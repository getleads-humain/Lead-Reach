"""
News Worker — Python FastAPI Sidecar for Newspaper3k
====================================================

Provides article extraction, news parsing, and NLP cleaning via the
`newspaper3k` Python library. Used by the Judge agent (Lead
Qualification) for intent-signal detection from news articles.

Endpoints:
    GET  /health              — service health check
    POST /extract             — extract article from a URL
    POST /extract-batch       — batch extract multiple URLs
    POST /search-intent       — search Google News + extract top articles
    POST /sentiment           — sentiment analysis on text

Run:
    cd python-workers/news-worker
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
    uvicorn main:app --host 0.0.0.0 --port 5341

Or use the start script: ./start.sh
"""

import os
import sys
import logging
from typing import List, Optional
from datetime import datetime
import asyncio

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, HttpUrl

# ─── Logging ───────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
)
log = logging.getLogger('news-worker')

# ─── Lazy Imports ──────────────────────────────────────────────────────────
#
# newspaper3k and its NLP deps are heavy — import lazily so the service
# can start even if optional deps are missing.

_nlp = None
def get_nlp():
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load('en_core_web_sm')
        except Exception as e:
            log.warning(f'spaCy model not available: {e}')
            _nlp = False  # mark as unavailable
    return _nlp if _nlp is not False else None


def get_newspaper():
    """Lazily import newspaper3k."""
    try:
        from newspaper import Article, Config
        return Article, Config
    except ImportError as e:
        log.error(f'newspaper3k not installed: {e}')
        return None, None


# ─── Pydantic Models ───────────────────────────────────────────────────────

class ExtractRequest(BaseModel):
    url: HttpUrl
    language: str = 'en'
    fetch_images: bool = False
    summarize: bool = True
    extract_keywords: bool = True
    max_keywords: int = 10


class ArticleResult(BaseModel):
    url: str
    title: str = ''
    authors: List[str] = []
    publish_date: Optional[str] = None
    top_image: Optional[str] = None
    meta_description: str = ''
    meta_keywords: List[str] = []
    text: str = ''
    summary: str = ''
    keywords: List[str] = []
    word_count: int = 0
    success: bool = True
    error: Optional[str] = None


class BatchExtractRequest(BaseModel):
    urls: List[HttpUrl]
    language: str = 'en'
    summarize: bool = True
    extract_keywords: bool = True
    max_concurrent: int = 3


class IntentSearchRequest(BaseModel):
    company_name: str
    query: Optional[str] = None  # defaults to company name
    max_articles: int = 5
    days_back: int = 30
    language: str = 'en'


class SentimentRequest(BaseModel):
    text: str
    method: str = 'vader'  # 'vader' | 'spacy' | 'simple'


class SentimentResult(BaseModel):
    sentiment: str  # 'positive' | 'negative' | 'neutral'
    score: float    # -1.0 to 1.0
    confidence: float
    method: str


class HealthResult(BaseModel):
    status: str
    version: str
    newspaper_available: bool
    spacy_available: bool
    uptime_seconds: float


# ─── App ───────────────────────────────────────────────────────────────────

app = FastAPI(
    title='LeadReach News Worker',
    description='Newspaper3k-powered article extraction service for the Judge agent',
    version='1.0.0',
)

_START_TIME = datetime.now()


@app.get('/health', response_model=HealthResult)
async def health():
    Article, _ = get_newspaper()
    return HealthResult(
        status='ok',
        version='1.0.0',
        newspaper_available=Article is not None,
        spacy_available=get_nlp() is not None,
        uptime_seconds=(datetime.now() - _START_TIME).total_seconds(),
    )


@app.post('/extract', response_model=ArticleResult)
async def extract_article(req: ExtractRequest):
    Article, Config = get_newspaper()
    if Article is None:
        raise HTTPException(503, 'newspaper3k not available — install requirements.txt')

    try:
        config = Config()
        config.fetch_images = req.fetch_images
        config.language = req.language
        config.memoize_articles = False
        config.request_timeout = 30

        article = Article(str(req.url), config=config)
        article.download()
        article.parse()

        if req.summarize:
            try:
                article.nlp()
            except Exception as e:
                log.warning(f'NLP summary failed for {req.url}: {e}')

        return ArticleResult(
            url=str(req.url),
            title=article.title or '',
            authors=list(article.authors or []),
            publish_date=article.publish_date.isoformat() if article.publish_date else None,
            top_image=article.top_image or None,
            meta_description=article.meta_description or '',
            meta_keywords=list(article.meta_keywords or []),
            text=article.text or '',
            summary=article.summary or '',
            keywords=list(article.keywords or [])[:req.max_keywords] if req.extract_keywords else [],
            word_count=len(article.text.split()) if article.text else 0,
        )
    except Exception as e:
        # Log the real exception for debugging; return a generic message to
        # the client to avoid information exposure (CodeQL #150).
        log.error(f'Extract failed for {req.url}: {e}', exc_info=True)
        return ArticleResult(
            url=str(req.url),
            success=False,
            error='Extraction failed. See server logs for details.',
        )


@app.post('/extract-batch', response_model=List[ArticleResult])
async def extract_batch(req: BatchExtractRequest):
    sem = asyncio.Semaphore(req.max_concurrent)

    async def extract_one(url: HttpUrl) -> ArticleResult:
        async with sem:
            r = ExtractRequest(
                url=url,
                language=req.language,
                summarize=req.summarize,
                extract_keywords=req.extract_keywords,
            )
            return await extract_article(r)

    tasks = [extract_one(u) for u in req.urls]
    return await asyncio.gather(*tasks)


@app.post('/search-intent')
async def search_intent(req: IntentSearchRequest):
    """Search Google News for company mentions and extract top articles.

    Returns aggregated intent signals: mention count, sentiment summary,
    detected intent keywords, recent article dates.
    """
    Article, Config = get_newspaper()
    if Article is None:
        raise HTTPException(503, 'newspaper3k not available')

    try:
        from newspaper import build
        config = Config()
        config.language = req.language
        config.memoize_articles = False
        config.fetch_images = False

        # Use Google News RSS as the source
        import urllib.parse
        query = req.query or req.company_name
        encoded = urllib.parse.quote_plus(query)
        google_news_url = f'https://news.google.com/rss/search?q={encoded}&hl={req.language}&gl=US&ceid=US:en'

        # Fetch the RSS feed
        import feedparser
        feed = feedparser.parse(google_news_url)

        cutoff = datetime.now().timestamp() - (req.days_back * 86400)

        articles = []
        for entry in feed.entries[:req.max_articles * 2]:
            try:
                pub_ts = entry.get('published_parsed')
                if pub_ts:
                    import time as _time
                    if _time.mktime(pub_ts) < cutoff:
                        continue

                article = Article(entry.link, config=config)
                article.download()
                article.parse()
                try:
                    article.nlp()
                except Exception:
                    pass

                articles.append(ArticleResult(
                    url=entry.link,
                    title=article.title or entry.get('title', ''),
                    authors=list(article.authors or []),
                    publish_date=article.publish_date.isoformat() if article.publish_date else None,
                    text=article.text or '',
                    summary=article.summary or '',
                    keywords=list(article.keywords or [])[:10],
                    word_count=len(article.text.split()) if article.text else 0,
                ))

                if len(articles) >= req.max_articles:
                    break

                # Be polite — small delay between fetches
                await asyncio.sleep(1)

            except Exception as e:
                log.warning(f'Failed to extract {entry.link}: {e}')
                continue

        # ── Aggregate intent signals ────────────────────────────────────
        intent_keywords = [
            'hiring surge', 'hiring', 'new CEO', 'CEO', 'CFO', 'CTO',
            'expansion', 'expanding', 'expands',
            'funding round', 'series a', 'series b', 'series c',
            'raised', 'raises', 'funding',
            'layoffs', 'layoff', 'fired', 'furlough',
            'acquisition', 'acquires', 'acquired', 'merger', 'merging',
            'IPO', 'going public', 'SPAC',
            'bankruptcy', 'chapter 11',
            'product launch', 'launches', 'launched', 'unveils',
            'partnership', 'partners with',
        ]
        mention_count = len(articles)
        intent_signals = {}
        for kw in intent_keywords:
            count = sum(1 for a in articles if kw.lower() in (a.title + ' ' + a.text).lower())
            if count > 0:
                intent_signals[kw] = count

        # Sentiment summary
        positive_count = sum(
            1 for a in articles
            if any(w in (a.title + ' ' + a.text).lower()
                   for w in ['growth', 'profit', 'record', 'surge', 'beat', 'strong', 'raises', 'expands'])
        )
        negative_count = sum(
            1 for a in articles
            if any(w in (a.title + ' ' + a.text).lower()
                   for w in ['loss', 'decline', 'fall', 'layoffs', 'bankruptcy', 'miss', 'weak', 'drops'])
        )

        return {
            'success': True,
            'company_name': req.company_name,
            'query': query,
            'mention_count_30d': mention_count,
            'articles': articles,
            'intent_signals': intent_signals,
            'sentiment': {
                'positive': positive_count,
                'negative': negative_count,
                'neutral': max(0, mention_count - positive_count - negative_count),
                'overall': 'positive' if positive_count > negative_count else
                          ('negative' if negative_count > positive_count else 'neutral'),
            },
            'publication_dates': [a.publish_date for a in articles if a.publish_date],
            'top_sources': list(set(
                a.url.split('/')[2] if '/' in a.url and len(a.url.split('/')) > 2 else ''
                for a in articles if a.url
            )),
        }

    except Exception as e:
        # Log the real exception for debugging; return a generic message to
        # the client to avoid information exposure (CodeQL #150).
        log.error(f'search-intent failed: {e}', exc_info=True)
        return JSONResponse(
            status_code=500,
            content={'success': False, 'error': 'Internal server error. See server logs for details.'},
        )


@app.post('/sentiment', response_model=SentimentResult)
async def sentiment(req: SentimentRequest):
    text = req.text or ''
    if not text.strip():
        return SentimentResult(sentiment='neutral', score=0.0, confidence=0.0, method=req.method)

    method = req.method

    if method == 'vader':
        try:
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
            analyzer = SentimentIntensityAnalyzer()
            scores = analyzer.polarity_scores(text)
            compound = scores['compound']
            sentiment_label = 'positive' if compound > 0.05 else \
                              'negative' if compound < -0.05 else 'neutral'
            return SentimentResult(
                sentiment=sentiment_label,
                score=compound,
                confidence=abs(compound),
                method='vader',
            )
        except ImportError:
            method = 'simple'  # fall through

    if method == 'spacy':
        nlp = get_nlp()
        if nlp is not None:
            doc = nlp(text[:5000])  # truncate to avoid timeouts
            # spaCy doesn't ship sentiment by default; use simple heuristic
            method = 'simple'

    # Simple heuristic fallback
    positive_words = ['good', 'great', 'excellent', 'growth', 'profit', 'strong', 'beat', 'record', 'surge', 'raises']
    negative_words = ['bad', 'loss', 'decline', 'weak', 'miss', 'fall', 'layoffs', 'bankruptcy', 'drops', 'fired']

    words = text.lower().split()
    pos = sum(1 for w in words if w in positive_words)
    neg = sum(1 for w in words if w in negative_words)
    total = pos + neg
    if total == 0:
        return SentimentResult(sentiment='neutral', score=0.0, confidence=0.0, method='simple')

    score = (pos - neg) / total
    label = 'positive' if score > 0.1 else ('negative' if score < -0.1 else 'neutral')
    return SentimentResult(
        sentiment=label,
        score=score,
        confidence=min(1.0, total / 10),
        method='simple',
    )


@app.get('/')
async def root():
    return {
        'service': 'LeadReach News Worker',
        'version': '1.0.0',
        'endpoints': ['/health', '/extract', '/extract-batch', '/search-intent', '/sentiment'],
    }


if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('NEWS_WORKER_PORT', '5341'))
    uvicorn.run(app, host='0.0.0.0', port=port, log_level='info')

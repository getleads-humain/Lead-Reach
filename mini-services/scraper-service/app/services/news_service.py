"""Newspaper3k service - News extraction and intent signal detection."""
import logging
from typing import Dict, Any, List
import re

logger = logging.getLogger(__name__)

INTENT_KEYWORDS = [
    "hiring surge", "new CEO", "expansion", "funding round", "layoffs",
    "acquisition", "merger", "IPO", "restructuring", "new product",
    "partnership", "investment", "growth", "closing", "bankruptcy",
    "raising capital", "series a", "series b", "series c", "pre-seed",
]

def extract_news(query: str, max_articles: int = 5) -> Dict[str, Any]:
    """Search and extract news articles using web search + Newspaper3k parsing."""
    articles = []
    all_keywords = []
    intent_signals = []

    try:
        import requests
        from bs4 import BeautifulSoup

        # Use Google News RSS as a free search source
        search_url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl=en-US&gl=US&ceid=US:en"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

        resp = requests.get(search_url, headers=headers, timeout=10)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.content, "xml")
            items = soup.find_all("item")[:max_articles]

            for item in items:
                title = item.find("title")
                link = item.find("link")
                pub_date = item.find("pubDate")
                source = item.find("source")

                article_data = {
                    "title": title.text if title else "",
                    "url": link.text if link else "",
                    "published_date": pub_date.text if pub_date else "",
                    "source": source.text if source else "",
                    "summary": "",
                    "keywords": [],
                    "sentiment": "neutral",
                }

                # Try to extract full article content with newspaper3k
                article_url = article_data["url"]
                if article_url:
                    try:
                        from newspaper import Article
                        article = Article(article_url)
                        article.download()
                        article.parse()
                        article.nlp()

                        article_data["summary"] = (article.summary or "")[:500]
                        article_data["keywords"] = article.keywords or []

                        # Detect intent signals
                        text_lower = (article.title + " " + article.text).lower() if article.text else ""
                        for kw in INTENT_KEYWORDS:
                            if kw.lower() in text_lower and kw not in intent_signals:
                                intent_signals.append(kw)

                        # Simple sentiment
                        positive = ["growth", "profit", "surge", "record", "boost", "gain", "success"]
                        negative = ["loss", "decline", "crash", "cut", "layoff", "bankrupt", "fail"]
                        pos_count = sum(1 for w in positive if w in text_lower)
                        neg_count = sum(1 for w in negative if w in text_lower)
                        if pos_count > neg_count:
                            article_data["sentiment"] = "positive"
                        elif neg_count > pos_count:
                            article_data["sentiment"] = "negative"

                        all_keywords.extend(article_data["keywords"])

                    except Exception as e:
                        logger.warning(f"Failed to parse article {article_url}: {e}")
                        # Fallback: use the title for keyword detection
                        text_lower = article_data["title"].lower()
                        for kw in INTENT_KEYWORDS:
                            if kw.lower() in text_lower and kw not in intent_signals:
                                intent_signals.append(kw)

                articles.append(article_data)

    except Exception as e:
        logger.error(f"News extraction error: {e}")
        return {
            "articles": [],
            "intent_signals": [],
            "mention_count": 0,
            "top_keywords": [],
            "error": str(e),
            "data_source": "newspaper3k",
        }

    # Deduplicate keywords
    from collections import Counter
    keyword_counts = Counter(all_keywords)
    top_keywords = [kw for kw, _ in keyword_counts.most_common(10)]

    return {
        "articles": articles,
        "intent_signals": intent_signals,
        "mention_count": len(articles),
        "top_keywords": top_keywords,
        "data_source": "newspaper3k",
    }

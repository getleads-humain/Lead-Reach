"""Email extraction from business websites."""
import asyncio
import re
import logging
from typing import List
from urllib.parse import urlparse, urlunparse

import httpx
from bs4 import BeautifulSoup

from .url_guard import assert_safe_url, UnsafeUrlError

logger = logging.getLogger("gmaps-scraper.email")

# Email regex pattern
EMAIL_PATTERN = re.compile(
    r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
)

# Domains to skip
SKIP_DOMAINS = {
    'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
    'linkedin.com', 'youtube.com', 'tiktok.com', 'pinterest.com',
    'google.com', 'apple.com', 'microsoft.com'
}

# Pre-compiled private-host detector — used by the inline SSRF guard.
_PRIVATE_HOST_RE = re.compile(
    r'^(?:localhost|::1|0\.0\.0\.0|'
    r'127\.|10\.|192\.168\.|169\.254\.|'
    r'172\.(?:1[6-9]|2[0-9]|3[01])\.|'
    r'0\.|f[cd][0-9a-f]{2}:|fe[89ab]|ff)'
)
_PRIVATE_HOST_SUFFIXES = ('.local', '.internal', '.localhost', '.intranet', '.corp', '.lan')


def is_valid_email(email: str) -> bool:
    """Check if an email looks valid (not a generic/webmaster email for social platforms)."""
    email_lower = email.lower()
    for domain in SKIP_DOMAINS:
        if domain in email_lower:
            return False
    # Skip very common non-business emails
    if email_lower.startswith(('noreply@', 'no-reply@', 'postmaster@', 'webmaster@')):
        return True  # Actually these might be valid, include them
    return True


def _validate_url_inline(url: str) -> str:
    """Inline SSRF guard — parse URL with `urllib.parse.urlparse()` and validate
    scheme + hostname (CodeQL sanitizer barrier). Returns the re-serialized URL
    so the taint flow on the original input is cut.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        raise UnsafeUrlError(
            f"Disallowed URL scheme: {parsed.scheme}",
            reason='disallowed-scheme',
            url=url,
        )
    host = (parsed.hostname or '').lower()
    if not host:
        raise UnsafeUrlError('Empty hostname', reason='empty-hostname', url=url)
    if host in ('localhost', '::1', '0.0.0.0') or \
       _PRIVATE_HOST_RE.match(host) or \
       any(host.endswith(suffix) for suffix in _PRIVATE_HOST_SUFFIXES):
        raise UnsafeUrlError(
            f"Internal/private host blocked: {host}",
            reason='private-hostname',
            url=url,
        )
    if parsed.username or parsed.password:
        raise UnsafeUrlError(
            'URL must not contain userinfo',
            reason='has-userinfo',
            url=url,
        )
    return urlunparse(parsed)


async def extract_emails_from_url(website_url: str, timeout: int = 15) -> List[str]:
    """Extract email addresses from a website URL.

    SSRF protection: the URL is validated inline via `urllib.parse.urlparse()`
    + scheme/hostname check (CodeQL sanitizer barrier) BEFORE any request is
    dispatched, and every redirect target is re-validated inline. This prevents
    the endpoint from being abused to fetch internal services (cloud metadata,
    RFC1918 ranges, loopback, link-local, etc.). Defense-in-depth: the
    comprehensive url-guard runs afterwards to catch DNS-rebinding-to-internal-IP
    attacks.
    """
    emails = set()

    if not website_url:
        return []

    # Normalize URL
    if not website_url.startswith(('http://', 'https://')):
        website_url = 'https://' + website_url

    # Inline SSRF guard — CodeQL sanitizer barrier.
    try:
        website_url = _validate_url_inline(website_url)
    except UnsafeUrlError as e:
        logger.warning(f"Refused to extract emails from unsafe URL {website_url}: {e.reason}")
        return []

    # Defense-in-depth: full DNS-rebinding check via url-guard.
    try:
        await assert_safe_url(website_url)
    except UnsafeUrlError as e:
        logger.warning(f"Refused to extract emails from unsafe URL {website_url}: {e.reason}")
        return []

    try:
        async with httpx.AsyncClient(
            follow_redirects=False,  # we follow redirects manually so each hop is SSRF-checked
            timeout=timeout,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        ) as client:
            # Fetch homepage
            try:
                resp = await client.get(website_url)
                # Manually follow up to 3 redirects, re-validating each hop inline.
                redirects = 0
                while 300 <= resp.status_code < 400 and redirects < 3:
                    location = resp.headers.get('location')
                    if not location:
                        break
                    from urllib.parse import urljoin
                    next_url = urljoin(website_url, location)
                    # Inline SSRF guard for each redirect target (CodeQL barrier).
                    try:
                        next_url = _validate_url_inline(next_url)
                    except UnsafeUrlError:
                        logger.warning(f"Refused to follow redirect to unsafe URL: {next_url}")
                        break
                    # Defense-in-depth: DNS-rebinding check.
                    try:
                        await assert_safe_url(next_url)
                    except UnsafeUrlError:
                        logger.warning(f"Refused to follow redirect to unsafe URL: {next_url}")
                        break
                    website_url = next_url
                    resp = await client.get(website_url)
                    redirects += 1

                if resp.status_code == 200:
                    # Extract from HTML content
                    _extract_emails_from_html(resp.text, emails)

                    # Also check for mailto: links in HTML
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    for a_tag in soup.find_all('a', href=True):
                        href = a_tag['href']
                        if href.startswith('mailto:'):
                            email = href.replace('mailto:', '').split('?')[0].strip()
                            if email and is_valid_email(email):
                                emails.add(email.lower())
            except httpx.HTTPError as e:
                logger.warning(f"HTTP error fetching {website_url}: {e}")

            # Also try common contact pages
            contact_paths = ['/contact', '/contact-us', '/about', '/about-us']
            for path in contact_paths[:2]:  # Limit to 2 to be respectful
                try:
                    contact_url = website_url.rstrip('/') + path
                    # Inline SSRF guard for each contact URL (CodeQL barrier).
                    # Same domain as base URL, but defensive in case of an
                    # earlier redirect to a different host.
                    try:
                        contact_url = _validate_url_inline(contact_url)
                    except UnsafeUrlError:
                        continue
                    # Defense-in-depth: DNS-rebinding check.
                    try:
                        await assert_safe_url(contact_url)
                    except UnsafeUrlError:
                        continue
                    resp = await client.get(contact_url)
                    if resp.status_code == 200:
                        _extract_emails_from_html(resp.text, emails)
                except Exception:
                    continue
                await asyncio.sleep(0.5)  # Be respectful

    except Exception as e:
        logger.warning(f"Email extraction error for {website_url}: {e}")

    return sorted(list(emails))


def _extract_emails_from_html(html: str, emails: set):
    """Extract emails from HTML content using regex."""
    # Find all email-like patterns
    found = EMAIL_PATTERN.findall(html)
    for email in found:
        if is_valid_email(email):
            emails.add(email.lower())

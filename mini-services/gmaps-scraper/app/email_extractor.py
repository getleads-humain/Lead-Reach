"""Email extraction from business websites."""
import asyncio
import re
import logging
from typing import List

import httpx
from bs4 import BeautifulSoup

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


async def extract_emails_from_url(website_url: str, timeout: int = 15) -> List[str]:
    """Extract email addresses from a website URL."""
    emails = set()

    if not website_url:
        return []

    # Normalize URL
    if not website_url.startswith(('http://', 'https://')):
        website_url = 'https://' + website_url

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=timeout,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        ) as client:
            # Fetch homepage
            try:
                resp = await client.get(website_url)
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
                    resp = await client.get(contact_url)
                    if resp.status_code == 200:
                        _extract_emails_from_html(resp.text, emails)
                except:
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

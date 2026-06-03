# -*- coding: utf-8 -*-
"""
Channel base class — platform availability checking.

Each channel represents a platform (YouTube, Twitter, GitHub, etc.)
and provides:
  - can_handle(url) → does this URL belong to this platform?
  - check(config) → is the upstream tool installed and configured?

After installation, agents call upstream tools directly.
"""

import re
import shutil
from abc import ABC, abstractmethod
from typing import List, Tuple
from urllib.parse import urlparse


def _domain_matches(hostname: str, expected: str) -> bool:
    """Check if hostname exactly matches or is a subdomain of expected domain.

    This prevents substring matching attacks where 'evilexample.com' would
    match 'example.com'. Only exact match or subdomain (e.g., 'www.example.com')
    returns True.
    """
    hostname = hostname.lower()
    expected = expected.lower()
    return hostname == expected or hostname.endswith('.' + expected)


def validate_url(url: str) -> str:
    """Validate a URL for safe use (SSRF prevention).

    Ensures the URL:
    - Uses http or https scheme only
    - Has a valid hostname
    - Does not target internal/private networks

    Returns the validated URL string.
    Raises ValueError if the URL is invalid or targets a private network.
    """
    try:
        parsed = urlparse(url)
    except Exception:
        raise ValueError(f"Invalid URL: {url!r}")

    # Only allow http and https schemes (blocks javascript:, data:, file:, etc.)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"URL scheme must be http or https, got: {parsed.scheme!r}")

    # Must have a hostname
    hostname = parsed.hostname
    if not hostname:
        raise ValueError(f"URL must have a hostname: {url!r}")

    # Block internal/private network addresses (SSRF prevention)
    blocked_patterns = [
        re.compile(r"^localhost$", re.IGNORECASE),
        re.compile(r"^127\."),
        re.compile(r"^10\."),
        re.compile(r"^172\.(1[6-9]|2[0-9]|3[01])\."),
        re.compile(r"^192\.168\."),
        re.compile(r"^0\."),
        re.compile(r"^::1$"),
        re.compile(r"^fd", re.IGNORECASE),
        re.compile(r"^fe80:", re.IGNORECASE),
        re.compile(r"^169\.254\."),
        re.compile(r"^\."),
        re.compile(r"^metadata\.google\.internal$", re.IGNORECASE),
        re.compile(r"^metadata\.azure\.com$", re.IGNORECASE),
    ]

    for pattern in blocked_patterns:
        if pattern.search(hostname):
            raise ValueError(f"URL targets internal/private network: {hostname!r}")

    return url


class Channel(ABC):
    """Base class for all channels."""

    name: str = ""                    # e.g. "youtube"
    description: str = ""             # e.g. "YouTube 视频和字幕"
    backends: List[str] = []          # e.g. ["yt-dlp"] — what upstream tool is used
    tier: int = 0                     # 0=zero-config, 1=needs free key, 2=needs setup

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Check if this channel can handle this URL."""
        ...

    def check(self, config=None) -> Tuple[str, str]:
        """
        Check if this channel's upstream tool is available.
        Returns (status, message) where status is 'ok'/'warn'/'off'/'error'.
        """
        return "ok", f"{'、'.join(self.backends) if self.backends else '内置'}"

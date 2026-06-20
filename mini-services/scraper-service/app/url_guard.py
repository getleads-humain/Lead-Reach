"""
URL Guard — SSRF Protection (Python edition)
=============================================

Server-Side Request Forgery (SSRF) defense used by every Python code path
that fetches an end-user-supplied URL (scraper-service, gmaps-scraper).

Mirrors the protection in `src/lib/url-guard.ts` and
`mini-services/*/url-guard.ts`.

What this guards against
------------------------
  1. Dangerous schemes — `file://`, `gopher://`, `ftp://`, `dict://`,
     `data:`, `javascript:`, etc. Only `http` and `https` are allowed.
  2. Internal / private IP literals — loopback, link-local, RFC1918,
     ULA IPv6, cloud metadata (169.254.169.254 etc.).
  3. DNS rebinding to internal IPs — hostname is resolved and refused
     if any resolved address is private.
  4. Hostname tricks — `localhost`, `*.internal`, `*.local`, IPv6
     bracketed forms, decimal/hex/octal IP encodings.

Usage
-----
    from url_guard import assert_safe_url, UnsafeUrlError

    try:
        await assert_safe_url(user_url)
    except UnsafeUrlError as e:
        ...
"""

from __future__ import annotations

import ipaddress
import socket
from typing import Set
from urllib.parse import urlparse, urlunparse

try:
    import httpx
    _HAS_HTTPX = True
except ImportError:
    _HAS_HTTPX = False


# ── Errors ────────────────────────────────────────────────────────────────


class UnsafeUrlError(Exception):
    """Raised when a URL is refused for SSRF safety reasons."""

    def __init__(self, message: str, reason: str = "unknown", url: str | None = None):
        super().__init__(message)
        self.reason = reason
        self.url = url


# ── Constants ─────────────────────────────────────────────────────────────

ALLOWED_SCHEMES = {"http", "https"}
MAX_URL_LENGTH = 8192
DEFAULT_PORTS = {"http": 80, "https": 443}

BLOCKED_HOSTNAMES: Set[str] = {
    "localhost",
    "ip6-localhost",
    "ip6-loopback",
    "broadcasthost",
    "metadata",
    "metadata.google.internal",
}

BLOCKED_HOSTNAME_SUFFIXES = (
    ".local",
    ".internal",
    ".localhost",
    ".intranet",
    ".corp",
    ".home",
    ".lan",
    ".test",
    ".example",
    ".invalid",
)

METADATA_HOSTNAMES: Set[str] = {
    "169.254.169.254",
    "metadata.google.internal",
    "100.100.100.200",
    "metadata.aliyuncs.com",
}


# ── IP checks ─────────────────────────────────────────────────────────────


def _is_private_ip(ip: str) -> bool:
    """Return True if the IP literal is private, loopback, link-local,
    multicast, reserved, or unspecified. Treats malformed inputs as
    private (fail-closed)."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return True  # malformed → treat as unsafe
    return (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    )


def _is_local_interface_ip(ip: str) -> bool:
    """Return True if the IP matches one of this host's own interface
    addresses (defense against DNS-rebinding-to-self attacks)."""
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None):
            if info[4][0] == ip:
                return True
    except (OSError, socket.gaierror):
        pass
    return ip in ("127.0.0.1", "::1")


# ── Sync safety check ────────────────────────────────────────────────────


def check_url_safety_sync(url: str) -> dict:
    """Validate a URL for SSRF safety without DNS resolution.

    Returns a dict with `safe: bool` and optional `reason`, `hostname`,
    `scheme`, `port`. Use `assert_safe_url()` (async) for the full
    DNS-resolving check.
    """
    if not isinstance(url, str):
        return {"safe": False, "reason": "URL is not a string"}
    if not url:
        return {"safe": False, "reason": "URL is empty"}
    if len(url) > MAX_URL_LENGTH:
        return {"safe": False, "reason": f"URL exceeds {MAX_URL_LENGTH} chars"}

    try:
        parsed = urlparse(url)
    except Exception:
        return {"safe": False, "reason": "Malformed URL"}

    scheme = (parsed.scheme or "").lower()
    if scheme not in ALLOWED_SCHEMES:
        return {
            "safe": False,
            "reason": f'Scheme "{scheme}" not allowed (only http/https)',
            "scheme": scheme,
        }

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        return {"safe": False, "reason": "Empty hostname", "scheme": scheme}

    if hostname in BLOCKED_HOSTNAMES:
        return {"safe": False, "reason": f'Hostname "{hostname}" is blocked', "hostname": hostname}
    if hostname in METADATA_HOSTNAMES:
        return {"safe": False, "reason": "Cloud metadata hostname blocked", "hostname": hostname}
    for suffix in BLOCKED_HOSTNAME_SUFFIXES:
        if hostname.endswith(suffix):
            return {
                "safe": False,
                "reason": f'Hostname suffix "{suffix}" is blocked',
                "hostname": hostname,
            }

    # If hostname is an IP literal, check it directly
    try:
        ip = ipaddress.ip_address(hostname)
        if _is_private_ip(str(ip)):
            return {
                "safe": False,
                "reason": f'IP literal "{hostname}" is private/reserved',
                "hostname": hostname,
            }
        if _is_local_interface_ip(str(ip)):
            return {
                "safe": False,
                "reason": f'IP "{hostname}" is a local interface',
                "hostname": hostname,
            }
    except ValueError:
        # Not an IP literal — hostname, will be DNS-resolved in assert_safe_url
        pass

    # Reject userinfo (common SSRF trick: http://user:pass@host/)
    if parsed.username or parsed.password:
        return {"safe": False, "reason": "URL must not contain userinfo (user:pass@)"}

    port = parsed.port if parsed.port else DEFAULT_PORTS.get(scheme)
    if not port or port < 1 or port > 65535:
        return {"safe": False, "reason": f'Invalid port "{parsed.port}"'}

    return {"safe": True, "hostname": hostname, "scheme": scheme, "port": port}


def assert_safe_url_sync(url: str) -> None:
    """Synchronous SSRF check — throws UnsafeUrlError on refusal."""
    report = check_url_safety_sync(url)
    if not report.get("safe"):
        raise UnsafeUrlError(
            f"Refused to load URL for SSRF safety: {report.get('reason')}",
            reason=report.get("reason", "unknown"),
            url=url,
        )


async def assert_safe_url(url: str) -> None:
    """Full SSRF check — syntactic + DNS resolution. Throws on unsafe URLs."""
    report = check_url_safety_sync(url)
    if not report.get("safe"):
        raise UnsafeUrlError(
            f"Refused to load URL for SSRF safety: {report.get('reason')}",
            reason=report.get("reason", "unknown"),
            url=url,
        )

    hostname = report["hostname"]
    # If hostname is an IP literal, sync check already validated it.
    try:
        ipaddress.ip_address(hostname)
        return
    except ValueError:
        pass

    # Resolve and check all IPs
    try:
        loopups = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        # If we can't resolve, allow it — the fetch will fail with a clear
        # DNS error rather than a silent SSRF success.
        return

    seen = set()
    for family, _, _, _, sockaddr in loopups:
        ip = sockaddr[0]
        if ip in seen:
            continue
        seen.add(ip)
        if _is_private_ip(ip):
            raise UnsafeUrlError(
                f'Refused to load URL for SSRF safety: hostname "{hostname}" '
                f"resolves to private IP {ip}",
                reason="resolves-to-private-ip",
                url=url,
            )
        if _is_local_interface_ip(ip):
            raise UnsafeUrlError(
                f'Refused to load URL for SSRF safety: hostname "{hostname}" '
                f"resolves to local interface {ip}",
                reason="resolves-to-local-interface",
                url=url,
            )


# ── Safe httpx client ────────────────────────────────────────────────────


def make_safe_httpx_client(**kwargs) -> "httpx.AsyncClient":
    """Return an httpx.AsyncClient configured for SSRF safety.

    The caller is still responsible for calling `assert_safe_url(url)`
    before each request — httpx's event hooks aren't sufficient on their
    own because they fire AFTER the connection has been opened.
    """
    if not _HAS_HTTPX:
        raise RuntimeError("httpx is not installed")

    # Disable automatic redirect following — callers should re-validate
    # every redirect target via assert_safe_url before following.
    kwargs.setdefault("follow_redirects", False)
    return httpx.AsyncClient(**kwargs)


async def safe_httpx_get(client: "httpx.AsyncClient", url: str, **kwargs):
    """httpx.get with SSRF protection + safe redirect handling."""
    await assert_safe_url(url)
    response = await client.get(url, **kwargs)

    # Manually follow redirects (one hop at a time) so each Location
    # header is re-validated.
    redirects_followed = 0
    while 300 <= response.status_code < 400 and redirects_followed < 5:
        location = response.headers.get("location")
        if not location:
            break
        next_url = urlunparse(urlparse(url)._replace(path=location)) if not urlparse(location).netloc else location
        # Re-resolve relative to current URL
        if not urlparse(next_url).scheme:
            base = urlparse(url)
            next_url = f"{base.scheme}://{base.netloc}{location}"
        await assert_safe_url(next_url)
        response = await client.get(next_url, **kwargs)
        redirects_followed += 1

    return response

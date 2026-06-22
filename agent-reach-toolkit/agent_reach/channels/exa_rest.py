# -*- coding: utf-8 -*-
"""Exa AI REST Client — direct API integration for the Agent-Reach toolkit.

This module provides a thin Python wrapper around the Exa AI REST API
(https://api.exa.ai). It is used by the agent-reach CLI when EXA_API_KEY
is set, and mirrors the capabilities of the TypeScript exa-sdk.ts module
so both the Python and TypeScript layers have feature parity.

Capabilities:
- Neural/semantic search with auto/keyword/neural/fast/deep modes
- Category filtering: company, linkedin profile, news, github, research paper, etc.
- Content retrieval: full page text, AI summaries, key highlights
- Domain filtering: include/exclude specific domains
- Date filtering: by crawl date and published date
- Subpage crawling: follow links within search results
- Find similar: discover pages similar to a given URL
- Structured outputs with grounding citations (outputSchema)

Requires EXA_API_KEY environment variable.
Get your key at: https://dashboard.exa.ai/api-keys
"""

import json
import os
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

EXA_API_BASE = "https://api.exa.ai"
EXA_SDK_VERSION = "2.0.1-python"


def _get_api_key() -> Optional[str]:
    """Return the Exa API key from env, or None if not set."""
    return os.environ.get("EXA_API_KEY") or None


def _post(path: str, body: Dict[str, Any], timeout: int = 30) -> Dict[str, Any]:
    """POST JSON to the Exa API and return the parsed response."""
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError(
            "EXA_API_KEY not set. Get a key at https://dashboard.exa.ai/api-keys"
        )

    url = f"{EXA_API_BASE}{path}"
    data = json.dumps(body).encode("utf-8")
    req = Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("x-api-key", api_key)
    req.add_header("User-Agent", f"leadreach-agent-reach/{EXA_SDK_VERSION}")

    try:
        with urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Exa API HTTP {e.code}: {err_body}") from e
    except URLError as e:
        raise RuntimeError(f"Exa API network error: {e.reason}") from e


def search(
    query: str,
    *,
    num_results: int = 10,
    search_type: str = "auto",
    category: Optional[str] = None,
    include_domains: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None,
    start_published_date: Optional[str] = None,
    end_published_date: Optional[str] = None,
    include_text: Optional[List[str]] = None,
    contents: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Search the web using Exa's AI-powered search API.

    Args:
        query: Natural-language or keyword search query.
        num_results: Number of results to return (1-50).
        search_type: 'auto', 'keyword', 'neural', 'fast', 'instant',
                     'deep-lite', 'deep', or 'deep-reasoning'.
        category: Optional category filter — 'company', 'people', 'news',
                  'research paper', 'github', 'linkedin profile', 'pdf',
                  'personal site', 'financial report'.
        include_domains: Only return results from these domains.
        exclude_domains: Skip results from these domains.
        start_published_date: ISO date string (e.g. '2024-01-01').
        end_published_date: ISO date string.
        include_text: Only return results containing these strings.
        contents: Content retrieval options — e.g. {'text': True, 'highlights': True}.

    Returns:
        Parsed JSON response from Exa. See ExaApiResponse in src/lib/exa-sdk.ts
        for the full shape.
    """
    body: Dict[str, Any] = {
        "query": query,
        "numResults": num_results,
        "type": search_type,
    }
    if category:
        body["category"] = category
    if include_domains:
        body["includeDomains"] = include_domains
    if exclude_domains:
        body["excludeDomains"] = exclude_domains
    if start_published_date:
        body["startPublishedDate"] = start_published_date
    if end_published_date:
        body["endPublishedDate"] = end_published_date
    if include_text:
        body["includeText"] = include_text
    if contents:
        body["contents"] = contents

    return _post("/search", body)


def find_similar(url: str, *, num_results: int = 10) -> Dict[str, Any]:
    """Find pages similar to the given URL."""
    return _post("/findSimilar", {
        "url": url,
        "numResults": num_results,
    })


def get_contents(urls: List[str], *, text: bool = True, highlights: bool = False) -> Dict[str, Any]:
    """Retrieve contents for a list of URLs."""
    body: Dict[str, Any] = {"urls": urls}
    contents: Dict[str, Any] = {}
    if text:
        contents["text"] = True
    if highlights:
        contents["highlights"] = True
    if contents:
        body["contents"] = contents
    return _post("/contents", body)


def is_configured() -> bool:
    """Return True if EXA_API_KEY is set."""
    return _get_api_key() is not None

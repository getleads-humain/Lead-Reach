# -*- coding: utf-8 -*-
"""Exa AI SDK — Full Exa API integration for the Agent-Reach toolkit.

This channel provides the complete Exa AI SDK integration, including:
- Neural/semantic search with auto/keyword/neural/fast/deep modes
- Category filtering: company, linkedin profile, news, github, research paper, etc.
- Content retrieval: full page text, AI summaries, key highlights
- Domain filtering: include/exclude specific domains
- Date filtering: by crawl date and published date
- Subpage crawling: follow links within search results
- Find similar: discover pages similar to a given URL

Repository: https://github.com/exa-labs/ai-sdk
npm: @exalabs/ai-sdk
API: https://api.exa.ai

Requires EXA_API_KEY environment variable.
Get your key at: https://dashboard.exa.ai/api-keys
"""

import os
from .base import Channel


class ExaSDKChannel(Channel):
    name = "exa-sdk"
    description = (
        "Full Exa AI SDK — neural search, category filters (company, LinkedIn, news, GitHub), "
        "content retrieval with summaries, domain filtering, subpage crawling, and findSimilar"
    )
    backends = ["@exalabs/ai-sdk (exa-labs/ai-sdk)"]
    tier = 0  # Zero-config when API key is set

    def can_handle(self, url: str) -> bool:
        return False  # Search-only channel (uses API, not URLs)

    def check(self, config=None):
        api_key = os.environ.get("EXA_API_KEY")
        if not api_key:
            return "warn", (
                "EXA_API_KEY not set. The Exa AI SDK requires an API key for full capabilities.\n"
                "Get your key at: https://dashboard.exa.ai/api-keys\n"
                "Then set: export EXA_API_KEY=your-key-here\n\n"
                "Without the API key, the platform falls back to z-ai-web-dev-sdk web_search "
                "for general search, and uses category-specific query patterns for "
                "company, LinkedIn, and news searches."
            )
        return "ok", (
            "Exa AI SDK fully operational — neural search, category filters, "
            "content retrieval (text, summaries, highlights), domain filtering, "
            "subpage crawling, and findSimilar are all available.\n"
            "Categories: company, linkedin profile, news, github, research paper, "
            "pdf, personal site, financial report\n"
            "Search types: auto, keyword, neural, fast, deep"
        )

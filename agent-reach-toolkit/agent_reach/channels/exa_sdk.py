# -*- coding: utf-8 -*-
"""Exa AI SDK — Full Exa API integration status check.

This channel reports the status of the full Exa AI SDK integration.
The actual API calls are made by:

- TypeScript layer (PRIMARY): `src/lib/exa-sdk.ts` → `exaClient.search()` etc.
  Used by all agent workflows: Prospect Discovery, Data Enrichment, Web
  Research, Lead Qualification, Outreach Composer. When EXA_API_KEY is set,
  exaSearch() in agent-reach-bridge.ts calls the real Exa REST API as its
  primary backend (zero-config).

- Python layer (PARITY): `agent_reach/channels/exa_rest.py` — direct REST
  client with the same capabilities. Used by the agent-reach CLI.

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
        "content retrieval with summaries, domain filtering, subpage crawling, and findSimilar. "
        "Primary backend for Scout/Forge/Sage/Bard agents when EXA_API_KEY is set."
    )
    backends = [
        "Exa REST API (src/lib/exa-sdk.ts) — TypeScript layer",
        "Exa REST API (agent_reach/channels/exa_rest.py) — Python CLI",
    ]
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
                "Without the API key, the platform falls back to DuckDuckGo/Jina for general "
                "search, and uses category-specific query patterns for company, LinkedIn, "
                "and news searches.\n\n"
                "Used by: Prospect Discovery (Scout), Data Enrichment (Forge), Web Research "
                "(Sage), Lead Qualification (Judge), Outreach Composer (Bard)."
            )
        return "ok", (
            "Exa AI SDK fully operational — neural search, category filters, "
            "content retrieval (text, summaries, highlights), domain filtering, "
            "subpage crawling, and findSimilar are all available.\n"
            "Categories: company, linkedin profile, news, github, research paper, "
            "pdf, personal site, financial report\n"
            "Search types: auto, keyword, neural, fast, deep, deep-reasoning\n"
            "Primary consumer: src/lib/exa-sdk.ts (TS) — exaSearch() in agent-reach-bridge.ts\n"
            "Python CLI: agent_reach/channels/exa_rest.py"
        )

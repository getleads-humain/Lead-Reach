# -*- coding: utf-8 -*-
"""Exa Search — semantic web search via Exa AI.

Two backend paths are supported:

1. **Direct Exa REST API** (preferred, zero-config when EXA_API_KEY is set)
   - Used by the TypeScript layer (src/lib/exa-sdk.ts) for all agent workflows
     (Prospect Discovery, Data Enrichment, Web Research, Lead Qualification,
     Outreach Composer).
   - When EXA_API_KEY is set in env, exaSearch() in agent-reach-bridge.ts
     calls api.exa.ai directly with full capabilities: neural search,
     category filters, content retrieval, domain filtering, subpages,
     findSimilar, and structured outputs.

2. **mcporter + Exa MCP** (fallback, free, no API key required)
   - Used by the Python toolkit CLI for ad-hoc search.
   - Install: `npm install -g mcporter && mcporter config add exa https://mcp.exa.ai/mcp`

When both are configured, the TS layer uses the REST API; the Python CLI
uses mcporter. Either path can be used independently.
"""

import os
import shutil
import subprocess
from .base import Channel


class ExaSearchChannel(Channel):
    name = "exa_search"
    description = "全网语义搜索 (Exa AI — direct REST API or mcporter MCP)"
    backends = ["Exa REST API (EXA_API_KEY)", "Exa via mcporter (free, no key)"]
    tier = 0  # Zero-config when API key is set

    def can_handle(self, url: str) -> bool:
        return False  # Search-only channel

    def check(self, config=None):
        # Path 1: Direct REST API (preferred)
        api_key = os.environ.get("EXA_API_KEY")
        if api_key:
            return "ok", (
                "Exa REST API configured (EXA_API_KEY set).\n"
                "Full capabilities available: neural/keyword/deep search, "
                "category filters (company, people, news, github, linkedin), "
                "content retrieval (text, highlights, summaries), domain "
                "filtering, subpage crawling, findSimilar, and structured "
                "outputs with grounding citations.\n"
                "Used by: Prospect Discovery, Data Enrichment, Web Research, "
                "Lead Qualification, Outreach Composer.\n"
                "Dashboard: https://dashboard.exa.ai/"
            )

        # Path 2: mcporter + Exa MCP (fallback, free)
        mcporter = shutil.which("mcporter")
        if not mcporter:
            return "warn", (
                "EXA_API_KEY not set and mcporter not installed. To enable Exa:\n"
                "  Option A (preferred): set EXA_API_KEY env var\n"
                "    Get a key at: https://dashboard.exa.ai/api-keys\n"
                "  Option B (free, no key): install mcporter\n"
                "    npm install -g mcporter\n"
                "    mcporter config add exa https://mcp.exa.ai/mcp"
            )
        try:
            r = subprocess.run(
                [mcporter, "config", "list"], capture_output=True,
                encoding="utf-8", errors="replace", timeout=5
            )
            if "exa" in r.stdout.lower():
                return "ok", (
                    "Exa available via mcporter (free, no API key).\n"
                    "For full capabilities (category filters, structured "
                    "outputs, content retrieval), set EXA_API_KEY env var."
                )
            return "off", (
                "mcporter installed but Exa not configured. Run:\n"
                "  mcporter config add exa https://mcp.exa.ai/mcp\n"
                "Or set EXA_API_KEY env var for direct REST API access."
            )
        except Exception:
            return "off", "mcporter connection error"

# -*- coding: utf-8 -*-
"""LinkedIn — check if linkedin-scraper-mcp is available."""

import shutil
import subprocess
from .base import Channel, _domain_matches


class LinkedInChannel(Channel):
    name = "linkedin"
    description = "LinkedIn 职业社交"
    backends = ["linkedin-scraper-mcp", "Jina Reader"]
    tier = 2

    def can_handle(self, url: str) -> bool:
        from urllib.parse import urlparse
        from .base import validate_url
        try:
            validate_url(url)
        except ValueError:
            return False
        return _domain_matches(urlparse(url).netloc.lower(), "linkedin.com")

    def check(self, config=None):
        mcporter = shutil.which("mcporter")
        if not mcporter:
            return "off", (
                "基本内容可通过 Jina Reader 读取。完整功能需要：\n"
                "  pip install linkedin-scraper-mcp\n"
                "  mcporter config add linkedin http://localhost:3000/mcp\n"
                "  详见 https://github.com/stickerdaniel/linkedin-mcp-server"
            )
        try:
            r = subprocess.run(
                [mcporter, "config", "list"], capture_output=True,
                encoding="utf-8", errors="replace", timeout=5
            )
            if "linkedin" in r.stdout.lower():
                return "ok", "完整可用（Profile、公司、职位搜索）"
        except Exception:
            pass
        return "off", (
            "mcporter 已装但 LinkedIn MCP 未配置。运行：\n"
            "  pip install linkedin-scraper-mcp\n"
            "  mcporter config add linkedin http://localhost:3000/mcp"
        )

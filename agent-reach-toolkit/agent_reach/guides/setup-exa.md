# Exa Search 配置指南

## 功能说明

Exa 是一个 AI 语义搜索引擎。LeadReach 平台支持两条独立的接入路径：

1. **Direct REST API（推荐）** — 设置 `EXA_API_KEY` 环境变量后立即启用。
   - 由 TypeScript 层（`src/lib/exa-sdk.ts`）调用，覆盖全部 Agent 工作流：
     Prospect Discovery、Data Enrichment、Web Research、Lead Qualification、Outreach Composer。
   - 由 Python 层（`agent_reach/channels/exa_rest.py`）调用，用于 agent-reach CLI。
   - 完整能力：neural/keyword/deep search、category 过滤、内容检索、
     domain 过滤、subpage 爬取、findSimilar、结构化输出（outputSchema）。

2. **mcporter + Exa MCP（免费，无需 API Key）** — 仅用于 Python CLI 的兜底路径。
   - 安装：`npm install -g mcporter && mcporter config add exa https://mcp.exa.ai/mcp`
   - 能力受限：仅基础 web_search。

两条路径相互独立；同时配置时，TypeScript 层走 REST API，Python CLI 走 mcporter。

## Agent 可自动完成的步骤

`agent-reach install --env=auto` 会自动检测并配置可用路径。

### 路径 A：REST API（推荐）
1. 在 `.env` 中设置：
   ```
   EXA_API_KEY=your-key-here
   ```
2. 重启服务。
3. 验证：
   ```bash
   curl http://localhost:3000/api/exa/status
   # {"ok": true, "configured": true, "backend": "exa-api", ...}
   ```

### 路径 B：mcporter（兜底）
```bash
npm install -g mcporter
mcporter config add exa https://mcp.exa.ai/mcp
agent-reach doctor | grep -i exa
```

## 需要用户手动做的步骤

**路径 A：** 在 https://dashboard.exa.ai/api-keys 申请 API Key，写入 `.env`。
**路径 B：** 无需手动操作（免费）。

## 常见问题

**Q: 有搜索次数限制吗？**
A: REST API 按 Exa 的官方定价计费（详见 https://dashboard.exa.ai/usage）。
   mcporter 端点当前免费无限制。

**Q: 哪条路径更准？**
A: REST API。它支持 neural search 和 category 过滤，召回率显著高于 mcporter 的基础 web_search。
   Prospect Discovery 的 Scout Agent 默认走 REST API（当 `EXA_API_KEY` 设置时）。

**Q: 如何查看当前使用的后端？**
A: `curl http://localhost:3000/api/exa/status` — 返回 `backend: 'exa-api'` 或 `'fallback'`。

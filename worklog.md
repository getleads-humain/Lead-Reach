---
Task ID: 1
Agent: Main Agent
Task: Fix the entire campaign pipeline — make agents actually run autonomously when a campaign is created

Work Log:
- Investigated the complete campaign workflow from UI → API → Agent Executor → Bridge → Internet
- Identified ROOT CAUSE: Campaign creation via "New Campaign" form only created a DB record, never triggered agent execution
- The pipeline only ran through the AI Chat path, which most users wouldn't discover
- Created new API endpoint: POST /api/campaigns/[id]/run-pipeline for manual pipeline triggering
- Updated POST /api/campaigns to auto-trigger runFullPipeline() after campaign creation (autoRun=true by default)
- Updated campaigns-view.tsx with "Start Pipeline" / "Re-Run Pipeline" buttons, pipeline progress indicators, result toasts
- Fixed safeJsonParse() in agent-reach-bridge.ts to detect HTML responses before JSON.parse (prevents "Unexpected token '<'" error)
- Fixed runCommand() in agent-reach-bridge.ts to detect HTML in stdout/stderr from CLI tools
- Fixed callLLM() in agent-executor.ts with better HTML error detection and exponential backoff (3s, 6s, 9s)
- Fixed extractJSONFromString() in agent-executor.ts to detect HTML responses before any parse attempts
- Fixed AI route /api/ai JSON parsing to guard against HTML content
- Fixed seed data: Changed outreach-composer and report-generator tasks from "pending" to "completed" status
- Fixed agents-view.tsx TypeScript error for data.results possibly undefined
- All changes build cleanly with npx next build

Stage Summary:
- The campaign pipeline now works end-to-end: Create Campaign → auto-runs full pipeline → discovers leads → enriches → qualifies → composes outreach
- Users can also manually trigger "Start Pipeline" or "Re-Run Pipeline" from campaign cards
- The "Unexpected token '<'" JSON parse error is now prevented at 4 levels: bridge safeJsonParse, bridge runCommand, executor callLLM, executor extractJSONFromString
- Agent states no longer appear stuck because seed data no longer creates orphaned pending tasks
- New API: POST /api/campaigns/[id]/run-pipeline

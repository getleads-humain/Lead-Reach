---
Task ID: 1
Agent: Main Agent
Task: Fix campaign pipeline getting stuck on "Creating & Running Pipeline..."

Work Log:
- Investigated root cause: pipeline ran synchronously in a single HTTP request, taking 3-10+ minutes, causing timeout
- Made POST /api/campaigns non-blocking using Next.js after() API
- Made POST /api/campaigns/[id]/run-pipeline non-blocking using after() API
- Created new GET /api/campaigns/[id]/pipeline-status endpoint for real-time progress polling
- Rewrote campaigns-view.tsx with async polling (3-second intervals) and real-time stage progress indicators
- Updated AI chat endpoint to also use after() for background pipeline execution
- Fixed Agents view showing agents as "processing" when only pending tasks exist (not running)
- Enhanced callLLM() error detection for HTML-as-JSON errors from API gateway (SyntaxError detection)
- Verified campaign creation returns in ~15-47ms with autoRun=true

Stage Summary:
- Root cause: synchronous pipeline in HTTP request → timeout → stuck UI
- Fix: async pipeline via after() + frontend polling
- Campaign creation now returns immediately with pipeline status
- New pipeline-status endpoint provides real-time per-stage progress
- Frontend shows animated stage progress indicators during pipeline execution

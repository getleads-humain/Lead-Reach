---
Task ID: 1
Agent: Main Agent
Task: Fix preview loading, campaign creation pipeline, and agent execution

Work Log:
- Assessed full codebase: React + TypeScript + Next.js 16 + Prisma + SQLite
- Identified root cause of "Create & Run Pipeline" failure: exec('npx tsx ...') approach was fragile
- Identified root cause of server crashes: self-fetch pattern + in-process pipeline execution OOM'd the dev server
- Fixed campaign creation route (src/app/api/campaigns/route.ts): Replaced self-fetch with direct spawn() of pipeline worker
- Fixed run-pipeline route (src/app/api/campaigns/[id]/run-pipeline/route.ts): Replaced exec() with spawn() with detached:true + unref()
- Verified pipeline produces real results: 32 leads in database across multiple campaigns
- Verified pipeline stages work: ProspectDiscovery finds companies via web_search_sdk, LLM extracts structured data
- Verified pipeline status endpoint works: Returns running/completed status with per-stage progress
- Fixed server stability: Dev server now stays alive during pipeline execution
- Updated start-server.sh with keep-alive restart loop

Stage Summary:
- Campaign creation works: POST /api/campaigns returns 201 with pipeline started
- Pipeline execution works: Worker process runs Discovery → Enrichment → Qualification → Outreach
- Pipeline status works: GET /api/campaigns/[id]/pipeline-status returns real-time progress
- Server stays stable: spawn() + detached + unref() isolates heavy pipeline from Next.js server
- Leads are being created: 32+ leads across campaigns with proper stages and tiers
- Key files modified: src/app/api/campaigns/route.ts, src/app/api/campaigns/[id]/run-pipeline/route.ts, start-server.sh

"use strict";
/**
 * Pipeline Worker Script
 *
 * This script runs the full agent pipeline in a separate Node.js process
 * to prevent the Next.js dev server from crashing during long-running
 * pipeline execution.
 *
 * Usage: node dist/lib/workers/pipeline-worker.js <campaignId> <query> [industry] [location]
 * Or via tsx: npx tsx src/lib/workers/pipeline-worker.ts <campaignId> <query> [industry] [location]
 */
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const agent_executor_1 = require("../agent-executor");
async function main() {
    const campaignId = process.argv[2];
    const query = process.argv[3];
    const industry = process.argv[4] || undefined;
    const location = process.argv[5] || undefined;
    if (!campaignId || !query) {
        console.error('[PipelineWorker] Missing campaignId or query');
        process.exit(1);
    }
    console.log(`[PipelineWorker] Starting pipeline for campaign ${campaignId}`);
    console.log(`[PipelineWorker] Query: "${query}", Industry: "${industry}", Location: "${location}"`);
    try {
        const result = await (0, agent_executor_1.runFullPipeline)(query, industry, location, campaignId);
        console.log(`[PipelineWorker] Pipeline completed: ${result.summary.leadsFound} found, ${result.summary.leadsQualified} qualified, ${result.summary.leadsContacted} contacted`);
        if (result.summary.errors.length > 0) {
            console.warn(`[PipelineWorker] Errors: ${result.summary.errors.join('; ')}`);
        }
        process.exit(0);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[PipelineWorker] Pipeline failed: ${msg}`);
        // Update any running tasks as failed
        try {
            await db_1.db.agentTask.updateMany({
                where: { campaignId, status: 'running' },
                data: { status: 'failed', error: `Pipeline failed: ${msg}`, completedAt: new Date() },
            });
        }
        catch (dbErr) {
            console.error(`[PipelineWorker] Failed to update stuck tasks:`, dbErr);
        }
        process.exit(1);
    }
}
main();

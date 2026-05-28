import { NextRequest, NextResponse } from 'next/server';
import { SALES_COMMANDS } from '@/lib/sales-intelligence';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/sales-intelligence/commands
 *
 * Return all available sales intelligence commands with their full
 * agent prompts/skill definitions from the ai-sales-team-claude repo.
 * This allows the AI assistant and platform agents to access the complete
 * sales methodology on demand.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const command = searchParams.get('command');

    // If a specific command is requested, return its full skill definition
    if (command && SALES_COMMANDS[command as keyof typeof SALES_COMMANDS]) {
      const skillContent = loadSkillContent(command);
      const agentContent = loadAgentContent(command);

      return NextResponse.json({
        command,
        meta: SALES_COMMANDS[command as keyof typeof SALES_COMMANDS],
        skillPrompt: skillContent,
        agentPrompt: agentContent,
      });
    }

    // Return all commands with metadata
    const commandsWithContent: Record<string, any> = {};
    for (const [cmd, meta] of Object.entries(SALES_COMMANDS)) {
      commandsWithContent[cmd] = {
        ...meta,
        skillPromptAvailable: skillFileExists(cmd),
        agentPromptAvailable: agentFileExists(cmd),
      };
    }

    return NextResponse.json({
      commands: commandsWithContent,
      total: Object.keys(SALES_COMMANDS).length,
    });
  } catch (error) {
    console.error('[Sales Commands] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load commands' },
      { status: 500 }
    );
  }
}

const REPO_BASE = path.join(process.cwd(), 'ai-sales-team-claude');

function skillFileExists(command: string): boolean {
  const skillPath = path.join(REPO_BASE, 'skills', `sales-${command}`, 'SKILL.md');
  return fs.existsSync(skillPath);
}

function agentFileExists(command: string): boolean {
  const agentPath = path.join(REPO_BASE, 'agents', `sales-${command}.md`);
  return fs.existsSync(agentPath);
}

function loadSkillContent(command: string): string | null {
  const skillPath = path.join(REPO_BASE, 'skills', `sales-${command}`, 'SKILL.md');
  try {
    if (fs.existsSync(skillPath)) {
      return fs.readFileSync(skillPath, 'utf-8');
    }
  } catch { /* ignore */ }
  return null;
}

function loadAgentContent(command: string): string | null {
  const agentPath = path.join(REPO_BASE, 'agents', `sales-${command}.md`);
  try {
    if (fs.existsSync(agentPath)) {
      return fs.readFileSync(agentPath, 'utf-8');
    }
  } catch { /* ignore */ }
  return null;
}

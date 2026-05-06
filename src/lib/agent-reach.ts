import type { ChannelStatus } from './types';

/**
 * Agent-Reach Integration Layer
 * 
 * This module provides TypeScript types, channel definitions, and UI helper functions
 * for the Agent-Reach toolkit integration.
 * 
 * ⚡ RUNTIME EXECUTION: The actual tool calls (Jina Reader, Exa Search, GitHub, etc.)
 * are handled by `src/lib/agent-reach-bridge.ts` — the Tool Bridge that executes
 * real HTTP/CLI commands against Agent-Reach channels.
 * 
 * 🧠 AGENT EXECUTION: The Agent Execution Engine at `src/lib/agent-executor.ts`
 * dispatches tasks to agents, calls the Tool Bridge, and feeds results to the LLM.
 * 
 * The original Python codebase is located at: /home/z/my-project/upload/Agent-Reach-main/
 * 
 * Agent-Reach gives AI agents internet access through 17+ channels:
 * - Web reading via Jina Reader
 * - Semantic search via Exa
 * - LinkedIn, Twitter/X, YouTube, GitHub, Reddit, and more
 * 
 * Architecture:
 *   UI (this module) ←→ API Routes ←→ Agent Executor ←→ Agent-Reach Bridge ←→ Internet
 */

// ============================================================
// Types
// ============================================================

export interface AgentReachChannelInfo {
  name: string;
  displayName: string;
  description: string;
  status: ChannelStatus;
  tier: number; // 0=zero-config, 1=needs-key, 2=needs-setup
  backend: string | null;
  message: string | null;
  lastChecked: string | null;
  icon?: string;
}

export interface AgentReachDoctorResult {
  channels: AgentReachChannelInfo[];
  okCount: number;
  totalCount: number;
  timestamp: string;
}

export interface AgentReachSearchParams {
  query: string;
  numResults?: number;
  channel?: string;
  includeDomains?: string[];
}

export interface AgentReachWebReadParams {
  url: string;
  format?: 'markdown' | 'text' | 'html';
}

// ============================================================
// Channel Definitions (mirrors Python: agent_reach/channels/)
// ============================================================

const CHANNEL_DEFINITIONS: Omit<AgentReachChannelInfo, 'lastChecked'>[] = [
  {
    name: 'web',
    displayName: 'Web',
    description: 'Read any webpage via Jina Reader - zero configuration required',
    status: 'ok',
    tier: 0,
    backend: 'Jina Reader',
    message: 'Zero-config, ready to use',
    icon: '🌐',
  },
  {
    name: 'exa_search',
    displayName: 'Exa Search',
    description: 'AI-powered semantic web search with high-quality results',
    status: 'warn',
    tier: 0,
    backend: 'Exa via mcporter',
    message: 'Auto-configured via MCP, free without API key',
    icon: '🔍',
  },
  {
    name: 'linkedin',
    displayName: 'LinkedIn',
    description: 'Professional profiles, company pages, and job search data',
    status: 'off',
    tier: 2,
    backend: 'linkedin-scraper-mcp',
    message: 'Cookie export required for authentication',
    icon: '💼',
  },
  {
    name: 'twitter',
    displayName: 'Twitter/X',
    description: 'Tweet search, user timelines, thread reading, and long-form articles',
    status: 'off',
    tier: 2,
    backend: 'twitter-cli',
    message: 'Cookie export required for authentication',
    icon: '🐦',
  },
  {
    name: 'youtube',
    displayName: 'YouTube',
    description: 'Video transcripts, subtitles, and channel data extraction',
    status: 'ok',
    tier: 0,
    backend: 'yt-dlp',
    message: 'Zero-config, ready to use',
    icon: '📺',
  },
  {
    name: 'github',
    displayName: 'GitHub',
    description: 'Repository data, code search, issues, and organization info',
    status: 'ok',
    tier: 0,
    backend: 'gh CLI',
    message: 'Public repos accessible without key',
    icon: '📦',
  },
  {
    name: 'reddit',
    displayName: 'Reddit',
    description: 'Subreddit posts, comments, search, and community data',
    status: 'warn',
    tier: 1,
    backend: 'rdt-cli',
    message: 'Cookie login required (rdt login)',
    icon: '📖',
  },
  {
    name: 'rss',
    displayName: 'RSS Feeds',
    description: 'Parse and read any RSS/Atom feed content',
    status: 'ok',
    tier: 0,
    backend: 'Feedparser',
    message: 'Zero-config, ready to use',
    icon: '📡',
  },
  {
    name: 'bilibili',
    displayName: 'Bilibili',
    description: 'B站视频字幕提取和搜索 — Platform keys configured (3 keys with auto-rotation)',
    status: 'ok',
    tier: 0,
    backend: 'yt-dlp + Platform API Keys',
    message: '3 platform keys active with auto-rotation',
    icon: '📺',
  },
  {
    name: 'xiaohongshu',
    displayName: 'XiaoHongShu',
    description: '小红书笔记搜索、阅读和互动',
    status: 'off',
    tier: 2,
    backend: 'xhs-cli',
    message: 'Cookie export required for authentication',
    icon: '📕',
  },
  {
    name: 'douyin',
    displayName: 'Douyin',
    description: '抖音视频解析和无水印下载',
    status: 'off',
    tier: 2,
    backend: 'douyin-mcp-server',
    message: 'Requires mcporter setup',
    icon: '🎵',
  },
  {
    name: 'wechat',
    displayName: 'WeChat Articles',
    description: '微信公众号文章搜索和全文阅读',
    status: 'warn',
    tier: 1,
    backend: 'Exa + Camoufox',
    message: 'Search works; full reading needs Camoufox',
    icon: '💬',
  },
  {
    name: 'weibo',
    displayName: 'Weibo',
    description: '微博热搜、搜索、用户动态和评论',
    status: 'ok',
    tier: 0,
    backend: 'Weibo API',
    message: 'Zero-config, ready to use',
    icon: '📰',
  },
  {
    name: 'v2ex',
    displayName: 'V2EX',
    description: 'V2EX热门帖子、节点、用户信息',
    status: 'ok',
    tier: 0,
    backend: 'V2EX API',
    message: 'Zero-config, ready to use',
    icon: '💻',
  },
  {
    name: 'xueqiu',
    displayName: 'Xueqiu',
    description: '雪球股票行情、搜索和热门帖子',
    status: 'ok',
    tier: 0,
    backend: 'Xueqiu API',
    message: 'Auto-fetches session cookies',
    icon: '📈',
  },
  {
    name: 'xiaoyuzhou',
    displayName: 'Xiaoyuzhou',
    description: '小宇宙播客音频转文字',
    status: 'off',
    tier: 2,
    backend: 'Groq Whisper + ffmpeg',
    message: 'Requires Groq API key and ffmpeg',
    icon: '🎙️',
  },
];

// ============================================================
// Helper Functions
// ============================================================

export function getDefaultChannels(): AgentReachChannelInfo[] {
  return CHANNEL_DEFINITIONS.map((ch) => ({
    ...ch,
    lastChecked: null,
  }));
}

export function getChannelStatusColor(status: ChannelStatus): string {
  switch (status) {
    case 'ok': return 'bg-emerald-500';
    case 'warn': return 'bg-amber-500';
    case 'off': return 'bg-gray-400';
    case 'error': return 'bg-red-500';
    case 'unknown': return 'bg-gray-300';
  }
}

export function getChannelStatusLabel(status: ChannelStatus): string {
  switch (status) {
    case 'ok': return 'Active';
    case 'warn': return 'Limited';
    case 'off': return 'Disabled';
    case 'error': return 'Error';
    case 'unknown': return 'Unknown';
  }
}

export function getTierLabel(tier: number): string {
  switch (tier) {
    case 0: return 'Zero Config';
    case 1: return 'Needs Key';
    case 2: return 'Needs Setup';
    default: return 'Unknown';
  }
}

export function getTierColor(tier: number): string {
  switch (tier) {
    case 0: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 1: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 2: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}

/**
 * Map an agent name to the Agent-Reach channels it primarily uses.
 * This mirrors the skill.md files in /agents/ directory.
 */
export function mapAgentToChannels(agentName: string): string[] {
  const mapping: Record<string, string[]> = {
    'orchestrator': [], // Orchestrator delegates, doesn't access channels directly
    'prospect-discovery': ['exa_search', 'web', 'linkedin', 'github', 'twitter', 'reddit'],
    'data-enrichment': ['web', 'linkedin', 'exa_search', 'twitter', 'github'],
    'web-research': ['web', 'exa_search', 'linkedin', 'twitter', 'youtube', 'reddit', 'rss'],
    'lead-qualification': ['web', 'linkedin', 'exa_search'],
    'outreach-composer': ['linkedin', 'web', 'exa_search'],
    'pipeline-manager': [], // Operates on database, no direct channel access
    'report-generator': [], // Operates on collected data
  };
  return mapping[agentName] || ['web'];
}

/**
 * Get the CLI command template for a channel operation.
 * These map to the Agent-Reach SKILL.md commands.
 */
export function getChannelCommand(channel: string, operation: string): string {
  const commands: Record<string, Record<string, string>> = {
    web: {
      read: 'curl -s "https://r.jina.ai/URL"',
    },
    exa_search: {
      search: 'mcporter call \'exa.web_search_exa(query: "QUERY", numResults: 10)\'',
      code: 'mcporter call \'exa.get_code_context_exa(query: "QUERY", tokensNum: 3000)\'',
    },
    twitter: {
      search: 'bird search "QUERY" -n 10',
      read: 'bird read URL_OR_ID',
      timeline: 'bird user-tweets @USERNAME -n 20',
      thread: 'bird thread URL_OR_ID',
    },
    youtube: {
      metadata: 'yt-dlp --dump-json "URL"',
      subtitles: 'yt-dlp --write-sub --write-auto-sub --sub-lang "en" --skip-download -o "/tmp/%(id)s" "URL"',
      search: 'yt-dlp --dump-json "ytsearch5:QUERY"',
    },
    github: {
      search_repos: 'gh search repos "QUERY" --sort stars --limit 10',
      view_repo: 'gh repo view OWNER/REPO',
      search_code: 'gh search code "QUERY" --language python',
    },
    linkedin: {
      profile: 'mcporter call \'linkedin.get_person_profile(linkedin_url: "URL")\'',
      search: 'mcporter call \'linkedin.search_people(keyword: "QUERY", limit: 10)\'',
      fallback: 'curl -s "https://r.jina.ai/https://linkedin.com/in/USERNAME"',
    },
    reddit: {
      search: 'curl -s "https://www.reddit.com/search.json?q=QUERY&limit=10" -H "User-Agent: agent-reach/1.0"',
      subreddit: 'curl -s "https://www.reddit.com/r/SUBREDDIT/hot.json?limit=10" -H "User-Agent: agent-reach/1.0"',
    },
    rss: {
      read: 'python3 -c "import feedparser; [print(e.title, e.link) for e in feedparser.parse(\'URL\').entries[:5]]"',
    },
  };
  return commands[channel]?.[operation] || `# Channel ${channel} operation ${operation} not mapped`;
}

/**
 * Get the Python source path for an Agent-Reach channel.
 * References the actual Python codebase at /home/z/my-project/upload/Agent-Reach-main/
 */
export function getChannelSourcePath(channel: string): string {
  return `/home/z/my-project/upload/Agent-Reach-main/agent_reach/channels/${channel}.py`;
}

/**
 * Get the Agent-Reach skill reference path.
 */
export function getSkillReferencePath(reference: string): string {
  return `/home/z/my-project/upload/Agent-Reach-main/agent_reach/skill/references/${reference}.md`;
}

/**
 * Agent-Reach Tool Bridge
 * 
 * This is the ACTUAL RUNTIME execution layer that gives AI agents real access
 * to the Agent-Reach toolkit's 17+ internet channels.
 * 
 * Unlike the agent-reach.ts module (which provides types and UI helpers),
 * this module EXECUTES the actual commands — calling Jina Reader, Exa Search,
 * GitHub CLI, Reddit API, YouTube, LinkedIn, Twitter, etc.
 * 
 * Each function returns structured data that agents can use directly.
 * All commands reference the Agent-Reach Python toolkit at:
 *   /home/z/my-project/agent-reach-toolkit/
 *   /home/z/my-project/upload/Agent-Reach-main/
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================
// Types
// ============================================================

export interface ToolResult<T = unknown> {
  success: boolean;
  data: T;
  source: string;
  channel: string;
  error?: string;
  raw?: string;
  timestamp: string;
}

export interface WebReadResult {
  url: string;
  title: string;
  content: string;
  wordCount: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
  publishedDate?: string;
}

export interface GitHubRepoResult {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  language: string;
}

export interface RedditPostResult {
  title: string;
  url: string;
  author: string;
  score: number;
  numComments: number;
  subreddit: string;
  selftext?: string;
}

export interface YouTubeResult {
  id: string;
  title: string;
  description: string;
  channel: string;
  duration?: string;
  subtitles?: string;
}

export interface LinkedInProfileResult {
  name: string;
  headline: string;
  location: string;
  url: string;
  summary?: string;
  experience?: string[];
}

export interface TwitterResult {
  text: string;
  author: string;
  url: string;
  likes: number;
  retweets: number;
  date: string;
}

export interface RSSResult {
  title: string;
  link: string;
  description: string;
  published: string;
  feed: string;
}

export interface V2EXResult {
  id: number;
  title: string;
  url: string;
  replies: number;
  node: string;
  content?: string;
}

export interface XueqiuResult {
  symbol: string;
  name: string;
  current: number;
  percent: number;
}

export interface WeiboResult {
  id: string;
  text: string;
  author: string;
  likes: number;
  url: string;
}

// ============================================================
// Configuration
// ============================================================

const JINA_READER_BASE = 'https://r.jina.ai';
const EXEC_TIMEOUT = 30000; // 30 seconds for CLI commands
const PYTHON_TOOLKIT_PATH = '/home/z/my-project/agent-reach-toolkit';

// ============================================================
// Core Utilities
// ============================================================

function makeTimestamp(): string {
  return new Date().toISOString();
}

function makeResult<T>(data: T, channel: string, source: string, raw?: string): ToolResult<T> {
  return {
    success: true,
    data,
    source,
    channel,
    raw,
    timestamp: makeTimestamp(),
  };
}

function makeError<T>(error: string, channel: string): ToolResult<T> {
  return {
    success: false,
    data: null as T,
    source: 'error',
    channel,
    error,
    timestamp: makeTimestamp(),
  };
}

/**
 * Safely execute a shell command with timeout
 */
async function runCommand(command: string, timeout = EXEC_TIMEOUT): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: { ...process.env, PATH: `${process.env.PATH}:/usr/local/bin:${PYTHON_TOOLKIT_PATH}` },
    });
    return { stdout: stdout || '', stderr: stderr || '' };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    // Some commands output to stdout even on error
    if (err.stdout) {
      return { stdout: err.stdout, stderr: err.stderr || '' };
    }
    throw new Error(err.message || 'Command execution failed');
  }
}

/**
 * Safely parse JSON from a string
 */
function safeJsonParse<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

// ============================================================
// Channel 1: Web — Jina Reader (Zero Config)
// ============================================================

/**
 * Read any webpage using Jina Reader API.
 * Zero configuration required — works out of the box.
 * 
 * Agent-Reach Reference: SKILL_en.md → "Web — Any URL"
 * Command: curl -s "https://r.jina.ai/URL"
 */
export async function webRead(url: string, format: 'markdown' | 'text' = 'markdown'): Promise<ToolResult<WebReadResult>> {
  const channel = 'web';
  try {
    const jinaUrl = `${JINA_READER_BASE}/${url}`;
    const headers: Record<string, string> = {
      'Accept': format === 'text' ? 'text/plain' : 'text/markdown',
    };

    const response = await fetch(jinaUrl, { headers, signal: AbortSignal.timeout(20000) });
    
    if (!response.ok) {
      return makeError<WebReadResult>(`Jina Reader returned ${response.status}: ${response.statusText}`, channel);
    }

    const content = await response.text();
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

    return makeResult<WebReadResult>(
      {
        url,
        title,
        content: content.slice(0, 50000), // Cap at 50k chars
        wordCount: content.split(/\s+/).length,
      },
      channel,
      'Jina Reader',
      content.slice(0, 2000),
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<WebReadResult>(`Web read failed: ${msg}`, channel);
  }
}

/**
 * Read multiple web pages in parallel
 */
export async function webReadMultiple(urls: string[]): Promise<ToolResult<WebReadResult>[]> {
  return Promise.all(urls.map(url => webRead(url)));
}

// ============================================================
// Channel 2: Exa Search (Semantic Web Search)
// ============================================================

/**
 * AI-powered semantic web search using Exa via mcporter.
 * Works without API key (auto-configured via MCP).
 * 
 * Agent-Reach Reference: SKILL_en.md → "Web Search (Exa)"
 * Command: mcporter call 'exa.web_search_exa(query: "query", numResults: 5)'
 */
export async function exaSearch(query: string, numResults = 10): Promise<ToolResult<SearchResult[]>> {
  const channel = 'exa_search';
  try {
    // Try mcporter first
    try {
      const { stdout } = await runCommand(
        `mcporter call 'exa.web_search_exa(query: "${query.replace(/'/g, "\\'")}", numResults: ${numResults})'`,
        25000,
      );
      
      const parsed = safeJsonParse<Record<string, unknown>[]>(stdout);
      if (parsed && Array.isArray(parsed)) {
        const results: SearchResult[] = parsed.map((item: Record<string, unknown>) => ({
          title: (item.title as string) || '',
          url: (item.url as string) || '',
          snippet: (item.text as string)?.slice(0, 300) || (item.snippet as string) || '',
          score: (item.score as number) || undefined,
          publishedDate: (item.publishedDate as string) || undefined,
        }));
        return makeResult(results, channel, 'Exa via mcporter', stdout.slice(0, 2000));
      }
    } catch {
      // mcporter not available, try fallback
    }

    // Fallback: Use Jina Reader to search (less semantic but works)
    const searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return makeError<SearchResult[]>(`Exa search fallback returned ${response.status}`, channel);
    }

    const text = await response.text();
    const results: SearchResult[] = [];
    const blocks = text.split(/\n\n+/);
    
    for (const block of blocks.slice(0, numResults)) {
      const linkMatch = block.match(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/);
      if (linkMatch) {
        results.push({
          title: linkMatch[1],
          url: linkMatch[2],
          snippet: block.replace(linkMatch[0], '').trim().slice(0, 300),
        });
      }
    }

    if (results.length === 0) {
      // Parse numbered list format
      const lines = text.split('\n').filter(l => l.trim());
      for (const line of lines.slice(0, numResults)) {
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          results.push({
            title: line.replace(urlMatch[0], '').replace(/^[\d.)\]\s]+/, '').trim().slice(0, 200),
            url: urlMatch[1],
            snippet: line.trim().slice(0, 300),
          });
        }
      }
    }

    return makeResult(results, channel, 'Jina Search (Exa fallback)', text.slice(0, 2000));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<SearchResult[]>(`Exa search failed: ${msg}`, channel);
  }
}

// ============================================================
// Channel 3: GitHub (gh CLI — Zero Config for public repos)
// ============================================================

/**
 * Search GitHub repositories.
 * 
 * Agent-Reach Reference: SKILL_en.md → "GitHub (gh CLI)"
 * Command: gh search repos "query" --sort stars --limit 10
 */
export async function githubSearchRepos(query: string, limit = 10): Promise<ToolResult<GitHubRepoResult[]>> {
  const channel = 'github';
  try {
    const { stdout } = await runCommand(
      `gh search repos "${query}" --sort stars --limit ${limit} --json fullName,description,url,stargazersCount,language`,
    );

    const parsed = safeJsonParse<Record<string, unknown>[]>(stdout);
    if (parsed && Array.isArray(parsed)) {
      const results: GitHubRepoResult[] = parsed.map((item: Record<string, unknown>) => ({
        name: ((item.fullName as string) || '').split('/').pop() || '',
        fullName: (item.fullName as string) || '',
        description: (item.description as string) || '',
        url: (item.url as string) || '',
        stars: (item.stargazersCount as number) || 0,
        language: (item.language as string) || '',
      }));
      return makeResult(results, channel, 'gh CLI', stdout.slice(0, 2000));
    }

    return makeError<GitHubRepoResult[]>('Failed to parse GitHub search results', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<GitHubRepoResult[]>(`GitHub search failed: ${msg}`, channel);
  }
}

/**
 * View a GitHub repository's details.
 * Command: gh repo view OWNER/REPO
 */
export async function githubViewRepo(ownerRepo: string): Promise<ToolResult<Record<string, unknown>>> {
  const channel = 'github';
  try {
    const { stdout } = await runCommand(`gh repo view ${ownerRepo} --json name,description,url,stargazersCount,forkCount,primaryLanguage,homepageUrl,createdAt,updatedAt,licenseInfo`);
    const parsed = safeJsonParse<Record<string, unknown>>(stdout);
    if (parsed) {
      return makeResult(parsed, channel, 'gh CLI', stdout.slice(0, 2000));
    }
    return makeError<Record<string, unknown>>('Failed to parse GitHub repo view', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<Record<string, unknown>>(`GitHub view failed: ${msg}`, channel);
  }
}

// ============================================================
// Channel 4: Reddit (Public JSON API)
// ============================================================

/**
 * Search Reddit posts.
 * 
 * Agent-Reach Reference: SKILL_en.md → "Reddit"
 * Command: curl -s "https://www.reddit.com/search.json?q=QUERY&limit=10"
 */
export async function redditSearch(query: string, limit = 10): Promise<ToolResult<RedditPostResult[]>> {
  const channel = 'reddit';
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=relevance`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'agent-reach/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      // Fallback: Try Jina Reader
      const jinaResult = await webRead(`https://www.reddit.com/search/?q=${encodeURIComponent(query)}`);
      if (jinaResult.success) {
        return makeResult<RedditPostResult[]>(
          [{ title: `Reddit search: ${query}`, url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`, author: '', score: 0, numComments: 0, subreddit: '', selftext: jinaResult.data.content?.slice(0, 1000) }],
          channel,
          'Jina Reader (Reddit fallback)',
        );
      }
      return makeError<RedditPostResult[]>(`Reddit search returned ${response.status}`, channel);
    }

    const data = await response.json() as Record<string, unknown>;
    const children = ((data as Record<string, unknown>).data as Record<string, unknown>)?.children as Array<Record<string, unknown>> || [];
    
    const results: RedditPostResult[] = children
      .filter((child: Record<string, unknown>) => child.kind === 't3')
      .map((child: Record<string, unknown>) => {
        const d = child.data as Record<string, unknown>;
        return {
          title: (d.title as string) || '',
          url: (d.url as string) || `https://reddit.com${d.permalink as string || ''}`,
          author: (d.author as string) || '',
          score: (d.score as number) || 0,
          numComments: (d.num_comments as number) || 0,
          subreddit: (d.subreddit as string) || '',
          selftext: (d.selftext as string)?.slice(0, 500) || '',
        };
      });

    return makeResult(results, channel, 'Reddit JSON API');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<RedditPostResult[]>(`Reddit search failed: ${msg}`, channel);
  }
}

/**
 * Get hot posts from a subreddit.
 * Command: curl -s "https://www.reddit.com/r/SUBREDDIT/hot.json?limit=10"
 */
export async function redditSubreddit(subreddit: string, limit = 10): Promise<ToolResult<RedditPostResult[]>> {
  const channel = 'reddit';
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'agent-reach/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return makeError<RedditPostResult[]>(`Reddit subreddit returned ${response.status}`, channel);
    }

    const data = await response.json() as Record<string, unknown>;
    const children = ((data as Record<string, unknown>).data as Record<string, unknown>)?.children as Array<Record<string, unknown>> || [];
    
    const results: RedditPostResult[] = children
      .filter((child: Record<string, unknown>) => child.kind === 't3')
      .map((child: Record<string, unknown>) => {
        const d = child.data as Record<string, unknown>;
        return {
          title: (d.title as string) || '',
          url: (d.url as string) || `https://reddit.com${d.permalink as string || ''}`,
          author: (d.author as string) || '',
          score: (d.score as number) || 0,
          numComments: (d.num_comments as number) || 0,
          subreddit: (d.subreddit as string) || subreddit,
          selftext: (d.selftext as string)?.slice(0, 500) || '',
        };
      });

    return makeResult(results, channel, 'Reddit JSON API');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<RedditPostResult[]>(`Reddit subreddit failed: ${msg}`, channel);
  }
}

// ============================================================
// Channel 5: YouTube (yt-dlp — Zero Config)
// ============================================================

/**
 * Get YouTube video metadata and subtitles.
 * 
 * Agent-Reach Reference: SKILL_en.md → "YouTube (yt-dlp)"
 * Command: yt-dlp --dump-json "URL"
 */
export async function youtubeGetInfo(url: string): Promise<ToolResult<YouTubeResult>> {
  const channel = 'youtube';
  try {
    const { stdout } = await runCommand(`yt-dlp --dump-json "${url}"`, 20000);
    const parsed = safeJsonParse<Record<string, unknown>>(stdout);

    if (parsed) {
      return makeResult<YouTubeResult>(
        {
          id: (parsed.id as string) || '',
          title: (parsed.title as string) || '',
          description: (parsed.description as string)?.slice(0, 2000) || '',
          channel: (parsed.channel as string) || (parsed.uploader as string) || '',
          duration: parsed.duration_string as string || undefined,
        },
        channel,
        'yt-dlp',
        stdout.slice(0, 2000),
      );
    }

    // Fallback: Try Jina Reader
    const jinaResult = await webRead(url);
    if (jinaResult.success) {
      return makeResult<YouTubeResult>(
        {
          id: '',
          title: jinaResult.data.title,
          description: jinaResult.data.content?.slice(0, 2000) || '',
          channel: '',
        },
        channel,
        'Jina Reader (YouTube fallback)',
      );
    }

    return makeError<YouTubeResult>('Failed to get YouTube info', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // Fallback to Jina Reader
    const jinaResult = await webRead(url);
    if (jinaResult.success) {
      return makeResult<YouTubeResult>(
        { id: '', title: jinaResult.data.title, description: jinaResult.data.content?.slice(0, 2000) || '', channel: '' },
        channel,
        'Jina Reader (YouTube fallback)',
      );
    }
    return makeError<YouTubeResult>(`YouTube info failed: ${msg}`, channel);
  }
}

/**
 * Get YouTube video subtitles/transcript.
 * Command: yt-dlp --write-sub --write-auto-sub --sub-lang "en" --skip-download -o "/tmp/%(id)s" "URL"
 */
export async function youtubeGetSubtitles(url: string, lang = 'en'): Promise<ToolResult<string>> {
  const channel = 'youtube';
  try {
    const tmpFile = `/tmp/yt-subtitles-${Date.now()}`;
    await runCommand(
      `yt-dlp --write-sub --write-auto-sub --sub-lang "${lang}" --convert-subs vtt --skip-download -o "${tmpFile}/%(id)s" "${url}"`,
      30000,
    );

    // Read the VTT file
    const fs = await import('fs/promises');
    const files = await fs.readdir(tmpFile);
    const vttFile = files.find(f => f.endsWith('.vtt'));
    
    if (vttFile) {
      const content = await fs.readFile(`${tmpFile}/${vttFile}`, 'utf-8');
      // Clean up VTT formatting
      const cleanText = content
        .replace(/WEBVTT.*?\n\n/s, '')
        .replace(/\d{2}:\d{2}:\d{2}\.\d{3}.*?\d{2}:\d{2}:\d{2}\.\d{3}.*/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Cleanup
      await fs.rm(tmpFile, { recursive: true, force: true }).catch(() => {});
      
      return makeResult(cleanText, channel, 'yt-dlp subtitles');
    }

    return makeError<string>('No subtitle file found', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<string>(`YouTube subtitles failed: ${msg}`, channel);
  }
}

/**
 * Search YouTube videos.
 * Command: yt-dlp --dump-json "ytsearch5:query"
 */
export async function youtubeSearch(query: string, limit = 5): Promise<ToolResult<YouTubeResult[]>> {
  const channel = 'youtube';
  try {
    const { stdout } = await runCommand(`yt-dlp --dump-json "ytsearch${limit}:${query}"`, 30000);
    
    // yt-dlp may return one JSON per line for search results
    const results: YouTubeResult[] = [];
    const lines = stdout.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      const parsed = safeJsonParse<Record<string, unknown>>(line);
      if (parsed) {
        results.push({
          id: (parsed.id as string) || '',
          title: (parsed.title as string) || '',
          description: (parsed.description as string)?.slice(0, 500) || '',
          channel: (parsed.channel as string) || (parsed.uploader as string) || '',
          duration: parsed.duration_string as string || undefined,
        });
      }
    }

    if (results.length > 0) {
      return makeResult(results, channel, 'yt-dlp search', stdout.slice(0, 2000));
    }

    return makeError<YouTubeResult[]>('No YouTube results found', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<YouTubeResult[]>(`YouTube search failed: ${msg}`, channel);
  }
}

// ============================================================
// Channel 6: LinkedIn (mcporter + Jina Reader fallback)
// ============================================================

/**
 * Get LinkedIn profile data.
 * 
 * Agent-Reach Reference: SKILL_en.md → "LinkedIn (mcporter)"
 * Primary: mcporter call 'linkedin.get_person_profile(...)'
 * Fallback: curl -s "https://r.jina.ai/https://linkedin.com/in/username"
 */
export async function linkedInGetProfile(url: string): Promise<ToolResult<LinkedInProfileResult>> {
  const channel = 'linkedin';
  try {
    // Try mcporter first
    try {
      const { stdout } = await runCommand(
        `mcporter call 'linkedin.get_person_profile(linkedin_url: "${url}")'`,
        20000,
      );
      const parsed = safeJsonParse<Record<string, unknown>>(stdout);
      if (parsed) {
        return makeResult<LinkedInProfileResult>(
          {
            name: (parsed.firstName as string && parsed.lastName as string) ? `${parsed.firstName} ${parsed.lastName}` : (parsed.fullName as string) || '',
            headline: (parsed.headline as string) || '',
            location: (parsed.location as string) || '',
            url,
            summary: (parsed.summary as string) || '',
            experience: Array.isArray(parsed.experience) 
              ? (parsed.experience as Array<Record<string, unknown>>).map((e: Record<string, unknown>) => `${e.title} at ${e.companyName}`)
              : undefined,
          },
          channel,
          'LinkedIn via mcporter',
          stdout.slice(0, 2000),
        );
      }
    } catch {
      // mcporter not available
    }

    // Fallback: Jina Reader
    const jinaResult = await webRead(url);
    if (jinaResult.success) {
      return makeResult<LinkedInProfileResult>(
        {
          name: jinaResult.data.title,
          headline: '',
          location: '',
          url,
          summary: jinaResult.data.content?.slice(0, 3000) || '',
        },
        channel,
        'Jina Reader (LinkedIn fallback)',
      );
    }

    return makeError<LinkedInProfileResult>('LinkedIn profile unavailable (mcporter not configured, Jina Reader blocked)', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<LinkedInProfileResult>(`LinkedIn profile failed: ${msg}`, channel);
  }
}

/**
 * Search LinkedIn people.
 * Command: mcporter call 'linkedin.search_people(keyword: "query", limit: 10)'
 */
export async function linkedInSearchPeople(query: string, limit = 10): Promise<ToolResult<LinkedInProfileResult[]>> {
  const channel = 'linkedin';
  try {
    // Try mcporter
    try {
      const { stdout } = await runCommand(
        `mcporter call 'linkedin.search_people(keyword: "${query.replace(/'/g, "\\'")}", limit: ${limit})'`,
        20000,
      );
      const parsed = safeJsonParse<Record<string, unknown>[]>(stdout);
      if (parsed && Array.isArray(parsed)) {
        const results: LinkedInProfileResult[] = parsed.map((item: Record<string, unknown>) => ({
          name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          headline: (item.headline as string) || '',
          location: (item.location as string) || '',
          url: (item.linkedinUrl as string) || '',
        }));
        return makeResult(results, channel, 'LinkedIn via mcporter', stdout.slice(0, 2000));
      }
    } catch {
      // mcporter not available
    }

    // Fallback: Search via Exa + Jina Reader
    const exaResult = await exaSearch(`site:linkedin.com/in ${query}`, limit);
    if (exaResult.success && exaResult.data.length > 0) {
      const results: LinkedInProfileResult[] = exaResult.data.map(r => ({
        name: r.title,
        headline: r.snippet,
        location: '',
        url: r.url,
      }));
      return makeResult(results, channel, 'Exa + Jina (LinkedIn fallback)');
    }

    return makeError<LinkedInProfileResult[]>('LinkedIn search unavailable', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<LinkedInProfileResult[]>(`LinkedIn search failed: ${msg}`, channel);
  }
}

// ============================================================
// Channel 7: Twitter/X (bird CLI + Jina Reader fallback)
// ============================================================

/**
 * Search Twitter/X.
 * 
 * Agent-Reach Reference: SKILL_en.md → "Twitter/X (bird)"
 * Command: bird search "query" -n 10
 */
export async function twitterSearch(query: string, limit = 10): Promise<ToolResult<TwitterResult[]>> {
  const channel = 'twitter';
  try {
    // Try bird CLI
    try {
      const { stdout } = await runCommand(`bird search "${query.replace(/"/g, '\\"')}" -n ${limit}`, 20000);
      // Parse bird output (usually JSON or text format)
      const parsed = safeJsonParse<TwitterResult[]>(stdout);
      if (parsed && Array.isArray(parsed)) {
        return makeResult(parsed, channel, 'bird CLI', stdout.slice(0, 2000));
      }
      
      // Try parsing text output
      const results: TwitterResult[] = [];
      const lines = stdout.split('\n').filter(l => l.trim());
      for (const line of lines.slice(0, limit)) {
        if (line.includes('http')) {
          const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
          results.push({
            text: line.replace(urlMatch?.[0] || '', '').trim(),
            author: '',
            url: urlMatch?.[1] || '',
            likes: 0,
            retweets: 0,
            date: '',
          });
        }
      }
      if (results.length > 0) {
        return makeResult(results, channel, 'bird CLI', stdout.slice(0, 2000));
      }
    } catch {
      // bird CLI not available
    }

    // Fallback: Exa search for tweets
    const exaResult = await exaSearch(`site:twitter.com OR site:x.com ${query}`, limit);
    if (exaResult.success && exaResult.data.length > 0) {
      const results: TwitterResult[] = exaResult.data.map(r => ({
        text: r.snippet,
        author: '',
        url: r.url,
        likes: 0,
        retweets: 0,
        date: r.publishedDate || '',
      }));
      return makeResult(results, channel, 'Exa (Twitter fallback)');
    }

    return makeError<TwitterResult[]>('Twitter search unavailable (bird CLI not configured)', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<TwitterResult[]>(`Twitter search failed: ${msg}`, channel);
  }
}

// ============================================================
// Channel 8: RSS Feeds (feedparser — Zero Config)
// ============================================================

/**
 * Read an RSS/Atom feed.
 * 
 * Agent-Reach Reference: SKILL_en.md → "RSS (feedparser)"
 * Command: python3 -c "import feedparser; ..."
 */
export async function rssRead(feedUrl: string, limit = 10): Promise<ToolResult<RSSResult[]>> {
  const channel = 'rss';
  try {
    // Use Python feedparser via Agent-Reach toolkit
    const { stdout } = await runCommand(
      `python3 -c "import feedparser; import json; feed = feedparser.parse('${feedUrl.replace(/'/g, "\\'")}'); items = [{'title': e.get('title',''), 'link': e.get('link',''), 'description': e.get('summary','')[:300], 'published': e.get('published',''), 'feed': feedUrl} for e in feed.entries[:${limit}]]; print(json.dumps(items))"`,
      15000,
    );

    const parsed = safeJsonParse<RSSResult[]>(stdout);
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      return makeResult(parsed, channel, 'feedparser', stdout.slice(0, 2000));
    }

    // Fallback: Try Jina Reader
    const jinaResult = await webRead(feedUrl);
    if (jinaResult.success) {
      return makeResult<RSSResult[]>(
        [{ title: jinaResult.data.title, link: feedUrl, description: jinaResult.data.content?.slice(0, 500) || '', published: '', feed: feedUrl }],
        channel,
        'Jina Reader (RSS fallback)',
      );
    }

    return makeError<RSSResult[]>('Failed to parse RSS feed', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<RSSResult[]>(`RSS read failed: ${msg}`, channel);
  }
}

// ============================================================
// Channel 9: V2EX (Public API — Zero Config)
// ============================================================

/**
 * Get V2EX hot topics.
 * 
 * Agent-Reach Reference: SKILL_en.md → "V2EX (public API)"
 */
export async function v2exHotTopics(limit = 10): Promise<ToolResult<V2EXResult[]>> {
  const channel = 'v2ex';
  try {
    const response = await fetch('https://www.v2ex.com/api/topics/hot.json', {
      headers: { 'User-Agent': 'agent-reach/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return makeError<V2EXResult[]>(`V2EX returned ${response.status}`, channel);
    }

    const data = await response.json() as Array<Record<string, unknown>>;
    const results: V2EXResult[] = data.slice(0, limit).map((item: Record<string, unknown>) => ({
      id: (item.id as number) || 0,
      title: (item.title as string) || '',
      url: (item.url as string) || '',
      replies: (item.replies as number) || 0,
      node: ((item.node as Record<string, unknown>)?.title as string) || '',
      content: (item.content as string)?.slice(0, 300) || '',
    }));

    return makeResult(results, channel, 'V2EX API');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<V2EXResult[]>(`V2EX hot topics failed: ${msg}`, channel);
  }
}

// ============================================================
// Channel 10: Weibo (mcporter — Zero Config)
// ============================================================

/**
 * Search Weibo content.
 * 
 * Agent-Reach Reference: SKILL_en.md → "Weibo (mcporter)"
 */
export async function weiboSearch(keyword: string, limit = 10): Promise<ToolResult<WeiboResult[]>> {
  const channel = 'weibo';
  try {
    // Try mcporter
    try {
      const { stdout } = await runCommand(
        `mcporter call 'weibo.search_content(keyword: "${keyword}", limit: ${limit})'`,
        15000,
      );
      const parsed = safeJsonParse<Record<string, unknown>[]>(stdout);
      if (parsed && Array.isArray(parsed)) {
        const results: WeiboResult[] = parsed.map((item: Record<string, unknown>) => ({
          id: (item.id as string) || '',
          text: (item.text as string)?.slice(0, 500) || '',
          author: ((item.user as Record<string, unknown>)?.screen_name as string) || '',
          likes: (item.attitudes_count as number) || 0,
          url: (item.scheme as string) || '',
        }));
        return makeResult(results, channel, 'Weibo via mcporter', stdout.slice(0, 2000));
      }
    } catch {
      // mcporter not available
    }

    // Fallback: Python toolkit direct
    try {
      const { stdout } = await runCommand(
        `cd ${PYTHON_TOOLKIT_PATH} && python3 -c "from agent_reach.channels.weibo import WeiboChannel; import json; ch=WeiboChannel(); results=ch.search_content('${keyword.replace(/'/g, "\\'")}', limit=${limit}); print(json.dumps(results[:${limit}]))"`,
        15000,
      );
      const parsed = safeJsonParse<WeiboResult[]>(stdout);
      if (parsed && Array.isArray(parsed)) {
        return makeResult(parsed, channel, 'Agent-Reach Python', stdout.slice(0, 2000));
      }
    } catch {
      // Python toolkit fallback failed
    }

    return makeError<WeiboResult[]>('Weibo search unavailable', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<WeiboResult[]>(`Weibo search failed: ${msg}`, channel);
  }
}

// ============================================================
// Channel 11: Xueqiu (Public API — Zero Config)
// ============================================================

/**
 * Get stock quotes from Xueqiu.
 * 
 * Agent-Reach Reference: SKILL_en.md → "Xueqiu (public API)"
 */
export async function xueqiuQuote(symbol: string): Promise<ToolResult<XueqiuResult>> {
  const channel = 'xueqiu';
  try {
    const { stdout } = await runCommand(
      `cd ${PYTHON_TOOLKIT_PATH} && python3 -c "from agent_reach.channels.xueqiu import XueqiuChannel; import json; ch=XueqiuChannel(); q=ch.get_stock_quote('${symbol}'); print(json.dumps(q))"`,
      15000,
    );
    const parsed = safeJsonParse<XueqiuResult>(stdout);
    if (parsed) {
      return makeResult(parsed, channel, 'Xueqiu via Agent-Reach Python');
    }
    return makeError<XueqiuResult>('Failed to parse Xueqiu quote', channel);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<XueqiuResult>(`Xueqiu quote failed: ${msg}`, channel);
  }
}

// ============================================================
// Composite Tool: Multi-Channel Business Discovery
// ============================================================

/**
 * The primary tool for prospect-discovery agent.
 * Searches multiple channels in parallel to discover businesses matching criteria.
 * 
 * This is what makes Agent-Reach so powerful for lead generation —
 * it casts a wide net across ALL available channels simultaneously.
 */
export async function discoverBusinesses(
  query: string,
  location?: string,
  industry?: string,
): Promise<ToolResult<SearchResult[]>> {
  const fullQuery = location ? `${query} ${location}` : query;
  const industryQuery = industry ? `${industry} companies ${location || ''}` : fullQuery;

  // Fire off parallel searches across multiple channels
  const [exaResults, redditResults, webResults] = await Promise.allSettled([
    exaSearch(fullQuery, 15),
    redditSearch(fullQuery, 5),
    // Also search for business directories
    webRead(`https://www.google.com/search?q=${encodeURIComponent(`${industryQuery} business directory list`)}`),
  ]);

  const allResults: SearchResult[] = [];

  // Collect Exa results
  if (exaResults.status === 'fulfilled' && exaResults.value.success) {
    allResults.push(...exaResults.value.data);
  }

  // Collect Reddit results
  if (redditResults.status === 'fulfilled' && redditResults.value.success) {
    allResults.push(...redditResults.value.data.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.selftext || `r/${r.subreddit} — ${r.score} upvotes`,
    })));
  }

  // Collect web directory results
  if (webResults.status === 'fulfilled' && webResults.value.success) {
    const content = webResults.value.data.content || '';
    // Extract URLs from Jina Reader output
    const urlMatches = content.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g);
    for (const match of urlMatches) {
      allResults.push({
        title: match[1],
        url: match[2],
        snippet: '',
      });
    }
  }

  return makeResult(allResults, 'multi', 'Multi-channel discovery (Exa + Reddit + Web)');
}

/**
 * Deep-enrich a single company/URL by reading its website content.
 * Used by data-enrichment agent to extract structured data.
 */
export async function enrichCompanyData(websiteUrl: string): Promise<ToolResult<WebReadResult>> {
  // Read main site
  const mainResult = await webRead(websiteUrl);
  if (!mainResult.success) {
    return mainResult;
  }

  // Also read common sub-pages for contact info, about, etc.
  const subPages = ['/contact', '/about', '/team', '/about-us'];
  const baseUrl = websiteUrl.replace(/\/$/, '');
  
  // Try to read contact page in parallel with main site
  const contactResult = await webRead(`${baseUrl}/contact`).catch(() => null);
  
  const combinedContent = [
    mainResult.data.content,
    contactResult?.data?.content ? `\n\n--- CONTACT PAGE ---\n${contactResult.data.content}` : '',
  ].join('');

  return makeResult<WebReadResult>(
    {
      url: websiteUrl,
      title: mainResult.data.title,
      content: combinedContent.slice(0, 80000),
      wordCount: combinedContent.split(/\s+/).length,
    },
    'web',
    'Jina Reader (multi-page)',
  );
}

// ============================================================
// Agent-Reach Doctor (Health Check)
// ============================================================

/**
 * Run Agent-Reach doctor to check channel availability.
 * This actually executes the Python doctor command.
 */
export async function runDoctor(): Promise<ToolResult<Record<string, unknown>>> {
  try {
    const { stdout } = await runCommand(
      `cd ${PYTHON_TOOLKIT_PATH} && python3 -c "from agent_reach.core import AgentReach; from agent_reach.doctor import format_report; ar=AgentReach(); report=format_report(ar.doctor()); print(report)"`,
      30000,
    );
    return makeResult<Record<string, unknown>>(
      { report: stdout },
      'agent-reach',
      'Agent-Reach Doctor',
      stdout,
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return makeError<Record<string, unknown>>(`Doctor failed: ${msg}`, 'agent-reach');
  }
}

// ============================================================
// Export all channel functions as a single toolkit object
// for agents to access
// ============================================================

export const AgentReachToolkit = {
  // Zero-config channels (always available)
  webRead,
  webReadMultiple,
  exaSearch,
  githubSearchRepos,
  githubViewRepo,
  redditSearch,
  redditSubreddit,
  youtubeGetInfo,
  youtubeGetSubtitles,
  youtubeSearch,
  v2exHotTopics,
  rssRead,
  
  // Channels requiring setup (best-effort with fallbacks)
  linkedInGetProfile,
  linkedInSearchPeople,
  twitterSearch,
  weiboSearch,
  xueqiuQuote,
  
  // Composite tools (multi-channel)
  discoverBusinesses,
  enrichCompanyData,
  
  // Utilities
  runDoctor,
} as const;

export type AgentReachToolkitType = typeof AgentReachToolkit;

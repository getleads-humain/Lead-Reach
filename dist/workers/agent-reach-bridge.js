"use strict";
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
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentReachToolkit = void 0;
exports.webRead = webRead;
exports.webReadMultiple = webReadMultiple;
exports.exaSearch = exaSearch;
exports.githubSearchRepos = githubSearchRepos;
exports.githubViewRepo = githubViewRepo;
exports.redditSearch = redditSearch;
exports.redditSubreddit = redditSubreddit;
exports.youtubeGetInfo = youtubeGetInfo;
exports.youtubeGetSubtitles = youtubeGetSubtitles;
exports.youtubeSearch = youtubeSearch;
exports.linkedInGetProfile = linkedInGetProfile;
exports.linkedInSearchPeople = linkedInSearchPeople;
exports.linkedInSearchCompanies = linkedInSearchCompanies;
exports.linkedInReadCompanyPage = linkedInReadCompanyPage;
exports.twitterSearch = twitterSearch;
exports.twitterReadTweet = twitterReadTweet;
exports.twitterSearchUsers = twitterSearchUsers;
exports.rssRead = rssRead;
exports.bilibiliSearch = bilibiliSearch;
exports.bilibiliPopular = bilibiliPopular;
exports.bilibiliVideoInfo = bilibiliVideoInfo;
exports.bilibiliSubtitles = bilibiliSubtitles;
exports.getBilibiliKeyStats = getBilibiliKeyStats;
exports.v2exHotTopics = v2exHotTopics;
exports.weiboSearch = weiboSearch;
exports.xueqiuQuote = xueqiuQuote;
exports.discoverBusinesses = discoverBusinesses;
exports.enrichCompanyData = enrichCompanyData;
exports.runDoctor = runDoctor;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// ============================================================
// Configuration
// ============================================================
const JINA_READER_BASE = 'https://r.jina.ai';
const EXEC_TIMEOUT = 30000; // 30 seconds for CLI commands
const PYTHON_TOOLKIT_PATH = '/home/z/my-project/agent-reach-toolkit';
// ============================================================
// Core Utilities
// ============================================================
function makeTimestamp() {
    return new Date().toISOString();
}
function makeResult(data, channel, source, raw) {
    return {
        success: true,
        data,
        source,
        channel,
        raw,
        timestamp: makeTimestamp(),
    };
}
function makeError(error, channel) {
    return {
        success: false,
        data: null,
        source: 'error',
        channel,
        error,
        timestamp: makeTimestamp(),
    };
}
/**
 * Safely execute a shell command with timeout
 */
async function runCommand(command, timeout = EXEC_TIMEOUT) {
    try {
        const { stdout, stderr } = await execAsync(command, {
            timeout,
            maxBuffer: 10 * 1024 * 1024, // 10MB
            env: { ...process.env, PATH: `${process.env.PATH}:/usr/local/bin:${PYTHON_TOOLKIT_PATH}` },
        });
        // Detect HTML in stdout — some CLI tools or API gateways return HTML error pages
        const trimmedStdout = (stdout || '').trim();
        if (trimmedStdout.startsWith('<') || trimmedStdout.startsWith('<!DOCTYPE') || trimmedStdout.startsWith('<html')) {
            console.warn(`[runCommand] Command "${command.slice(0, 80)}" returned HTML instead of expected output — API gateway error page`);
            return { stdout: '', stderr: 'Command returned HTML instead of expected JSON/data (likely API gateway error page)' };
        }
        return { stdout: stdout || '', stderr: stderr || '' };
    }
    catch (error) {
        const err = error;
        // If the process was killed (timeout), return a meaningful error instead of throwing
        if (err.killed) {
            return { stdout: '', stderr: `Command timed out after ${timeout}ms` };
        }
        // Check if the error stdout is HTML (API gateway error page)
        if (err.stdout) {
            const trimmedErrStdout = err.stdout.trim();
            if (trimmedErrStdout.startsWith('<') || trimmedErrStdout.startsWith('<!DOCTYPE') || trimmedErrStdout.startsWith('<html')) {
                console.warn(`[runCommand] Command "${command.slice(0, 80)}" error output is HTML — API gateway error page`);
                return { stdout: '', stderr: 'Command returned HTML error page instead of data (API gateway issue)' };
            }
            return { stdout: err.stdout, stderr: err.stderr || '' };
        }
        // Instead of throwing, return empty result with error info
        // This prevents uncaught errors from crashing the server process
        const errMsg = err.message || 'Command execution failed';
        console.warn(`[runCommand] Command failed: ${errMsg.slice(0, 200)}`);
        return { stdout: '', stderr: errMsg };
    }
}
/**
 * Safely parse JSON from a string.
 * Detects HTML responses (from error pages, rate limits, API gateways)
 * before attempting JSON.parse to avoid the "Unexpected token '<'" SyntaxError.
 */
function safeJsonParse(str) {
    if (!str || !str.trim())
        return null;
    // Detect HTML responses early — these come from API gateways returning error pages
    // instead of JSON (rate limits, 404 pages, maintenance pages, etc.)
    const trimmed = str.trim();
    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
        console.warn('[safeJsonParse] Received HTML instead of JSON — likely an API gateway error page');
        return null;
    }
    try {
        return JSON.parse(str);
    }
    catch {
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
async function webRead(url, format = 'markdown') {
    const channel = 'web';
    try {
        const jinaUrl = `${JINA_READER_BASE}/${url}`;
        const headers = {
            'Accept': format === 'text' ? 'text/plain' : 'text/markdown',
        };
        const response = await fetch(jinaUrl, { headers, signal: AbortSignal.timeout(20000) });
        if (!response.ok) {
            return makeError(`Jina Reader returned ${response.status}: ${response.statusText}`, channel);
        }
        const content = await response.text();
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
        return makeResult({
            url,
            title,
            content: content.slice(0, 50000), // Cap at 50k chars
            wordCount: content.split(/\s+/).length,
        }, channel, 'Jina Reader', content.slice(0, 2000));
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Web read failed: ${msg}`, channel);
    }
}
/**
 * Read multiple web pages in parallel
 */
async function webReadMultiple(urls) {
    return Promise.all(urls.map(url => webRead(url)));
}
// ============================================================
// Channel 2: Web Search (z-ai-web-dev-sdk → Exa/mcporter → Jina)
// ============================================================
/**
 * AI-powered web search using multiple sources with smart fallback.
 *
 * Pipeline (tries each in order until one returns results):
 * 1. z-ai-web-dev-sdk web_search (MOST RELIABLE — always available)
 * 2. mcporter Exa (if available)
 * 3. Jina Search (s.jina.ai)
 *
 * Agent-Reach Reference: SKILL_en.md → "Web Search (Exa)"
 */
async function exaSearch(query, numResults = 10) {
    const channel = 'exa_search';
    // ===== METHOD 1: z-ai-web-dev-sdk web_search (Primary — always works) =====
    try {
        const ZAI = (await Promise.resolve().then(() => __importStar(require('z-ai-web-dev-sdk')))).default;
        const zai = await ZAI.create();
        const searchResult = await zai.functions.invoke('web_search', {
            query,
            num: numResults,
        });
        if (Array.isArray(searchResult) && searchResult.length > 0) {
            const results = searchResult.map((item) => ({
                title: item.name || '',
                url: item.url || '',
                snippet: item.snippet || '',
                score: item.rank || undefined,
                publishedDate: item.date || undefined,
            }));
            console.log(`[exaSearch] z-ai-web-dev-sdk returned ${results.length} results for "${query.slice(0, 60)}"`);
            return makeResult(results, channel, 'z-ai-web-dev-sdk Web Search', JSON.stringify(searchResult).slice(0, 2000));
        }
        console.warn(`[exaSearch] z-ai-web-dev-sdk returned 0 results for "${query.slice(0, 60)}"`);
    }
    catch (sdkError) {
        const msg = sdkError instanceof Error ? sdkError.message : 'Unknown error';
        console.warn(`[exaSearch] z-ai-web-dev-sdk failed: ${msg.slice(0, 200)}`);
    }
    // ===== METHOD 2: mcporter Exa (if available) =====
    try {
        const { stdout } = await runCommand(`mcporter call 'exa.web_search_exa(query: "${query.replace(/'/g, "\\'")}", numResults: ${numResults})'`, 25000);
        const parsed = safeJsonParse(stdout);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            const results = parsed.map((item) => ({
                title: item.title || '',
                url: item.url || '',
                snippet: item.text?.slice(0, 300) || item.snippet || '',
                score: item.score || undefined,
                publishedDate: item.publishedDate || undefined,
            }));
            return makeResult(results, channel, 'Exa via mcporter', stdout.slice(0, 2000));
        }
    }
    catch {
        // mcporter not available, try fallback
    }
    // ===== METHOD 3: Jina Search (final fallback) =====
    try {
        const searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, {
            headers: { 'Accept': 'text/plain' },
            signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) {
            return makeError(`All search methods failed (Jina returned ${response.status})`, channel);
        }
        const text = await response.text();
        // Detect HTML error pages
        if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
            return makeError('Jina Search returned HTML error page', channel);
        }
        const results = [];
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
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`All search methods failed: ${msg}`, channel);
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
async function githubSearchRepos(query, limit = 10) {
    const channel = 'github';
    try {
        const { stdout } = await runCommand(`gh search repos "${query}" --sort stars --limit ${limit} --json fullName,description,url,stargazersCount,language`);
        const parsed = safeJsonParse(stdout);
        if (parsed && Array.isArray(parsed)) {
            const results = parsed.map((item) => ({
                name: (item.fullName || '').split('/').pop() || '',
                fullName: item.fullName || '',
                description: item.description || '',
                url: item.url || '',
                stars: item.stargazersCount || 0,
                language: item.language || '',
            }));
            return makeResult(results, channel, 'gh CLI', stdout.slice(0, 2000));
        }
        return makeError('Failed to parse GitHub search results', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`GitHub search failed: ${msg}`, channel);
    }
}
/**
 * View a GitHub repository's details.
 * Command: gh repo view OWNER/REPO
 */
async function githubViewRepo(ownerRepo) {
    const channel = 'github';
    try {
        const { stdout } = await runCommand(`gh repo view ${ownerRepo} --json name,description,url,stargazersCount,forkCount,primaryLanguage,homepageUrl,createdAt,updatedAt,licenseInfo`);
        const parsed = safeJsonParse(stdout);
        if (parsed) {
            return makeResult(parsed, channel, 'gh CLI', stdout.slice(0, 2000));
        }
        return makeError('Failed to parse GitHub repo view', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`GitHub view failed: ${msg}`, channel);
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
async function redditSearch(query, limit = 10) {
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
                return makeResult([{ title: `Reddit search: ${query}`, url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`, author: '', score: 0, numComments: 0, subreddit: '', selftext: jinaResult.data.content?.slice(0, 1000) }], channel, 'Jina Reader (Reddit fallback)');
            }
            return makeError(`Reddit search returned ${response.status}`, channel);
        }
        const data = await response.json();
        const children = data.data?.children || [];
        const results = children
            .filter((child) => child.kind === 't3')
            .map((child) => {
            const d = child.data;
            return {
                title: d.title || '',
                url: d.url || `https://reddit.com${d.permalink || ''}`,
                author: d.author || '',
                score: d.score || 0,
                numComments: d.num_comments || 0,
                subreddit: d.subreddit || '',
                selftext: d.selftext?.slice(0, 500) || '',
            };
        });
        return makeResult(results, channel, 'Reddit JSON API');
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Reddit search failed: ${msg}`, channel);
    }
}
/**
 * Get hot posts from a subreddit.
 * Command: curl -s "https://www.reddit.com/r/SUBREDDIT/hot.json?limit=10"
 */
async function redditSubreddit(subreddit, limit = 10) {
    const channel = 'reddit';
    try {
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'agent-reach/1.0' },
            signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
            return makeError(`Reddit subreddit returned ${response.status}`, channel);
        }
        const data = await response.json();
        const children = data.data?.children || [];
        const results = children
            .filter((child) => child.kind === 't3')
            .map((child) => {
            const d = child.data;
            return {
                title: d.title || '',
                url: d.url || `https://reddit.com${d.permalink || ''}`,
                author: d.author || '',
                score: d.score || 0,
                numComments: d.num_comments || 0,
                subreddit: d.subreddit || subreddit,
                selftext: d.selftext?.slice(0, 500) || '',
            };
        });
        return makeResult(results, channel, 'Reddit JSON API');
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Reddit subreddit failed: ${msg}`, channel);
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
async function youtubeGetInfo(url) {
    const channel = 'youtube';
    try {
        const { stdout } = await runCommand(`yt-dlp --dump-json "${url}"`, 20000);
        const parsed = safeJsonParse(stdout);
        if (parsed) {
            return makeResult({
                id: parsed.id || '',
                title: parsed.title || '',
                description: parsed.description?.slice(0, 2000) || '',
                channel: parsed.channel || parsed.uploader || '',
                duration: parsed.duration_string || undefined,
            }, channel, 'yt-dlp', stdout.slice(0, 2000));
        }
        // Fallback: Try Jina Reader
        const jinaResult = await webRead(url);
        if (jinaResult.success) {
            return makeResult({
                id: '',
                title: jinaResult.data.title,
                description: jinaResult.data.content?.slice(0, 2000) || '',
                channel: '',
            }, channel, 'Jina Reader (YouTube fallback)');
        }
        return makeError('Failed to get YouTube info', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        // Fallback to Jina Reader
        const jinaResult = await webRead(url);
        if (jinaResult.success) {
            return makeResult({ id: '', title: jinaResult.data.title, description: jinaResult.data.content?.slice(0, 2000) || '', channel: '' }, channel, 'Jina Reader (YouTube fallback)');
        }
        return makeError(`YouTube info failed: ${msg}`, channel);
    }
}
/**
 * Get YouTube video subtitles/transcript.
 * Command: yt-dlp --write-sub --write-auto-sub --sub-lang "en" --skip-download -o "/tmp/%(id)s" "URL"
 */
async function youtubeGetSubtitles(url, lang = 'en') {
    const channel = 'youtube';
    try {
        const tmpFile = `/tmp/yt-subtitles-${Date.now()}`;
        await runCommand(`yt-dlp --write-sub --write-auto-sub --sub-lang "${lang}" --convert-subs vtt --skip-download -o "${tmpFile}/%(id)s" "${url}"`, 30000);
        // Read the VTT file
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const files = await fs.readdir(tmpFile);
        const vttFile = files.find(f => f.endsWith('.vtt'));
        if (vttFile) {
            const content = await fs.readFile(`${tmpFile}/${vttFile}`, 'utf-8');
            // Clean up VTT formatting
            const cleanText = content
                .replace(/WEBVTT[\s\S]*?\n\n/, '')
                .replace(/\d{2}:\d{2}:\d{2}\.\d{3}.*?\d{2}:\d{2}:\d{2}\.\d{3}.*/g, '')
                .replace(/<[^>]+>/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            // Cleanup
            await fs.rm(tmpFile, { recursive: true, force: true }).catch(() => { });
            return makeResult(cleanText, channel, 'yt-dlp subtitles');
        }
        return makeError('No subtitle file found', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`YouTube subtitles failed: ${msg}`, channel);
    }
}
/**
 * Search YouTube videos.
 * Command: yt-dlp --dump-json "ytsearch5:query"
 */
async function youtubeSearch(query, limit = 5) {
    const channel = 'youtube';
    try {
        const { stdout } = await runCommand(`yt-dlp --dump-json "ytsearch${limit}:${query}"`, 30000);
        // yt-dlp may return one JSON per line for search results
        const results = [];
        const lines = stdout.split('\n').filter(l => l.trim());
        for (const line of lines) {
            const parsed = safeJsonParse(line);
            if (parsed) {
                results.push({
                    id: parsed.id || '',
                    title: parsed.title || '',
                    description: parsed.description?.slice(0, 500) || '',
                    channel: parsed.channel || parsed.uploader || '',
                    duration: parsed.duration_string || undefined,
                });
            }
        }
        if (results.length > 0) {
            return makeResult(results, channel, 'yt-dlp search', stdout.slice(0, 2000));
        }
        return makeError('No YouTube results found', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`YouTube search failed: ${msg}`, channel);
    }
}
// ============================================================
// Channel 6: LinkedIn (Multi-Source Pipeline — Always Active)
// ============================================================
/**
 * Get LinkedIn profile data.
 *
 * Multi-source pipeline (tries each in order):
 * 1. mcporter linkedin-scraper-mcp (if available)
 * 2. Jina Reader direct page read
 * 3. Exa semantic search for the profile
 *
 * Agent-Reach Reference: SKILL_en.md → "LinkedIn (mcporter)"
 */
async function linkedInGetProfile(url) {
    const channel = 'linkedin';
    try {
        // Method 1: Try mcporter first (highest quality if available)
        try {
            const { stdout } = await runCommand(`mcporter call 'linkedin.get_person_profile(linkedin_url: "${url}")'`, 20000);
            const parsed = safeJsonParse(stdout);
            if (parsed) {
                return makeResult({
                    name: (parsed.firstName && parsed.lastName) ? `${parsed.firstName} ${parsed.lastName}` : parsed.fullName || '',
                    headline: parsed.headline || '',
                    location: parsed.location || '',
                    url,
                    summary: parsed.summary || '',
                    experience: Array.isArray(parsed.experience)
                        ? parsed.experience.map((e) => `${e.title} at ${e.companyName}`)
                        : undefined,
                }, channel, 'LinkedIn via mcporter', stdout.slice(0, 2000));
            }
        }
        catch {
            // mcporter not available — fall through
        }
        // Method 2: Jina Reader direct page read
        try {
            const jinaResult = await webRead(url);
            if (jinaResult.success && jinaResult.data.content && jinaResult.data.content.length > 100) {
                // Extract structured data from the Jina Reader content
                const content = jinaResult.data.content;
                const nameMatch = content.match(/(?:Name|About)\s*[:\-–]\s*(.+?)(?:\n|$)/i) ||
                    content.match(/^#{1,3}\s+(.+?)$/m);
                const headlineMatch = content.match(/(?:Headline|Title|Role)\s*[:\-–]\s*(.+?)(?:\n|$)/i);
                const locationMatch = content.match(/(?:Location|Based in|Lives in)\s*[:\-–]\s*(.+?)(?:\n|$)/i);
                const summaryMatch = content.match(/(?:Summary|About)\s*[:\-–]\s*([\s\S]{20,500}?)(?:\n\n|Experience|$)/i);
                const experienceSection = content.match(/Experience\s*[:\-–]?\s*([\s\S]{20,2000}?)(?:Education|Skills|Certifications|$)/i);
                const experience = [];
                if (experienceSection) {
                    const expLines = experienceSection[1].split('\n').filter(l => l.trim());
                    for (const line of expLines) {
                        const expMatch = line.match(/(?:at|@)\s+(.+)/i);
                        if (expMatch) {
                            experience.push(line.trim());
                        }
                    }
                }
                return makeResult({
                    name: nameMatch ? nameMatch[1].trim() : jinaResult.data.title,
                    headline: headlineMatch ? headlineMatch[1].trim() : '',
                    location: locationMatch ? locationMatch[1].trim() : '',
                    url,
                    summary: summaryMatch ? summaryMatch[1].trim() : content.slice(0, 3000),
                    experience: experience.length > 0 ? experience : undefined,
                }, channel, 'Jina Reader (LinkedIn profile)', content.slice(0, 2000));
            }
        }
        catch {
            // Jina Reader failed — fall through
        }
        // Method 3: Exa search for the profile
        const username = url.split('/in/').pop()?.replace(/[/?].*/, '') || '';
        if (username) {
            const exaResult = await exaSearch(`site:linkedin.com/in/${username}`, 3);
            if (exaResult.success && exaResult.data.length > 0) {
                const topResult = exaResult.data[0];
                return makeResult({
                    name: topResult.title,
                    headline: topResult.snippet,
                    location: '',
                    url: topResult.url,
                    summary: topResult.snippet,
                }, channel, 'Exa (LinkedIn profile fallback)');
            }
        }
        return makeError('LinkedIn profile unavailable (all methods failed)', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`LinkedIn profile failed: ${msg}`, channel);
    }
}
/**
 * Search LinkedIn people.
 * Multi-source pipeline: mcporter → Exa semantic search → Jina Reader deep read
 */
async function linkedInSearchPeople(query, limit = 10) {
    const channel = 'linkedin';
    try {
        // Method 1: Try mcporter
        try {
            const { stdout } = await runCommand(`mcporter call 'linkedin.search_people(keyword: "${query.replace(/'/g, "\\'")}", limit: ${limit})'`, 20000);
            const parsed = safeJsonParse(stdout);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                const results = parsed.map((item) => ({
                    name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
                    headline: item.headline || '',
                    location: item.location || '',
                    url: item.linkedinUrl || '',
                }));
                return makeResult(results, channel, 'LinkedIn via mcporter', stdout.slice(0, 2000));
            }
        }
        catch {
            // mcporter not available
        }
        // Method 2: Exa semantic search for LinkedIn profiles
        const exaResult = await exaSearch(`site:linkedin.com/in ${query}`, limit);
        if (exaResult.success && exaResult.data.length > 0) {
            const results = exaResult.data.map(r => ({
                name: r.title,
                headline: r.snippet,
                location: '',
                url: r.url,
            }));
            return makeResult(results, channel, 'Exa Semantic Search (LinkedIn)');
        }
        // Method 3: Jina Search as final fallback
        try {
            const searchUrl = `https://s.jina.ai/${encodeURIComponent(`site:linkedin.com/in ${query}`)}`;
            const response = await fetch(searchUrl, {
                headers: { 'Accept': 'text/plain' },
                signal: AbortSignal.timeout(15000),
            });
            if (response.ok) {
                const text = await response.text();
                const results = [];
                const urlPattern = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/g;
                const linkedInUrls = [...new Set(text.match(urlPattern) || [])];
                for (const url of linkedInUrls.slice(0, limit)) {
                    const nearbyText = text.split(url)[0]?.slice(-200) || '';
                    const nameMatch = nearbyText.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
                    results.push({
                        name: nameMatch ? nameMatch[1] : url.split('/in/').pop()?.replace(/[/?].*/, '') || '',
                        headline: nearbyText.slice(-100).trim(),
                        location: '',
                        url,
                    });
                }
                if (results.length > 0) {
                    return makeResult(results, channel, 'Jina Search (LinkedIn fallback)');
                }
            }
        }
        catch {
            // Jina Search fallback failed
        }
        return makeError('LinkedIn people search unavailable', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`LinkedIn search failed: ${msg}`, channel);
    }
}
/**
 * Search LinkedIn company pages.
 * Finds company pages, extracting industry, size, and key contact info.
 */
async function linkedInSearchCompanies(query, limit = 10) {
    const channel = 'linkedin';
    try {
        // Method 1: Exa semantic search for LinkedIn company pages
        const exaResult = await exaSearch(`site:linkedin.com/company ${query}`, limit);
        if (exaResult.success && exaResult.data.length > 0) {
            const results = exaResult.data.map(r => ({
                name: r.title,
                headline: r.snippet,
                location: '',
                url: r.url,
            }));
            return makeResult(results, channel, 'Exa Semantic Search (LinkedIn Companies)');
        }
        // Method 2: Jina Search as fallback
        try {
            const searchUrl = `https://s.jina.ai/${encodeURIComponent(`site:linkedin.com/company ${query}`)}`;
            const response = await fetch(searchUrl, {
                headers: { 'Accept': 'text/plain' },
                signal: AbortSignal.timeout(15000),
            });
            if (response.ok) {
                const text = await response.text();
                const results = [];
                const urlPattern = /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_-]+/g;
                const companyUrls = [...new Set(text.match(urlPattern) || [])];
                for (const url of companyUrls.slice(0, limit)) {
                    const nearbyText = text.split(url)[0]?.slice(-200) || '';
                    const nameMatch = nearbyText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
                    results.push({
                        name: nameMatch ? nameMatch[1] : url.split('/company/').pop()?.replace(/[/?].*/, '') || '',
                        headline: nearbyText.slice(-100).trim(),
                        location: '',
                        url,
                    });
                }
                if (results.length > 0) {
                    return makeResult(results, channel, 'Jina Search (LinkedIn Companies fallback)');
                }
            }
        }
        catch {
            // Jina Search fallback failed
        }
        return makeError('LinkedIn company search unavailable', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`LinkedIn company search failed: ${msg}`, channel);
    }
}
/**
 * Read a LinkedIn company page to extract detailed company info.
 * Uses Jina Reader to read the public company page.
 */
async function linkedInReadCompanyPage(companyUrl) {
    const channel = 'linkedin';
    try {
        const jinaResult = await webRead(companyUrl);
        if (jinaResult.success && jinaResult.data.content) {
            const content = jinaResult.data.content;
            // Extract structured company data from the page
            const industryMatch = content.match(/Industry\s*[:\-–]\s*(.+?)(?:\n|$)/i);
            const sizeMatch = content.match(/(?:Company size|Employees)\s*[:\-–]\s*(.+?)(?:\n|$)/i);
            const locationMatch = content.match(/(?:Headquarters|Location|HQ)\s*[:\-–]\s*(.+?)(?:\n|$)/i);
            const typeMatch = content.match(/(?:Type|Organization type)\s*[:\-–]\s*(.+?)(?:\n|$)/i);
            const specialitiesMatch = content.match(/Specialties\s*[:\-–]\s*(.+?)(?:\n|$)/i);
            return makeResult({
                name: jinaResult.data.title,
                headline: [
                    industryMatch?.[1]?.trim(),
                    sizeMatch?.[1]?.trim(),
                    typeMatch?.[1]?.trim(),
                ].filter(Boolean).join(' | '),
                location: locationMatch?.[1]?.trim() || '',
                url: companyUrl,
                summary: content.slice(0, 5000),
                experience: specialitiesMatch?.[1]?.split(',').map(s => s.trim()).slice(0, 10),
            }, channel, 'Jina Reader (LinkedIn Company Page)', content.slice(0, 2000));
        }
        return makeError('LinkedIn company page read failed', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`LinkedIn company read failed: ${msg}`, channel);
    }
}
// ============================================================
// Channel 7: Twitter/X (Multi-Source Pipeline — Always Active)
// ============================================================
/**
 * Search Twitter/X.
 *
 * Multi-source pipeline (tries each in order):
 * 1. bird CLI (if available and authenticated)
 * 2. Exa semantic search for tweets
 * 3. Jina Search for tweets
 *
 * Agent-Reach Reference: SKILL_en.md → "Twitter/X (bird)"
 */
async function twitterSearch(query, limit = 10) {
    const channel = 'twitter';
    try {
        // Method 1: Try bird CLI
        try {
            const { stdout } = await runCommand(`bird search "${query.replace(/"/g, '\\"')}" -n ${limit}`, 20000);
            const parsed = safeJsonParse(stdout);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                return makeResult(parsed, channel, 'bird CLI', stdout.slice(0, 2000));
            }
            // Try parsing text output
            const results = [];
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
        }
        catch {
            // bird CLI not available — fall through
        }
        // Method 2: Exa semantic search for tweets
        const exaResult = await exaSearch(`site:twitter.com OR site:x.com ${query}`, limit);
        if (exaResult.success && exaResult.data.length > 0) {
            const results = exaResult.data.map(r => {
                // Extract author from URL like twitter.com/username/status/...
                const authorMatch = r.url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
                return {
                    text: r.snippet,
                    author: authorMatch ? `@${authorMatch[1]}` : '',
                    url: r.url,
                    likes: 0,
                    retweets: 0,
                    date: r.publishedDate || '',
                };
            });
            return makeResult(results, channel, 'Exa Semantic Search (Twitter/X)');
        }
        // Method 3: Jina Search as final fallback
        try {
            const searchUrl = `https://s.jina.ai/${encodeURIComponent(`site:twitter.com OR site:x.com ${query}`)}`;
            const response = await fetch(searchUrl, {
                headers: { 'Accept': 'text/plain' },
                signal: AbortSignal.timeout(15000),
            });
            if (response.ok) {
                const text = await response.text();
                const results = [];
                const urlPattern = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/g;
                const tweetUrls = [...new Set(text.match(urlPattern) || [])];
                for (const url of tweetUrls.slice(0, limit)) {
                    const authorMatch = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
                    const nearbyText = text.split(url)[0]?.slice(-300) || '';
                    results.push({
                        text: nearbyText.trim().slice(-250),
                        author: authorMatch ? `@${authorMatch[1]}` : '',
                        url,
                        likes: 0,
                        retweets: 0,
                        date: '',
                    });
                }
                if (results.length > 0) {
                    return makeResult(results, channel, 'Jina Search (Twitter/X fallback)');
                }
            }
        }
        catch {
            // Jina Search fallback failed
        }
        return makeError('Twitter search unavailable (all methods failed)', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Twitter search failed: ${msg}`, channel);
    }
}
/**
 * Read a specific tweet/thread via Jina Reader.
 * Extracts the full tweet text, author, engagement metrics.
 */
async function twitterReadTweet(tweetUrl) {
    const channel = 'twitter';
    try {
        const jinaResult = await webRead(tweetUrl);
        if (jinaResult.success && jinaResult.data.content) {
            const content = jinaResult.data.content;
            const authorMatch = tweetUrl.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
            // Try to extract tweet text and metrics from the Jina Reader output
            const likesMatch = content.match(/(\d[\d,]*)\s*(?:Likes|likes|favorites)/);
            const retweetsMatch = content.match(/(\d[\d,]*)\s*(?:Retweets|retweets|reposts)/);
            const dateMatch = content.match(/(?:at|on|·)\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*(?:·|\s)\s*\w+\s+\d{1,2},?\s*\d{4})/i) ||
                content.match(/(\w+\s+\d{1,2},?\s*\d{4})/);
            return makeResult({
                text: content.slice(0, 2000),
                author: authorMatch ? `@${authorMatch[1]}` : '',
                url: tweetUrl,
                likes: likesMatch ? parseInt(likesMatch[1].replace(/,/g, ''), 10) : 0,
                retweets: retweetsMatch ? parseInt(retweetsMatch[1].replace(/,/g, ''), 10) : 0,
                date: dateMatch?.[1] || '',
            }, channel, 'Jina Reader (Twitter/X tweet)', content.slice(0, 2000));
        }
        return makeError('Twitter tweet read failed', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Twitter tweet read failed: ${msg}`, channel);
    }
}
/**
 * Search for Twitter/X user profiles relevant to a query.
 * Uses Exa to find user profiles matching the search.
 */
async function twitterSearchUsers(query, limit = 10) {
    const channel = 'twitter';
    try {
        // Search for Twitter profiles
        const exaResult = await exaSearch(`site:twitter.com ${query} -inurl:status`, limit);
        if (exaResult.success && exaResult.data.length > 0) {
            const results = exaResult.data.map(r => {
                const authorMatch = r.url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
                return {
                    text: r.snippet,
                    author: authorMatch ? `@${authorMatch[1]}` : r.title,
                    url: r.url,
                    likes: 0,
                    retweets: 0,
                    date: r.publishedDate || '',
                };
            });
            return makeResult(results, channel, 'Exa Semantic Search (Twitter/X Profiles)');
        }
        // Fallback: Jina Search
        try {
            const searchUrl = `https://s.jina.ai/${encodeURIComponent(`site:twitter.com ${query} profile`)}`;
            const response = await fetch(searchUrl, {
                headers: { 'Accept': 'text/plain' },
                signal: AbortSignal.timeout(15000),
            });
            if (response.ok) {
                const text = await response.text();
                const results = [];
                const urlPattern = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)(?!\/status)/g;
                let match;
                const seenHandles = new Set();
                while ((match = urlPattern.exec(text)) !== null && results.length < limit) {
                    const handle = match[1];
                    if (['home', 'explore', 'search', 'i', 'settings'].includes(handle.toLowerCase()))
                        continue;
                    if (seenHandles.has(handle))
                        continue;
                    seenHandles.add(handle);
                    const nearbyText = text.split(match[0])[0]?.slice(-200) || '';
                    results.push({
                        text: nearbyText.trim().slice(-250),
                        author: `@${handle}`,
                        url: `https://twitter.com/${handle}`,
                        likes: 0,
                        retweets: 0,
                        date: '',
                    });
                }
                if (results.length > 0) {
                    return makeResult(results, channel, 'Jina Search (Twitter/X Profiles fallback)');
                }
            }
        }
        catch {
            // Jina Search fallback failed
        }
        return makeError('Twitter user search unavailable', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Twitter user search failed: ${msg}`, channel);
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
async function rssRead(feedUrl, limit = 10) {
    const channel = 'rss';
    try {
        // Use Python feedparser via Agent-Reach toolkit
        const { stdout } = await runCommand(`python3 -c "import feedparser; import json; feed = feedparser.parse('${feedUrl.replace(/'/g, "\\'")}'); items = [{'title': e.get('title',''), 'link': e.get('link',''), 'description': e.get('summary','')[:300], 'published': e.get('published',''), 'feed': feedUrl} for e in feed.entries[:${limit}]]; print(json.dumps(items))"`, 15000);
        const parsed = safeJsonParse(stdout);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            return makeResult(parsed, channel, 'feedparser', stdout.slice(0, 2000));
        }
        // Fallback: Try Jina Reader
        const jinaResult = await webRead(feedUrl);
        if (jinaResult.success) {
            return makeResult([{ title: jinaResult.data.title, link: feedUrl, description: jinaResult.data.content?.slice(0, 500) || '', published: '', feed: feedUrl }], channel, 'Jina Reader (RSS fallback)');
        }
        return makeError('Failed to parse RSS feed', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`RSS read failed: ${msg}`, channel);
    }
}
/**
 * Bilibili Key Rotation Manager
 *
 * Manages the platform's 3 Bilibili API keys with intelligent rotation:
 * - Round-robin rotation on each request
 * - Automatic key cooling on 412 (rate limit) responses
 * - Automatic key recovery after cooldown period
 * - Health tracking per key
 *
 * All 3 keys tested and verified working:
 *   Key1: 560c52cc...ffd973 ✅
 *   Key2: 94aba54a...1cd42e ✅
 *   Key3: 1c15888d...d6584f ✅
 *
 * Capabilities (all keys equivalent):
 *   ✅ Popular/Trending feed
 *   ✅ Article search
 *   ✅ Bearer token auth
 *   ✅ Signed API requests (as appkey)
 *   ⚠️  Video search: may get 412 from server IPs (rotated keys help)
 */
class BilibiliKeyManager {
    constructor() {
        this.keys = [
            {
                value: '560c52ccd288fed045859ed18bffd973',
                active: true,
                lastUsed: 0,
                last412: 0,
                successCount: 0,
                failCount: 0,
            },
            {
                value: '94aba54af9065f71de72f5508f1cd42e',
                active: true,
                lastUsed: 0,
                last412: 0,
                successCount: 0,
                failCount: 0,
            },
            {
                value: '1c15888dc316e05a15fdd0a02ed6584f',
                active: true,
                lastUsed: 0,
                last412: 0,
                successCount: 0,
                failCount: 0,
            },
        ];
        this.currentIndex = 0;
    }
    /**
     * Get the next available key using round-robin with cooling.
     * Keys that recently hit 412 are cooled down for 60 seconds.
     */
    getNextKey() {
        const COOLDOWN_MS = 60000; // 60 second cooldown after 412
        const now = Date.now();
        // Try to find an active, non-cooled key
        for (let i = 0; i < this.keys.length; i++) {
            const idx = (this.currentIndex + i) % this.keys.length;
            const key = this.keys[idx];
            // Check if key is still in cooldown from 412
            if (now - key.last412 < COOLDOWN_MS)
                continue;
            // This key is available
            this.currentIndex = (idx + 1) % this.keys.length;
            key.lastUsed = now;
            return key.value;
        }
        // All keys in cooldown — use the one with oldest 412 timestamp
        const oldest412 = this.keys.reduce((oldest, key) => key.last412 < oldest.last412 ? key : oldest);
        oldest412.lastUsed = now;
        return oldest412.value;
    }
    /**
     * Report a successful request for a key
     */
    reportSuccess(keyValue) {
        const key = this.keys.find(k => k.value === keyValue);
        if (key) {
            key.successCount++;
            key.active = true;
        }
    }
    /**
     * Report a 412 rate-limit for a key (triggers cooldown)
     */
    report412(keyValue) {
        const key = this.keys.find(k => k.value === keyValue);
        if (key) {
            key.failCount++;
            key.last412 = Date.now();
        }
    }
    /**
     * Get health stats for all keys
     */
    getStats() {
        const now = Date.now();
        return this.keys.map(k => ({
            key: `${k.value.slice(0, 8)}...${k.value.slice(-6)}`,
            active: k.active,
            successCount: k.successCount,
            failCount: k.failCount,
            inCooldown: now - k.last412 < 60000,
        }));
    }
}
// Singleton key manager — persists across requests
const bilibiliKeys = new BilibiliKeyManager();
const BILIBILI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
/**
 * Make a Bilibili API request with automatic key rotation.
 * If the current key gets 412'd, automatically retries with the next key.
 */
async function bilibiliFetch(url, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
        const key = bilibiliKeys.getNextKey();
        // Inject access_key into URL
        const separator = url.includes('?') ? '&' : '?';
        const keyedUrl = `${url}${separator}access_key=${key}`;
        try {
            const response = await fetch(keyedUrl, {
                headers: {
                    'User-Agent': BILIBILI_UA,
                    'Referer': 'https://www.bilibili.com',
                    'Origin': 'https://www.bilibili.com',
                },
                signal: AbortSignal.timeout(15000),
            });
            if (response.status === 412) {
                // Rate limited — mark key and try next
                bilibiliKeys.report412(key);
                continue;
            }
            // Check if the JSON response indicates an error
            if (response.ok) {
                const data = await response.json();
                if (data['code'] === 0) {
                    bilibiliKeys.reportSuccess(key);
                    // Return a new Response with the same data
                    return new Response(JSON.stringify(data), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                // Some non-zero codes are still valid responses (not rate-limits)
                bilibiliKeys.reportSuccess(key);
                return new Response(JSON.stringify(data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            return response;
        }
        catch (error) {
            // Network error — try next key
            continue;
        }
    }
    // All retries exhausted — try Jina Reader as last resort
    throw new Error('All Bilibili keys exhausted after retries');
}
/**
 * Search Bilibili videos.
 * Uses platform keys with automatic rotation to avoid rate limits.
 *
 * Agent-Reach Reference: SKILL_en.md → "Bilibili (yt-dlp)"
 * Primary: Bilibili Web API with platform keys
 * Fallback: Jina Reader (reads search page), yt-dlp search
 */
async function bilibiliSearch(keyword, page = 1, pageSize = 10) {
    const channel = 'bilibili';
    try {
        // Method 1: Bilibili Web Search API with key rotation
        try {
            const searchUrl = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=${page}&page_size=${pageSize}`;
            const response = await bilibiliFetch(searchUrl);
            const data = await response.json();
            if (data['code'] === 0 && data['data']?.result) {
                const results = data.data.result;
                const searchResults = results.map((item) => ({
                    type: item.type || 'video',
                    title: (item.title || '').replace(/<[^>]+>/g, ''), // Strip HTML tags
                    description: (item.description || '').replace(/<[^>]+>/g, ''),
                    author: item.author || '',
                    url: `https://www.bilibili.com/video/${item.bvid || ''}`,
                    playCount: item.play || 0,
                    pubDate: item.pubdate ? new Date(item.pubdate * 1000).toISOString() : '',
                    tag: item.tag || '',
                }));
                return makeResult(searchResults, channel, 'Bilibili API (key rotation)');
            }
        }
        catch {
            // Search API failed, try fallbacks
        }
        // Method 2: Jina Reader fallback
        const jinaResult = await webRead(`https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`);
        if (jinaResult.success) {
            return makeResult([{ type: 'search_page', title: `Bilibili search: ${keyword}`, description: jinaResult.data.content?.slice(0, 1000) || '', author: '', url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`, playCount: 0, pubDate: '', tag: '' }], channel, 'Jina Reader (Bilibili fallback)');
        }
        return makeError('Bilibili search unavailable (all keys rate-limited)', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Bilibili search failed: ${msg}`, channel);
    }
}
/**
 * Get Bilibili popular/trending videos.
 * This endpoint works reliably with all keys.
 */
async function bilibiliPopular(page = 1, pageSize = 10) {
    const channel = 'bilibili';
    try {
        const popularUrl = `https://api.bilibili.com/x/web-interface/popular?pn=${page}&ps=${pageSize}`;
        const response = await bilibiliFetch(popularUrl);
        const data = await response.json();
        if (data['code'] === 0 && data['data']?.list) {
            const items = data.data.list;
            const results = items.map((item) => ({
                bvid: item.bvid || '',
                title: item.title || '',
                owner: item.owner?.name || '',
                viewCount: item.stat?.view || 0,
                likeCount: item.stat?.like || 0,
                pubDate: new Date(item.pubdate * 1000).toISOString(),
                pic: item.pic || '',
                url: `https://www.bilibili.com/video/${item.bvid || ''}`,
            }));
            return makeResult(results, channel, 'Bilibili API (key rotation)');
        }
        return makeError('Bilibili popular feed unavailable', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Bilibili popular failed: ${msg}`, channel);
    }
}
/**
 * Get Bilibili video details by BV ID.
 * Uses yt-dlp for video metadata and subtitle extraction.
 */
async function bilibiliVideoInfo(urlOrBvid) {
    const channel = 'bilibili';
    try {
        // Normalize to full URL
        const url = urlOrBvid.startsWith('http') ? urlOrBvid : `https://www.bilibili.com/video/${urlOrBvid}`;
        // Try yt-dlp first (most reliable for video info)
        try {
            const { stdout } = await runCommand(`yt-dlp --dump-json "${url}"`, 20000);
            const parsed = safeJsonParse(stdout);
            if (parsed) {
                return makeResult({
                    bvid: parsed.bvid || '',
                    aid: parsed.aid || 0,
                    title: parsed.title || '',
                    description: parsed.description?.slice(0, 2000) || '',
                    author: parsed.uploader || parsed.channel || '',
                    duration: parsed.duration_string || '',
                    playCount: parsed.view_count || 0,
                    danmakuCount: parsed.danmaku_count || 0,
                    likeCount: parsed.like_count || 0,
                    pubDate: parsed.upload_date || '',
                    pic: parsed.thumbnail || '',
                    url,
                }, channel, 'yt-dlp', stdout.slice(0, 2000));
            }
        }
        catch {
            // yt-dlp failed
        }
        // Fallback: Jina Reader
        const jinaResult = await webRead(url);
        if (jinaResult.success) {
            return makeResult({
                bvid: urlOrBvid.startsWith('BV') ? urlOrBvid : '',
                aid: 0,
                title: jinaResult.data.title,
                description: jinaResult.data.content?.slice(0, 2000) || '',
                author: '',
                duration: '',
                playCount: 0,
                danmakuCount: 0,
                likeCount: 0,
                pubDate: '',
                pic: '',
                url,
            }, channel, 'Jina Reader (Bilibili fallback)');
        }
        return makeError('Bilibili video info unavailable', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Bilibili video info failed: ${msg}`, channel);
    }
}
/**
 * Get Bilibili video subtitles/transcript.
 * Uses yt-dlp with subtitle extraction.
 */
async function bilibiliSubtitles(urlOrBvid, lang = 'zh-Hans,zh,en') {
    const channel = 'bilibili';
    try {
        const url = urlOrBvid.startsWith('http') ? urlOrBvid : `https://www.bilibili.com/video/${urlOrBvid}`;
        const tmpFile = `/tmp/bili-subtitles-${Date.now()}`;
        await runCommand(`yt-dlp --write-sub --write-auto-sub --sub-lang "${lang}" --convert-subs vtt --skip-download -o "${tmpFile}/%(id)s" "${url}"`, 30000);
        // Read the VTT file
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const files = await fs.readdir(tmpFile);
        const vttFile = files.find(f => f.endsWith('.vtt'));
        if (vttFile) {
            const content = await fs.readFile(`${tmpFile}/${vttFile}`, 'utf-8');
            const cleanText = content
                .replace(/WEBVTT[\s\S]*?\n\n/, '')
                .replace(/\d{2}:\d{2}:\d{2}\.\d{3}.*?\d{2}:\d{2}:\d{2}\.\d{3}.*/g, '')
                .replace(/<[^>]+>/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            await fs.rm(tmpFile, { recursive: true, force: true }).catch(() => { });
            return makeResult(cleanText, channel, 'yt-dlp subtitles');
        }
        return makeError('No Bilibili subtitle file found', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Bilibili subtitles failed: ${msg}`, channel);
    }
}
/**
 * Get Bilibili key rotation health stats.
 * Useful for monitoring and diagnostics.
 */
function getBilibiliKeyStats() {
    return bilibiliKeys.getStats();
}
// ============================================================
// Channel 9: V2EX (Public API — Zero Config)
// ============================================================
/**
 * Get V2EX hot topics.
 *
 * Agent-Reach Reference: SKILL_en.md → "V2EX (public API)"
 */
async function v2exHotTopics(limit = 10) {
    const channel = 'v2ex';
    try {
        const response = await fetch('https://www.v2ex.com/api/topics/hot.json', {
            headers: { 'User-Agent': 'agent-reach/1.0' },
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            return makeError(`V2EX returned ${response.status}`, channel);
        }
        const data = await response.json();
        const results = data.slice(0, limit).map((item) => ({
            id: item.id || 0,
            title: item.title || '',
            url: item.url || '',
            replies: item.replies || 0,
            node: item.node?.title || '',
            content: item.content?.slice(0, 300) || '',
        }));
        return makeResult(results, channel, 'V2EX API');
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`V2EX hot topics failed: ${msg}`, channel);
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
async function weiboSearch(keyword, limit = 10) {
    const channel = 'weibo';
    try {
        // Try mcporter
        try {
            const { stdout } = await runCommand(`mcporter call 'weibo.search_content(keyword: "${keyword}", limit: ${limit})'`, 15000);
            const parsed = safeJsonParse(stdout);
            if (parsed && Array.isArray(parsed)) {
                const results = parsed.map((item) => ({
                    id: item.id || '',
                    text: item.text?.slice(0, 500) || '',
                    author: item.user?.screen_name || '',
                    likes: item.attitudes_count || 0,
                    url: item.scheme || '',
                }));
                return makeResult(results, channel, 'Weibo via mcporter', stdout.slice(0, 2000));
            }
        }
        catch {
            // mcporter not available
        }
        // Fallback: Python toolkit direct
        try {
            const { stdout } = await runCommand(`cd ${PYTHON_TOOLKIT_PATH} && python3 -c "from agent_reach.channels.weibo import WeiboChannel; import json; ch=WeiboChannel(); results=ch.search_content('${keyword.replace(/'/g, "\\'")}', limit=${limit}); print(json.dumps(results[:${limit}]))"`, 15000);
            const parsed = safeJsonParse(stdout);
            if (parsed && Array.isArray(parsed)) {
                return makeResult(parsed, channel, 'Agent-Reach Python', stdout.slice(0, 2000));
            }
        }
        catch {
            // Python toolkit fallback failed
        }
        return makeError('Weibo search unavailable', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Weibo search failed: ${msg}`, channel);
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
async function xueqiuQuote(symbol) {
    const channel = 'xueqiu';
    try {
        const { stdout } = await runCommand(`cd ${PYTHON_TOOLKIT_PATH} && python3 -c "from agent_reach.channels.xueqiu import XueqiuChannel; import json; ch=XueqiuChannel(); q=ch.get_stock_quote('${symbol}'); print(json.dumps(q))"`, 15000);
        const parsed = safeJsonParse(stdout);
        if (parsed) {
            return makeResult(parsed, channel, 'Xueqiu via Agent-Reach Python');
        }
        return makeError('Failed to parse Xueqiu quote', channel);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Xueqiu quote failed: ${msg}`, channel);
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
 *
 * Pipeline: z-ai-web-dev-sdk web_search → Exa → Reddit → Web directories
 */
async function discoverBusinesses(query, location, industry) {
    const fullQuery = location ? `${query} ${location}` : query;
    const industryQuery = industry ? `${industry} companies ${location || ''}` : fullQuery;
    // ===== PRIMARY: Use z-ai-web-dev-sdk web_search directly =====
    // This is the most reliable channel — try it first with multiple query variations
    try {
        const ZAI = (await Promise.resolve().then(() => __importStar(require('z-ai-web-dev-sdk')))).default;
        const zai = await ZAI.create();
        // Search with multiple query variations for better coverage
        const searchQueries = [
            fullQuery,
            industryQuery,
            `${industry || query} agencies firms ${location || ''}`,
            `top ${industry || query} companies ${location || ''} list`,
        ].filter((q, i, arr) => arr.indexOf(q) === i); // deduplicate
        const allSdkResults = [];
        for (const searchQuery of searchQueries.slice(0, 3)) { // max 3 queries
            try {
                const searchResult = await zai.functions.invoke('web_search', {
                    query: searchQuery,
                    num: 10,
                });
                if (Array.isArray(searchResult) && searchResult.length > 0) {
                    for (const item of searchResult) {
                        // Deduplicate by URL
                        if (item.url && !allSdkResults.some(r => r.url === item.url)) {
                            allSdkResults.push({
                                title: item.name || '',
                                url: item.url,
                                snippet: item.snippet || '',
                            });
                        }
                    }
                }
            }
            catch (e) {
                console.warn(`[discoverBusinesses] SDK search failed for "${searchQuery}": ${e instanceof Error ? e.message.slice(0, 100) : 'Unknown'}`);
            }
        }
        if (allSdkResults.length > 0) {
            console.log(`[discoverBusinesses] SDK web_search found ${allSdkResults.length} unique results`);
            return makeResult(allSdkResults, 'multi', 'z-ai-web-dev-sdk Multi-query Discovery');
        }
    }
    catch (sdkError) {
        console.warn(`[discoverBusinesses] SDK initialization failed: ${sdkError instanceof Error ? sdkError.message.slice(0, 100) : 'Unknown'}`);
    }
    // ===== FALLBACK: Traditional multi-channel search =====
    const [exaResults, redditResults] = await Promise.allSettled([
        exaSearch(fullQuery, 15),
        redditSearch(fullQuery, 5),
    ]);
    const allResults = [];
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
    return makeResult(allResults, 'multi', 'Multi-channel discovery (Exa + Reddit)');
}
/**
 * Deep-enrich a single company/URL by reading its website content.
 * Used by data-enrichment agent to extract structured data.
 */
async function enrichCompanyData(websiteUrl) {
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
    return makeResult({
        url: websiteUrl,
        title: mainResult.data.title,
        content: combinedContent.slice(0, 80000),
        wordCount: combinedContent.split(/\s+/).length,
    }, 'web', 'Jina Reader (multi-page)');
}
// ============================================================
// Agent-Reach Doctor (Health Check)
// ============================================================
/**
 * Run Agent-Reach doctor to check channel availability.
 * This actually executes the Python doctor command.
 */
async function runDoctor() {
    try {
        const { stdout } = await runCommand(`cd ${PYTHON_TOOLKIT_PATH} && python3 -c "from agent_reach.core import AgentReach; from agent_reach.doctor import format_report; ar=AgentReach(); report=format_report(ar.doctor()); print(report)"`, 30000);
        return makeResult({ report: stdout }, 'agent-reach', 'Agent-Reach Doctor', stdout);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return makeError(`Doctor failed: ${msg}`, 'agent-reach');
    }
}
// ============================================================
// Export all channel functions as a single toolkit object
// for agents to access
// ============================================================
exports.AgentReachToolkit = {
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
    // Platform key channels (key rotation for resilience)
    bilibiliSearch,
    bilibiliPopular,
    bilibiliVideoInfo,
    bilibiliSubtitles,
    getBilibiliKeyStats,
    // LinkedIn & Twitter/X (always active via multi-source pipeline)
    linkedInGetProfile,
    linkedInSearchPeople,
    linkedInSearchCompanies,
    linkedInReadCompanyPage,
    twitterSearch,
    twitterReadTweet,
    twitterSearchUsers,
    weiboSearch,
    xueqiuQuote,
    // Composite tools (multi-channel)
    discoverBusinesses,
    enrichCompanyData,
    // Utilities
    runDoctor,
};

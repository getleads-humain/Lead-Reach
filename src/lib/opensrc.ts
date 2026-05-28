/**
 * OpenSrc Integration Module
 * 
 * Integrates the vercel-labs/opensrc CLI tool into the Agent Reach platform.
 * OpenSrc fetches source code of npm/PyPI/crates.io packages and caches them
 * globally at ~/.opensrc/, giving AI agents deep implementation context.
 * 
 * Benefits for Agent Reach:
 * - Tech Stack Intelligence: Discover what packages companies use from GitHub repos
 * - Deep Integration Context: Understand how libraries work internally, not just API docs
 * - Exact Version Matching: Lockfile-aware version detection ensures agents read
 *   the exact version of source code that's being used
 * - Multi-Registry Coverage: npm, PyPI, crates.io, and direct Git repos
 * - Private Repo Support: Auth via GITHUB_TOKEN, GITLAB_TOKEN, BITBUCKET_TOKEN
 * 
 * CLI Reference: https://github.com/vercel-labs/opensrc
 * Version: 0.7.2
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

// ============================================================
// Types
// ============================================================

export interface OpenSrcPackageInfo {
  name: string;
  version: string;
  registry: 'npm' | 'pypi' | 'crates' | 'repo';
  path: string;
  fetchedAt: string;
}

export interface OpenSrcCachedSources {
  updatedAt: string;
  packages: OpenSrcPackageInfo[];
}

export interface OpenSrcFetchResult {
  packageName: string;
  version: string;
  registry: string;
  localPath: string;
  fromCache: boolean;
}

export interface TechStackAnalysis {
  languages: Record<string, number>;
  frameworks: string[];
  dependencies: Array<{ name: string; version: string; registry: string }>;
  devDependencies: Array<{ name: string; version: string; registry: string }>;
  packageManager: string;
  summary: string;
}

export interface OpenSrcSourceReadResult {
  packageName: string;
  filePath: string;
  content: string;
  lineCount: number;
  language: string;
}

// ============================================================
// Configuration
// ============================================================

const OPENSRC_CACHE_DIR = `${process.env.HOME || '/root'}/.opensrc`;
const EXEC_TIMEOUT = 45000; // 45 seconds for opensrc commands (cloning can take time)

// ============================================================
// Core CLI Wrapper
// ============================================================

/**
 * Run an opensrc CLI command.
 */
async function runOpenSrc(args: string, timeout = EXEC_TIMEOUT): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(`npx opensrc ${args}`, {
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env },
    });
    return { stdout: stdout || '', stderr: stderr || '' };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string; killed?: boolean };
    if (err.killed) {
      return { stdout: '', stderr: `opensrc command timed out after ${timeout}ms` };
    }
    const errMsg = err.message || 'opensrc command failed';
    console.warn(`[opensrc] Command failed: ${errMsg.slice(0, 300)}`);
    return { stdout: err.stdout || '', stderr: err.stderr || errMsg };
  }
}

/**
 * Safely parse JSON from opensrc output.
 */
function safeJsonParse<T>(str: string): T | null {
  if (!str || !str.trim()) return null;
  try {
    return JSON.parse(str.trim()) as T;
  } catch {
    return null;
  }
}

// ============================================================
// Public API — CLI Commands
// ============================================================

/**
 * Fetch source code for a package or repo into the global cache.
 * Supports npm packages, PyPI packages, crates.io crates, and GitHub repos.
 * 
 * Registry prefixes:
 * - npm: (default) "react", "npm:react"
 * - PyPI: "pypi:requests", "pip:requests", "python:requests"
 * - crates.io: "crates:serde", "cargo:serde", "rust:serde"
 * - Repo: "github:owner/repo", "gitlab:owner/repo", "bitbucket:owner/repo"
 * 
 * @example
 * await fetchPackageSource('react');           // npm
 * await fetchPackageSource('pypi:requests');   // PyPI
 * await fetchPackageSource('crates:serde');    // crates.io
 * await fetchPackageSource('github:vercel-labs/opensrc'); // GitHub repo
 */
export async function fetchPackageSource(packageRef: string): Promise<{
  success: boolean;
  data: OpenSrcFetchResult | null;
  error?: string;
}> {
  try {
    const { stdout, stderr } = await runOpenSrc(`fetch ${packageRef}`);

    // Check for common errors
    if (stderr.includes('not found') || stderr.includes('PackageNotFound')) {
      return { success: false, data: null, error: `Package not found: ${packageRef}` };
    }
    if (stderr.includes('No repo URL')) {
      return { success: false, data: null, error: `No repository URL found for: ${packageRef}` };
    }
    if (stderr.includes('Clone failed')) {
      return { success: false, data: null, error: `Failed to clone repository for: ${packageRef}` };
    }

    // Parse the fetch output to get version and path info
    // Output format: "✓ Fetched package@version from registry (path)"
    const match = stdout.match(/Fetched\s+(\S+?)(?:@(\S+?))?\s+from\s+(\w+)\s+\((.+?)\)/);
    if (match) {
      return {
        success: true,
        data: {
          packageName: match[1],
          version: match[2] || 'latest',
          registry: match[3],
          localPath: match[4],
          fromCache: stdout.includes('(cached)'),
        },
      };
    }

    // If we got output but couldn't parse it, still report success
    if (stdout.trim()) {
      // Try getting path via `opensrc path`
      const pathResult = await getPackagePath(packageRef);
      return {
        success: true,
        data: {
          packageName: packageRef,
          version: 'unknown',
          registry: 'unknown',
          localPath: pathResult.data?.path || '',
          fromCache: false,
        },
      };
    }

    return { success: false, data: null, error: stderr || 'Unknown fetch error' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: null, error: msg };
  }
}

/**
 * Get the absolute path to a cached package's source code.
 * Automatically fetches on cache miss.
 */
export async function getPackagePath(packageRef: string): Promise<{
  success: boolean;
  data: { path: string; packageRef: string } | null;
  error?: string;
}> {
  try {
    const { stdout, stderr } = await runOpenSrc(`path ${packageRef}`);
    const path = stdout.trim();
    if (path && !stderr.includes('not found')) {
      return { success: true, data: { path, packageRef } };
    }
    return { success: false, data: null, error: stderr || 'Package not cached' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: null, error: msg };
  }
}

/**
 * List all globally cached source packages.
 */
export async function listCachedSources(): Promise<{
  success: boolean;
  data: OpenSrcPackageInfo[];
  error?: string;
}> {
  try {
    const { stdout } = await runOpenSrc('list --json');
    const parsed = safeJsonParse<OpenSrcCachedSources>(stdout);
    if (parsed && Array.isArray(parsed.packages)) {
      return { success: true, data: parsed.packages };
    }
    return { success: true, data: [] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: [], error: msg };
  }
}

/**
 * Remove a specific package from the cache.
 */
export async function removeCachedSource(packageRef: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await runOpenSrc(`remove ${packageRef}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Clean all cached sources.
 */
export async function cleanAllSources(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await runOpenSrc('clean');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// ============================================================
// Advanced API — Source Reading & Analysis
// ============================================================

/**
 * Read a specific file from a cached package's source code.
 * This gives agents the ability to read actual implementation files.
 */
export async function readPackageSourceFile(
  packageRef: string,
  filePath: string,
): Promise<{
  success: boolean;
  data: OpenSrcSourceReadResult | null;
  error?: string;
}> {
  try {
    // First, ensure the package is cached
    const pathResult = await getPackagePath(packageRef);
    if (!pathResult.success || !pathResult.data?.path) {
      // Try fetching first
      const fetchResult = await fetchPackageSource(packageRef);
      if (!fetchResult.success) {
        return { success: false, data: null, error: `Cannot access source for ${packageRef}: ${fetchResult.error}` };
      }
    }

    // Re-get path after potential fetch
    const resolvedPath = await getPackagePath(packageRef);
    if (!resolvedPath.success || !resolvedPath.data?.path) {
      return { success: false, data: null, error: `Cannot resolve path for ${packageRef}` };
    }

    const fullPath = join(resolvedPath.data.path, filePath);
    const content = await readFile(fullPath, 'utf-8');
    const lineCount = content.split('\n').length;

    // Detect language from file extension
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      py: 'python', rs: 'rust', go: 'go', java: 'java', rb: 'ruby',
      md: 'markdown', json: 'json', yaml: 'yaml', yml: 'yaml',
      toml: 'toml', css: 'css', html: 'html', sql: 'sql',
    };

    return {
      success: true,
      data: {
        packageName: packageRef,
        filePath,
        content: content.slice(0, 100000), // Cap at 100k chars
        lineCount,
        language: languageMap[ext] || ext,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: null, error: msg };
  }
}

/**
 * Read the top-level structure of a package's source code.
 * Returns a list of files and directories for navigation.
 */
export async function browsePackageSource(packageRef: string, subPath = ''): Promise<{
  success: boolean;
  data: Array<{ name: string; type: 'file' | 'directory'; path: string }>;
  error?: string;
}> {
  try {
    const pathResult = await getPackagePath(packageRef);
    if (!pathResult.success || !pathResult.data?.path) {
      const fetchResult = await fetchPackageSource(packageRef);
      if (!fetchResult.success) {
        return { success: false, data: [], error: `Cannot access source for ${packageRef}` };
      }
    }

    const resolvedPath = await getPackagePath(packageRef);
    if (!resolvedPath.success || !resolvedPath.data?.path) {
      return { success: false, data: [], error: `Cannot resolve path for ${packageRef}` };
    }

    const fullPath = join(resolvedPath.data.path, subPath);
    const entries = await readdir(fullPath, { withFileTypes: true });

    const result = entries
      .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
      .map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' as const : 'file' as const,
        path: join(subPath, e.name),
      }));

    return { success: true, data: result };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: [], error: msg };
  }
}

/**
 * Analyze a company's tech stack from their GitHub repository.
 * Fetches the repo, reads package.json/requirements.txt/Cargo.toml,
 * and extracts structured dependency information.
 */
export async function analyzeTechStack(githubRepo: string): Promise<{
  success: boolean;
  data: TechStackAnalysis | null;
  error?: string;
}> {
  try {
    // Ensure the repo is cached
    const repoRef = `github:${githubRepo}`;
    const pathResult = await getPackagePath(repoRef);
    if (!pathResult.success || !pathResult.data?.path) {
      const fetchResult = await fetchPackageSource(repoRef);
      if (!fetchResult.success) {
        return { success: false, data: null, error: `Cannot fetch repo ${githubRepo}: ${fetchResult.error}` };
      }
    }

    const resolvedPath = await getPackagePath(repoRef);
    if (!resolvedPath.success || !resolvedPath.data?.path) {
      return { success: false, data: null, error: `Cannot resolve path for ${githubRepo}` };
    }

    const repoPath = resolvedPath.data.path;
    const analysis: TechStackAnalysis = {
      languages: {},
      frameworks: [],
      dependencies: [],
      devDependencies: [],
      packageManager: 'unknown',
      summary: '',
    };

    // Read package.json (Node.js/JavaScript projects)
    try {
      const pkgJson = await readFile(join(repoPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(pkgJson);

      analysis.packageManager = 'npm';
      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          analysis.dependencies.push({ name, version: String(version), registry: 'npm' });
        }
      }
      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          analysis.devDependencies.push({ name, version: String(version), registry: 'npm' });
        }
      }

      // Detect frameworks
      const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
      if (allDeps.includes('next')) analysis.frameworks.push('Next.js');
      if (allDeps.includes('react')) analysis.frameworks.push('React');
      if (allDeps.includes('vue')) analysis.frameworks.push('Vue');
      if (allDeps.includes('angular') || allDeps.includes('@angular/core')) analysis.frameworks.push('Angular');
      if (allDeps.includes('express')) analysis.frameworks.push('Express');
      if (allDeps.includes('fastify')) analysis.frameworks.push('Fastify');
      if (allDeps.includes('nestjs') || allDeps.includes('@nestjs/core')) analysis.frameworks.push('NestJS');
      if (allDeps.includes('prisma') || allDeps.includes('@prisma/client')) analysis.frameworks.push('Prisma');
      if (allDeps.includes('tailwindcss')) analysis.frameworks.push('Tailwind CSS');
      if (allDeps.includes('typescript')) analysis.frameworks.push('TypeScript');
      if (allDeps.includes('@trpc/server')) analysis.frameworks.push('tRPC');
    } catch {
      // No package.json
    }

    // Read requirements.txt (Python projects)
    try {
      const reqTxt = await readFile(join(repoPath, 'requirements.txt'), 'utf-8');
      analysis.packageManager = analysis.packageManager === 'unknown' ? 'pip' : analysis.packageManager;
      for (const line of reqTxt.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
          const match = trimmed.match(/^([a-zA-Z0-9_-]+)([>=<~!]+.*)?$/);
          if (match) {
            analysis.dependencies.push({ name: match[1], version: match[2]?.replace(/^[>=<~!]+/, '') || '*', registry: 'pypi' });
          }
        }
      }
    } catch {
      // No requirements.txt
    }

    // Read pyproject.toml (Python projects)
    try {
      const pyproject = await readFile(join(repoPath, 'pyproject.toml'), 'utf-8');
      analysis.packageManager = analysis.packageManager === 'unknown' ? 'pip' : analysis.packageManager;
      // Parse [project.dependencies] section
      const depMatch = pyproject.match(/\[project\.dependencies\]([\s\S]*?)(?:\[|$)/);
      if (depMatch) {
        for (const line of depMatch[1].split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([a-zA-Z0-9_-]+)/);
            if (match) {
              analysis.dependencies.push({ name: match[1], version: '*', registry: 'pypi' });
            }
          }
        }
      }
    } catch {
      // No pyproject.toml
    }

    // Read Cargo.toml (Rust projects)
    try {
      const cargoToml = await readFile(join(repoPath, 'Cargo.toml'), 'utf-8');
      analysis.packageManager = analysis.packageManager === 'unknown' ? 'cargo' : analysis.packageManager;
      const depMatch = cargoToml.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
      if (depMatch) {
        for (const line of depMatch[1].split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([a-zA-Z0-9_-]+)/);
            if (match) {
              analysis.dependencies.push({ name: match[1], version: '*', registry: 'crates' });
            }
          }
        }
      }
    } catch {
      // No Cargo.toml
    }

    // Detect languages from file extensions
    try {
      const entries = await readdir(repoPath, { withFileTypes: true, recursive: false });
      const langCounts: Record<string, number> = {};

      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = entry.name.split('.').pop()?.toLowerCase();
          if (ext) {
            const langMap: Record<string, string> = {
              ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
              py: 'Python', rs: 'Rust', go: 'Go', java: 'Java', rb: 'Ruby',
              css: 'CSS', html: 'HTML', sql: 'SQL', sh: 'Shell',
            };
            const lang = langMap[ext];
            if (lang) langCounts[lang] = (langCounts[lang] || 0) + 1;
          }
        }
      }
      analysis.languages = langCounts;
    } catch {
      // Can't read directory
    }

    // Build summary
    const parts: string[] = [];
    if (analysis.frameworks.length > 0) parts.push(`Frameworks: ${analysis.frameworks.join(', ')}`);
    if (analysis.dependencies.length > 0) parts.push(`${analysis.dependencies.length} dependencies`);
    if (analysis.devDependencies.length > 0) parts.push(`${analysis.devDependencies.length} dev dependencies`);
    if (Object.keys(analysis.languages).length > 0) {
      const topLang = Object.entries(analysis.languages).sort((a, b) => b[1] - a[1])[0];
      if (topLang) parts.push(`Primary language: ${topLang[0]}`);
    }
    analysis.summary = parts.join(' | ') || 'No tech stack information found';

    return { success: true, data: analysis };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: null, error: msg };
  }
}

/**
 * Search for patterns within a cached package's source code.
 * Uses ripgrep (rg) for fast, regex-capable searching.
 */
export async function searchPackageSource(
  packageRef: string,
  pattern: string,
  maxResults = 20,
): Promise<{
  success: boolean;
  data: Array<{ file: string; line: number; content: string }>;
  error?: string;
}> {
  try {
    const pathResult = await getPackagePath(packageRef);
    if (!pathResult.success || !pathResult.data?.path) {
      return { success: false, data: [], error: `Package not cached: ${packageRef}` };
    }

    const { stdout } = await execAsync(
      `rg --line-number --max-count ${maxResults} "${pattern.replace(/"/g, '\\"')}" "${pathResult.data.path}"`,
      { timeout: 10000, maxBuffer: 5 * 1024 * 1024 },
    );

    const results: Array<{ file: string; line: number; content: string }> = [];
    for (const line of stdout.split('\n').slice(0, maxResults)) {
      if (!line.trim()) continue;
      const match = line.match(/^(.+?):(\d+):(.*)$/);
      if (match) {
        results.push({
          file: match[1].replace(pathResult.data.path + '/', ''),
          line: parseInt(match[2], 10),
          content: match[3].trim(),
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    // rg returns exit code 1 when no matches found — that's not an error
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg.includes('exit code 1') || msg.includes('No matches')) {
      return { success: true, data: [] };
    }
    return { success: false, data: [], error: msg };
  }
}

/**
 * Fetch multiple packages in parallel and return their paths.
 * Useful for pre-caching dependencies that agents will need.
 */
export async function prefetchPackages(packageRefs: string[]): Promise<Array<{
  packageRef: string;
  success: boolean;
  path?: string;
  error?: string;
}>> {
  const results = await Promise.allSettled(
    packageRefs.map(async (ref) => {
      const fetchResult = await fetchPackageSource(ref);
      if (fetchResult.success && fetchResult.data) {
        return { packageRef: ref, success: true, path: fetchResult.data.localPath };
      }
      return { packageRef: ref, success: false, error: fetchResult.error };
    }),
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { packageRef: packageRefs[i], success: false, error: r.reason?.message };
  });
}

/**
 * Pre-fetch commonly used packages for the Agent Reach platform.
 * This ensures source code is available when agents need it.
 */
export async function prefetchPlatformDependencies(): Promise<void> {
  const commonPackages = [
    'prisma', 'next', 'zod', 'react',
  ];

  console.log(`[opensrc] Pre-fetching ${commonPackages.length} platform dependencies...`);
  const results = await prefetchPackages(commonPackages);
  const succeeded = results.filter(r => r.success).length;
  console.log(`[opensrc] Pre-fetch complete: ${succeeded}/${commonPackages.length} packages cached`);
}

// ============================================================
// Agent-Reach Bridge Integration Types
// ============================================================

export interface OpenSrcChannelResult {
  operation: string;
  packageName: string;
  success: boolean;
  data: unknown;
  error?: string;
  timestamp: string;
}

/**
 * Main entry point for Agent-Reach Bridge integration.
 * This function is called by the bridge when agents use the opensrc channel.
 */
export async function executeOpenSrcOperation(
  operation: string,
  params: Record<string, unknown>,
): Promise<OpenSrcChannelResult> {
  const timestamp = new Date().toISOString();
  const packageName = (params.packageRef as string) || (params.package as string) || '';

  try {
    let data: unknown;

    switch (operation) {
      case 'fetch':
        data = await fetchPackageSource(packageName);
        break;
      case 'path':
        data = await getPackagePath(packageName);
        break;
      case 'list':
        data = await listCachedSources();
        break;
      case 'read_file':
        data = await readPackageSourceFile(packageName, (params.filePath as string) || 'README.md');
        break;
      case 'browse':
        data = await browsePackageSource(packageName, (params.subPath as string) || '');
        break;
      case 'analyze_tech_stack':
        data = await analyzeTechStack((params.githubRepo as string) || packageName);
        break;
      case 'search_source':
        data = await searchPackageSource(packageName, (params.pattern as string) || '', (params.maxResults as number) || 20);
        break;
      case 'prefetch':
        data = await prefetchPackages((params.packages as string[]) || [packageName]);
        break;
      case 'remove':
        data = await removeCachedSource(packageName);
        break;
      case 'clean':
        data = await cleanAllSources();
        break;
      default:
        return {
          operation,
          packageName,
          success: false,
          data: null,
          error: `Unknown opensrc operation: ${operation}`,
          timestamp,
        };
    }

    return { operation, packageName, success: true, data, timestamp };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { operation, packageName, success: false, data: null, error: msg, timestamp };
  }
}

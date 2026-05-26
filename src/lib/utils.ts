import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely fetch a URL and parse the response as JSON.
 * Prevents the common SyntaxError: "Unexpected token '<'" when the server
 * returns an HTML error page (404, 500, rate-limit, etc.) instead of JSON.
 *
 * @param url - The URL to fetch (or a RequestInfo)
 * @param init - Optional fetch options
 * @returns Parsed JSON response
 * @throws Error with descriptive message if response is not OK or not JSON
 */
export async function safeFetchJSON<T = unknown>(url: string | URL | Request, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url as RequestInfo, init);
  } catch (networkError) {
    throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Request failed'}`);
  }

  // Check if the response status indicates an error
  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const text = await response.text();
      // Try to extract JSON error message from the response
      if (text.startsWith('{')) {
        const json = JSON.parse(text);
        errorDetail += `: ${json.error || json.message || json.details || text.slice(0, 200)}`;
      } else {
        // It's an HTML error page — provide a user-friendly message
        // 502 = Bad Gateway (upstream proxy/LLM gateway overloaded)
        // 503 = Service Unavailable (server overloaded or in maintenance)
        // 504 = Gateway Timeout (upstream server took too long)
        if (response.status === 502) {
          errorDetail += ': The AI service is temporarily busy (Bad Gateway). Please try again.';
        } else if (response.status === 503) {
          errorDetail += ': The server is temporarily overloaded. Please try again.';
        } else if (response.status === 504) {
          errorDetail += ': The request timed out. Please try again with a simpler query.';
        } else if (response.status === 404) {
          errorDetail += ': Endpoint not found';
        } else {
          errorDetail += ': Server error';
        }
      }
    } catch {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        errorDetail += ': The AI service is temporarily unavailable. Please try again.';
      } else {
        errorDetail += ': Server error';
      }
    }
    throw new Error(errorDetail);
  }

  // Verify content type is JSON before parsing
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
    // Response might be HTML — read as text first to avoid SyntaxError
    const text = await response.text();
    if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
      throw new Error('Server returned HTML instead of JSON. The API endpoint may be unavailable or misconfigured.');
    }
    // Try to parse it as JSON anyway (some servers don't set content-type properly)
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('Response is not valid JSON');
    }
  }

  try {
    return await response.json() as T;
  } catch (parseError) {
    // Last resort — read as text and check if it's HTML
    const text = await response.text().catch(() => '');
    if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
      throw new Error('Server returned HTML instead of JSON. The API endpoint may be unavailable.');
    }
    throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
  }
}

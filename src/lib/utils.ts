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
    // For 502/503/504 — try to parse the body as JSON first,
    // because our API routes now return structured error objects even on failure.
    // Only fall back to generic messages if the body isn't JSON.
    let errorDetail = '';
    try {
      const text = await response.text();
      if (text.trim().startsWith('{')) {
        // Our API returned a JSON error — extract the message
        try {
          const json = JSON.parse(text);
          // If the JSON has a 'message' field with content, use it directly
          // (our chat routes return full agent messages even on gateway errors)
          if (json.message?.content) {
            // This is a structured agent response — return it as the error
            throw Object.assign(new Error('RETRYABLE_JSON_RESPONSE'), { jsonBody: json });
          }
          errorDetail = json.error || json.message || json.details || `HTTP ${response.status}`;
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message === 'RETRYABLE_JSON_RESPONSE') {
            throw parseErr; // Re-throw the special case
          }
          errorDetail = `HTTP ${response.status}: ${text.slice(0, 200)}`;
        }
      } else if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
        // HTML error page from a reverse proxy (nginx, CloudFront, etc.)
        // These are the WORST case — we can't extract useful info.
        // Provide a friendly message and mark as retryable.
        if (response.status === 502) {
          errorDetail = 'The AI service is temporarily busy. Please try again in a few seconds.';
        } else if (response.status === 503) {
          errorDetail = 'The server is temporarily overloaded. Please try again shortly.';
        } else if (response.status === 504) {
          errorDetail = 'The request timed out. Please try again with a simpler query.';
        } else {
          errorDetail = `Server returned error (${response.status}). Please try again.`;
        }
      } else {
        errorDetail = `HTTP ${response.status}: ${text.slice(0, 200)}`;
      }
    } catch (specialErr) {
      if (specialErr instanceof Error && specialErr.message === 'RETRYABLE_JSON_RESPONSE' && 'jsonBody' in specialErr) {
        // Return the JSON body as if it was a successful response
        return (specialErr as unknown as { jsonBody: T }).jsonBody;
      }
      errorDetail = `HTTP ${response.status}: Service unavailable. Please try again.`;
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

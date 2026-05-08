"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.safeFetchJSON = safeFetchJSON;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
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
async function safeFetchJSON(url, init) {
    let response;
    try {
        response = await fetch(url, init);
    }
    catch (networkError) {
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
            }
            else {
                // It's an HTML error page — don't include the HTML in the error message
                errorDetail += response.status === 404 ? ': Endpoint not found' : ': Server error';
            }
        }
        catch {
            errorDetail += ': Server error';
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
            return JSON.parse(text);
        }
        catch {
            throw new Error('Response is not valid JSON');
        }
    }
    try {
        return await response.json();
    }
    catch (parseError) {
        // Last resort — read as text and check if it's HTML
        const text = await response.text().catch(() => '');
        if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
            throw new Error('Server returned HTML instead of JSON. The API endpoint may be unavailable.');
        }
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }
}

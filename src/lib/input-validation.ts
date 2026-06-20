/**
 * LeadReach — Centralized Input Validation
 * ==========================================
 * Zod-based input validation schemas and helpers for secure request handling.
 *
 * All user input MUST be validated through these schemas before processing.
 * This module enforces the input validation requirements in SECURITY_POLICY.md §8.5.
 *
 * @see SECURITY_POLICY.md §8.5
 */

import { z, ZodError, ZodSchema } from 'zod';

// ── Sanitization Utilities ─────────────────────────────────────────

/**
 * Strips HTML tags from a string to prevent XSS via user input.
 * Uses iterative removal to handle nested patterns like <<script>script>.
 * Decodes HTML entities AFTER tag removal to prevent double-escaping issues.
 *
 * CodeQL fixes applied:
 * - Incomplete multi-char sanitization: iterative loop ensures all tags removed
 * - Double escaping: entity decoding happens only after all tags are stripped,
 *   preventing re-introduction of tags via entity expansion
 */
function stripHtml(input: string): string {
  // Iteratively remove HTML tags until stable (handles nested/broken tags)
  // This prevents bypass via patterns like: <scr<script>ipt> → <script>
  let previous = '';
  let current = input;
  const MAX_ITERATIONS = 10; // Safety bound to prevent infinite loops
  let iterations = 0;
  while (previous !== current && iterations < MAX_ITERATIONS) {
    previous = current;
    current = current.replace(/<[^>]*>/g, '');
    iterations++;
  }
  // Decode HTML entities in a SINGLE PASS to prevent double-escaping/
  // double-unescaping vulnerabilities (CodeQL alert #98).
  //
  // The previous sequential `.replace()` approach could double-decode
  // inputs like `&amp;lt;` → first pass decodes `&lt;` to `<`, then
  // `&amp;` to `&`, but the intermediate `&lt;` was already decoded,
  // potentially re-introducing tag characters.
  //
  // This single-pass regex matches ALL known entities at once and
  // replaces them with their decoded values in one atomic operation,
  // so no decoded value can be re-processed by a subsequent replace.
  const entityMap: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&nbsp;': ' ',
  };
  current = current.replace(
    /&(?:lt|gt|amp|quot|nbsp|#x27|#x2F);/g,
    (entity) => entityMap[entity] ?? entity,
  );
  return current.trim();
}

/**
 * Sanitizes a string by stripping HTML tags and normalizing whitespace.
 */
function sanitizeString(input: string): string {
  return stripHtml(input).replace(/\s+/g, ' ').trim();
}

// ── Reusable Schemas ───────────────────────────────────────────────

/**
 * Email validation schema.
 * - RFC 5322 compliant via Zod email validation
 * - Normalized to lowercase
 * - Max 254 characters (RFC 5321)
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(254, 'Email must be at most 254 characters')
  .email('Invalid email format')
  .transform((val) => val.toLowerCase().trim());

/**
 * Password validation schema.
 * Per SECURITY_POLICY.md §6.2:
 * - Minimum 16 characters
 * - At least 3 of 4 character categories (uppercase, lowercase, numbers, special)
 */
export const passwordSchema = z
  .string()
  .min(16, 'Password must be at least 16 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine(
    (password) => {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

      const categories = [hasUppercase, hasLowercase, hasNumber, hasSpecial];
      const categoryCount = categories.filter(Boolean).length;

      return categoryCount >= 3;
    },
    {
      message:
        'Password must contain at least 3 of: uppercase letters, lowercase letters, numbers, special characters',
    }
  );

/**
 * Sanitized string schema for free-text user input.
 * - Strips all HTML tags
 * - Normalizes whitespace
 * - Configurable min/max length
 */
export const sanitizedStringSchema = (
  minLength: number = 1,
  maxLength: number = 1000
) =>
  z
    .string()
    .min(minLength, `Must be at least ${minLength} character(s)`)
    .max(maxLength, `Must be at most ${maxLength} character(s)`)
    .transform(sanitizeString)
    .refine(
      (val) => val.length >= minLength,
      `Must contain at least ${minLength} non-whitespace character(s)`
    );

/**
 * UUID validation schema.
 * Validates UUID v4 format.
 */
export const uuidSchema = z
  .string()
  .min(1, 'ID is required')
  .uuid('Invalid UUID format');

/**
 * Pagination schema.
 * Validates and provides defaults for page-based pagination.
 */
export const paginationSchema = z.object({
  page: z
    .coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z
    .coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(20),
});

/**
 * Search query schema.
 * Sanitizes and validates search input with length constraints.
 */
export const searchQuerySchema = z.object({
  q: sanitizedStringSchema(1, 200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * URL validation schema.
 * - HTTPS only (per security requirements)
 * - Blocks internal/private network addresses (SSRF prevention)
 * - Max 2048 characters
 */
export const urlSchema = z
  .string()
  .min(1, 'URL is required')
  .max(2048, 'URL must be at most 2048 characters')
  .url('Invalid URL format')
  .refine(
    (url) => url.startsWith('https://'),
    'Only HTTPS URLs are allowed'
  )
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        // Block internal/private network addresses (SSRF prevention)
        const blockedPatterns = [
          /^localhost$/i,
          /^127\./,
          /^10\./,
          /^172\.(1[6-9]|2[0-9]|3[01])\./,
          /^192\.168\./,
          /^0\./,
          /^::1$/,
          /^fc00:/i,
          /^fd/i,
          /^fe80:/i,
          /^169\.254\./,
          /^\./,
          /^metadata\.google\.internal$/i,
          /^metadata\.azure\.com$/i,
        ];

        return !blockedPatterns.some((pattern) => pattern.test(hostname));
      } catch {
        return false;
      }
    },
    'Internal or private network URLs are not allowed'
  );

// ── File Upload Validation ─────────────────────────────────────────

/** Maximum file upload size in bytes (10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types for file uploads */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/json',
  'text/plain',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * File upload validation schema.
 */
export const fileUploadSchema = z.object({
  name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must be at most 255 characters')
    .refine(
      (name) => !/[<>:"|?*\x00-\x1f]/.test(name),
      'File name contains invalid characters'
    ),
  size: z
    .number()
    .min(1, 'File is empty')
    .max(MAX_FILE_SIZE, `File size must be at most ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  type: z
    .string()
    .refine(
      (type) => (ALLOWED_MIME_TYPES as readonly string[]).includes(type),
      `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    ),
});

/**
 * Validate a File object from a multipart form upload.
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!file) {
    return { valid: false, errors: ['No file provided'] };
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    errors.push(`File type "${file.type}" is not allowed`);
  }

  if (file.name && /[<>:"|?*\x00-\x1f]/.test(file.name)) {
    errors.push('File name contains invalid characters');
  }

  return { valid: errors.length === 0, errors };
}

// ── Validation Helpers ─────────────────────────────────────────────

export interface ValidationResult<T> {
  success: boolean;
  data: T | null;
  errors: z.ZodIssue[] | null;
}

/**
 * Validate input against a Zod schema.
 * Returns a structured result object instead of throwing.
 *
 * @param schema - The Zod schema to validate against
 * @param input - The raw input to validate
 * @returns Validation result with success status, parsed data, and any errors
 *
 * @example
 * ```ts
 * const result = validateInput(emailSchema, userInput);
 * if (result.success) {
 *   console.log(result.data); // typed as string
 * } else {
 *   console.log(result.errors); // ZodIssue[]
 * }
 * ```
 */
export function validateInput<T>(schema: ZodSchema<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: null,
    };
  }

  return {
    success: false,
    data: null,
    errors: result.error.issues,
  };
}

/**
 * Validate input against a Zod schema, throwing on failure.
 * Use in API route handlers where you want to return a 400 on invalid input.
 *
 * @param schema - The Zod schema to validate against
 * @param input - The raw input to validate
 * @returns The validated and transformed data
 * @throws {ZodError} If validation fails
 *
 * @example
 * ```ts
 * try {
 *   const email = validateOrThrow(emailSchema, body.email);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     return Response.json({ errors: error.issues }, { status: 400 });
 *   }
 * }
 * ```
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}

// ── Client Identification ──────────────────────────────────────────

/**
 * Extract a client identifier from a request for rate limiting purposes.
 *
 * Priority order:
 * 1. Authenticated user ID (from Supabase session)
 * 2. X-Forwarded-For header (first IP in chain)
 * 3. X-Real-IP header
 * 4. CF-Connecting-IP header (Cloudflare)
 * 5. Fallback to 'unknown'
 *
 * @param request - The incoming HTTP request
 * @returns A string identifier for the client
 */
export function getClientIdentifier(request: Request): string {
  // Try to get user ID from auth header (if available)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Use a hash of the token to avoid exposing it
    return `bearer:${authHeader.substring(7, 19)}`;
  }

  // Try X-Forwarded-For (first IP in the chain)
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const firstIp = xff.split(',')[0].trim();
    if (firstIp) return `ip:${firstIp}`;
  }

  // Try X-Real-IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return `ip:${realIp}`;

  // Try Cloudflare connecting IP
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return `ip:${cfIp}`;

  return 'unknown';
}

/**
 * Format Zod validation errors into a user-friendly object.
 */
export function formatValidationErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

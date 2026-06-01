/**
 * LeadReach — Input Validation & Sanitization
 * =============================================
 * Centralized input validation utilities for all API endpoints.
 * Per SECURITY_POLICY.md Section 8.2:
 *   - All user input is validated server-side using Zod schemas
 *   - SQL injection prevented by Prisma ORM parameterized queries
 *   - File uploads validated for type, size, and content
 *   - Request body size limits enforced
 */

import { z, ZodError, ZodSchema } from 'zod'

// ============================================================
// Common Validation Schemas
// ============================================================

/** Email validation with strict format */
export const emailSchema = z.string().email({ message: 'Invalid email format' }).max(254)

/** Password: minimum 16 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special char */
export const passwordSchema = z
  .string()
  .min(16, 'Password must be at least 16 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/** Sanitized string — strips HTML tags and trims whitespace */
export const sanitizedString = z
  .string()
  .trim()
  .transform((val) => val.replace(/<[^>]*>/g, '')) // Strip HTML tags
  .transform((val) => val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')) // Strip control chars

/** Non-empty sanitized string */
export const nonEmptyString = sanitizedString.min(1, 'Field is required')

/** UUID validation */
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' })

/** Pagination parameters */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/** Search query — sanitized and length-limited */
export const searchQuerySchema = sanitizedString.max(500, 'Search query too long')

/** URL validation */
export const urlSchema = z.string().url({ message: 'Invalid URL format' }).max(2048)

// ============================================================
// Validation Result Type
// ============================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: z.ZodIssue[] }

// ============================================================
// Validation Helper
// ============================================================

/**
 * Validate input against a Zod schema.
 * Returns a typed result with either parsed data or validation errors.
 */
export function validateInput<T>(schema: ZodSchema<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error.errors }
}

/**
 * Validate input and throw a formatted error on failure.
 * Useful in API route handlers where we want to return 400.
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, input: unknown): T {
  return schema.parse(input)
}

// ============================================================
// Rate Limit Key Extraction
// ============================================================

/**
 * Extract a client identifier for rate limiting.
 * Uses authenticated user ID when available, falls back to IP address.
 */
export function getClientIdentifier(request: Request): string {
  // Priority: authenticated user > forwarded IP > direct IP
  const userId = request.headers.get('x-user-id')
  if (userId) return `user:${userId}`

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return `ip:${forwarded.split(',')[0].trim()}`

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return `ip:${realIp}`

  return 'ip:unknown'
}

// ============================================================
// File Upload Validation
// ============================================================

/** Allowed file types for upload */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'text/plain',
])

/** Maximum file size: 10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate a file upload against security policy requirements.
 * Checks MIME type, file size, and filename safety.
 */
export function validateFileUpload(file: { name: string; type: string; size: number }): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not allowed` }
  }

  // Check filename for path traversal
  const sanitizedName = file.name.replace(/[^\w.\-]/g, '_')
  if (sanitizedName !== file.name && file.name.includes('..')) {
    return { valid: false, error: 'Invalid filename' }
  }

  return { valid: true }
}

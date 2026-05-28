/**
 * LeadReach — Database Client
 * =============================
 * Uses the Supabase REST API client as the primary data access layer.
 *
 * The Prisma ORM direct PostgreSQL connection (port 5432) is unreachable
 * from the dev server, so we delegate all database operations to the
 * Supabase REST API (PostgREST) which is accessible over HTTPS.
 *
 * The API surface matches Prisma's, so all existing route files work
 * without any changes: db.campaign.findMany(), db.lead.create(), etc.
 */

export { db } from './db-supabase'

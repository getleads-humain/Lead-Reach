/**
 * LeadReach — Supabase REST API Database Client
 * ================================================
 * Drop-in replacement for Prisma ORM that uses the Supabase REST API
 * (PostgREST) under the hood. This is needed because the Prisma direct
 * PostgreSQL connection (port 5432) is unreachable from the dev server.
 *
 * The API surface matches Prisma's, so all existing route files work
 * without any changes: db.campaign.findMany(), db.lead.create(), etc.
 */

import { supabaseService } from './supabase'

// ── CUID generator (matches Prisma's @default(cuid())) ─────────────────────
function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).slice(2, 10)
  const randomPart2 = Math.random().toString(36).slice(2, 10)
  return `c${timestamp}${randomPart}${randomPart2}`.slice(0, 25)
}

// ── Models that use auto-generated CUID IDs ────────────────────────────────
const CUID_MODELS = new Set([
  'campaign', 'lead', 'outreach', 'agentTask', 'agentReachChannel',
  'aISetter', 'setterConversation', 'subAccount', 'customAITask',
  'aBTest', 'iCPProfile', 'followUpSequence',
  'billingPlan', 'subscription', 'billingEvent', 'consumptionRecord',
  'autoresearchJob', 'autoresearchExperiment', 'autoresearchFragment',
  'enrichmentJob', 'prospectReport', 'icp',
])

// ── camelCase → snake_case converter ──────────────────────────────────────
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// ── Model → Table name mapping ────────────────────────────────────────────
const MODEL_TABLE_MAP: Record<string, string> = {
  campaign: 'campaigns',
  lead: 'leads',
  outreach: 'outreach',
  agentTask: 'agent_tasks',
  agentReachChannel: 'agent_reach_channels',
  aISetter: 'ai_setters',
  setterConversation: 'setter_conversations',
  subAccount: 'sub_accounts',
  customAITask: 'custom_ai_tasks',
  aBTest: 'ab_tests',
  iCPProfile: 'icp_profiles',
  followUpSequence: 'follow_up_sequences',
  profile: 'profiles',
  userSettings: 'user_settings',
  // Billing models (defined in Supabase SQL migrations, not in Prisma schema)
  billingPlan: 'billing_plans',
  subscription: 'subscriptions',
  billingEvent: 'billing_events',
  consumptionRecord: 'consumption_records',
  // Autoresearch models (defined in Supabase SQL migrations)
  autoresearchJob: 'autoresearch_jobs',
  autoresearchExperiment: 'autoresearch_experiments',
  autoresearchFragment: 'autoresearch_fragments',
  // Enrichment models (defined in Supabase SQL migrations)
  enrichmentJob: 'enrichment_jobs',
  // Reports models (defined in Supabase SQL migrations)
  prospectReport: 'prospect_reports',
  // ICP models (defined in Supabase SQL migrations)
  icp: 'icps',
}

// ── Relation metadata (for include support) ───────────────────────────────
const RELATIONS: Record<string, Record<string, { table: string; fk: string }>> = {
  campaign: {
    leads: { table: 'leads', fk: 'campaign_id' },
    tasks: { table: 'agent_tasks', fk: 'campaign_id' },
  },
  lead: {
    campaign: { table: 'campaigns', fk: 'campaign_id' },
    outreach: { table: 'outreach', fk: 'lead_id' },
  },
  outreach: {
    lead: { table: 'leads', fk: 'lead_id' },
  },
  agentTask: {
    campaign: { table: 'campaigns', fk: 'campaign_id' },
  },
  aISetter: {
    conversations: { table: 'setter_conversations', fk: 'setter_id' },
  },
  setterConversation: {
    setter: { table: 'ai_setters', fk: 'setter_id' },
  },
  subAccount: {
    setters: { table: 'ai_setters', fk: 'sub_account_id' },
    customTasks: { table: 'custom_ai_tasks', fk: 'sub_account_id' },
  },
  profile: {
    userSettings: { table: 'user_settings', fk: 'id' },
  },
  // Billing relations
  subscription: {
    plan: { table: 'billing_plans', fk: 'plan_id' },
    billingEvents: { table: 'billing_events', fk: 'subscription_id' },
    consumptionRecords: { table: 'consumption_records', fk: 'subscription_id' },
  },
  billingEvent: {
    subscription: { table: 'subscriptions', fk: 'subscription_id' },
  },
  consumptionRecord: {
    subscription: { table: 'subscriptions', fk: 'subscription_id' },
  },
}

// ── Types ─────────────────────────────────────────────────────────────────
type OrderBy = Record<string, 'asc' | 'desc'>
type WhereInput = Record<string, unknown>
type DataInput = Record<string, unknown>

interface FindManyOptions {
  where?: WhereInput
  orderBy?: OrderBy | OrderBy[]
  take?: number
  skip?: number
  include?: Record<string, unknown>
}

interface FindUniqueOptions {
  where: Record<string, string>
  include?: Record<string, unknown>
}

interface FindFirstOptions {
  where?: WhereInput
  orderBy?: OrderBy
  include?: Record<string, unknown>
}

interface CreateOptions {
  data: DataInput
  include?: Record<string, unknown>
}

interface UpdateOptions {
  where: Record<string, string>
  data: DataInput
  include?: Record<string, unknown>
}

interface UpdateManyOptions {
  where: WhereInput
  data: DataInput
}

interface DeleteOptions {
  where: Record<string, string>
}

interface DeleteManyOptions {
  where?: WhereInput
}

interface CountOptions {
  where?: WhereInput
}

// ── Format a value for PostgREST filter strings ──────────────────────────
function formatPostgrestValue(val: unknown): string {
  if (val instanceof Date) return val.toISOString()
  return String(val)
}

// ── Convert a Prisma-style where clause to Supabase query filters ─────────
function buildFilters(query: any, tableName: string, where: WhereInput): void {
  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR') {
      // Supabase doesn't directly support OR the same way Prisma does.
      // We'll handle simple OR conditions with .or()
      const orConditions = value as WhereInput[]
      const orParts: string[] = []
      for (const cond of orConditions) {
        for (const [k, v] of Object.entries(cond)) {
          const col = toSnakeCase(k)
          if (typeof v === 'object' && v !== null) {
            if ('contains' in (v as object)) {
              orParts.push(`${col}.ilike.%${(v as { contains: string }).contains}%`)
            } else if ('lt' in (v as object)) {
              orParts.push(`${col}.lt.${formatPostgrestValue((v as { lt: unknown }).lt)}`)
            } else if ('gt' in (v as object)) {
              orParts.push(`${col}.gt.${formatPostgrestValue((v as { gt: unknown }).gt)}`)
            } else if ('gte' in (v as object)) {
              orParts.push(`${col}.gte.${formatPostgrestValue((v as { gte: unknown }).gte)}`)
            } else if ('lte' in (v as object)) {
              orParts.push(`${col}.lte.${formatPostgrestValue((v as { lte: unknown }).lte)}`)
            }
          } else {
            orParts.push(`${col}.eq.${formatPostgrestValue(v)}`)
          }
        }
      }
      if (orParts.length > 0) {
        query = query.or(orParts.join(','))
      }
      continue
    }

    if (key === 'AND') {
      const andConditions = value as WhereInput[]
      for (const cond of andConditions) {
        buildFilters(query, tableName, cond)
      }
      continue
    }

    const col = toSnakeCase(key)

    if (value === null) {
      query = query.is(col, null)
    } else if (value instanceof Date) {
      query = query.eq(col, value.toISOString())
    } else if (typeof value === 'object' && value !== null) {
      const v = value as Record<string, unknown>
      if ('contains' in v) {
        query = query.ilike(col, `%${v.contains}%`)
      } else if ('startsWith' in v) {
        query = query.ilike(col, `${v.startsWith}%`)
      } else if ('endsWith' in v) {
        query = query.ilike(col, `%${v.endsWith}`)
      } else if ('lt' in v) {
        query = query.lt(col, formatPostgrestValue(v.lt))
      } else if ('gt' in v) {
        query = query.gt(col, formatPostgrestValue(v.gt))
      } else if ('lte' in v) {
        query = query.lte(col, formatPostgrestValue(v.lte))
      } else if ('gte' in v) {
        query = query.gte(col, formatPostgrestValue(v.gte))
      } else if ('in' in v) {
        const vals = v.in as unknown[]
        query = query.in(col, vals)
      } else if ('not' in v) {
        query = query.neq(col, formatPostgrestValue(v.not))
      }
    } else {
      query = query.eq(col, value)
    }
  }
}

// ── Convert a value for insert/update, handling Date → ISO string ────────
function formatDbValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value
  if (value === null || value === undefined) return value
  if (typeof value === 'object' && 'increment' in (value as object)) return value
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return value
}

// ── Convert Prisma-style data to Supabase insert/update format ────────────
function transformDataToDb(data: DataInput): DataInput {
  const result: DataInput = {}
  for (const [key, value] of Object.entries(data)) {
    // Handle Prisma's { increment: N } operator — kept as-is for later processing
    if (typeof value === 'object' && value !== null && 'increment' in (value as object)) {
      result[toSnakeCase(key)] = value
      continue
    }
    result[toSnakeCase(key)] = formatDbValue(value)
  }
  return result
}

// ── Convert a Supabase row (snake_case) back to Prisma format (camelCase) ─
function transformRowFromDb(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    result[toCamelCase(key)] = value
  }
  return result
}

// ── Build select string for include relations ─────────────────────────────
function buildSelectString(modelName: string, include?: Record<string, unknown>): string {
  let select = '*'

  if (!include) return select

  const parts: string[] = []

  // Handle _count: { select: { leads: true } }
  if (include._count && typeof include._count === 'object') {
    const countSelect = (include._count as { select: Record<string, boolean> }).select
    for (const [relName, enabled] of Object.entries(countSelect)) {
      if (!enabled) continue
      const relation = RELATIONS[modelName]?.[relName]
      if (relation) {
        // PostgREST count aggregation: leads(count)
        parts.push(`${relName}:${relation.table}!${relation.fk}(count)`)
      }
    }
  }

  // Handle relation includes
  if (RELATIONS[modelName]) {
    for (const [relName, relConfig] of Object.entries(include)) {
      if (relName === '_count') continue
      const relation = RELATIONS[modelName][relName]
      if (relation) {
        if (relConfig && typeof relConfig === 'object' && 'select' in (relConfig as object)) {
          // e.g., include: { campaign: { select: { name: true } } }
          const selectFields = (relConfig as { select: Record<string, boolean> }).select
          const fields = Object.keys(selectFields).map(toSnakeCase).join(',')
          parts.push(`${relName}:${relation.table}!${relation.fk}(${fields})`)
        } else {
          parts.push(`${relName}:${relation.table}!${relation.fk}(*)`)
        }
      }
    }
  }

  if (parts.length > 0) {
    select = `*,${parts.join(',')}`
  }

  return select
}

// ── Model delegate — one per Prisma model ─────────────────────────────────
class ModelDelegate {
  constructor(private modelName: string) {}

  private get table(): string {
    return MODEL_TABLE_MAP[this.modelName] || toSnakeCase(this.modelName) + 's'
  }

  async findMany(options: FindManyOptions = {}): Promise<Record<string, unknown>[]> {
    let query = supabaseService.from(this.table).select(buildSelectString(this.modelName, options.include))

    // Apply where filters
    if (options.where) {
      buildFilters(query, this.table, options.where)
    }

    // Apply ordering
    if (options.orderBy) {
      const orderByArr = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]
      for (const ob of orderByArr) {
        for (const [field, dir] of Object.entries(ob)) {
          query = query.order(toSnakeCase(field), { ascending: dir === 'asc' })
        }
      }
    }

    // Apply pagination
    if (options.skip) query = query.range(options.skip, options.skip + (options.take || 50) - 1)
    else if (options.take) query = query.limit(options.take)

    const { data, error } = await query

    if (error) {
      console.error(`[db-supabase] findMany error on ${this.table}:`, error.message)
      throw new Error(`Database query failed: ${error.message}`)
    }

    const rows = (data || []) as Record<string, unknown>[]

    // Transform rows and handle _count
    const result = rows.map((row) => {
      const transformed = transformRowFromDb(row)

      // Handle _count for relations — PostgREST returns [{count}] or [{count: N}]
      if (options.include && options.include._count && typeof options.include._count === 'object') {
        const countSelect = (options.include._count as { select: Record<string, boolean> }).select
        const countResult: Record<string, number> = {}
        for (const relName of Object.keys(countSelect)) {
          const relData = row[relName]
          if (Array.isArray(relData) && relData.length > 0) {
            // PostgREST count returns [{count: N}] or [{total: N}]
            const countEntry = relData[0] as Record<string, unknown>
            countResult[relName] = typeof countEntry.count === 'number' ? countEntry.count : (typeof countEntry.total === 'number' ? countEntry.total : 0)
          } else if (Array.isArray(relData)) {
            countResult[relName] = 0
          } else {
            countResult[relName] = 0
          }
        }
        transformed._count = countResult
      }

      // Handle nested relation transforms
      if (options.include) {
        for (const relName of Object.keys(options.include)) {
          if (relName === '_count') continue
          const relation = RELATIONS[this.modelName]?.[relName]
          if (relation) {
            const relData = row[relName]
            if (relData && typeof relData === 'object') {
              if (Array.isArray(relData)) {
                transformed[relName] = relData.map(transformRowFromDb)
              } else {
                transformed[relName] = transformRowFromDb(relData as Record<string, unknown>)
              }
            }
          }
        }
      }

      return transformed
    })

    return result
  }

  async findFirst(options: FindFirstOptions = {}): Promise<Record<string, unknown> | null> {
    const results = await this.findMany({ ...options, take: 1 })
    return results[0] || null
  }

  async findUnique(options: FindUniqueOptions): Promise<Record<string, unknown> | null> {
    let query = supabaseService.from(this.table).select(buildSelectString(this.modelName, options.include))

    for (const [key, value] of Object.entries(options.where)) {
      query = query.eq(toSnakeCase(key), value)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error(`[db-supabase] findUnique error on ${this.table}:`, error.message)
      throw new Error(`Database query failed: ${error.message}`)
    }

    if (!data) return null

    return transformRowFromDb(data as Record<string, unknown>)
  }

  async create(options: CreateOptions): Promise<Record<string, unknown>> {
    const dbData = transformDataToDb(options.data)

    // Auto-generate CUID for models that use @default(cuid())
    if (CUID_MODELS.has(this.modelName) && !dbData.id) {
      dbData.id = generateCuid()
    }

    const { data, error } = await supabaseService
      .from(this.table)
      .insert(dbData)
      .select(buildSelectString(this.modelName, options.include))
      .single()

    if (error) {
      console.error(`[db-supabase] create error on ${this.table}:`, error.message)
      throw new Error(`Database insert failed: ${error.message}`)
    }

    return transformRowFromDb(data as Record<string, unknown>)
  }

  async update(options: UpdateOptions): Promise<Record<string, unknown>> {
    const dbData = transformDataToDb(options.data)

    // Check for increment operators — need RPC for atomic increments
    const increments: Record<string, number> = {}
    for (const [key, value] of Object.entries(dbData)) {
      if (typeof value === 'object' && value !== null && 'increment' in (value as object)) {
        increments[key] = (value as { increment: number }).increment
        delete dbData[key]
      }
    }

    let query = supabaseService
      .from(this.table)
      .update(dbData)

    for (const [key, value] of Object.entries(options.where)) {
      query = query.eq(toSnakeCase(key), value)
    }

    const { data, error } = await query
      .select(buildSelectString(this.modelName, options.include))
      .single()

    if (error) {
      console.error(`[db-supabase] update error on ${this.table}:`, error.message)
      throw new Error(`Database update failed: ${error.message}`)
    }

    let result = transformRowFromDb(data as Record<string, unknown>)

    // Handle increments via a separate update if needed
    if (Object.keys(increments).length > 0) {
      // Fetch current values and add increment
      for (const [col, amount] of Object.entries(increments)) {
        const currentVal = (result as Record<string, unknown>)[toCamelCase(col)] as number || 0
        const newVal = currentVal + amount
        const { error: incError } = await supabaseService
          .from(this.table)
          .update({ [col]: newVal })
          .eq('id', options.where.id)
        if (incError) {
          console.error(`[db-supabase] increment error on ${this.table}.${col}:`, incError.message)
        }
        result[toCamelCase(col)] = newVal
      }
    }

    return result
  }

  async updateMany(options: UpdateManyOptions): Promise<{ count: number }> {
    const dbData = transformDataToDb(options.data)

    // Handle increment in updateMany
    for (const [key, value] of Object.entries(dbData)) {
      if (typeof value === 'object' && value !== null && 'increment' in (value as object)) {
        // For updateMany with increment, we need to do individual updates
        // This is a limitation — fall back to fetch-then-update
        const col = key
        const amount = (value as { increment: number }).increment
        delete dbData[key]

        // First fetch matching rows
        let fetchQuery = supabaseService.from(this.table).select(`id,${col}`)
        if (options.where) {
          buildFilters(fetchQuery, this.table, options.where)
        }
        const { data: rows, error: fetchErr } = await fetchQuery
        if (fetchErr) {
          console.error(`[db-supabase] updateMany increment fetch error:`, fetchErr.message)
          throw new Error(`Database updateMany failed: ${fetchErr.message}`)
        }

        // Update each row individually
        let count = 0
        for (const row of (rows || [])) {
          const currentVal = (row as Record<string, unknown>)[col] as number || 0
          const { error: updErr } = await supabaseService
            .from(this.table)
            .update({ [col]: currentVal + amount, ...dbData })
            .eq('id', (row as Record<string, unknown>).id)
          if (!updErr) count++
        }
        return { count }
      }
    }

    let query = supabaseService.from(this.table).update(dbData)
    const needsTautology = !options.where || Object.keys(options.where).length === 0
    if (needsTautology) {
      query = query.not('id', 'is', null)
    } else {
      buildFilters(query, this.table, options.where)
    }

    const { error } = await query

    if (error) {
      console.error(`[db-supabase] updateMany error on ${this.table}:`, error.message)
      throw new Error(`Database updateMany failed: ${error.message}`)
    }

    // Supabase doesn't return count on updateMany without .select()
    return { count: -1 }
  }

  async delete(options: DeleteOptions): Promise<Record<string, unknown>> {
    let query = supabaseService.from(this.table).delete()

    for (const [key, value] of Object.entries(options.where)) {
      query = query.eq(toSnakeCase(key), value)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error(`[db-supabase] delete error on ${this.table}:`, error.message)
      throw new Error(`Database delete failed: ${error.message}`)
    }

    return transformRowFromDb(data as Record<string, unknown>)
  }

  async deleteMany(options: DeleteManyOptions = {}): Promise<{ count: number }> {
    // PostgREST requires at least one filter for DELETE.
    // If no where clause, use a tautology filter (id.not.eq.impossible)
    // that matches all rows.
    const needsTautology = !options.where || Object.keys(options.where).length === 0

    let query = supabaseService.from(this.table).delete()

    if (needsTautology) {
      // Use a filter that matches all rows — id is not null is always true
      query = query.not('id', 'is', null)
    } else {
      buildFilters(query, this.table, options.where!)
    }

    const { data, error } = await query.select()

    if (error) {
      console.error(`[db-supabase] deleteMany error on ${this.table}:`, error.message)
      throw new Error(`Database deleteMany failed: ${error.message}`)
    }

    return { count: (data || []).length }
  }

  async count(options: CountOptions = {}): Promise<number> {
    let query = supabaseService.from(this.table).select('*', { count: 'exact', head: true })

    if (options.where) {
      buildFilters(query, this.table, options.where)
    }

    const { count, error } = await query

    if (error) {
      console.error(`[db-supabase] count error on ${this.table}:`, error.message)
      throw new Error(`Database count failed: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Aggregate — minimal implementation supporting _sum
   * e.g., db.subscription.aggregate({ where: { status: 'active' }, _sum: { totalBilled: true } })
   */
  async aggregate(options: { where?: WhereInput; _sum?: Record<string, boolean> }): Promise<Record<string, unknown>> {
    // Supabase PostgREST doesn't support SUM directly in the same way,
    // so we fetch the relevant rows and compute sums client-side.
    if (!options._sum) {
      // Just count
      return { _count: await this.count({ where: options.where }) }
    }

    const sumFields = Object.keys(options._sum).filter(k => options._sum![k])
    const selectFields = sumFields.map(toSnakeCase).join(',')

    let query = supabaseService.from(this.table).select(selectFields)
    if (options.where) {
      buildFilters(query, this.table, options.where)
    }

    const { data, error } = await query
    if (error) {
      console.error(`[db-supabase] aggregate error on ${this.table}:`, error.message)
      throw new Error(`Database aggregate failed: ${error.message}`)
    }

    const _sum: Record<string, number> = {}
    for (const field of sumFields) {
      _sum[field] = (data || []).reduce((acc, row) => {
        const val = (row as Record<string, unknown>)[toSnakeCase(field)]
        return acc + (typeof val === 'number' ? val : 0)
      }, 0)
    }

    return { _sum, _count: (data || []).length }
  }

  /**
   * GroupBy — minimal implementation supporting _count
   * e.g., db.subscription.groupBy({ by: ['planId'], _count: true, where: { status: 'active' } })
   */
  async groupBy(options: { by: string[]; _count?: boolean; where?: WhereInput }): Promise<Record<string, unknown>[]> {
    // PostgREST doesn't support GROUP BY, so we fetch and group client-side.
    const groupByFields = options.by.map(toSnakeCase)
    const selectFields = groupByFields.join(',')

    let query = supabaseService.from(this.table).select(selectFields)
    if (options.where) {
      buildFilters(query, this.table, options.where)
    }

    const { data, error } = await query
    if (error) {
      console.error(`[db-supabase] groupBy error on ${this.table}:`, error.message)
      throw new Error(`Database groupBy failed: ${error.message}`)
    }

    // Group results client-side
    const groups: Record<string, { values: Record<string, unknown>; count: number }> = {}
    for (const row of (data || [])) {
      const key = groupByFields.map(f => String((row as Record<string, unknown>)[f])).join('|')
      if (!groups[key]) {
        const values: Record<string, unknown> = {}
        for (const f of groupByFields) {
          values[toCamelCase(f)] = (row as Record<string, unknown>)[f]
        }
        groups[key] = { values, count: 0 }
      }
      groups[key].count++
    }

    return Object.values(groups).map(g => ({
      ...g.values,
      _count: g.count,
    }))
  }
}

// ── Database client — mirrors Prisma's db object ──────────────────────────
export const db = {
  campaign: new ModelDelegate('campaign'),
  lead: new ModelDelegate('lead'),
  outreach: new ModelDelegate('outreach'),
  agentTask: new ModelDelegate('agentTask'),
  agentReachChannel: new ModelDelegate('agentReachChannel'),
  aISetter: new ModelDelegate('aISetter'),
  setterConversation: new ModelDelegate('setterConversation'),
  subAccount: new ModelDelegate('subAccount'),
  customAITask: new ModelDelegate('customAITask'),
  aBTest: new ModelDelegate('aBTest'),
  iCPProfile: new ModelDelegate('iCPProfile'),
  followUpSequence: new ModelDelegate('followUpSequence'),
  profile: new ModelDelegate('profile'),
  userSettings: new ModelDelegate('userSettings'),
  // Billing models
  billingPlan: new ModelDelegate('billingPlan'),
  subscription: new ModelDelegate('subscription'),
  billingEvent: new ModelDelegate('billingEvent'),
  consumptionRecord: new ModelDelegate('consumptionRecord'),
  // Autoresearch models
  autoresearchJob: new ModelDelegate('autoresearchJob'),
  autoresearchExperiment: new ModelDelegate('autoresearchExperiment'),
  autoresearchFragment: new ModelDelegate('autoresearchFragment'),
  // Enrichment models
  enrichmentJob: new ModelDelegate('enrichmentJob'),
  // Reports models
  prospectReport: new ModelDelegate('prospectReport'),
  // ICP models (separate from iCPProfile which maps to icp_profiles)
  icp: new ModelDelegate('icp'),

  /** Execute raw SQL via Supabase RPC (not available via REST) */
  $queryRawUnsafe: async (_sql: string) => {
    console.warn('[db-supabase] $queryRawUnsafe is not supported via REST API')
    return []
  },

  /** Execute raw SQL via Supabase RPC (not available via REST) */
  $executeRawUnsafe: async (_sql: string) => {
    console.warn('[db-supabase] $executeRawUnsafe is not supported via REST API')
    return 0
  },

  /** Disconnect — no-op for REST API */
  $disconnect: async () => {
    // No-op for REST API
  },
}

export type DatabaseClient = typeof db

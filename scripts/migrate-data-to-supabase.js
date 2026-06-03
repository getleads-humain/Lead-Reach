/**
 * Data Migration Script: SQLite → Supabase PostgreSQL
 * Reads data from local SQLite and generates INSERT SQL for Supabase.
 * Run: node scripts/migrate-data-to-supabase.js
 */

const fs = require('fs');
const path = require('path');

const sqliteDbPath = path.join(__dirname, '..', 'db', 'custom.db');

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  const escaped = String(val).replace(/'/g, "''");
  return `'${escaped}'`;
}

const tableMap = {
  'Campaign': { pgTable: 'campaigns', columns: ['id','name','description','status','targetIndustry','targetLocation','targetCompanySize','targetCriteria','leadsFound','leadsQualified','leadsContacted','leadsResponded','createdAt','updatedAt'] },
  'Lead': { pgTable: 'leads', columns: ['id','campaignId','companyName','legalName','website','industry','subIndustry','sicCode','naicsCode','hqAddress','city','stateProvince','country','postalCode','phoneMain','phoneDirect','generalEmail','supportEmail','ceoName','ceoEmail','keyContactName','keyContactTitle','keyContactEmail','employeeCount','revenueEstimate','foundingYear','ownershipType','linkedinUrl','twitterHandle','facebookPage','techStack','leadScore','leadTier','firmographicScore','intentScore','reachabilityScore','strategicScore','dataCompleteness','stage','lastContactDate','nextFollowUp','notes','sources','discoveredAt','enrichedAt','qualifiedAt','contactedAt','createdAt','updatedAt'] },
  'Outreach': { pgTable: 'outreach', columns: ['id','leadId','channel','type','subject','body','status','sentAt','openedAt','repliedAt','createdAt','updatedAt'] },
  'AgentTask': { pgTable: 'agent_tasks', columns: ['id','campaignId','agentName','taskType','status','priority','input','output','error','progress','startedAt','completedAt','createdAt','updatedAt'] },
  'AgentReachChannel': { pgTable: 'agent_reach_channels', columns: ['id','name','displayName','description','status','tier','backend','message','lastChecked','createdAt','updatedAt'] },
  'SubAccount': { pgTable: 'sub_accounts', columns: ['id','name','description','status','clientName','clientEmail','industry','maxSetters','maxLeads','currentLeads','totalConversations','totalBookings','totalQualified','createdAt','updatedAt'] },
  'AISetter': { pgTable: 'ai_setters', columns: ['id','name','description','status','avatar','qualificationRules','conversationsHandled','leadsQualified','leadsBooked','conversionRate','avgResponseTime','language','channels','calendarLink','followUpEnabled','followUpDelay','maxFollowUps','ghlIntegrationId','activeVariant','variantAMessage','variantBMessage','subAccountId','createdAt','updatedAt'] },
  'SetterConversation': { pgTable: 'setter_conversations', columns: ['id','setterId','leadName','leadChannel','leadPhone','leadEmail','status','language','messages','painPoints','objections','qualificationScore','qualificationAnswers','bookedAppointment','bookedAt','appointmentDate','appointmentNotes','followUpCount','lastFollowUpAt','nextFollowUpAt','variant','createdAt','updatedAt'] },
  'CustomAITask': { pgTable: 'custom_ai_tasks', columns: ['id','name','description','type','status','trigger','actions','executionsCount','lastExecutedAt','subAccountId','createdAt','updatedAt'] },
  'ABTest': { pgTable: 'ab_tests', columns: ['id','name','description','status','variantAName','variantBName','variantAImpressions','variantBImpressions','variantAConversions','variantBConversions','variantAConversionRate','variantBConversionRate','winner','startDate','endDate','createdAt','updatedAt'] },
  'ICPProfile': { pgTable: 'icp_profiles', columns: ['id','name','description','industries','companySizes','locations','revenueRange','requiredTech','preferredTech','techSophisticationLevel','digitalMaturityScore','values','challenges','goals','cultureTypes','buyingSignals','engagementPatterns','triggerEvents','expansionSignals','complianceNeeds','budgetRange','decisionTimeline','priceSensitivity','lifetimeValuePotential','criteria','leadsScored','avgFitScore','createdAt','updatedAt'] },
  'FollowUpSequence': { pgTable: 'follow_up_sequences', columns: ['id','name','description','status','steps','totalSteps','enrolledCount','completedCount','responseRate','createdAt','updatedAt'] },
};

async function main() {
  const Database = require('better-sqlite3');
  const db = new Database(sqliteDbPath, { readonly: true });

  const sql = [];
  sql.push('-- ============================================');
  sql.push('-- LeadReach Data Migration: SQLite → Supabase');
  sql.push('-- ============================================\n');

  const order = ['Campaign','SubAccount','AgentReachChannel','Lead','Outreach','AgentTask','AISetter','SetterConversation','CustomAITask','ABTest','ICPProfile','FollowUpSequence'];
  let totalRows = 0;

  for (const model of order) {
    const { pgTable, columns } = tableMap[model];
    try {
      const rows = db.prepare(`SELECT * FROM "${model}"`).all();
      console.log(`${model} → ${pgTable}: ${rows.length} rows`);
      totalRows += rows.length;
      sql.push(`\n-- ${model} → ${pgTable} (${rows.length} rows)`);

      for (const row of rows) {
        const cols = [], vals = [];
        for (const col of columns) {
          const pgCol = col === 'trigger' ? 'trigger_config' : camelToSnake(col);
          if (row[col] !== undefined) {
            cols.push(pgCol);
            vals.push(escapeValue(row[col]));
          }
        }
        sql.push(`INSERT INTO ${pgTable} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;`);
      }
    } catch (err) {
      sql.push(`-- Error reading ${model}: ${err.message}`);
    }
  }

  db.close();
  const outPath = path.join(__dirname, '..', 'docs', 'supabase_data_migration.sql');
  fs.writeFileSync(outPath, sql.join('\n'));
  console.log(`\nTotal: ${totalRows} rows migrated`);
  console.log(`Saved to: ${outPath}`);
}

main().catch(console.error);

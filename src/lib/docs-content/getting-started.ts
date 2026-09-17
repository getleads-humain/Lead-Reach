import type { DocContent } from './types';

export const gettingStartedDocs: DocContent[] = [
  // ===========================================================================
  // CARD 1: QUICK START GUIDE
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 1. CREATING YOUR ACCOUNT
  // ---------------------------------------------------------------------------
  {
    slug: 'creating-account',
    title: 'Creating Your Account',
    description: 'Set up your LeadReach AI workspace, verify your sending domain, and invite teammates in under 10 minutes.',
    category: 'Getting Started',
    readTime: '7 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Creating a LeadReach AI account is the foundation for accessing the platform's eight AI agents, 17+ prospecting channels, and the full ICP-to-outreach pipeline. Your account represents a single isolated workspace that hosts multiple ICP definitions, multiple campaigns, and an unlimited number of invited teammates. Before you begin, ensure you have a business email address on a domain you control, because LeadReach AI uses domain verification to enable the email touchpoints in the 7-touch, 14-day outreach cadence. You will also need a clear idea of the geography you want to target, because the region you select during signup pre-seeds your default data residency, your default outbound email sending infrastructure, and the recommended timezone for the cadence scheduler. The entire signup flow takes about 8 minutes when your DNS verification records are ready, and you can begin discovering leads immediately after workspace provisioning completes.` },
      { type: 'paragraph', content: `LeadReach AI workspaces are isolated tenant units, meaning all ICPs, leads, campaigns, and approval workflows live inside the workspace you create at signup. There is no cross-workspace data leakage, even when two workspaces belong to the same parent organization, which is critical for sales teams operating in regulated verticals such as financial services or healthcare. The platform supports both self-serve signup for teams of up to 25 seats and enterprise SSO onboarding for organizations requiring SCIM provisioning, audit log export, and delegated admin roles. Choosing the right path at signup affects the billing model, the data residency region, and the available agent roster, so review the plan tier table below before you commit. We recommend starting on the Growth tier if you have between 5 and 25 seats, because it unlocks four concurrent agents and is the minimum needed to run Prospect Discovery, Data Enrichment, Lead Qualification, and Outreach Composer in parallel without queueing.` },
      { type: 'heading', level: 2, content: 'Step-by-Step Setup' },
      { type: 'paragraph', content: `The signup flow is designed to move you from an empty workspace to your first discovered lead in under 15 minutes. Each step is gated on the previous step's validation, so you cannot skip domain verification or invite teammates before the workspace exists. The platform surfaces inline help throughout the flow, including tooltips that explain the downstream impact of each configuration choice. If you pause for more than 30 minutes, the wizard auto-saves your progress to your browser's local storage, and you can resume from the same step on the same device. The steps below assume you have your DNS provider credentials available and a target ICP description of at least 200 characters.` },
      { type: 'steps', items: [
        `Navigate to app.leadreach.ai/signup and register with your business email. Avoid personal email providers such as gmail.com or outlook.com, because they cannot pass domain verification and will permanently restrict outbound email channels.`,
        `Verify your email by clicking the magic link sent to your inbox. The link expires after 24 hours and is single-use; if it has expired, request a new one from the login screen rather than reusing the original.`,
        `Name your workspace using a recognizable team label, such as the parent company name plus the business unit. Workspace names appear in audit logs, approval notifications, and the email from-name for system-generated messages.`,
        `Select your primary target region. This choice pins your default data residency, your default outbound email sending infrastructure, and the recommended timezone for the 7-touch cadence scheduler. You cannot change this without a support-assisted migration.`,
        `Complete domain verification by adding the three TXT records provided to your DNS provider. DNS propagation typically completes in 10 to 60 minutes; the platform polls DNS every 5 minutes and sends an in-app notification when verification succeeds.`,
        `Invite your first teammates by entering their email addresses. Each invitee receives a personalized onboarding link valid for 7 days. You can revoke pending invitations from the Team Settings page at any time before they are accepted.`,
      ]},
      { type: 'paragraph', content: `After completing these steps, you will land on the workspace dashboard, which displays your active ICP count, your discovered lead count, and any pending approval tasks. At this stage the Orchestrator agent is idle because no ICP has been defined. You can either proceed to the ICP Builder or import an existing ICP from a JSON file if you have one from a previous workspace. The dashboard also surfaces a guided tour that highlights the three primary navigation regions: the Agents console, the Leads inbox, and the Campaign manager. We recommend completing the tour before you create your first ICP, because it explains the relationship between the eight agents and the 5-dimension scoring model that drives lead prioritization.` },
      { type: 'heading', level: 2, content: 'Workspace Configuration' },
      { type: 'paragraph', content: `Workspace configuration is exposed through the Settings page and is organized into seven tabs: General, Team, Billing, Security, Integrations, Webhooks, and Audit Log. The General tab is where you set the workspace name, default timezone, default outreach voice, and the data residency region pinned during signup. The Team tab controls seat allocation, role assignment, and invitation management. The Billing tab displays your current plan tier, monthly lead discovery quota, and any add-on packs you have purchased. The Security tab is where you enforce SSO, MFA, IP allowlisting, and session timeout policy. The Integrations tab lists connected CRM instances, email mailboxes, and calendar providers. The Webhooks tab lets you register inbound endpoints for lead and campaign events. The Audit Log tab exports the last 90 days of admin actions as CSV, with extended 7-year retention on Enterprise tiers.` },
      { type: 'code', language: 'json', caption: 'Example workspace configuration payload exported from the Settings page', code: `{
  "workspace": {
    "name": "Acme Corp - Sales Development",
    "default_timezone": "America/New_York",
    "default_outreach_voice": "consultative",
    "data_residency": "us-east-1",
    "plan_tier": "growth"
  },
  "security": {
    "sso_provider": "okta",
    "enforce_mfa": true,
    "session_timeout_minutes": 60,
    "ip_allowlist": ["10.0.0.0/8", "203.0.113.0/24"]
  },
  "quotas": {
    "monthly_lead_discovery": 25000,
    "active_icps": 10,
    "active_campaigns": 5,
    "seats": 25
  }
}` },
      { type: 'paragraph', content: `This configuration payload can be exported from the Settings page and committed to version control, which is the recommended pattern for teams that want reproducible workspace state. The payload includes your plan tier, your seat count, and your monthly discovery quota, so you can diff changes between workspace snapshots. The IP allowlist is optional but recommended for any workspace that contains CRM integrations or that runs approval workflows with executive sign-off. When you rotate IP allowlist entries, allow 15 minutes for the platform's edge cache to invalidate and re-issue session tokens before you test the new policy with a teammate session. The webhook tab accepts up to 10 inbound endpoints per workspace and retries failed deliveries with exponential backoff for up to 24 hours.` },
      { type: 'heading', level: 3, content: 'Plan Tiers and Limits' },
      { type: 'paragraph', content: `LeadReach AI offers four self-serve plan tiers and two enterprise tiers. The tier you select determines your monthly discovery quota, the number of concurrent agents you can run, and the channels available for the 7-touch outreach cadence. All tiers include the full 60-field lead enrichment payload and the 5-dimension scoring model, but only the top two tiers expose the scoring weights as a configurable option. Downgrades take effect at the next billing cycle, while upgrades take effect immediately and are prorated against the unused balance of your current tier. Enterprise tiers add dedicated agent infrastructure, custom channel connectors, and a 99.95 percent uptime SLA.` },
      { type: 'table', caption: 'Plan tier comparison', headers: ['Plan Tier', 'Monthly Leads', 'Concurrent Agents', 'Active ICPs', 'SSO Support'], rows: [
        ['Starter', '1,000', '1', '1', 'No'],
        ['Growth', '25,000', '4', '10', 'No'],
        ['Scale', '150,000', '8', '25', 'Yes'],
        ['Enterprise', 'Custom', '8', 'Unlimited', 'Yes'],
        ['Enterprise Plus', 'Custom', '8 + dedicated', 'Unlimited', 'Yes'],
      ]},
      { type: 'paragraph', content: `The Growth tier is the recommended starting point for most B2B sales teams between 5 and 25 seats, because it unlocks 4 concurrent agents, which is the minimum needed to run Prospect Discovery, Data Enrichment, Lead Qualification, and Outreach Composer in parallel without queueing. The Starter tier is restricted to a single agent, which means discovery and enrichment run sequentially and a typical ICP takes 3 to 4 times longer to produce the first batch of qualified leads. Enterprise tiers are priced based on annual commitment and include a dedicated customer success engineer, custom channel connectors, and quarterly business reviews that benchmark your discovery throughput against industry peers.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `Treat your LeadReach AI workspace as production infrastructure, not as a sandbox. Apply the same hygiene you would apply to a CRM or marketing automation instance: enforce SSO, require MFA, restrict admin role assignment to two or three named individuals, and review the audit log weekly. Name your workspace with a convention that includes the parent company and the business unit, because this name appears in every system-generated email and approval notification. Use the Integrations tab to connect your CRM before you create your first ICP, so discovered leads flow into your CRM pipeline automatically and avoid the manual import step that erodes data quality over time. Seat allocation should match your actual usage, not your headcount forecast, because the platform bills per active seat and revoking unused seats at the end of each quarter is a quick way to control cost.` },
      { type: 'list', items: [
        `Enforce SSO and MFA before inviting any teammate, even on the Starter tier.`,
        `Connect your CRM before defining your first ICP so leads flow into your pipeline automatically.`,
        `Limit admin role assignment to no more than three named individuals to reduce blast radius.`,
        `Commit the exported workspace configuration to version control and tag releases quarterly.`,
        `Review the audit log weekly for unexpected configuration changes and export monthly.`,
        `Document IP allowlist changes in a change management system with a ticket reference.`,
        `Deactivate departing teammates instead of deleting their accounts to preserve audit history.`,
      ]},
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `The most common signup issue is failed domain verification, which usually traces to TXT records that were entered with extra whitespace, incorrect quoting, or were propagated to a subdomain instead of the apex. The Settings page surfaces the exact DNS lookup result the platform received, so you can compare it against the expected value. If the lookup returns an empty result after 60 minutes, verify that your DNS provider has not inserted a default record that conflicts with the verification record. Some DNS providers prepend the apex domain to TXT record names, which causes a duplicate label and breaks verification. The second most common issue is the workspace name being rejected for containing unsupported characters; only alphanumeric characters, hyphens, and spaces are permitted, and the name cannot exceed 64 characters.` },
      { type: 'callout', variant: 'tip', content: `If your DNS provider uses a web UI that auto-appends the apex domain to TXT record names, enter the verification record name as the empty string or as the at-symbol placeholder. The platform polls DNS every 5 minutes and you will receive an in-app notification the moment verification succeeds, so you do not need to refresh the Settings page manually.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions during signup include whether you can rename your workspace after creation, whether you can change your data residency region, and whether you can migrate an existing ICP from a previous workspace. The workspace name is editable from the General tab at any time, and the change propagates to system-generated emails within 5 minutes. The data residency region is pinned at signup and cannot be changed without a support-assisted migration that takes 5 to 10 business days, because the platform must re-encrypt and re-replicate all stored leads and campaign artifacts to the new region. Existing ICPs can be imported via JSON file upload on the ICP Builder page, which preserves all filter definitions and the scoring weights. The platform does not support anonymous signup; every account must be tied to a verifiable business email, because outbound email channels in the 7-touch cadence require a verified sending domain to maintain deliverability above the 98 percent threshold that keeps your campaigns out of spam filters.` },
      { type: 'paragraph', content: `Another frequent question is whether the platform supports multiple workspaces under a single billing relationship. The answer is yes, but each workspace is billed separately and quota is not shared across workspaces. Organizations that need to share quota across business units should request the Enterprise Plus tier, which provisions a parent billing account and allows workspace quota pooling. Finally, if you signed up with an incorrect email address, contact support within 24 hours of signup; after that window, the workspace cannot be re-parented to a different email without a full data export and re-import on a new workspace.` },
      { type: 'divider' },
      { type: 'quote', content: `Your workspace is the system of record for every prospect relationship your team will build on LeadReach AI. Treat it like production from day one.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. DEFINING YOUR ICP
  // ---------------------------------------------------------------------------
  {
    slug: 'defining-icp',
    title: 'Defining Your ICP',
    description: 'Translate your ideal customer profile into a structured ICP definition that drives the Prospect Discovery agent across all 17+ channels.',
    category: 'Getting Started',
    readTime: '9 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Your Ideal Customer Profile (ICP) is the most important configuration in your LeadReach AI workspace, because every downstream agent uses it as the targeting predicate. The ICP definition feeds the Prospect Discovery agent (Scout), which then searches the 17+ supported channels including DuckDuckGo, Exa, LinkedIn, GitHub, Twitter/X, YouTube, Reddit, RSS, OpenStreetMap, Weibo, V2EX, Xueqiu, Bilibili, XiaoHongShu, Douyin, WeChat, and Xiaoyuzhou. An accurately defined ICP produces high-precision leads that the Data Enrichment agent (Forge) can expand to the full 60+ fields across eight categories, the Lead Qualification agent (Judge) can score on the 5-dimension model, and the Outreach Composer agent (Bard) can craft personalized 7-touch sequences for. An inaccurately defined ICP cascades waste through every downstream stage and produces leads that look promising on paper but never convert.` },
      { type: 'paragraph', content: `A complete ICP definition on LeadReach AI includes five dimensions: industry and vertical, company size and revenue, technology stack, geography and language, and growth and intent signals. Each dimension contributes to the firmographic and intent portions of the 5-dimension scoring model that produces a 0-100 score per lead, with firmographic weighted at 25 percent and intent weighted at 20 percent. The ICP Builder surfaces all five dimensions as a single tabbed form, and you can save the ICP as a draft at any point before publishing. Once published, the ICP is locked to the version number that the Orchestrator agent references when it dispatches the discovery pipeline; editing a published ICP creates a new version rather than mutating the existing one, which preserves reproducibility for any historical lead batch.` },
      { type: 'heading', level: 2, content: 'Step-by-Step: Building Your First ICP' },
      { type: 'paragraph', content: `Before you open the ICP Builder, write down your ICP hypothesis in plain English in a separate document. The hypothesis should answer three questions: which companies do you sell to, which signals indicate they are likely buyers, and which signals disqualify them. Having this hypothesis written down before you start clicking through the ICP Builder reduces the chance that you will over-constrain your ICP in pursuit of precision at the expense of recall. The ICP Builder is a structured form, but the form is only as good as the strategic thinking that informs it. Allocate 30 to 45 minutes for your first ICP and plan to revise it twice within the first two weeks of usage based on actual lead quality feedback from your sales team.` },
      { type: 'steps', items: [
        `Open the ICP Builder from the left navigation rail and click New ICP. Give the ICP a descriptive name that includes the target segment, such as "US Mid-Market B2B SaaS - Series B+" — the name appears in campaign configurations and audit logs.`,
        `Complete the Industry and Vertical tab by selecting one or more top-level industries from the platform taxonomy and optionally narrowing to sub-industries. The taxonomy is two levels deep and contains 24 top-level categories with an average of 8 sub-industries each.`,
        `Switch to the Company Size and Revenue tab and set the employee count range, the revenue range, and the funding stage filters. The platform supports ranges as either absolute thresholds or as percentiles relative to the industry benchmark.`,
        `Open the Technology Stack tab and select the technologies your buyers are likely to use. You can mark technologies as must-have, preferred, or excluded; the Prospect Discovery agent uses these signals as ranking features when surfacing candidate companies.`,
        `Move to the Geography and Language tab and select the countries, states or provinces, and languages you want to target. Each selection contributes a hard filter, so be careful not to over-narrow; the platform defaults to English-speaking North America.`,
        `Open the Growth and Intent Signals tab and configure the intent signals you want to weight. Available signals include hiring velocity, funding events, technology adoption, executive movement, content publication, and competitor mention.`,
        `Click Publish to lock the ICP version. The Orchestrator agent picks up the new ICP within 5 minutes and dispatches the first discovery run; you will see the first batch of leads in the Leads inbox within 15 to 45 minutes depending on channel depth.`,
      ]},
      { type: 'paragraph', content: `Once your ICP is published, the platform assigns it a version number and begins the first discovery run automatically. You can monitor the run from the Agents console by selecting the Orchestrator agent, which displays the dispatch plan, the per-channel estimated lead count, and the projected completion time. The first run typically returns between 200 and 1,500 candidate companies depending on how narrow your ICP is; runs with fewer than 200 candidates usually indicate an over-constrained ICP, and runs with more than 5,000 candidates usually indicate an under-constrained ICP. Tune the ICP iteratively based on these signals rather than starting from scratch each time.` },
      { type: 'heading', level: 2, content: 'ICP Definition Schema' },
      { type: 'paragraph', content: `The ICP definition is serialized as a structured JSON document that can be exported, version-controlled, and re-imported across workspaces. The schema is stable across platform versions; the platform uses semantic versioning and any breaking change to the schema ships as a major version bump with a migration tool. The payload below is a representative ICP definition targeting US mid-market B2B SaaS companies that have recently raised a Series B or later round, use a modern sales tech stack, and exhibit hiring intent for sales and marketing roles. The weights on the intent dimension are configured to favor funding signals and hiring signals, which are the strongest predictors of buying behavior in the SaaS vertical according to the platform's calibration data.` },
      { type: 'code', language: 'json', caption: 'Example ICP definition targeting US mid-market B2B SaaS companies', code: `{
  "name": "US Mid-Market B2B SaaS - Series B+",
  "version": "1.0.0",
  "industry": {
    "primary": ["technology", "financial_services", "healthcare"],
    "sub_industries": ["saas", "fintech", "healthtech"],
    "exclude": ["consulting", "agency"]
  },
  "company_size": {
    "employees_min": 50,
    "employees_max": 1000,
    "revenue_min_usd": 5000000,
    "revenue_max_usd": 100000000,
    "funding_stage": ["series_b", "series_c", "series_d", "public"]
  },
  "tech_stack": {
    "must_have": ["hubspot", "salesforce", "segment"],
    "preferred": ["snowflake", "dbt", "amplitude"],
    "excluded": ["excel_only"]
  },
  "geography": {
    "countries": ["US", "CA"],
    "languages": ["en"],
    "exclude": ["state:CA", "state:NY"]
  },
  "intent": {
    "weights": {
      "funding": 0.30,
      "hiring": 0.25,
      "tech_adoption": 0.15,
      "executive_move": 0.10,
      "content_publication": 0.10,
      "competitor_mention": 0.10
    },
    "lookback_days": 90
  }
}` },
      { type: 'paragraph', content: `When you export an ICP, the payload includes the version number, the creation timestamp, the author's user ID, and a hash of the definition that the platform uses for change detection. The hash lets the Orchestrator agent skip re-discovery when the ICP has not changed since the last run, which conserves your monthly discovery quota. The intent weights must sum to exactly 1.0; the platform surfaces a validation error if they do not, and it will not let you publish an ICP with invalid weights. The lookback window for intent signals defaults to 90 days but can be configured between 7 and 365 days; shorter windows produce fresher signals but lower recall, while longer windows produce higher recall but more stale signals.` },
      { type: 'heading', level: 3, content: 'ICP Dimensions Reference' },
      { type: 'paragraph', content: `The table below summarizes the five ICP dimensions, their data sources, and their contribution to the 5-dimension scoring model. Firmographic dimensions (industry, company size, geography) contribute 25 percent of the final score, and intent dimensions contribute 20 percent. The remaining 55 percent of the score is split between reachability (20 percent), strategic fit (20 percent), and data completeness (15 percent), all of which are computed by the Lead Qualification agent from the enriched lead payload rather than from the ICP definition itself. Understanding the contribution split helps you prioritize which dimensions to tune when iterating on lead quality.` },
      { type: 'table', caption: 'ICP dimensions and their contribution to the lead score', headers: ['Dimension', 'Primary Data Sources', 'Score Contribution', 'Filter Type'], rows: [
        ['Industry and Vertical', 'Internal taxonomy, Crunchbase, LinkedIn', 'Firmographic 25%', 'Hard'],
        ['Company Size and Revenue', 'Crunchbase, PitchBook, SEC filings', 'Firmographic 25%', 'Hard'],
        ['Technology Stack', 'BuiltWith, Wappalyzer, DNS signals', 'Firmographic 25%', 'Soft'],
        ['Geography and Language', 'IP geolocation, whois, language detection', 'Firmographic 25%', 'Hard'],
        ['Growth and Intent', 'Hiring feeds, funding rounds, news, RSS', 'Intent 20%', 'Weighted'],
      ]},
      { type: 'paragraph', content: `Hard filter dimensions exclude any lead that does not match exactly; weighted dimensions contribute to the score but do not exclude. This is why the technology stack dimension is classified as a soft filter even though it appears in the ICP definition alongside the hard filters: the platform uses tech stack as a ranking feature rather than as a strict predicate, because detection accuracy for some technologies is below 90 percent and excluding on a false negative would unfairly remove high-quality leads. The intent dimension is the only weighted dimension, meaning each signal within it contributes proportionally to its configured weight, and a lead that matches multiple intent signals can score highly on intent even if no single signal is dominant.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common ICP definition mistake is over-narrowing. A first-time user often configures every dimension tightly in pursuit of precision, then discovers that the first discovery run returns 30 leads in 90 days, which is too few to support a 7-touch cadence across multiple reps. The platform surfaces a warning when an ICP is projected to return fewer than 200 candidate companies per month, and we recommend widening the ICP until that projection clears 500. Another common mistake is under-narrowing, where the ICP returns 10,000 candidates per month and overwhelms the enrichment and qualification pipeline. The platform surfaces a parallel warning when the projection exceeds 5,000, and we recommend tightening the ICP until it falls below that threshold.` },
      { type: 'list', items: [
        `Start wide and narrow iteratively based on lead quality feedback from your sales team.`,
        `Aim for 500 to 5,000 projected candidate companies per month as the productive range.`,
        `Use at most three must-have technologies to avoid over-constraining on tech stack.`,
        `Configure intent lookback to 90 days for steady-state and 30 days for high-velocity campaigns.`,
        `Avoid excluding entire states or provinces unless you have a regulatory reason to do so.`,
        `Re-publish the ICP at least once per quarter to reflect market and product changes.`,
        `Keep a changelog of ICP versions so you can correlate lead quality shifts with definition changes.`,
      ]},
      { type: 'callout', variant: 'warning', content: `If you publish an ICP with intent weights that do not sum to exactly 1.0, the platform will reject the publish and surface a validation error inline. The error message names the offending dimension and the current sum, so you can adjust the weights without leaving the ICP Builder. Do not attempt to work around the validation by exporting, editing, and re-importing the JSON, because the import path performs the same validation and will reject the file.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If the first discovery run returns zero leads, the most likely cause is a hard-filter dimension that is too restrictive. Inspect each dimension's contribution to the candidate pool using the ICP Builder's projection panel, which shows how many candidates remain after each dimension is applied. The second most likely cause is a tech stack filter that includes must-have technologies that are not detectable across the 17+ channels; the platform surfaces a warning next to any technology with detection confidence below 70 percent. If you believe a candidate company should have matched your ICP but did not appear, use the Lead Lookup tool under the Leads inbox to search for that company by name; the tool will show which dimension excluded it, which gives you the actionable feedback you need to tune the ICP.` },
      { type: 'callout', variant: 'tip', content: `The ICP Builder's projection panel updates in real time as you change filters, so you can experiment with different combinations before publishing. The panel shows the projected monthly candidate count, the projected enrichment cost, and the projected time to first lead, all of which help you understand the tradeoffs of each filter change before you commit.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include how many ICPs a single workspace can host, whether ICPs can be shared across campaigns, and what happens to active campaigns when an ICP is revised. A Growth-tier workspace supports up to 10 active ICPs, and an Enterprise-tier workspace supports unlimited ICPs. ICPs are not directly bound to campaigns; instead, each campaign references an ICP version at campaign creation time, and the campaign continues to use that version even if the ICP is later revised. This decoupling prevents a careless ICP edit from invalidating an in-flight campaign's lead pool. To pick up a revised ICP, pause the campaign, update its ICP reference, and resume; the platform preserves any leads already in the cadence and only newly discovered leads will use the revised ICP.` },
      { type: 'paragraph', content: `Another common question is whether ICPs can be cloned across workspaces. The answer is yes via the JSON export and import path, but the imported ICP is treated as a new version 1.0.0 in the target workspace and does not retain version history from the source workspace. Finally, the platform does not support soft-deleting an ICP; once published, an ICP can be archived but not deleted, because deleting would break the audit chain for any leads discovered against that ICP. Archived ICPs are hidden from the ICP Builder list view but remain referenceable by campaign and audit log queries.` },
      { type: 'divider' },
      { type: 'quote', content: `Your ICP is a hypothesis, not a fact. Treat it as a living document that improves with every campaign cycle.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. DEPLOYING YOUR FIRST AGENT
  // ---------------------------------------------------------------------------
  {
    slug: 'deploying-agent',
    title: 'Deploying Your First Agent',
    description: 'Configure and deploy one of the eight LeadReach AI agents with the correct inputs, schedule, and budget envelope.',
    category: 'Getting Started',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `LeadReach AI ships with eight specialized agents that together cover the full lead generation lifecycle from discovery through reporting. The Orchestrator agent (Atlas) coordinates the others, the Prospect Discovery agent (Scout) searches the 17+ channels for candidate companies, the Data Enrichment agent (Forge) expands each candidate to the 60+ field payload across 8 categories, the Web Research agent (Sage) performs deep research on individual leads, the Lead Qualification agent (Judge) applies the 5-dimension scoring model, the Outreach Composer agent (Bard) drafts the 7-touch cadence, the Pipeline Manager agent (Flow) tracks the cadence execution, and the Report Generator agent (Echo) produces performance summaries. Deploying an agent means binding it to an ICP, setting its schedule, allocating a compute and channel budget, and choosing its concurrency level.` },
      { type: 'paragraph', content: `Most teams deploy their first agent immediately after publishing their first ICP, and the recommended starting point is the Prospect Discovery agent (Scout). Scout is the gateway to the rest of the platform because its output is the input to every downstream agent. Without Scout running, the Orchestrator has nothing to coordinate, Forge has nothing to enrich, Judge has nothing to score, and Bard has nothing to write about. Deploying Scout takes about 5 minutes once your ICP is published, and you can monitor the first discovery run from the Agents console. The other seven agents are typically deployed in the order Forge, Judge, Bard, Flow, Sage, Echo, with the Orchestrator running continuously from workspace creation.` },
      { type: 'heading', level: 2, content: 'Step-by-Step Deployment' },
      { type: 'paragraph', content: `Agent deployment is performed from the Agents console, which is the second item in the left navigation rail. Each agent has its own deployment card that displays the current status (idle, running, paused, error), the current ICP binding, the schedule, the budget consumed in the current billing cycle, and the last completed run timestamp. The deployment wizard walks you through six steps, and the platform validates each step before letting you proceed to the next. You can deploy the same agent multiple times with different ICPs and different schedules, which is useful when you want to run a high-velocity ICP and a steady-state ICP in parallel against different segments.` },
      { type: 'steps', items: [
        `Open the Agents console from the left navigation rail and click the deployment card for the agent you want to deploy. For your first deployment, choose the Prospect Discovery agent (Scout).`,
        `Select the ICP version to bind the agent to. The dropdown shows all published ICPs in your workspace along with their version numbers and projected monthly candidate counts; pick the ICP that matches your targeting intent.`,
        `Configure the channel subset by selecting which of the 17+ channels Scout should search. For your first run, keep the default selection of the top 8 channels by volume: DuckDuckGo, Exa, LinkedIn, GitHub, Twitter/X, Reddit, YouTube, and OpenStreetMap.`,
        `Set the schedule for the agent. Choose "Continuous" for steady-state discovery that runs in a loop, or "Cron" for scheduled runs at a specific time. The default for Scout is Continuous with a 60-minute cycle.`,
        `Allocate the budget envelope by setting the monthly channel cost cap and the monthly compute cost cap. Scout consumes channel API credits and search credits; the recommended starting cap is 1,000 USD per month for the Growth tier.`,
        `Choose the concurrency level, which controls how many parallel channel queries the agent can execute. The Growth tier supports concurrency 4, the Scale tier supports concurrency 8, and Enterprise tiers support concurrency 8 plus dedicated workers.`,
        `Click Deploy. The agent transitions from idle to running within 60 seconds, and you will see the first candidate companies appear in the Leads inbox within 15 to 45 minutes depending on channel depth and concurrency.`,
      ]},
      { type: 'paragraph', content: `After deployment, the agent's deployment card shows live progress including the current channel being searched, the number of candidates discovered in the current cycle, and the projected completion time for the cycle. You can pause the agent at any time without losing in-flight work; paused agents retain their last completed cycle's results and resume from the beginning of the next cycle when unpaused. If an agent encounters an error, the platform surfaces the error inline on the deployment card and automatically retries with exponential backoff for up to 24 hours before placing the agent in a failed state. Failed agents require manual intervention through the Restart button on the deployment card.` },
      { type: 'heading', level: 2, content: 'Agent Configuration' },
      { type: 'paragraph', content: `Each agent has a configuration payload that can be exported as JSON and committed to version control. The payload for the Prospect Discovery agent includes the ICP version reference, the channel subset, the schedule, the budget envelope, the concurrency level, and a few agent-specific options such as the maximum candidates per channel per cycle and the deduplication strategy. The configuration is editable from the agent's settings panel after deployment, and changes take effect at the start of the next cycle rather than mid-cycle to avoid disrupting in-flight queries. The platform tracks every configuration change in the audit log along with the user who made the change and the reason field that the user is prompted to provide.` },
      { type: 'code', language: 'json', caption: 'Example Prospect Discovery agent deployment configuration', code: `{
  "agent": "scout",
  "name": "Scout - US B2B SaaS Discovery",
  "icp_ref": "icp_8f3a2b1c_v1.0.0",
  "channels": [
    "duckduckgo", "exa", "linkedin", "github",
    "twitter_x", "reddit", "youtube", "openstreetmap"
  ],
  "schedule": {
    "mode": "continuous",
    "cycle_minutes": 60,
    "quiet_hours": "22:00-06:00 America/New_York"
  },
  "budget": {
    "monthly_channel_cap_usd": 800,
    "monthly_compute_cap_usd": 200,
    "hard_stop_on_exceed": true
  },
  "concurrency": 4,
  "limits": {
    "max_candidates_per_channel_per_cycle": 250,
    "dedup_strategy": "domain_exact"
  }
}` },
      { type: 'paragraph', content: `The quiet_hours field is optional but recommended, because some channels rate-limit aggressively during business hours in their target geography. The dedup_strategy field accepts domain_exact (default), domain_normalized (strips subdomains), or linkedin_company_url_exact. For B2B ICPs we recommend domain_normalized, because it consolidates leads that share a root domain across subsidiaries, which avoids double-counting companies like Acme Corp and Acme India as two separate leads. The hard_stop_on_exceed flag governs what happens when the monthly budget cap is hit; if true, the agent pauses until the next billing cycle, and if false, the agent continues to run and the overage is billed at the prevailing overage rate.` },
      { type: 'heading', level: 3, content: 'Agent Roster Reference' },
      { type: 'paragraph', content: `The table below summarizes the eight agents, their primary function, their typical input and output, and the recommended deployment order for a new workspace. The Orchestrator is always deployed by default and cannot be uninstalled. The remaining seven agents are deployed on demand as your team expands its use of the platform. Sage and Echo are the least urgent to deploy because their outputs are situational rather than continuous; Sage runs on-demand per lead, and Echo runs on a weekly or monthly cadence.` },
      { type: 'table', caption: 'The eight LeadReach AI agents and their roles', headers: ['Agent', 'Codename', 'Function', 'Deploy Order'], rows: [
        ['Orchestrator', 'Atlas', 'Coordinates all other agents', 'Default'],
        ['Prospect Discovery', 'Scout', 'Searches 17+ channels for candidates', '1st'],
        ['Data Enrichment', 'Forge', 'Expands leads to 60+ fields across 8 categories', '2nd'],
        ['Web Research', 'Sage', 'Performs deep research on individual leads', '5th'],
        ['Lead Qualification', 'Judge', 'Applies 5-dimension scoring model', '3rd'],
        ['Outreach Composer', 'Bard', 'Drafts 7-touch outreach cadence', '4th'],
        ['Pipeline Manager', 'Flow', 'Tracks cadence execution and replies', '6th'],
        ['Report Generator', 'Echo', 'Produces performance summaries', '7th'],
      ]},
      { type: 'paragraph', content: `The deployment order in the table reflects the data flow: Scout produces candidates, Forge enriches them, Judge scores them, Bard writes outreach for the high-scoring ones, Flow executes the outreach cadence, Sage runs deep research on leads that need a personalized touch in the later cadence touchpoints, and Echo summarizes the campaign's performance. The Orchestrator (Atlas) is the only agent that does not consume data; it produces plans and dispatches other agents. Every agent except Atlas and Echo is bound to an ICP version; Atlas coordinates across ICPs and Echo aggregates across all campaigns.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `Deploy agents in the order recommended in the table above, and do not skip ahead. A common mistake is to deploy Bard before Forge and Judge are running, which produces outreach drafts based on un-enriched candidate records that lack the 60+ fields needed for personalization. The result is generic outreach that performs worse than a templated email and erodes your sending reputation. Another common mistake is to deploy Sage as a default enrichment step for every lead; Sage's per-lead research cost is 5x to 10x higher than Forge's, and reserving Sage for the top-scoring 10 percent of leads is the cost-effective pattern. Use the agent's deployment card to set the lead score threshold above which Sage should run, with 70 (the threshold for "hot" tier) being the recommended default.` },
      { type: 'list', items: [
        `Deploy agents in the recommended order: Scout, Forge, Judge, Bard, Flow, Sage, Echo.`,
        `Reserve Sage for leads scoring 70 or higher to control per-lead research cost.`,
        `Set quiet_hours to match the target geography's business hours to avoid rate limits.`,
        `Use domain_normalized dedup for B2B ICPs to consolidate subsidiary leads.`,
        `Set hard_stop_on_exceed to true on your first deployment to avoid surprise overage charges.`,
        `Restart failed agents within 24 hours to prevent the cycle from being marked as a permanent failure.`,
        `Tag agent configurations with the campaign name in version control to ease rollback.`,
      ]},
      { type: 'callout', variant: 'info', content: `Each agent has a globally unique identifier of the form agent_<workspace_id>_<codename>_<deployment_id> that is referenced by the audit log and by webhooks. The identifier is stable across restarts and configuration changes, so you can safely store it in external systems for correlation. The deployment ID is a 16-character alphanumeric string that you can copy from the deployment card's detail panel.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If an agent fails to start, the most common cause is a missing ICP binding; the deployment wizard will not let you proceed without selecting one, but you can unbind the agent post-deployment through the settings panel, which then leaves the agent idle. The second most common cause is exceeding the concurrency limit for your plan tier; the platform surfaces a clear error in this case and suggests downgrading concurrency or upgrading the plan. The third most common cause is an invalid channel API key in the Integrations tab; Scout will start but produce zero candidates, and the deployment card will show a per-channel error indicator next to the affected channel. To resolve, open the Integrations tab, re-enter the API key, and restart the agent.` },
      { type: 'callout', variant: 'warning', content: `If you change an agent's ICP binding after deployment, in-flight candidates from the previous ICP are preserved in the Leads inbox but are no longer enriched by Forge on subsequent cycles. To clean them up, use the bulk action "Discard stale candidates" on the Leads inbox filter view, which removes candidates that have not been touched in 7 days.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether multiple agents can be bound to the same ICP, whether agents can be paused without losing state, and how agent costs are billed. Multiple agents can be bound to the same ICP, and this is the recommended pattern when you want Scout to run continuously while Sage runs on-demand for high-scoring subsets of the same ICP. Pausing an agent preserves its in-flight work, its last completed cycle results, and its budget envelope; resuming continues from the beginning of the next cycle without losing any state. Agent costs are billed as part of your monthly platform subscription and do not appear as a separate line item, but the channel API credits consumed by Scout and the per-lead research cost consumed by Sage are billed separately against your monthly channel cap and your monthly research cap respectively.` },
      { type: 'paragraph', content: `Another frequent question is whether agents can be exported and re-imported across workspaces. Agent deployments cannot be exported directly, but the configuration payload can be exported as JSON and re-imported on a new workspace, which creates a new deployment with a new deployment ID. The audit log and webhook subscriptions from the original deployment do not transfer. Finally, the platform does not support running two instances of the same agent on the same ICP; if you need parallel runs against different segments, create two separate ICPs and bind each agent instance to a different ICP.` },
      { type: 'paragraph', content: `For teams that operate across multiple regions, the Orchestrator agent supports multi-region deployment patterns where each region's agents are pinned to that region's data residency. This pattern is recommended when your ICP spans regions with conflicting data residency requirements, such as a US-plus-EU ICP where EU leads must be stored in the EU residency region. Multi-region deployment also lets you run parallel discovery cycles for the same ICP across different timezones, which improves freshness for time-sensitive intent signals. Contact your customer success manager to enable multi-region deployment on Enterprise tiers, and plan for a 5 to 10 business day setup window for the second region. The setup includes provisioning the new residency region, replicating your workspace configuration, and validating that your CRM integration can ingest leads from both regions without creating duplicates. Once enabled, the Orchestrator automatically routes candidates to the correct region based on their detected headquarters country, and you can monitor both regions from the same Agents console.` },
      { type: 'divider' },
      { type: 'quote', content: `An agent is only as effective as the ICP it is bound to. Get the ICP right before you scale the agent fleet.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. REVIEWING DISCOVERED LEADS
  // ---------------------------------------------------------------------------
  {
    slug: 'reviewing-leads',
    title: 'Reviewing Discovered Leads',
    description: 'Triage discovered leads by score tier, validate the 60+ enrichment fields, and route accepted leads into active campaigns.',
    category: 'Getting Started',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `The Leads inbox is where your discovered leads land after the Prospect Discovery agent (Scout) and the Data Enrichment agent (Forge) have completed their work. Each lead arrives as a 60+ field payload organized into eight categories: Identity, Location, Contact, People, Firmographic, Digital, Financial, and Scoring. The Lead Qualification agent (Judge) has already applied the 5-dimension weighted scoring model that produces a 0-100 score, and the score is the primary triage signal for your review workflow. Leads scoring 88 or above are flagged as super_hot, 70 to 87 as hot, 40 to 69 as warm, and below 40 as cold. Reviewing leads means accepting, rejecting, or routing them into active campaigns based on the score tier and the enriched fields.` },
      { type: 'paragraph', content: `A disciplined review workflow is what separates teams that convert 3 percent of discovered leads into pipeline from teams that convert 12 percent. The high-converting teams review their inbox daily, focus first on the super_hot and hot tiers, validate the enrichment fields that drive personalization, and route accepted leads into the appropriate active campaign within 24 hours of discovery. The platform supports this workflow with bulk actions, custom inbox views, and an approval integration that lets you require a second reviewer for any lead above a configurable score threshold. The review process also feeds back into the Lead Qualification agent's calibration; rejected leads with high scores are used as negative examples in the next calibration cycle.` },
      { type: 'heading', level: 2, content: 'Step-by-Step Review Workflow' },
      { type: 'paragraph', content: `The review workflow below assumes that Scout and Forge are running and that your Leads inbox has at least 50 discovered leads awaiting review. The workflow is designed to take a sales development representative about 90 minutes per day for an inbox of 200 to 400 leads, which is the typical daily volume for a Growth-tier workspace running Scout continuously. The workflow prioritizes score tier over discovery recency, because a super_hot lead discovered yesterday is more valuable than a warm lead discovered this morning. The workflow also incorporates a validation step for the enrichment fields that drive personalization in the 7-touch cadence, because Bard will only be as personalized as the fields Forge produces.` },
      { type: 'steps', items: [
        `Open the Leads inbox from the left navigation rail and apply the filter Score Tier: super_hot. This narrows the view to leads scoring 88 or above, which are the highest priority for outreach.`,
        `For each lead in the filtered view, scan the Identity and Firmographic sections of the lead card to confirm the company name, website, industry, and employee count match your ICP. Reject any lead that fails this sanity check.`,
        `Open the Contact section and verify that at least one decision-maker contact has a verified email and LinkedIn URL. Leads without a decision-maker contact should be routed back to Forge for re-enrichment rather than accepted.`,
        `Review the Scoring section to understand why the lead scored highly. The section shows the per-dimension breakdown: firmographic (25%), intent (20%), reachability (20%), strategic (20%), data completeness (15%). Use this breakdown to decide which campaign to route the lead into.`,
        `Accept the lead by clicking Accept and selecting the target campaign from the dropdown. The platform routes the lead to the campaign's Pipeline Manager agent (Flow) and triggers Bard to draft the first outreach touchpoint.`,
        `Once all super_hot leads are reviewed, switch the filter to Score Tier: hot and repeat the workflow. Allocate roughly 60% of your review time to super_hot, 30% to hot, and 10% to warm.`,
        `At the end of the review session, use the bulk action "Discard cold leads" to remove leads scoring below 40 from the inbox; they will be archived and excluded from future discovery to conserve your monthly quota.`,
      ]},
      { type: 'paragraph', content: `After accepting a lead and routing it to a campaign, you can monitor its progress through the 7-touch cadence from the campaign's Pipeline view. The cadence runs over 14 days and includes a mix of email, LinkedIn, and phone touchpoints orchestrated by the Pipeline Manager agent (Flow). If the lead responds positively at any touchpoint, Flow marks the lead as "engaged" and removes it from the remaining touchpoints. If the lead responds negatively or bounces, Flow marks the lead as "closed" and notifies you in the inbox. Leads that complete all 7 touchpoints without a response are marked as "exhausted" and are eligible for re-engagement in a future campaign cycle after a 30-day cooldown.` },
      { type: 'heading', level: 2, content: 'Lead Object Structure' },
      { type: 'paragraph', content: `Each lead is stored as a structured JSON document with the eight enrichment categories exposed as nested objects. The payload below is a representative super_hot lead that has been enriched by Forge and scored by Judge. The score object contains the per-dimension breakdown that you see in the Scoring section of the lead card, and the tier field is the derived bucket (cold, warm, hot, super_hot) that drives the inbox filter. The payload is what Bard receives as input when drafting the first outreach touchpoint, so the more complete the payload, the more personalized the outreach.` },
      { type: 'code', language: 'json', caption: 'Example enriched and scored lead payload', code: `{
  "lead_id": "lead_01HZXK8F3A2B1C9Q7V6M5P4R",
  "discovered_at": "2025-01-14T09:32:11Z",
  "identity": {
    "company_name": "Acme Analytics",
    "domain": "acmeanalytics.com",
    "linkedin_url": "linkedin.com/company/acme-analytics"
  },
  "location": {
    "hq_country": "US",
    "hq_region": "California",
    "hq_city": "San Francisco",
    "timezone": "America/Los_Angeles"
  },
  "contact": {
    "decision_makers": [
      {
        "name": "Jordan Lee",
        "title": "VP of Sales",
        "email": "jordan@acmeanalytics.com",
        "email_status": "verified",
        "linkedin_url": "linkedin.com/in/jordanlee"
      }
    ]
  },
  "firmographic": {
    "industry": "technology",
    "sub_industry": "saas",
    "employees": 240,
    "revenue_usd": 18000000,
    "funding_stage": "series_c"
  },
  "scoring": {
    "score": 91,
    "tier": "super_hot",
    "breakdown": {
      "firmographic": 24,
      "intent": 19,
      "reachability": 18,
      "strategic": 20,
      "data_completeness": 10
    },
    "max_score": 100,
    "calibrated_at": "2025-01-14T09:35:02Z"
  }
}` },
      { type: 'paragraph', content: `The payload shown is abbreviated for documentation purposes; the full payload contains between 60 and 80 fields depending on the ICP and the channels that produced the lead. The decision_makers array can contain up to 10 contacts, and the platform prioritizes contacts with verified emails and LinkedIn URLs. The scoring breakdown always sums to the score field; if it does not, the lead is flagged as "scoring_anomaly" and is held in a separate review queue until the Lead Qualification agent re-runs. The calibrated_at timestamp tells you which version of the scoring weights was applied; if you have revised the weights since the lead was scored, you can trigger a re-score from the lead card's actions menu.` },
      { type: 'heading', level: 3, content: 'Score Tier Reference' },
      { type: 'paragraph', content: `The table below summarizes the four score tiers, the recommended action for each tier, and the typical acceptance rate observed across the platform's customer base. The acceptance rate is the percentage of leads in that tier that are routed to a campaign rather than rejected; it is a benchmark and not a target, because the right acceptance rate depends on your ICP precision and your sales capacity. Teams with tight ICPs and high sales capacity can accept 80 percent of hot leads, while teams with loose ICPs and limited sales capacity may accept only 30 percent. The most important signal is consistency: review every lead in the tier with the same checklist.` },
      { type: 'table', caption: 'Score tiers and recommended actions', headers: ['Tier', 'Score Range', 'Recommended Action', 'Typical Acceptance Rate'], rows: [
        ['Cold', '0 to 39', 'Discard; excluded from future discovery', '0% to 5%'],
        ['Warm', '40 to 69', 'Review weekly; route to nurture campaign', '15% to 25%'],
        ['Hot', '70 to 87', 'Review daily; route to active outreach campaign', '40% to 60%'],
        ['Super Hot', '88 to 100', 'Review immediately; route to priority outreach campaign', '70% to 90%'],
      ]},
      { type: 'paragraph', content: `The boundary scores of 40, 70, and 88 are the platform defaults and can be customized on Enterprise tiers through the Scoring Weights panel in the Settings page. Adjusting the boundaries affects the tier distribution of your entire historical lead base, so the platform recalculates tiers retroactively when you change a boundary. We recommend reviewing the tier distribution weekly and adjusting boundaries quarterly at most, because frequent changes undermine the consistency of your review workflow. The score itself is always preserved; only the tier label changes, so historical reporting remains accurate.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `Review leads daily rather than weekly, because lead freshness is one of the strongest predictors of conversion. A super_hot lead reviewed within 24 hours of discovery converts at roughly 2.5x the rate of the same lead reviewed 7 days later, because the intent signals that drove the score are still active and the decision-maker is still in the buying window. Use the inbox's saved views feature to create a custom view per reviewer per tier, so each reviewer can quickly filter to their assigned segment without re-applying filters each session. The platform supports up to 50 saved views per workspace, and views can be shared with teammates through the share button on the view tab.` },
      { type: 'list', items: [
        `Review leads daily; aim for under 24 hours from discovery to first touchpoint.`,
        `Prioritize super_hot and hot tiers; allocate 90% of review time to these two tiers.`,
        `Validate the Identity and Contact sections before accepting; reject on mismatch.`,
        `Use saved views per reviewer per tier to standardize the workflow across the team.`,
        `Require a second reviewer for leads above 90 via the approval workflow integration.`,
        `Re-score leads when you revise the scoring weights to keep tier labels consistent.`,
        `Run the weekly "Discard cold leads" bulk action to conserve your monthly discovery quota.`,
      ]},
      { type: 'callout', variant: 'tip', content: `The bulk action toolbar on the Leads inbox supports multi-select via shift-click and accepts up to 500 leads per action. Bulk accept routes all selected leads to a single campaign; bulk reject tags all selected leads with your selected rejection reason and feeds them back into the Lead Qualification agent's calibration set as negative examples.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `The most common review issue is a lead with a high score but a clearly mismatched firmographic profile, which usually indicates the Lead Qualification agent's intent dimension is over-weighted relative to the firmographic dimension. Inspect the scoring breakdown on the lead card to confirm, and if the intent weight is above 0.25, consider rebalancing. The second most common issue is a lead with no decision-maker contacts despite a high score, which indicates Forge could not find a verified contact; route the lead back to Forge for re-enrichment rather than accepting it. The third most common issue is duplicate leads with the same domain but different company names, which indicates the dedup_strategy on Scout should be tightened to domain_normalized.` },
      { type: 'callout', variant: 'info', content: `The Lead Lookup tool under the Leads inbox lets you search for any lead by domain, company name, or decision-maker email. Use it before accepting a lead to confirm you are not creating a duplicate in your CRM; the tool surfaces matches across all lead states including archived and exhausted.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether leads can be exported to CSV, whether rejected leads can be reinstated, and how the deduplication strategy affects review. Leads can be exported to CSV from the inbox's bulk action menu, with a maximum of 10,000 leads per export; larger exports require the API and are paginated. Rejected leads can be reinstated from the archived view within 30 days of rejection, after which they are permanently deleted to comply with data retention policies. The deduplication strategy affects review by controlling whether the same company appears as one lead or multiple leads; domain_exact produces multiple leads per subdomain, while domain_normalized consolidates to one lead per root domain, which is the recommended pattern for B2B ICPs.` },
      { type: 'paragraph', content: `Another frequent question is whether the platform supports automated routing based on score thresholds. The answer is yes via the Routing Rules panel in the Settings page, where you can configure that all leads scoring 88 or above are auto-accepted into the priority outreach campaign, all leads scoring 70 to 87 are routed to the standard outreach campaign, and all leads scoring 40 to 69 are routed to the nurture campaign. Auto-routing bypasses human review, which trades off quality control for speed; we recommend starting with manual review and only enabling auto-routing once your team's acceptance rate has stabilized above 70 percent for two consecutive months.` },
      { type: 'paragraph', content: `The platform also supports a hybrid routing pattern where super_hot leads are auto-routed, hot leads require single-approver manual review, and warm leads require dual-approver manual review. This pattern is useful for high-value deal motions where you want maximum speed for the most qualified leads and maximum quality control for the borderline leads. Configure the hybrid pattern via the Routing Rules panel, where you can set per-tier approval modes and approver queues independently. The hybrid pattern typically improves overall throughput by 20 to 30 percent compared to fully manual review, while maintaining a 5 to 10 percent higher acceptance rate than fully threshold-based routing because the borderline leads receive the extra scrutiny that prevents false positives. We recommend piloting the hybrid pattern on a single campaign for 30 days before rolling it out to all campaigns, to confirm that the per-tier approval modes match your team's actual capacity and conversion patterns.` },
      { type: 'divider' },
      { type: 'quote', content: `Review is where data becomes pipeline. The discipline of your review workflow determines the ceiling of your conversion rate.` },
    ],
  },

  // ===========================================================================
  // CARD 2: IDEAL CUSTOMER PROFILE BUILDER
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 5. INDUSTRY & VERTICAL TARGETING
  // ---------------------------------------------------------------------------
  {
    slug: 'icp-industry',
    title: 'Industry & Vertical Targeting',
    description: 'Configure the industry and vertical dimension of your ICP using the platform taxonomy of 24 top-level categories and 192 sub-industries.',
    category: 'Getting Started',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Industry and vertical targeting is the first dimension of your ICP and the strongest single predictor of lead quality, contributing up to 25 percent of the firmographic portion of the 5-dimension score. The platform taxonomy is two levels deep, with 24 top-level industries and an average of 8 sub-industries each, for a total of 192 sub-industry categories. The taxonomy is maintained by the platform's data team and is updated quarterly to reflect emerging verticals such as climate technology, generative AI infrastructure, and stablecoin payments. When you select an industry in the ICP Builder, the Prospect Discovery agent (Scout) restricts its search to companies that match the selected top-level industry and at least one of the selected sub-industries. Companies that match a sub-industry but not its parent top-level industry are excluded by default, which prevents taxonomy drift from polluting your lead pool.` },
      { type: 'paragraph', content: `Industry targeting is a hard filter, meaning any company that does not match your selected industries is excluded from discovery regardless of its score on other dimensions. This makes industry selection the highest-leverage decision in your ICP, because an over-narrow selection permanently removes high-quality companies from your candidate pool. The platform surfaces a real-time projection of candidate count as you select industries, which lets you see the tradeoff between precision and recall before you publish. We recommend starting with two or three top-level industries that share a buying pattern, then narrowing to sub-industries that share a specific pain point your product solves. For example, if you sell a sales tech stack, you might select technology and financial services as top-level industries and narrow to saas, fintech, and insurance_tech as sub-industries, because these three share the buyer profile of a VP of Sales with budget authority and a 90-day buying cycle.` },
      { type: 'heading', level: 2, content: 'Step-by-Step Configuration' },
      { type: 'paragraph', content: `The industry configuration panel is the first tab in the ICP Builder and is required to publish an ICP. The panel includes a search box, a top-level industry selector, a sub-industry selector, and an exclusion selector. The search box accepts free text and matches against both industry names and common aliases, so searching for "fintech" surfaces both the financial_services top-level industry and the fintech sub-industry. The selectors support multi-select with bulk operations including select all, clear all, and select by CSV import, which is useful when you want to replicate an ICP from a spreadsheet of target accounts.` },
      { type: 'steps', items: [
        `Open the ICP Builder and navigate to the Industry and Vertical tab. The panel loads with no industries selected; the projection panel on the right shows the total addressable market across all 24 top-level industries.`,
        `Click on a top-level industry to select it; the sub-industry panel updates to show only the sub-industries under that top-level. The default selection is all sub-industries under the chosen top-level, which is the broadest possible targeting within that industry.`,
        `Narrow the sub-industries by deselecting any that do not match your ICP. The projection panel updates in real time to show the projected monthly candidate count after each change.`,
        `Optionally, add exclusions by switching to the Excluded Industries panel and selecting industries or sub-industries that should never appear in your lead pool. Common exclusions for B2B ICPs include consulting, agency, and government.`,
        `Review the projection panel to confirm your selection produces between 500 and 5,000 projected candidates per month, which is the productive range for most Growth-tier workspaces.`,
        `Save the ICP as a draft and review the change summary, which lists all industries added or removed since the last published version. The summary is included in the audit log entry when you publish.`,
        `Click Publish to lock the ICP version. The Orchestrator agent picks up the new industry targeting within 5 minutes and the first discovery run begins.`,
      ]},
      { type: 'paragraph', content: `After publishing, the ICP Builder shows the active industry targeting configuration at the top of the panel along with the projected candidate count and the average enrichment cost per candidate. You can edit the targeting at any time, but each edit creates a new ICP version rather than mutating the existing one. The version history is accessible from the ICP list view and lets you compare any two versions side by side to understand the tradeoffs of each change. The platform also surfaces a "Drift detection" indicator that warns when an ICP version has not been revised in 90 days, because industries evolve and an ICP that was accurate 90 days ago may no longer reflect your market.` },
      { type: 'heading', level: 2, content: 'Industry Configuration Schema' },
      { type: 'paragraph', content: `The industry configuration is serialized as a nested JSON object with three arrays: primary (top-level industries to include), sub_industries (sub-industries to include, which must be children of the primary selections), and exclude (top-level or sub-industries to exclude). The schema below is a representative configuration targeting US B2B SaaS companies in the financial services and healthcare verticals. Note that the sub_industries are subsets of the primary selections; the platform validates this hierarchy on publish and will reject any configuration where a selected sub-industry does not belong to a selected top-level.` },
      { type: 'code', language: 'json', caption: 'Example industry configuration for US B2B SaaS ICP', code: `{
  "industry": {
    "primary": ["technology", "financial_services", "healthcare"],
    "sub_industries": [
      "saas", "fintech", "healthtech",
      "insurance_tech", "payments"
    ],
    "exclude": ["consulting", "agency", "government"]
  },
  "projection": {
    "estimated_monthly_candidates": 3200,
    "average_enrichment_cost_usd": 0.18,
    "primary_channels": ["linkedin", "crunchbase", "exa"]
  }
}` },
      { type: 'paragraph', content: `The projection object is read-only and is computed by the platform when the configuration is saved. It includes the estimated monthly candidates, the average enrichment cost per candidate, and the list of primary channels that the Prospect Discovery agent will use to find candidates matching this industry targeting. The primary channels are surfaced to help you anticipate which channel API credits will be consumed most heavily; for B2B SaaS ICPs, LinkedIn and Crunchbase are typically the top two primary channels. The projection is an estimate based on historical data from the last 30 days and can vary by 20 percent in either direction based on market conditions.` },
      { type: 'heading', level: 3, content: 'Top-Level Industry Taxonomy' },
      { type: 'paragraph', content: `The table below lists all 24 top-level industries in the platform taxonomy along with the number of sub-industries under each and a representative sub-industry. The full sub-industry list is accessible from the ICP Builder's search panel by typing the top-level industry name. The taxonomy is mapped to NAICS and ISIC codes for interoperability with external data sources, and the mapping is exposed in the export payload as the naics_code and isic_code fields on each sub-industry.` },
      { type: 'table', caption: 'Top-level industry taxonomy (24 categories)', headers: ['Top-Level Industry', 'Sub-Industries', 'Representative Sub-Industry'], rows: [
        ['Technology', '12', 'saas'],
        ['Financial Services', '10', 'fintech'],
        ['Healthcare', '9', 'healthtech'],
        ['Manufacturing', '11', 'advanced_manufacturing'],
        ['Retail', '8', 'ecommerce'],
        ['Media', '7', 'streaming'],
        ['Education', '6', 'edtech'],
        ['Real Estate', '5', 'proptech'],
        ['Transportation', '7', 'logistics'],
        ['Energy', '6', 'climate_tech'],
      ]},
      { type: 'paragraph', content: `The table above shows 10 of the 24 top-level industries; the remaining 14 include construction, hospitality, food and beverage, agriculture, government, non-profit, telecommunications, utilities, legal, automotive, aerospace, defense, pharmaceuticals, and biotechnology. Each top-level industry has between 4 and 12 sub-industries, and the platform team adds new sub-industries quarterly based on customer demand and market emergence. If your target industry is not represented in the taxonomy, you can request a custom sub-industry through your customer success manager; custom sub-industries are scoped to your workspace and do not appear in other workspaces until promoted to the global taxonomy in a quarterly release.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common industry targeting mistake is selecting too many top-level industries in pursuit of breadth, which dilutes the firmographic score and produces leads that match the industry but not the buyer profile. A second common mistake is selecting a single top-level industry without narrowing to sub-industries, which produces high recall but low precision and overwhelms the enrichment pipeline with low-quality candidates. The recommended pattern is to select two or three top-level industries that share a buyer profile, narrow to three to five sub-industries that share a pain point, and exclude one or two sub-industries that consistently produce false positives. For B2B SaaS sellers, the technology top-level industry combined with the saas, devtools, and data_infra sub-industries is a productive starting configuration that produces 2,000 to 4,000 monthly candidates.` },
      { type: 'list', items: [
        `Select two or three top-level industries that share a buyer profile.`,
        `Narrow to three to five sub-industries that share a specific pain point.`,
        `Exclude consulting, agency, and government sub-industries for B2B ICPs.`,
        `Aim for 500 to 5,000 projected monthly candidates as the productive range.`,
        `Review the ICP quarterly to reflect taxonomy updates and market shifts.`,
        `Use the version diff view to evaluate proposed industry changes before publishing.`,
        `Request custom sub-industries through your CSM for niche verticals not in the taxonomy.`,
      ]},
      { type: 'callout', variant: 'warning', content: `Niche industries with fewer than 1,000 companies globally may not produce enough candidates to support a 7-touch cadence across multiple reps. If your ICP targets a niche vertical, consider widening the geography or relaxing the company size filters to compensate for the small industry population.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If your industry targeting produces zero candidates, the most likely cause is selecting a sub-industry without its parent top-level industry; the platform validates this hierarchy on publish, but a draft ICP can have orphan sub-industries that produce zero candidates. The second most likely cause is excluding too aggressively; the exclusion list is applied as a hard filter, and excluding a top-level industry that contains a selected sub-industry will produce zero candidates. The projection panel surfaces both of these issues with a red warning indicator next to the affected selection. The third most likely cause is targeting a sub-industry with very low global population; switch to the related sub-industries panel in the ICP Builder to see the estimated global company count per sub-industry.` },
      { type: 'callout', variant: 'tip', content: `The ICP Builder's projection panel includes a "Similar sub-industries" expandable section that shows the top five sub-industries most similar to your current selection by buyer profile overlap. Use it to discover adjacent verticals when your current targeting is too narrow.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether you can target custom industries not in the taxonomy, whether sub-industries can span multiple top-level industries, and how often the taxonomy is updated. Custom sub-industries can be requested through your customer success manager and are scoped to your workspace; promotion to the global taxonomy happens quarterly based on aggregate demand. Sub-industries are strictly scoped to a single top-level industry to maintain the hierarchy invariant, which simplifies the platform's reasoning and prevents taxonomy drift. The taxonomy is updated quarterly with new sub-industries based on customer demand and market emergence; updates are announced in the platform's release notes and do not break existing ICP versions because versioning is immutable.` },
      { type: 'paragraph', content: `Another frequent question is whether the platform can detect industries automatically from a list of target accounts. The answer is yes via the "Infer ICP from accounts" tool in the ICP Builder, which accepts up to 1,000 domain names and returns the inferred industry configuration along with a confidence score per inference. The tool uses the same data sources that Scout uses during discovery, so the inferred configuration is consistent with what the discovery pipeline will actually find. We recommend running the inference tool whenever you have a list of closed-won accounts from your CRM, because it produces a data-driven ICP hypothesis that you can refine in the ICP Builder.` },
      { type: 'paragraph', content: `Finally, a common pitfall when defining industry targeting is conflating your ICP with your TAM. The ICP is the subset of your TAM where your product has the strongest product-market fit and where your sales motion is most repeatable; it is not the entire addressable market. If your industry targeting produces more than 5,000 projected candidates per month, you are likely targeting your TAM rather than your ICP, and you should narrow your sub-industry selection to focus on the buyers who have the specific pain point your product solves. A narrow ICP produces higher conversion rates and faster sales cycles than a broad ICP, even if the broad ICP produces more raw lead volume. We have observed across the platform's customer base that the highest-converting teams operate ICPs with 1,500 to 3,000 monthly candidates rather than the 5,000+ candidate ICPs that less mature teams prefer, because the narrower ICP allows the Outreach Composer agent to produce more personalized outreach that resonates with the specific pain point. Use the ICP Builder's projection panel as a forcing function for ICP discipline, and treat any projection above 5,000 as a signal to narrow further.` },
      { type: 'divider' },
      { type: 'quote', content: `Industry targeting is the foundation of your ICP. Get this dimension right and the other four dimensions have room to operate.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. COMPANY SIZE & REVENUE FILTERS
  // ---------------------------------------------------------------------------
  {
    slug: 'icp-company-size',
    title: 'Company Size & Revenue Filters',
    description: 'Filter your ICP by employee count, annual revenue, and funding stage using absolute thresholds or industry percentiles.',
    category: 'Getting Started',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Company size and revenue filters are the second dimension of your ICP and the second-strongest predictor of lead quality, contributing alongside industry to the 25 percent firmographic portion of the 5-dimension score. The platform supports three interrelated filters: employee count, annual revenue, and funding stage. Each filter can be configured as an absolute threshold (for example, employees between 50 and 1,000) or as an industry-relative percentile (for example, companies in the top 25 percent of employee count within their industry). Absolute thresholds are the recommended pattern for B2B ICPs because they map directly to your sales team's capacity and deal size, while industry-relative percentiles are useful when you sell to companies of widely varying absolute sizes depending on the vertical.` },
      { type: 'paragraph', content: `The company size filter is a hard filter, meaning any company outside the configured range is excluded from discovery regardless of its score on other dimensions. This makes the filter both powerful and dangerous: setting the range too narrow can exclude high-quality companies that are slightly outside the range, while setting it too wide can dilute the firmographic score. The platform surfaces a projection of candidate count as you adjust the range, and we recommend targeting a range that produces 2,000 to 4,000 projected candidates per month for a Growth-tier workspace. The revenue and funding stage filters are also hard filters, and they are applied conjunctively with the employee count filter, meaning a company must match all three to be included.` },
      { type: 'heading', level: 2, content: 'Step-by-Step Configuration' },
      { type: 'paragraph', content: `The company size configuration panel is the second tab in the ICP Builder. The panel includes an employee count range slider, an annual revenue range slider, a funding stage multi-select, and a toggle between absolute thresholds and industry-relative percentiles. The slider ranges are bounded by the platform's data coverage; employee count ranges from 1 to 100,000, annual revenue ranges from 100,000 USD to 10 billion USD, and funding stage includes pre_seed through public. The panel includes a "Use industry benchmark" toggle that converts the absolute thresholds to industry-relative percentiles, which is useful when your ICP spans industries with very different size distributions.` },
      { type: 'steps', items: [
        `Open the ICP Builder and navigate to the Company Size and Revenue tab. The panel loads with default ranges of 10 to 10,000 employees and 1 million to 1 billion USD revenue, which is the broad B2B SaaS range.`,
        `Adjust the employee count range slider to match your ICP. For mid-market B2B SaaS, the typical range is 50 to 1,000 employees; for enterprise, 1,000 to 10,000; for SMB, 10 to 200.`,
        `Adjust the annual revenue range slider to match your ICP. The revenue filter is most reliable for public companies and late-stage private companies; early-stage private companies may have revenue data missing.`,
        `Select one or more funding stages from the multi-select. Available stages are pre_seed, seed, series_a, series_b, series_c, series_d, series_e_plus, public, and bootstrap.`,
        `Optionally toggle "Use industry benchmark" to convert absolute thresholds to industry-relative percentiles. This is recommended when your ICP spans industries with very different size distributions.`,
        `Review the projection panel to confirm your configuration produces between 2,000 and 4,000 projected candidates per month, which is the productive range for most Growth-tier workspaces.`,
        `Save the ICP as a draft and review the change summary, then click Publish to lock the version.`,
      ]},
      { type: 'paragraph', content: `After publishing, the panel shows the active company size configuration along with the projected candidate count, the average enrichment cost per candidate, and the data source coverage percentage. The data source coverage is the percentage of candidates in the projection that have verified employee count and revenue data from at least two independent sources; for B2B SaaS ICPs, this coverage is typically 85 to 95 percent. If your coverage is below 70 percent, the platform may not have strong revenue data for your targeted industries, and you should consider relaxing the revenue filter or relying on the employee count filter alone.` },
      { type: 'heading', level: 2, content: 'Company Size Configuration Schema' },
      { type: 'paragraph', content: `The company size configuration is serialized as a nested JSON object with three sub-objects: employees, revenue, and funding_stage. Each sub-object includes the min and max thresholds and the optional benchmark_mode flag. The schema below is a representative configuration targeting US mid-market B2B SaaS companies with 50 to 1,000 employees, 5 to 100 million USD in annual revenue, and Series B or later funding.` },
      { type: 'code', language: 'json', caption: 'Example company size configuration for US mid-market B2B SaaS ICP', code: `{
  "company_size": {
    "employees": {
      "min": 50,
      "max": 1000,
      "benchmark_mode": false
    },
    "revenue": {
      "min_usd": 5000000,
      "max_usd": 100000000,
      "benchmark_mode": false,
      "currency": "USD"
    },
    "funding_stage": ["series_b", "series_c", "series_d", "public"],
    "exclude_stages": ["pre_seed", "seed", "series_a"]
  },
  "projection": {
    "estimated_monthly_candidates": 2400,
    "data_source_coverage_pct": 92,
    "primary_sources": ["crunchbase", "pitchbook", "sec_edgar"]
  }
}` },
      { type: 'paragraph', content: `The currency field on the revenue object accepts any ISO 4217 currency code; the platform converts non-USD values to USD using the daily rate from the European Central Bank's reference rates. The conversion happens at enrichment time rather than at ICP publication time, so the threshold values in the configuration remain in their original currency. The exclude_stages array is optional and is applied as a hard filter; we recommend excluding pre_seed, seed, and series_a for B2B SaaS ICPs because these companies typically have not yet established a repeatable sales motion and are unlikely to be in a buying window for sales tech stacks. The projection includes the primary data sources that the platform uses to verify company size, which helps you anticipate any data gaps.` },
      { type: 'heading', level: 3, content: 'Size Bracket Reference' },
      { type: 'paragraph', content: `The table below summarizes the five standard size brackets used across the platform, their typical employee and revenue ranges, and the recommended outbound strategy for each. The brackets are not strict platform categories; they are conventions that the platform surfaces in the ICP Builder's preset selector for quick configuration. You can configure custom ranges that do not align with these brackets, but we recommend using the presets unless you have a specific reason to deviate, because the presets are calibrated against historical conversion data from the platform's customer base.` },
      { type: 'table', caption: 'Standard company size brackets and outbound strategy', headers: ['Bracket', 'Employees', 'Annual Revenue (USD)', 'Recommended Outbound'], rows: [
        ['Micro', '1 to 9', 'Less than 1M', 'Self-serve motion; no outbound'],
        ['Small', '10 to 49', '1M to 5M', 'Light outbound; email-only cadence'],
        ['Mid-Market', '50 to 999', '5M to 100M', 'Full 7-touch cadence; SDR-led'],
        ['Large Enterprise', '1,000 to 9,999', '100M to 1B', 'Full 7-touch cadence; AE-led'],
        ['Strategic Enterprise', '10,000+', 'Greater than 1B', 'ABM motion; custom cadence'],
      ]},
      { type: 'paragraph', content: `The mid-market bracket is the most productive target for B2B SaaS sellers because it has the right balance of budget authority and decision speed; the typical mid-market deal closes in 30 to 90 days, which fits within the 14-day outreach cadence plus a 30-day follow-up window. The large enterprise bracket has higher deal sizes but longer sales cycles of 90 to 180 days, which exceeds the cadence window and requires a follow-up cadence extension. The strategic enterprise bracket is typically served by an account-based motion rather than a high-velocity cadence, because each deal requires significant solution customization and executive sponsorship.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common company size configuration mistake is over-narrowing on revenue, which excludes private companies whose revenue data is not publicly disclosed. The platform uses three primary sources for revenue data (Crunchbase, PitchBook, and SEC EDGAR), and coverage drops significantly for early-stage private companies. For ICPs that target Series A or earlier, we recommend relying on the employee count and funding stage filters rather than the revenue filter, because the latter will exclude most candidates due to data gaps. A second common mistake is setting the employee count max too high, which dilutes the firmographic score by including companies that are far outside your sales team's capacity. The recommended pattern is to set the employee count max to roughly 3x the largest company your sales team has closed in the last 12 months, which leaves headroom for growth without diluting precision.` },
      { type: 'list', items: [
        `Use absolute thresholds for B2B ICPs; reserve industry-relative percentiles for cross-vertical ICPs.`,
        `Rely on employee count and funding stage for early-stage private companies; revenue data is sparse.`,
        `Set employee count max to roughly 3x the largest company your sales team has closed in 12 months.`,
        `Exclude pre_seed, seed, and series_a for sales tech stacks; these companies lack budget authority.`,
        `Target the mid-market bracket (50 to 1,000 employees) for high-velocity B2B SaaS motions.`,
        `Use the Strategic Enterprise bracket only with an ABM motion; the 7-touch cadence is too short.`,
        `Review the data source coverage percentage; below 70% indicates weak revenue data for your industry.`,
      ]},
      { type: 'callout', variant: 'tip', content: `Employee count is a more reliable signal than revenue for early-stage private companies, because headcount is observable from hiring feeds and LinkedIn data while revenue is not. For Series A and earlier ICPs, weight the employee count filter higher and consider disabling the revenue filter entirely.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If your company size configuration produces zero candidates, the most likely cause is a revenue range that excludes all private companies in your targeted industry. The projection panel surfaces a "Data source coverage" indicator; if the indicator is below 50 percent, the platform does not have sufficient revenue data for your targeted industries, and you should either relax the revenue filter or remove it entirely. The second most likely cause is a funding stage selection that does not match your targeted industries; for example, selecting only "public" for an ICP that targets technology sub-industries will exclude most SaaS companies because the majority are private. The third most likely cause is an industry benchmark percentile that is too restrictive; switch back to absolute thresholds to diagnose.` },
      { type: 'callout', variant: 'info', content: `The ICP Builder includes a "Coverage diagnostic" tool in the panel header that runs a 30-second analysis of your configuration and surfaces the data source coverage per filter. The tool identifies which filter is most responsible for candidate exclusion and recommends a relaxation strategy. Run the diagnostic before you publish any ICP that targets early-stage private companies.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether you can filter by annual recurring revenue (ARR) specifically, how the platform handles companies with multiple business lines, and how currency conversion works for non-USD revenue. ARR filtering is supported on Enterprise tiers via the "revenue_type" field, which accepts "total_revenue" (default) or "arr"; ARR is most reliable for SaaS companies and is sourced from PitchBook and public earnings reports. Companies with multiple business lines are counted at the consolidated level; the platform does not split revenue by business unit because that data is rarely public. Currency conversion uses the European Central Bank's daily reference rate at enrichment time, and the threshold values in your ICP remain in their original currency; this means a USD-denominated threshold is stable across time while a non-USD threshold may include or exclude companies as exchange rates fluctuate.` },
      { type: 'paragraph', content: `Another frequent question is whether the platform can detect company size automatically from a list of target accounts. The answer is yes via the "Infer ICP from accounts" tool, which accepts up to 1,000 domain names and returns the inferred employee count, revenue, and funding stage distributions. The tool surfaces the median, 25th percentile, and 75th percentile for each metric, which lets you set your thresholds based on the actual distribution of your closed-won accounts rather than on intuition. We recommend running the inference tool whenever you have CRM data of closed-won accounts from the last 12 months, because it produces a data-driven starting configuration that you can refine in the ICP Builder.` },
      { type: 'paragraph', content: `A final consideration when configuring company size filters is the distinction between absolute size and relative size within an industry. A 200-employee company is mid-market in absolute terms, but in the financial services industry it is small relative to peers, while in the consumer goods industry it is mid-market relative to peers. This matters because buyer behavior is shaped by relative size; a relatively small company in a large-employee industry is typically more agile and has shorter sales cycles than a relatively large company in the same industry. Use the industry-relative percentile mode when your ICP spans industries with very different absolute size distributions, and use the absolute threshold mode when your ICP is concentrated in a single industry with similar size distributions. The platform surfaces a size distribution chart on the ICP Builder's projection panel that shows the absolute size distribution of your targeted candidates overlaid with the industry-relative percentile bands, which helps you decide which mode is more appropriate for your ICP. We recommend reviewing this chart whenever you add or remove an industry from your ICP, because the optimal mode can change as the industry mix changes.` },
      { type: 'divider' },
      { type: 'quote', content: `Company size is the second-strongest predictor of lead quality. Set the range based on your team's actual capacity, not on aspirational deal sizes.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. TECHNOLOGY STACK SIGNALS
  // ---------------------------------------------------------------------------
  {
    slug: 'icp-tech-stack',
    title: 'Technology Stack Signals',
    description: `Use technology stack signals as a soft ranking filter to identify companies that use your buyers' preferred tools.`,
    category: 'Getting Started',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Technology stack signals are the third dimension of your ICP and the only soft filter in the firmographic portion of the 5-dimension score. Unlike industry and company size, which are hard filters that exclude non-matching companies, tech stack signals are ranking features that boost or demote candidates without excluding them. This soft treatment exists because tech stack detection accuracy varies by technology; the platform's confidence is above 95 percent for technologies that leave DNS or HTTP headers (such as Cloudflare, Shopify, and HubSpot), but drops to 70 percent for technologies detectable only via JavaScript bundles (such as React, Vue, and Stripe). Excluding on a 70 percent accurate signal would unfairly remove 30 percent of high-quality leads, so the platform uses it as a ranking feature instead.` },
      { type: 'paragraph', content: `The platform's tech stack detection covers over 4,000 technologies across 12 categories including web frameworks, content management systems, e-commerce platforms, analytics, marketing automation, CRM, customer support, devops, data infrastructure, communication, security, and advertising. Detection happens via three complementary methods: DNS and HTTP header inspection (highest accuracy, 95+ percent), JavaScript bundle analysis (medium accuracy, 70 to 85 percent), and job posting keyword extraction (lowest accuracy, 60 to 75 percent but useful for internal-facing technologies). The Data Enrichment agent (Forge) runs all three methods and consolidates the results into a confidence-scored list of detected technologies per company, which is what the ICP Builder uses to evaluate candidates.` },
      { type: 'heading', level: 2, content: 'Step-by-Step Configuration' },
      { type: 'paragraph', content: `The technology stack configuration panel is the third tab in the ICP Builder. The panel includes a technology search box, a must-have list, a preferred list, an excluded list, and a confidence threshold slider. The search box accepts free text and matches against both technology names and aliases, so searching for "HS" surfaces HubSpot. The lists support multi-select with bulk operations, and the confidence threshold slider lets you set the minimum confidence required for a detection to count as a match, with the default at 70 percent.` },
      { type: 'steps', items: [
        `Open the ICP Builder and navigate to the Technology Stack tab. The panel loads with empty lists and a default confidence threshold of 70 percent.`,
        `Search for technologies your buyers are likely to use. For a sales tech stack ICP, common must-haves include Salesforce, HubSpot, Outreach, and Gong; preferred include Snowflake, dbt, and Amplitude.`,
        `Add each technology to either the must-have list, the preferred list, or the excluded list by clicking the appropriate button. Must-have technologies boost the candidate's score by a fixed amount; preferred boost by a smaller amount; excluded demote.`,
        `Adjust the confidence threshold slider based on the detection accuracy of your selected technologies. For DNS-detectable technologies, 95 percent is appropriate; for JavaScript-detectable technologies, 70 percent is the minimum.`,
        `Review the projection panel to confirm your configuration does not over-narrow the candidate pool. Tech stack filters should reduce the projected candidate count by no more than 30 percent.`,
        `Save the ICP as a draft and review the change summary, then click Publish to lock the version.`,
      ]},
      { type: 'paragraph', content: `After publishing, the panel shows the active tech stack configuration along with the projected candidate count and the average detection confidence for each selected technology. The detection confidence is sourced from the last 30 days of detection runs and is shown as a percentage next to each technology. If a selected technology has detection confidence below 70 percent, the platform surfaces a warning indicator next to it, because that signal is unreliable enough that it should not be in the must-have list. We recommend moving any technology with sub-70 percent confidence to the preferred list or removing it entirely.` },
      { type: 'heading', level: 2, content: 'Tech Stack Configuration Schema' },
      { type: 'paragraph', content: `The tech stack configuration is serialized as a nested JSON object with four arrays: must_have, preferred, excluded, and the confidence_threshold field. Each technology is identified by its slug, which is a stable identifier across platform versions. The schema below is a representative configuration for a sales tech stack ICP targeting companies that use Salesforce or HubSpot as their CRM, Snowflake or dbt for data infrastructure, and Amplitude for product analytics.` },
      { type: 'code', language: 'json', caption: 'Example tech stack configuration for a sales tech stack ICP', code: `{
  "tech_stack": {
    "must_have": ["salesforce", "hubspot", "outreach"],
    "preferred": ["snowflake", "dbt", "amplitude", "segment"],
    "excluded": ["excel_only", "google_sheets_only"],
    "confidence_threshold_pct": 75,
    "detection_methods": ["dns_http", "javascript", "job_postings"]
  },
  "projection": {
    "estimated_monthly_candidates": 2800,
    "average_detection_confidence_pct": 88,
    "primary_detection_method": "dns_http"
  }
}` },
      { type: 'paragraph', content: `The detection_methods array lets you restrict which detection methods are used for this ICP. The default is to use all three methods and consolidate, but you can restrict to DNS and HTTP only if you want the highest accuracy, at the cost of missing technologies that are only detectable via JavaScript. The projection includes the average detection confidence across all selected technologies, which helps you anticipate how reliable the tech stack filter will be for this ICP. If the average confidence is below 80 percent, the filter is more of a tie-breaker than a strong ranking signal, and you should rely more on the industry and company size dimensions for precision.` },
      { type: 'heading', level: 3, content: 'Detectable Technology Categories' },
      { type: 'paragraph', content: `The table below summarizes the 12 detectable technology categories, the number of technologies in each, and the typical detection accuracy. The full technology catalog is accessible from the ICP Builder's search panel by typing the category name. The catalog is updated monthly based on customer requests and market emergence, with new technologies added within 30 days of reaching sufficient market share.` },
      { type: 'table', caption: 'Detectable technology categories (12 categories, 4,000+ technologies)', headers: ['Category', 'Technology Count', 'Detection Accuracy'], rows: [
        ['Web Frameworks', '180', '70% to 85%'],
        ['Content Management', '95', '85% to 95%'],
        ['E-commerce Platforms', '60', '90% to 98%'],
        ['Analytics', '120', '85% to 95%'],
        ['Marketing Automation', '85', '90% to 98%'],
        ['CRM', '40', '85% to 95%'],
        ['Customer Support', '70', '85% to 95%'],
        ['DevOps', '150', '75% to 90%'],
        ['Data Infrastructure', '110', '70% to 85%'],
        ['Communication', '50', '80% to 92%'],
        ['Security', '90', '75% to 88%'],
        ['Advertising', '75', '85% to 95%'],
      ]},
      { type: 'paragraph', content: `Web frameworks and data infrastructure categories have the lowest detection accuracy because their signals are primarily JavaScript-based, which is harder to detect reliably than DNS or HTTP header signals. E-commerce platforms and marketing automation have the highest accuracy because they leave strong DNS and HTTP fingerprints and often include tracking pixels that are easy to identify. The CRM category has variable accuracy because some CRMs (like Salesforce) leave strong fingerprints while others (like custom-built CRMs) are not detectable at all; we recommend focusing on the well-known CRMs (Salesforce, HubSpot, Pipedrive, Zoho) for reliable detection.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common tech stack configuration mistake is over-using the must-have list, which converts a soft ranking filter into a de facto hard filter and excludes companies that would otherwise be high-quality leads. We recommend keeping the must-have list to at most three technologies, with the rest moved to the preferred list. A second common mistake is including technologies with detection confidence below 70 percent in the must-have list, which produces unreliable exclusions; move these to the preferred list or remove them. The recommended pattern is to use tech stack signals as a tie-breaker between leads that score equally on the hard dimensions, rather than as a primary filter. For B2B SaaS sellers, a must-have of Salesforce or HubSpot, a preferred list of three to five modern data tools, and an exclusion of "excel_only" or "google_sheets_only" produces the right balance of precision and recall.` },
      { type: 'list', items: [
        `Keep the must-have list to at most three technologies to preserve recall.`,
        `Move any technology with sub-70 percent detection confidence to the preferred list.`,
        `Use DNS-detectable technologies for the must-have list; they have the highest accuracy.`,
        `Exclude "excel_only" or "google_sheets_only" for B2B SaaS ICPs to filter out unsophisticated buyers.`,
        `Set the confidence threshold to 75 percent as the default; lower only for high-volume ICPs.`,
        `Allow all three detection methods by default; restrict to DNS_HTTP only for high-precision ICPs.`,
        `Treat tech stack signals as a tie-breaker rather than as a primary filter.`,
      ]},
      { type: 'callout', variant: 'info', content: `Tech stack detection runs on the company's primary domain only; subsidiaries on subdomains may not be detected. For ICPs that target companies with multiple business lines, use the domain_normalized dedup strategy on the Scout agent to consolidate detections across the corporate domain tree.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If your tech stack configuration produces zero candidates, the most likely cause is a must-have list containing a technology that is not detectable across your targeted industries; the platform surfaces a warning indicator next to any technology with detection confidence below 70 percent. The second most likely cause is a confidence threshold set too high; the default of 75 percent is appropriate for most ICPs, but raising it above 90 percent will exclude most JavaScript-detectable technologies. The third most likely cause is restricting detection methods to DNS_HTTP only while targeting industries that primarily use internal-facing technologies like data infrastructure, which are not DNS-detectable. To diagnose, switch detection methods back to all three and re-run the projection.` },
      { type: 'callout', variant: 'tip', content: `The ICP Builder's technology search panel includes a "Detection confidence" indicator next to each technology, sourced from the last 30 days of detection runs across the platform's customer base. Use this indicator to decide which list (must-have, preferred, excluded) to add a technology to.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether you can request custom technologies not in the catalog, how detection works for companies behind Cloudflare or proxies, and how often the catalog is updated. Custom technologies can be requested through your customer success manager and are typically added within 30 days if they reach sufficient market share; custom requests are scoped to your workspace until promoted to the global catalog. Companies behind Cloudflare or proxies are detected using the JavaScript bundle method, which is unaffected by DNS proxies; the platform also uses job posting keyword extraction as a fallback for any company where DNS and JavaScript detection both fail. The catalog is updated monthly with new technologies based on customer demand and market emergence, and updates are announced in the platform's release notes. When new technologies are added to the catalog, they are automatically detected across the platform's existing customer base and surfaced in each workspace's Recent Detections panel for review. If a new technology in the catalog is relevant to your ICP, you can add it to your tech stack configuration from the ICP Builder without republishing the ICP; the change takes effect at the next discovery cycle. The catalog update process is governed by a customer advisory board that reviews proposed additions quarterly and prioritizes technologies with at least 50 customer requests, which ensures that the catalog reflects real customer demand rather than market hype. We recommend subscribing to the platform's release notes and reviewing new additions monthly to keep your tech stack configuration current with the latest detections.` },
      { type: 'paragraph', content: `Another frequent question is whether the platform can detect a company's tech stack automatically from a list of target accounts. The answer is yes via the "Infer ICP from accounts" tool, which accepts up to 1,000 domain names and returns the most commonly detected technologies with their detection confidence. The tool surfaces the top 20 technologies by frequency, which lets you build a data-driven tech stack configuration rather than relying on intuition. We recommend running the inference tool whenever you have a list of closed-won accounts from your CRM, because it produces a configuration that reflects your actual customer base.` },
      { type: 'paragraph', content: `A final consideration is the relationship between tech stack signals and the buyer journey stage. Companies that recently adopted a new CRM within the last 30 days are in the early stage of the buyer journey and may not be ready to evaluate adjacent tools for 6 to 12 months, because they are still in implementation. Companies that adopted a new CRM 6 to 12 months ago are typically in the optimization stage and are evaluating adjacent tools that integrate with the CRM, which is the highest-conversion window for sales tech stacks. The platform surfaces the adoption recency signal on each lead's enrichment payload under the Digital category, and you can filter on this signal via the Custom Signals panel on Enterprise tiers. We recommend filtering for adoption recency between 90 and 365 days for B2B SaaS ICPs, which captures the optimization-stage buyers without excluding the early-adopter buyers who are evaluating replacement tools. This single filter typically improves conversion rates by 15 to 25 percent compared to an unfiltered tech stack configuration, because it focuses your outreach on buyers in the buying-ready stage rather than the implementation-stage buyers who are not yet ready to evaluate adjacent tools. For ICPs that target replacement-tool buyers specifically, narrow the adoption recency window to 365 to 730 days, which captures buyers who have used their current tool for 1 to 2 years and are typically in the evaluation stage for replacements.` },
      { type: 'divider' },
      { type: 'quote', content: `Tech stack is a soft signal. Use it as a tie-breaker, not as a gatekeeper.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. GEOGRAPHIC & LANGUAGE PREFERENCES
  // ---------------------------------------------------------------------------
  {
    slug: 'icp-geography',
    title: 'Geographic & Language Preferences',
    description: 'Configure the geography and language dimension of your ICP using country, region, and language filters with GDPR-aware exclusions.',
    category: 'Getting Started',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Geographic and language preferences are the fourth dimension of your ICP and the most operationally consequential dimension, because the geography you select determines which data residency region stores your discovered leads, which outbound email infrastructure delivers your 7-touch cadence, and which privacy regime governs your outreach. The platform supports filtering by country, by state or province, and by language, with each filter applied as a hard filter that excludes non-matching candidates. The geography dimension contributes 25 percent of the firmographic portion of the 5-dimension score, equally weighted with industry and company size, which reflects its importance as a precision lever for B2B ICPs.` },
      { type: 'paragraph', content: `The platform's geographic coverage spans 249 countries and territories, with sub-national granularity for 38 countries including the United States, Canada, Mexico, Brazil, the United Kingdom, Germany, France, Spain, Italy, the Netherlands, Australia, Japan, India, China, and Singapore. Language coverage spans 56 languages with detection accuracy above 90 percent for the top 20 languages and above 75 percent for the remaining 36. The default ICP geography is English-speaking North America (US and CA) with English as the only accepted language, which is the productive starting point for most B2B SaaS sellers; teams with global sales motions typically add the United Kingdom, Australia, and Germany in that order based on average deal size and English-language penetration.` },
      { type: 'heading', level: 2, content: 'Step-by-Step Configuration' },
      { type: 'paragraph', content: `The geography configuration panel is the fourth tab in the ICP Builder. The panel includes a country multi-select with search, a region multi-select that loads based on selected countries, a language multi-select, and a GDPR-aware exclusions toggle. The country multi-select supports ISO 3166-1 alpha-2 codes (such as US, CA, GB) and accepts free-text country names. The region multi-select supports ISO 3166-2 codes (such as US-CA for California) and accepts free-text region names. The language multi-select supports ISO 639-1 codes (such as en, fr, de) and accepts free-text language names.` },
      { type: 'steps', items: [
        `Open the ICP Builder and navigate to the Geography and Language tab. The panel loads with US, CA, and GB pre-selected and English as the only language, which is the default B2B SaaS configuration.`,
        `Adjust the country multi-select by adding or removing countries. Use the search box to find countries by name; the platform supports all 249 ISO 3166-1 countries and territories.`,
        `Optionally narrow to specific regions within each country by selecting from the region multi-select. The region selector loads based on your country selection and supports ISO 3166-2 codes.`,
        `Add or remove languages in the language multi-select. The default is English only; for European ICPs, common additions are German, French, Spanish, and Italian.`,
        `Optionally enable GDPR-aware exclusions to automatically exclude countries with strict data residency requirements (such as Germany and France) unless you have a data processing agreement on file.`,
        `Review the projection panel to confirm your configuration produces between 500 and 5,000 projected candidates per month and that the data residency region matches your outbound email infrastructure.`,
        `Save the ICP as a draft and review the change summary, then click Publish to lock the version.`,
      ]},
      { type: 'paragraph', content: `After publishing, the panel shows the active geography configuration along with the projected candidate count, the data residency region that will store the discovered leads, and the outbound email infrastructure that will deliver the 7-touch cadence. The data residency region is pinned at signup and cannot be changed without a support-assisted migration, so if your selected geography requires a different residency region (for example, EU leads must be stored in the EU residency region), the platform will surface a validation error at publish time. To resolve, either narrow your geography to match your current residency region or contact support to initiate a migration.` },
      { type: 'heading', level: 2, content: 'Geography Configuration Schema' },
      { type: 'paragraph', content: `The geography configuration is serialized as a nested JSON object with three arrays: countries, regions (optional), and languages. The exclude array is optional and is applied as a hard filter. The schema below is a representative configuration targeting English-speaking North America with the exception of California and New York, which are excluded due to existing account saturation. The gdpr_aware flag enables automatic exclusion of countries with strict data residency requirements unless a data processing agreement is on file.` },
      { type: 'code', language: 'json', caption: 'Example geography configuration for English-speaking North America', code: `{
  "geography": {
    "countries": ["US", "CA"],
    "regions": [],
    "exclude": ["US-CA", "US-NY"],
    "languages": ["en"],
    "gdpr_aware": true,
    "require_dpa": ["DE", "FR", "IT", "ES", "NL"]
  },
  "projection": {
    "estimated_monthly_candidates": 3200,
    "data_residency_region": "us-east-1",
    "outbound_email_infrastructure": "us-east-1-primary"
  }
}` },
      { type: 'paragraph', content: `The require_dpa array lists countries for which the platform will require a data processing agreement on file before storing leads; if your workspace does not have a DPA on file for a country in this list, the platform will surface a validation error at publish time. To resolve, either remove the country from your ICP, upload a DPA through the Integrations tab, or contact your customer success manager to add a DPA at the workspace level. The projection includes the data residency region and the outbound email infrastructure, both of which must align with the selected geography; misalignment produces a validation error rather than a silent misconfiguration.` },
      { type: 'heading', level: 3, content: 'Region Code Reference' },
      { type: 'paragraph', content: `The table below summarizes the supported region code formats for the 38 countries with sub-national granularity. The region codes follow ISO 3166-2 and are stable across platform versions. For countries without sub-national granularity, the region multi-select is empty and only the country filter applies. The platform's sub-national coverage is updated quarterly based on customer demand, with new regions added within 60 days of sufficient demand.` },
      { type: 'table', caption: 'Region code formats for selected countries', headers: ['Country', 'Region Code Format', 'Example Region', 'Sub-Regions'], rows: [
        ['United States', 'US-XX', 'US-CA (California)', '50 states + DC'],
        ['Canada', 'CA-XX', 'CA-ON (Ontario)', '13 provinces and territories'],
        ['United Kingdom', 'GB-XX', 'GB-ENG (England)', '4 constituent countries'],
        ['Germany', 'DE-XX', 'DE-BY (Bavaria)', '16 states'],
        ['Australia', 'AU-XX', 'AU-NSW (New South Wales)', '8 states and territories'],
        ['Japan', 'JP-XX', 'JP-13 (Tokyo)', '47 prefectures'],
      ]},
      { type: 'paragraph', content: `The region code format follows ISO 3166-2 with the country code as the prefix and a region code as the suffix, separated by a hyphen. The platform accepts both the hyphenated form (US-CA) and the underscore form (US_CA) for backwards compatibility, but the hyphenated form is preferred for new configurations. For countries with non-Latin scripts such as Japan and China, the region codes use the ISO 3166-2 Latin transliteration rather than the local script, which ensures consistency across geographies.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common geography configuration mistake is over-narrowing to a single country in pursuit of operational simplicity, which excludes high-quality leads in adjacent markets. The recommended pattern for B2B SaaS sellers is to target three to five countries that share a primary language, because the 7-touch cadence's outreach drafts are most effective in a single primary language. A second common mistake is excluding regions without a documented reason, which creates confusion when sales reps ask why certain states are not producing leads; we recommend adding a comment in the ICP's audit log explaining each exclusion. The third common mistake is enabling GDPR-aware exclusions without uploading the required DPAs, which produces a publish-time validation error that frustrates the workflow.` },
      { type: 'list', items: [
        `Target three to five countries that share a primary language for cadence efficiency.`,
        `Avoid excluding regions without documenting the reason in the ICP's audit log comment.`,
        `Upload required DPAs before enabling GDPR-aware exclusions for EU countries.`,
        `Use the default English-speaking North America configuration for your first ICP.`,
        `Add the United Kingdom, Australia, and Germany in that order for global expansion.`,
        `Confirm the data residency region matches your outbound email infrastructure before publishing.`,
        `Use the country-only filter for countries without sub-national granularity rather than leaving regions empty.`,
      ]},
      { type: 'callout', variant: 'warning', content: `GDPR requires data controllers to have a data processing agreement with any processor that handles EU personal data. LeadReach AI requires a DPA on file at the workspace level before you can target EU countries, and the ICP Builder will block publishing until the DPA is uploaded. Contact your customer success manager to initiate the DPA signing process, which typically takes 5 to 10 business days.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If your geography configuration produces a publish-time validation error, the most likely cause is a mismatch between your selected countries and your workspace's data residency region. The platform stores EU-targeted leads in the EU residency region, US-targeted leads in the US residency region, and APAC-targeted leads in the APAC residency region; if your workspace is pinned to the US residency region but you select EU countries, the validation will fail. To resolve, either narrow your geography to US-aligned countries or contact support to initiate a residency migration. The second most likely cause is a missing DPA for an EU country; the validation error names the country and links to the Integrations tab where you can upload the DPA. The third most likely cause is selecting a region code that does not exist; the platform validates against the ISO 3166-2 standard and will reject any non-standard codes.` },
      { type: 'callout', variant: 'tip', content: `The ICP Builder's geography panel includes a "Residency check" button that runs a 10-second validation of your configuration against your workspace's data residency region. Run the check before publishing to catch any residency mismatches early, when they are easy to fix.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether you can target multiple regions with different cadences, how language detection works for multilingual regions, and how the platform handles territories and dependencies. Targeting multiple regions with different cadences requires creating multiple ICPs and binding each to a separate campaign, because a single ICP cannot vary its cadence by region. Language detection uses a combination of website content analysis, decision-maker LinkedIn language, and company language preferences from Crunchbase; the platform defaults to English when detection is ambiguous, which is the conservative choice for B2B outreach. Territories and dependencies (such as Puerto Rico, Hong Kong, and Gibraltar) are treated as separate geographies with their own ISO 3166-1 codes; you can target them independently of their administering country. For teams that operate in multiple languages, the platform supports per-language outreach personalization via the Outreach Composer agent (Bard), which produces separate cadence drafts per language within the same campaign. This means a single campaign targeting English, German, and French produces three personalized cadence drafts per lead, one in each language, and the cadence execution engine sends the draft that matches the prospect's detected preferred language. To enable per-language personalization, add the supported languages in the ICP Builder's Language multi-select and configure the per-language outreach voice on the Campaign Settings page; the platform supports up to 10 languages per campaign before personalization quality degrades. We recommend starting with a single language and adding additional languages only after verifying that your Bard-generated drafts in the primary language achieve your target reply rate of 8 percent or higher.` },
      { type: 'paragraph', content: `Another frequent question is whether the platform supports outbound outreach in non-English languages. The answer is yes via the Outreach Composer agent (Bard), which supports the 56 languages in the platform's language catalog. However, Bard's quality in non-English languages is calibrated to the top 20 languages; outreach in the remaining 36 languages may have lower personalization quality. We recommend keeping the language list to the top 10 languages (English, German, French, Spanish, Italian, Portuguese, Dutch, Japanese, Chinese, Korean) for the highest outreach quality. For languages outside the top 10, consider using a human reviewer for the first outreach touchpoint.` },
      { type: 'paragraph', content: `A final consideration is the regulatory landscape in your targeted geographies, which extends beyond GDPR to include CCPA in California, PIPEDA in Canada, LGPD in Brazil, APPI in Japan, and PIPL in China. Each regime has specific requirements for personal data processing, consent, and cross-border transfer that affect both discovery and outreach. The platform maintains a compliance matrix that maps each supported country to its applicable regulations and surfaces a compliance warning on the ICP Builder when your selected geography triggers a regulatory regime your workspace is not configured to handle. For PIPL specifically, the platform requires a separate workspace pinned to the China data residency region, because PIPL mandates that Chinese personal data be stored and processed within China; the standard workspace cannot store or process Chinese personal data even on Enterprise tiers. For CCPA, the platform supports a Do Not Sell My Personal Information integration that lets California residents opt out of having their personal data processed for outreach; the integration is configured on the Integrations tab and applies automatically to all campaigns targeting California. For LGPD and APPI, the platform provides an opt-in consent flow that requires the prospect to explicitly consent to outreach before the first touchpoint is sent, which adds friction to the cadence but ensures compliance with the consent-first regimes. Contact your customer success manager to enable any of these compliance integrations on Enterprise tiers.` },
      { type: 'divider' },
      { type: 'quote', content: `Geography is not just a targeting filter; it is the boundary of your compliance posture. Configure it with the same care you apply to your security configuration.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. GROWTH & INTENT SIGNALS
  // ---------------------------------------------------------------------------
  {
    slug: 'icp-intent',
    title: 'Growth & Intent Signals',
    description: 'Configure the intent dimension of your ICP using weighted signals for funding, hiring, technology adoption, and executive movement.',
    category: 'Getting Started',
    readTime: '9 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Growth and intent signals are the fifth and final dimension of your ICP and the only weighted dimension, contributing 20 percent of the 5-dimension score. Unlike the firmographic dimensions which are hard filters, intent signals are weighted ranking features that boost candidates exhibiting buying-ready behavior. The platform supports six intent signal categories: funding events, hiring velocity, technology adoption, executive movement, content publication, and competitor mention. Each category is sourced from a dedicated data feed and is updated on a different cadence; funding events are updated daily from Crunchbase and PitchBook, hiring velocity is updated daily from job posting aggregators, technology adoption is updated weekly from the same detection pipeline that powers the tech stack dimension, executive movement is updated weekly from LinkedIn, content publication is updated daily from RSS and news feeds, and competitor mention is updated daily from the 17+ supported channels.` },
      { type: 'paragraph', content: `Intent signals are the strongest predictor of buying readiness in the platform's calibration data, with leads exhibiting two or more intent signals converting at 3.5x the rate of leads with zero intent signals. This is why the intent dimension is the only weighted dimension; the platform wants to surface leads with strong intent even if they fall slightly short on the firmographic dimensions. The tradeoff is that intent signals are noisier than firmographic filters, because they capture behavioral data that can change quickly. The platform mitigates this with a configurable lookback window that defaults to 90 days, which balances signal freshness against noise. Shorter lookback windows (30 days) produce fresher signals but lower recall, while longer lookback windows (180 days) produce higher recall but more stale signals.` },
      { type: 'heading', level: 2, content: 'Step-by-Step Configuration' },
      { type: 'paragraph', content: `The intent configuration panel is the fifth tab in the ICP Builder. The panel includes a six-row weight table with sliders for each intent category, a lookback window dropdown, and a per-signal threshold slider. The weights must sum to exactly 1.0, and the platform surfaces a live validation indicator next to the total. The default weights are funding 0.30, hiring 0.25, technology adoption 0.15, executive movement 0.10, content publication 0.10, and competitor mention 0.10, which is the calibrated starting point for B2B SaaS ICPs based on historical conversion data.` },
      { type: 'steps', items: [
        `Open the ICP Builder and navigate to the Growth and Intent Signals tab. The panel loads with the six default weights summing to 1.0 and a 90-day lookback window.`,
        `Adjust the weights using the sliders or by entering values directly in the input fields. The total updates in real time, and the platform surfaces a red indicator if the total deviates from 1.0 by more than 0.001.`,
        `For B2B SaaS ICPs, increase the funding weight if your buyers are typically Series B or later, because funding is the strongest buying signal for funded companies. Increase the hiring weight if your buyers are typically earlier stage.`,
        `Optionally, adjust the per-signal threshold slider to set the minimum signal strength required for a signal to count. The default is 0.5 on a 0 to 1 scale; lower thresholds capture more signals but introduce noise.`,
        `Set the lookback window using the dropdown. The default 90 days is appropriate for steady-state ICPs; use 30 days for high-velocity campaigns and 180 days for nurture campaigns.`,
        `Review the projection panel to confirm your configuration does not over- or under-weight any single signal. The panel shows the projected distribution of leads by signal count.`,
        `Save the ICP as a draft and review the change summary, then click Publish to lock the version.`,
      ]},
      { type: 'paragraph', content: `After publishing, the panel shows the active intent configuration along with the projected signal distribution per lead. The distribution is shown as a histogram with buckets for zero, one, two, three, and four-plus signals; the productive range is 40 to 60 percent of leads in the zero-signal bucket, 20 to 30 percent in the one-signal bucket, 10 to 20 percent in the two-signal bucket, and less than 10 percent in the three-plus-signal buckets. If your distribution skews too heavily toward zero signals, your weights are too low; if it skews too heavily toward multiple signals, your weights are too high or your lookback is too long.` },
      { type: 'heading', level: 2, content: 'Intent Configuration Schema' },
      { type: 'paragraph', content: `The intent configuration is serialized as a nested JSON object with two sub-objects: weights (the six signal weights) and limits (the lookback window and per-signal threshold). The schema below is a representative configuration for a B2B SaaS ICP with elevated weights on funding and hiring, which are the strongest buying signals for funded companies. The 90-day lookback is the steady-state default, and the 0.5 per-signal threshold filters out weak signals that would otherwise introduce noise.` },
      { type: 'code', language: 'json', caption: 'Example intent configuration for B2B SaaS ICP', code: `{
  "intent": {
    "weights": {
      "funding": 0.30,
      "hiring": 0.25,
      "tech_adoption": 0.15,
      "executive_move": 0.10,
      "content_publication": 0.10,
      "competitor_mention": 0.10
    },
    "limits": {
      "lookback_days": 90,
      "per_signal_threshold": 0.5,
      "min_signals_required": 0
    }
  },
  "projection": {
    "leads_with_zero_signals_pct": 45,
    "leads_with_one_signal_pct": 28,
    "leads_with_two_signals_pct": 18,
    "leads_with_three_plus_signals_pct": 9
  }
}` },
      { type: 'paragraph', content: `The min_signals_required field is optional and is applied as a soft filter; setting it to 1 excludes leads with zero intent signals from the candidate pool, which is appropriate for high-velocity campaigns where every lead must exhibit buying-ready behavior. Setting it to 0 (the default) includes all leads regardless of intent signal count, which is appropriate for steady-state campaigns where intent is a ranking feature rather than a filter. We recommend starting with min_signals_required at 0 and only increasing it if your campaign's conversion rate drops below 2 percent, which typically indicates that intent signals are not strong enough relative to firmographic matches.` },
      { type: 'heading', level: 3, content: 'Intent Signal Types Reference' },
      { type: 'paragraph', content: `The table below summarizes the six intent signal types, their data sources, their update cadence, and their typical signal strength distribution. The signal strength is on a 0 to 1 scale, with values above 0.5 considered strong signals. The platform weights strong signals more heavily than weak signals when computing the intent score for a lead, so the per-signal threshold effectively acts as a noise filter rather than a hard filter.` },
      { type: 'table', caption: 'Intent signal types and their characteristics', headers: ['Signal Type', 'Primary Data Sources', 'Update Cadence', 'Default Weight'], rows: [
        ['Funding Events', 'Crunchbase, PitchBook, news feeds', 'Daily', '0.30'],
        ['Hiring Velocity', 'Job posting aggregators, LinkedIn', 'Daily', '0.25'],
        ['Technology Adoption', 'BuiltWith, Wappalyzer, DNS signals', 'Weekly', '0.15'],
        ['Executive Movement', 'LinkedIn, news feeds', 'Weekly', '0.10'],
        ['Content Publication', 'RSS, news feeds, company blogs', 'Daily', '0.10'],
        ['Competitor Mention', '17+ supported channels', 'Daily', '0.10'],
      ]},
      { type: 'paragraph', content: `Funding events have the highest default weight because they are the strongest single buying signal in the platform's calibration data; a Series B or later funding event typically correlates with a 60 to 90 day buying window for sales tech stacks, which aligns with the 14-day cadence plus a 30-day follow-up window. Hiring velocity is the second-strongest signal because companies hiring for sales and marketing roles are typically expanding their go-to-market motion and have budget for new tools. Technology adoption is weighted lower because it is a slower signal that indicates infrastructure maturity rather than immediate buying readiness. Competitor mention has the lowest weight because it is the noisiest signal; mentions can be positive or negative and do not always indicate buying readiness.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common intent configuration mistake is over-weighting a single signal in pursuit of precision, which makes the intent score brittle to noise in that signal. We recommend keeping no single weight above 0.35 to maintain a diversified intent profile. A second common mistake is setting the lookback window too short in pursuit of fresher signals, which reduces recall and excludes leads with valid but older intent signals; the 90-day default is the calibrated sweet spot. The third common mistake is setting the per-signal threshold too high, which filters out moderately strong signals and reduces the candidate pool. The 0.5 default is appropriate for most ICPs; lowering it to 0.3 increases recall at the cost of more noise, while raising it to 0.7 increases precision at the cost of more exclusions.` },
      { type: 'list', items: [
        `Keep no single weight above 0.35 to maintain a diversified intent profile.`,
        `Use the 90-day lookback as the default; reserve 30 days for high-velocity campaigns.`,
        `Keep the per-signal threshold at 0.5 unless you have a specific reason to deviate.`,
        `Increase the funding weight for Series B or later ICPs; increase hiring for earlier stage.`,
        `Set min_signals_required to 0 for steady-state and 1 for high-velocity campaigns.`,
        `Review the projected signal distribution before publishing; aim for 40-60% zero-signal leads.`,
        `Re-calibrate weights quarterly based on actual conversion data from your campaigns.`,
      ]},
      { type: 'callout', variant: 'tip', content: `The ICP Builder's intent panel includes a "Conversion calibration" tool that analyzes your historical closed-won accounts and recommends weight adjustments based on which signals correlate with actual conversions. Run the calibration after your first 90 days of campaign data to refine your weights from intuition-driven to data-driven.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If your intent configuration produces a publish-time validation error, the most likely cause is weights that do not sum to exactly 1.0; the platform tolerates a deviation of 0.001 to account for floating point precision, but larger deviations are rejected. The second most likely cause is a per-signal threshold outside the valid range of 0.1 to 0.9; the platform enforces this range to prevent noise-amplifying configurations. The third most likely cause is a lookback window outside the valid range of 7 to 365 days. The platform surfaces clear validation errors in all three cases with the offending field named. If your intent configuration produces zero candidates despite valid weights, the most likely cause is min_signals_required set too high; lower it to 0 to confirm, then tune upward based on lead quality feedback.` },
      { type: 'callout', variant: 'info', content: `Intent signals decay over time; a funding event from 180 days ago is a weaker buying signal than one from 30 days ago. The platform applies a linear decay within the lookback window, so a signal at the start of the window contributes 1x and a signal at the end of the window contributes 0x, with linear interpolation in between. This decay is reflected in the per-signal strength score shown on each lead's Scoring section.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether you can configure custom intent signals, how the platform handles conflicting signals, and how often the calibration data is refreshed. Custom intent signals can be configured on Enterprise tiers via the Custom Signals panel in the Settings page; common custom signals include product launch events, regulatory changes, and competitor product releases. Conflicting signals (such as a funding event and an executive departure in the same window) are treated additively rather than subtractively, because the platform's calibration data shows that both signals independently correlate with buying readiness. The calibration data is refreshed monthly based on aggregate conversion data from the platform's customer base, and your workspace inherits the global calibration unless you have run the Conversion calibration tool to produce a workspace-specific calibration.` },
      { type: 'paragraph', content: `Another frequent question is whether the intent dimension can be disabled entirely. The answer is no; the intent dimension is a required part of the ICP and contributes 20 percent of the score. However, you can effectively neutralize the intent dimension by setting all weights to equal values (0.166 each) and setting min_signals_required to 0, which produces a configuration where intent is a uniform ranking feature rather than a discriminating one. We do not recommend this configuration for production ICPs, because it discards the strongest signal in the platform's calibration data and typically produces a 30 to 40 percent lower conversion rate than a properly weighted configuration.` },
      { type: 'paragraph', content: `A final consideration is the relationship between intent signals and seasonal patterns. B2B SaaS buying cycles have predictable seasonality, with the strongest intent signals in Q1 (post-budget refresh) and Q4 (use-it-or-lose-it budget), and the weakest signals in Q3 (summer slowdown in the Northern Hemisphere). The platform surfaces a seasonality-adjusted projection on the ICP Builder that shows the expected monthly candidate count after adjusting for seasonal patterns, which helps you set realistic expectations for your discovery throughput. For campaigns that target Q3 specifically, consider increasing the intent weights to compensate for the seasonal signal weakness, or use a 60-day lookback to capture more signals within the narrower window. For Q1 and Q4 campaigns, the default 90-day lookback is appropriate because the seasonal signals are strong enough to surface without needing a wider window. The seasonality adjustment is computed from the platform's aggregate historical data across the customer base and is updated annually based on the previous 12 months of conversion data; it is exposed as a multiplier between 0.7 and 1.3 on the projection panel, with 1.0 representing a neutral month and 1.3 representing a peak month.` },
      { type: 'divider' },
      { type: 'quote', content: `Intent is the difference between a company that fits your ICP and a company that is ready to buy. Calibrate it with data, not intuition.` },
    ],
  },

  // ===========================================================================
  // CARD 3: CAMPAIGN MANAGEMENT
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 10. CREATING A NEW CAMPAIGN
  // ---------------------------------------------------------------------------
  {
    slug: 'campaign-create',
    title: 'Creating a New Campaign',
    description: 'Create a new outreach campaign by binding an ICP version, selecting channels, and configuring the 14-day cadence envelope.',
    category: 'Getting Started',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `A campaign is the runtime container that orchestrates the 7-touch, 14-day outreach cadence across discovered leads. Each campaign binds to a single published ICP version, selects which of the 17+ channels will be used for outreach, defines the pipeline stages that leads move through, and configures the approval workflow that gates which leads enter the cadence. A LeadReach AI workspace can host multiple concurrent campaigns, each with a different ICP, different channels, and different cadence envelopes. The Growth tier supports up to 5 active campaigns, the Scale tier supports up to 25, and Enterprise tiers support unlimited campaigns subject to a fair-use policy.` },
      { type: 'paragraph', content: `Campaigns are the unit of execution for the Outreach Composer agent (Bard) and the Pipeline Manager agent (Flow). Bard drafts the 7-touch cadence for each accepted lead in the campaign, and Flow executes the cadence over the 14-day envelope, handling per-touchpoint scheduling, reply detection, and cadence state transitions. The Report Generator agent (Echo) produces performance summaries per campaign, including acceptance rate, contact rate, reply rate, positive reply rate, meeting book rate, and pipeline contribution. A well-configured campaign produces 200 to 400 accepted leads per month on a Growth-tier workspace with a properly tuned ICP, which translates to 20 to 40 meetings booked per month at a 10 percent meeting-book rate.` },
      { type: 'heading', level: 2, content: 'Step-by-Step: Creating a Campaign' },
      { type: 'paragraph', content: `Campaign creation is performed from the Campaign manager, which is the third item in the left navigation rail. The creation wizard walks you through seven steps and validates each step before letting you proceed. The wizard can be paused and resumed; the platform saves your progress to the workspace and you can return to the wizard from the Campaign manager's draft list. We recommend having your ICP published, your CRM connected, and your outbound email infrastructure verified before you start the wizard, because each of these prerequisites is required for a successful campaign launch.` },
      { type: 'steps', items: [
        `Open the Campaign manager from the left navigation rail and click New Campaign. The wizard opens to the first step, which is naming the campaign.`,
        `Name the campaign using a convention that includes the ICP name, the quarter, and the channel mix, such as "US B2B SaaS Q1 2025 - Email+LinkedIn". The name appears in the Pipeline Manager dashboard and in audit log entries.`,
        `Select the ICP version to bind the campaign to. The dropdown shows all published ICPs in your workspace along with their version numbers and projected monthly candidate counts; pick the ICP that matches your targeting intent.`,
        `Configure the channel mix by selecting which of the 17+ channels will be used for outreach. The default mix is email and LinkedIn, which is the most productive combination for B2B SaaS campaigns.`,
        `Configure the cadence envelope by setting the duration (default 14 days) and the touchpoint count (default 7 touches spread across email, LinkedIn, and phone). The platform provides preset cadences for common B2B SaaS patterns.`,
        `Configure the approval workflow by selecting whether leads require manual approval before entering the cadence. For your first campaign, we recommend requiring manual approval for all leads to maintain quality control.`,
        `Click Launch to start the campaign. The campaign transitions from draft to active within 60 seconds, and the first accepted leads will enter the cadence within the next 24 hours.`,
      ]},
      { type: 'paragraph', content: `After launching, the campaign's dashboard shows live metrics including accepted lead count, current cadence state distribution, reply rate, and pipeline contribution. You can pause the campaign at any time without losing in-flight leads; paused campaigns retain their cadence state and resume from the next scheduled touchpoint when unpaused. Editing an active campaign is restricted to a subset of fields (cadence envelope, channel mix, approval workflow) to prevent changes that would invalidate in-flight cadence state. To make larger changes, pause the campaign, edit, and resume; the platform preserves any leads already in the cadence and only newly accepted leads will use the revised configuration.` },
      { type: 'heading', level: 2, content: 'Campaign Configuration Schema' },
      { type: 'paragraph', content: `The campaign configuration is serialized as a structured JSON document that can be exported, version-controlled, and re-imported across workspaces. The payload includes the ICP version reference, the channel mix, the cadence envelope, the approval workflow, and a few campaign-specific options such as the daily sending limit and the timezone for cadence scheduling. The schema is stable across platform versions, and the platform uses semantic versioning for breaking changes.` },
      { type: 'code', language: 'json', caption: 'Example campaign configuration for a B2B SaaS email+LinkedIn campaign', code: `{
  "campaign": {
    "name": "US B2B SaaS Q1 2025 - Email+LinkedIn",
    "icp_ref": "icp_8f3a2b1c_v1.0.0",
    "channels": ["email", "linkedin"],
    "cadence": {
      "duration_days": 14,
      "touchpoints": 7,
      "touchpoint_mix": [
        { "day": 1, "channel": "email", "type": "intro" },
        { "day": 3, "channel": "linkedin", "type": "connection_request" },
        { "day": 5, "channel": "email", "type": "follow_up" },
        { "day": 7, "channel": "phone", "type": "cold_call" },
        { "day": 9, "channel": "email", "type": "value_add" },
        { "day": 12, "channel": "linkedin", "type": "message" },
        { "day": 14, "channel": "email", "type": "break_up" }
      ]
    },
    "approval": {
      "mode": "manual",
      "approvers": ["user_01HZXK8F", "user_01HZXK9G"],
      "auto_approve_threshold": 90
    },
    "limits": {
      "daily_sending_per_rep": 50,
      "timezone": "America/New_York",
      "quiet_hours": "20:00-08:00"
    }
  }
}` },
      { type: 'paragraph', content: `The touchpoint_mix array defines the 7-touch cadence with the day offset, channel, and touchpoint type for each touch. The platform provides preset mixes for common B2B SaaS patterns including "Email+LinkedIn", "Email+Phone", and "Email+LinkedIn+Phone". The auto_approve_threshold field lets you configure that leads scoring above the threshold (90 by default, which is in the super_hot range) bypass manual approval and enter the cadence automatically. The daily_sending_per_rep field caps the number of outbound emails per rep per day to maintain sending reputation; the recommended value is 50, which is below the 80-email-per-day reputation threshold that triggers spam filter penalties on most email providers.` },
      { type: 'heading', level: 3, content: 'Campaign Fields Reference' },
      { type: 'paragraph', content: `The table below summarizes the most important campaign fields, their default values, and the recommended configuration for a first-time B2B SaaS campaign. The defaults are calibrated to the platform's customer base and are appropriate for most steady-state campaigns. High-velocity campaigns (targeting super_hot leads) and nurture campaigns (targeting warm leads) may require adjustments to specific fields, which are noted in the recommendations column.` },
      { type: 'table', caption: 'Campaign field defaults and recommendations', headers: ['Field', 'Default', 'Recommendation for First Campaign'], rows: [
        ['Cadence duration', '14 days', 'Use default; extend to 21 for nurture'],
        ['Touchpoint count', '7', 'Use default; reduce to 5 for nurture'],
        ['Channel mix', 'Email+LinkedIn', 'Use default; add Phone for high-velocity'],
        ['Daily sending per rep', '50', 'Use default; do not exceed 80'],
        ['Quiet hours', '20:00-08:00', 'Match target geography business hours'],
        ['Approval mode', 'Manual', 'Use manual; switch to auto after 60 days'],
        ['Auto-approve threshold', '90', 'Use default; lower to 80 for high-velocity'],
      ]},
      { type: 'paragraph', content: `The quiet hours field uses 24-hour notation in the timezone specified by the timezone field; touchpoints scheduled during quiet hours are deferred to the next business day. The approval mode accepts "manual" (all leads require approval), "auto" (no leads require approval), or "threshold" (leads above the auto_approve_threshold bypass approval, the rest require approval). We recommend starting with "manual" for your first campaign to maintain quality control, then switching to "threshold" after 60 days once your team's acceptance rate has stabilized above 70 percent.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common campaign creation mistake is launching with an unverified ICP, which produces leads that do not match your targeting intent and erodes your sending reputation with low-quality outreach. We recommend running your ICP for at least 7 days before launching a campaign, to confirm that the discovered leads match your expectations. A second common mistake is setting the daily_sending_per_rep above 80, which triggers spam filter penalties on most email providers and tanks your deliverability. The third common mistake is launching without connecting your CRM, which forces the Pipeline Manager agent to store cadence state locally rather than syncing to your CRM pipeline, and creates data silos that erode data quality over time.` },
      { type: 'list', items: [
        `Run your ICP for 7 days before launching a campaign to confirm lead quality.`,
        `Keep daily_sending_per_rep at or below 50 to maintain sending reputation.`,
        `Connect your CRM before launching to enable cadence state sync.`,
        `Use a campaign naming convention that includes ICP, quarter, and channel mix.`,
        `Start with manual approval; switch to threshold after 60 days of stable acceptance rate.`,
        `Match quiet hours to target geography business hours; defer overnight sends.`,
        `Use the Email+LinkedIn preset for your first campaign; add Phone after calibration.`,
      ]},
      { type: 'callout', variant: 'tip', content: `The campaign naming convention is enforced as a soft check by the platform; if your name does not include the quarter or the channel mix, the platform surfaces a yellow warning indicator but does not block the launch. We recommend following the convention strictly because it makes report aggregation and audit log review significantly easier.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If your campaign fails to launch, the most common cause is an unverified ICP binding; the launch wizard validates that the ICP version exists and is published, but a post-launch ICP revision can invalidate the binding if the new version is incompatible. To resolve, pause the campaign, update the ICP binding to the new version, and resume. The second most common cause is an unverified outbound email infrastructure; the launch wizard requires at least one email mailbox to be connected and verified, and the verification status is shown on the Integrations tab. The third most common cause is exceeding the active campaign limit for your plan tier; the platform surfaces a clear error in this case and suggests archiving an existing campaign or upgrading the tier.` },
      { type: 'callout', variant: 'warning', content: `If you change the cadence envelope after launch (for example, extending from 14 to 21 days), leads already in the cadence will continue with the original envelope until they complete or exhaust. Only newly accepted leads will use the revised envelope. To apply the revised envelope to in-flight leads, you must pause the campaign, cancel all in-flight leads, and re-accept them; this is destructive and should be done only when strictly necessary.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include how many campaigns a single workspace can host, whether campaigns can be cloned, and what happens to active leads when a campaign is archived. A Growth-tier workspace supports up to 5 active campaigns, a Scale-tier workspace supports up to 25, and Enterprise tiers support unlimited campaigns subject to a fair-use policy. Campaigns can be cloned via the duplicate action on the Campaign manager, which copies all configuration except the ICP binding and the launch timestamp; the cloned campaign starts as a draft and must be launched manually. Archiving a campaign preserves all historical data and audit logs but stops new leads from entering the cadence; in-flight leads complete their current cadence envelope, and the campaign's pipeline contribution is preserved in the Report Generator's historical summaries.` },
      { type: 'paragraph', content: `Another frequent question is whether a single lead can be in multiple campaigns simultaneously. The answer is no; the platform enforces a single-campaign invariant per lead to prevent cross-campaign outreach that would erode prospect experience. If you want to re-engage a lead in a new campaign, you must first close the lead in the existing campaign by marking it as exhausted, then accept it into the new campaign after a 30-day cooldown. The cooldown prevents rapid re-engagement that would burn the prospect and protects your sending reputation.` },
      { type: 'paragraph', content: `A final consideration is the relationship between campaigns and your CRM pipeline. The platform supports bidirectional sync with Salesforce, HubSpot, and Pipedrive, which means that every lead accepted into a campaign appears in your CRM pipeline at the Introduced stage, and every stage transition in LeadReach AI is mirrored in the CRM. This bidirectional sync eliminates the manual CRM update burden that plagues traditional SDR workflows and ensures that your CRM pipeline is always current. To enable sync, connect your CRM on the Integrations tab and map each LeadReach AI pipeline stage to a CRM stage by ID. The platform supports up to 5 CRM instances per workspace for teams that operate across multiple regions or business units, with each instance mapped to a different campaign or set of campaigns. For Salesforce specifically, the sync uses the Salesforce REST API with a per-workspace rate limit of 100,000 calls per day, which is sufficient for campaigns processing up to 5,000 leads per month; larger volumes require the Bulk API integration available on Enterprise tiers. We recommend validating the stage mapping in a sandbox CRM before activating the sync on your production CRM, to avoid creating stage-mismatched records that would require manual cleanup.` },
      { type: 'divider' },
      { type: 'quote', content: `A campaign is the runtime for your outbound motion. Configure it with the same care you apply to your ICP, because the two work as a system.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11. CHANNEL CONFIGURATION
  // ---------------------------------------------------------------------------
  {
    slug: 'campaign-channels',
    title: 'Channel Configuration',
    description: 'Configure which of the 17+ supported channels your campaign uses for outreach, including per-channel rate limits and routing rules.',
    category: 'Getting Started',
    readTime: '9 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `LeadReach AI supports 17+ prospecting and outreach channels across global and regional geographies. The global channels are DuckDuckGo, Exa, LinkedIn, GitHub, Twitter/X, YouTube, Reddit, RSS, and OpenStreetMap; the regional channels for the Chinese market are Weibo, V2EX, Xueqiu, Bilibili, XiaoHongShu, Douyin, WeChat, and Xiaoyuzhou. Each channel serves a distinct function in the discovery and outreach pipeline: discovery channels surface candidate companies and decision-makers, while outreach channels deliver the 7-touch cadence. LinkedIn and email are the only channels that serve both discovery and outreach functions; the others are discovery-only.` },
      { type: 'paragraph', content: `Channel configuration on a campaign includes selecting which channels will be used for outreach, setting per-channel daily sending limits, configuring per-channel routing rules, and connecting any required third-party API keys. The platform surfaces a per-channel health indicator that reflects the current API quota, rate limit status, and recent error rate. Channels with degraded health are flagged with a yellow indicator and may produce slower outreach or higher bounce rates; channels with critical health are flagged with a red indicator and should be paused until the underlying issue is resolved. The platform automatically pauses outreach on any channel with a critical health indicator for more than 60 minutes to protect your sending reputation.` },
      { type: 'heading', level: 2, content: 'Step-by-Step Channel Configuration' },
      { type: 'paragraph', content: `The channel configuration panel is the fourth step of the campaign creation wizard and is also accessible from the campaign's settings panel after launch. The panel displays the 17+ channels in a grid with their current connection status, daily sending limit, and health indicator. The default channel mix for a new B2B SaaS campaign is email and LinkedIn, which is the most productive combination based on the platform's historical conversion data.` },
      { type: 'steps', items: [
        `Open the campaign creation wizard or navigate to an existing campaign's settings panel and click the Channels tab.`,
        `Review the channel grid to identify which channels are connected (green indicator), pending (yellow indicator), or unconnected (gray indicator). Only connected channels can be enabled for outreach.`,
        `Enable the channels you want to use for outreach by toggling the switch on each channel card. For your first B2B SaaS campaign, enable Email and LinkedIn.`,
        `For each enabled channel, set the daily sending limit. The recommended starting value is 50 for email and 20 for LinkedIn; do not exceed 80 for email or 25 for LinkedIn to avoid rate limits and account flags.`,
        `Configure per-channel routing rules by specifying which touchpoint types should be sent on each channel. The default routing sends intro, follow_up, value_add, and break_up on email; connection_request and message on LinkedIn; cold_call on phone.`,
        `Connect any required third-party API keys via the Integrations tab if you have not already done so. LinkedIn and email require mailbox credentials; phone requires a VoIP integration such as Twilio or Aircall.`,
        `Save the configuration. The platform validates the channel mix against the ICP and the cadence envelope, and surfaces any incompatibilities before letting you proceed.`,
      ]},
      { type: 'paragraph', content: `After saving, the panel shows the active channel configuration along with the projected daily outreach volume and the projected monthly reach. The platform calculates projected reach as the product of daily sending limit, working days per month (22), and the number of reps assigned to the campaign. A campaign with 5 reps, 50 daily emails per rep, and 20 daily LinkedIn messages per rep produces a projected monthly reach of 5,500 emails and 2,200 LinkedIn messages, which is sufficient for a 7-touch cadence against 200 to 400 monthly accepted leads. If your projected reach is below 200 monthly accepted leads, increase the daily sending limit or add more reps.` },
      { type: 'heading', level: 2, content: 'Channel Configuration Schema' },
      { type: 'paragraph', content: `The channel configuration is serialized as a nested JSON object with a channels array, each entry containing the channel name, daily limit, routing rules, and connection status. The schema below is a representative configuration for a B2B SaaS campaign using email, LinkedIn, and phone for outreach, with the recommended daily limits and routing rules.` },
      { type: 'code', language: 'json', caption: 'Example channel configuration for email+LinkedIn+phone B2B SaaS campaign', code: `{
  "channels": [
    {
      "name": "email",
      "enabled": true,
      "daily_limit_per_rep": 50,
      "routing": ["intro", "follow_up", "value_add", "break_up"],
      "connection_status": "connected",
      "mailbox": "smtp://outreach@acme.com@smtp.gmail.com:587"
    },
    {
      "name": "linkedin",
      "enabled": true,
      "daily_limit_per_rep": 20,
      "routing": ["connection_request", "message"],
      "connection_status": "connected",
      "account": "sales_lead@acme.com"
    },
    {
      "name": "phone",
      "enabled": true,
      "daily_limit_per_rep": 30,
      "routing": ["cold_call"],
      "connection_status": "connected",
      "provider": "twilio",
      "from_number": "+18005551234"
    }
  ],
  "global_limits": {
    "max_total_daily_outreach_per_rep": 100,
    "min_gap_minutes_between_touches": 60,
    "respect_timezone": true
  }
}` },
      { type: 'paragraph', content: `The global_limits object includes the max_total_daily_outreach_per_rep field which caps the total outreach across all channels per rep per day; the recommended value is 100, which is below the 120-touch daily limit that triggers spam filter penalties and LinkedIn account flags. The min_gap_minutes_between_touches field ensures that no two touchpoints to the same lead are sent within the specified window; the default 60 minutes prevents awkward double-touches while still allowing for cadence progression. The respect_timezone flag defers outreach to leads in timezones outside their business hours, which is critical for maintaining deliverability and response rates across global campaigns.` },
      { type: 'heading', level: 3, content: 'Supported Channels Reference' },
      { type: 'paragraph', content: `The table below summarizes the 17+ supported channels, their function (discovery, outreach, or both), and their primary use case. The channels are grouped into global channels and China-region channels; the China-region channels are only relevant for ICPs targeting the Chinese market and are not enabled by default. The platform adds new channels quarterly based on customer demand and market emergence.` },
      { type: 'table', caption: 'Supported channels (17+ global and regional)', headers: ['Channel', 'Function', 'Primary Use Case'], rows: [
        ['DuckDuckGo', 'Discovery', 'General web search for candidate companies'],
        ['Exa', 'Discovery', 'Semantic search for niche buyer profiles'],
        ['LinkedIn', 'Discovery + Outreach', 'Decision-maker identification and outreach'],
        ['GitHub', 'Discovery', 'Developer-tool buyer identification'],
        ['Twitter/X', 'Discovery', 'Real-time signal monitoring'],
        ['YouTube', 'Discovery', 'Content-driven buyer identification'],
        ['Reddit', 'Discovery', 'Community-sourced buyer identification'],
        ['RSS', 'Discovery', 'News and blog signal monitoring'],
        ['OpenStreetMap', 'Discovery', 'Location-based business discovery'],
        ['Email', 'Outreach', 'Primary 7-touch cadence delivery'],
        ['Phone', 'Outreach', 'Cold call touchpoint in mixed cadence'],
      ]},
      { type: 'paragraph', content: `The China-region channels (Weibo, V2EX, Xueqiu, Bilibili, XiaoHongShu, Douyin, WeChat, and Xiaoyuzhou) serve the same discovery function as the global channels but for the Chinese market. Each has a specific use case; Weibo is for general social signal monitoring, V2EX is for developer community monitoring, Xueqiu is for financial signals, Bilibili is for video content monitoring, XiaoHongShu is for consumer brand monitoring, Douyin is for short-form video signal monitoring, WeChat is for direct outreach (with strict rate limits), and Xiaoyuzhou is for podcast content monitoring. Enabling any China-region channel requires connecting the corresponding API credentials via the Integrations tab and accepting the additional data residency requirements for Chinese-personal-data processing.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common channel configuration mistake is over-enabling channels in pursuit of breadth, which dilutes the cadence's effectiveness and increases the operational burden on the team. We recommend starting with email and LinkedIn only, then adding phone after 30 days of stable cadence performance. A second common mistake is setting daily sending limits too high to maximize throughput, which triggers spam filter penalties and LinkedIn account flags; the recommended email limit is 50 per rep per day and the recommended LinkedIn limit is 20 per rep per day. The third common mistake is failing to respect timezone, which produces outreach at 3am in the prospect's local timezone and tanks reply rates; the respect_timezone flag should always be enabled for global campaigns.` },
      { type: 'list', items: [
        `Start with email and LinkedIn only; add phone after 30 days of stable performance.`,
        `Keep email daily limit at or below 50 per rep to maintain sending reputation.`,
        `Keep LinkedIn daily limit at or below 20 per rep to avoid account flags.`,
        `Set max_total_daily_outreach_per_rep to 100 to cap combined outreach.`,
        `Set min_gap_minutes_between_touches to 60 to prevent awkward double-touches.`,
        `Always enable respect_timezone for global campaigns to maintain reply rates.`,
        `Monitor per-channel health indicators weekly and pause channels with critical issues.`,
      ]},
      { type: 'callout', variant: 'warning', content: `LinkedIn enforces strict rate limits on connection requests and messages, with violations resulting in account restrictions that can take up to 30 days to resolve. The platform defaults to 20 connection requests and 20 messages per rep per day, which is within LinkedIn's published rate limits. Do not exceed 25 of either per day, and do not enable LinkedIn outreach for campaigns with under 200 monthly accepted leads, because the low volume signals spam-like behavior to LinkedIn's detection systems.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If a channel shows a critical health indicator, the most common cause is an expired or revoked API credential. Open the Integrations tab and re-authorize the channel; the platform surfaces the exact error message from the channel provider, which helps diagnose whether the issue is credential expiry, rate limiting, or account suspension. The second most common cause is exceeding the daily sending limit, which triggers a temporary cooldown of 60 minutes; the platform surfaces this in the channel health indicator and automatically resumes after the cooldown. The third most common cause is a high bounce rate above 5 percent, which triggers a defensive pause on the email channel to protect your sending reputation; investigate the bounce rate via the Email Health dashboard and resolve before resuming.` },
      { type: 'callout', variant: 'info', content: `The Email Health dashboard under the Integrations tab surfaces the current bounce rate, complaint rate, and inbox placement rate per mailbox. Inbox placement below 90 percent indicates a deliverability issue that should be resolved before continuing outreach; the dashboard provides specific remediation steps based on the root cause, which is typically a missing DMARC record, a low sender reputation score, or a content filter trigger.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether you can add custom channels not in the platform's catalog, how the platform handles LinkedIn's connection request limits, and whether the China-region channels can be used for non-Chinese ICPs. Custom channels can be added on Enterprise tiers via the Custom Channels panel in the Settings page; the platform supports webhook-based custom channels that send outreach payloads to an external endpoint, which is useful for proprietary messaging platforms or internal communication tools. LinkedIn's connection request limit is enforced by the platform at 20 per rep per day by default, with a hard cap at 25; the platform also enforces a 24-hour cooldown between connection requests to the same prospect, which prevents duplicate requests. For teams that want to scale LinkedIn outreach beyond the per-rep rate limits, the platform supports a multi-account LinkedIn configuration where each rep can connect up to 3 LinkedIn accounts to the platform, with the cadence execution engine distributing outreach across the connected accounts. The multi-account configuration increases per-rep LinkedIn capacity to 60 connection requests and 60 messages per day while remaining within LinkedIn's aggregate rate limits, but requires careful monitoring to avoid LinkedIn account restrictions. We recommend enabling multi-account LinkedIn only on teams with at least 5 SDRs and a dedicated sales ops resource for monitoring, because the operational overhead of managing multiple accounts per rep can erode the throughput gains if not actively managed.` },
      { type: 'paragraph', content: `Another frequent question is whether the China-region channels can be used for non-Chinese ICPs. The answer is technically yes but operationally discouraged, because the China-region channels are calibrated for Chinese-language content and Chinese-personal-data processing, which means they produce lower-quality results for non-Chinese companies. We recommend using the China-region channels only for ICPs that target companies headquartered in China or with significant Chinese operations. The platform surfaces a warning if you enable China-region channels for ICPs that do not include China in their geography configuration.` },
      { type: 'paragraph', content: `A final consideration is the operational overhead of each channel you enable. Email is the lowest-overhead channel because it requires only SMTP credentials and runs fully automated through the cadence; the operational cost is roughly 5 minutes per rep per week to monitor bounces and complaints. LinkedIn is medium-overhead because it requires manual acceptance of connection responses and personalized replies to messages; the operational cost is roughly 30 minutes per rep per week to manage LinkedIn engagement. Phone is the highest-overhead channel because each cold call requires a human rep to dial and handle the conversation; the operational cost is roughly 4 hours per rep per week to make 30 calls per day. When configuring channels, balance the operational capacity of your team against the throughput requirements of your campaign. A typical SDR has capacity for 50 emails per day, 20 LinkedIn messages per day, and 30 calls per day, which collectively support a 7-touch cadence against 30 to 40 simultaneous leads per SDR. If your campaign targets more than 40 simultaneous leads per SDR, you are over-loading your reps and the cadence will suffer; either reduce the accepted lead count or add more SDRs to the campaign. The platform surfaces a Capacity Utilization indicator on the campaign dashboard that shows the current SDR-to-lead ratio and flags any campaign exceeding 40 leads per SDR with a yellow warning.` },
      { type: 'divider' },
      { type: 'quote', content: `Channels are the surface area of your outreach. Choose them carefully, because each channel adds operational complexity and risk.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 12. PIPELINE STAGE DEFINITIONS
  // ---------------------------------------------------------------------------
  {
    slug: 'campaign-pipeline',
    title: 'Pipeline Stage Definitions',
    description: 'Define the pipeline stages that leads move through during the 14-day cadence, including SLAs and stage transition rules.',
    category: 'Getting Started',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Pipeline stage definitions are the runtime state machine that the Pipeline Manager agent (Flow) uses to track each lead's progression through the 14-day, 7-touch cadence. Each lead enters the pipeline at the "introduced" stage when the first touchpoint is sent and progresses through stages as touchpoints are delivered and replies are detected. The default pipeline includes seven stages: introduced, engaged, qualified, meeting_scheduled, meeting_held, closed_won, and closed_lost. The platform supports custom stages for campaigns that require a more granular state machine, with up to 15 stages per campaign. Each stage has an associated SLA that governs the maximum time a lead can remain in the stage before the platform surfaces a stall warning.` },
      { type: 'paragraph', content: `Pipeline stage configuration is what allows the Report Generator agent (Echo) to produce accurate campaign performance summaries including stage-by-stage conversion rates, average time in stage, and stage-specific SLA compliance. A well-configured pipeline produces clean reporting that lets you identify bottlenecks (for example, leads stalling in the "engaged" stage for more than 7 days indicates a content gap in the cadence) and focus your optimization efforts. The default pipeline is calibrated for B2B SaaS campaigns and is appropriate for most first-time campaigns; custom pipelines are recommended only for teams with mature sales processes that have specific stage requirements beyond the defaults.` },
      { type: 'heading', level: 2, content: 'Step-by-Step: Configuring Pipeline Stages' },
      { type: 'paragraph', content: `The pipeline configuration panel is the fifth step of the campaign creation wizard and is also accessible from the campaign's settings panel after launch. The panel displays the current pipeline stages in a flow diagram with stage names, SLAs, and transition rules. The default pipeline is pre-loaded for new campaigns and can be customized by adding, removing, or renaming stages, and by adjusting the SLAs and transition rules. The platform validates the pipeline as a directed acyclic graph, meaning stages cannot form cycles and every stage must have a defined transition path to either closed_won or closed_lost.` },
      { type: 'steps', items: [
        `Open the campaign creation wizard or navigate to an existing campaign's settings panel and click the Pipeline tab.`,
        `Review the default pipeline stages. The default is introduced, engaged, qualified, meeting_scheduled, meeting_held, closed_won, closed_lost.`,
        `Customize stage names if your sales process uses different terminology. The platform preserves the stage IDs internally and only changes the display names, so reports remain comparable across renames.`,
        `Adjust the SLA for each stage by entering the maximum days a lead can remain in the stage before a stall warning is triggered. The default SLA is 3 days for introduced, 5 days for engaged, 7 days for qualified, and 14 days for meeting_scheduled and meeting_held.`,
        `Configure transition rules by specifying which events trigger stage transitions. The default rules are: reply triggers transition to engaged; positive reply triggers transition to qualified; meeting booking triggers transition to meeting_scheduled; meeting completion triggers transition to meeting_held.`,
        `Add custom stages if your sales process requires them. Common additions include "demo_scheduled" between qualified and meeting_scheduled, and "verbal_commit" between meeting_held and closed_won.`,
        `Save the pipeline configuration. The platform validates the directed acyclic graph and surfaces any cycle errors or orphaned stages before letting you proceed.`,
      ]},
      { type: 'paragraph', content: `After saving, the panel shows the active pipeline configuration along with the projected stage distribution for your campaign. The projection is based on historical conversion data from the platform's customer base and is shown as a funnel diagram with the percentage of leads expected to reach each stage. A well-calibrated campaign produces a funnel where 30 to 40 percent of accepted leads reach engaged, 15 to 25 percent reach qualified, 8 to 15 percent reach meeting_scheduled, 5 to 10 percent reach meeting_held, and 1 to 3 percent reach closed_won. If your projected funnel skews significantly outside these ranges, your ICP may be mis-calibrated for your close rate expectations.` },
      { type: 'heading', level: 2, content: 'Pipeline Configuration Schema' },
      { type: 'paragraph', content: `The pipeline configuration is serialized as a structured JSON document with a stages array and a transitions array. Each stage has an ID, a display name, an SLA in days, and a category (active, won, lost). Each transition has a from_stage, a to_stage, and a trigger event. The schema below is the default pipeline configuration for a B2B SaaS campaign, with seven stages and six transitions.` },
      { type: 'code', language: 'json', caption: 'Default pipeline configuration for B2B SaaS campaigns', code: `{
  "pipeline": {
    "stages": [
      { "id": "introduced", "name": "Introduced", "sla_days": 3, "category": "active" },
      { "id": "engaged", "name": "Engaged", "sla_days": 5, "category": "active" },
      { "id": "qualified", "name": "Qualified", "sla_days": 7, "category": "active" },
      { "id": "meeting_scheduled", "name": "Meeting Scheduled", "sla_days": 14, "category": "active" },
      { "id": "meeting_held", "name": "Meeting Held", "sla_days": 14, "category": "active" },
      { "id": "closed_won", "name": "Closed Won", "sla_days": null, "category": "won" },
      { "id": "closed_lost", "name": "Closed Lost", "sla_days": null, "category": "lost" }
    ],
    "transitions": [
      { "from": "introduced", "to": "engaged", "trigger": "reply_received" },
      { "from": "engaged", "to": "qualified", "trigger": "positive_reply" },
      { "from": "qualified", "to": "meeting_scheduled", "trigger": "meeting_booked" },
      { "from": "meeting_scheduled", "to": "meeting_held", "trigger": "meeting_completed" },
      { "from": "meeting_held", "to": "closed_won", "trigger": "deal_won" },
      { "from": "meeting_held", "to": "closed_lost", "trigger": "deal_lost" }
    ]
  }
}` },
      { type: 'paragraph', content: `The category field accepts "active", "won", or "lost"; active stages are where leads in flight reside, won stages represent successful closure, and lost stages represent failure to convert. The SLA field accepts null for terminal stages (closed_won and closed_lost) which do not have a maximum duration. The trigger field accepts a set of platform-defined event names including reply_received, positive_reply, meeting_booked, meeting_completed, deal_won, deal_lost, and stage_timeout (which fires when the SLA expires). Custom triggers can be defined via webhooks for Enterprise tiers.` },
      { type: 'heading', level: 3, content: 'Default Pipeline Stages Reference' },
      { type: 'paragraph', content: `The table below summarizes the seven default pipeline stages, their SLAs, and the trigger events that transition leads into each stage. The default pipeline is calibrated for B2B SaaS campaigns with a 14-day cadence; longer cadences (21 or 28 days) typically require longer SLAs in the engaged and qualified stages to avoid false stall warnings. The platform surfaces stall warnings in the Pipeline Manager dashboard and in daily email summaries sent to the campaign owner.` },
      { type: 'table', caption: 'Default pipeline stages and their characteristics', headers: ['Stage', 'SLA (days)', 'Entry Trigger', 'Category'], rows: [
        ['Introduced', '3', 'First touchpoint sent', 'Active'],
        ['Engaged', '5', 'Reply received from prospect', 'Active'],
        ['Qualified', '7', 'Positive reply received', 'Active'],
        ['Meeting Scheduled', '14', 'Meeting booked', 'Active'],
        ['Meeting Held', '14', 'Meeting completed', 'Active'],
        ['Closed Won', 'No SLA', 'Deal closed won', 'Won'],
        ['Closed Lost', 'No SLA', 'Deal closed lost', 'Lost'],
      ]},
      { type: 'paragraph', content: `The SLA for the Introduced stage is set to 3 days because most B2B SaaS prospects reply within 3 days of receiving the first touchpoint if they are going to reply at all; leads remaining in Introduced for more than 3 days typically require a follow-up touchpoint (which is sent automatically by the cadence) rather than a manual intervention. The SLA for the Engaged stage is 5 days because engaged prospects typically require a few days to evaluate the value proposition before either requesting a meeting or going silent. The 14-day SLAs for Meeting Scheduled and Meeting Held reflect the typical 1 to 2 week delay between booking a meeting and holding it.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common pipeline configuration mistake is adding too many custom stages in pursuit of granularity, which makes reporting noisy and SLA enforcement brittle. We recommend using the default seven stages for your first campaign and only adding custom stages when you have clear evidence that the default stages are insufficient. A second common mistake is setting SLAs too aggressively, which produces false stall warnings that erode trust in the system; the default SLAs are calibrated to surface real stalls without overwhelming the team. The third common mistake is failing to configure stage transitions correctly, which leaves leads stuck in stages that should have transitioned automatically; use the pipeline validation tool to confirm that every stage has a defined transition path.` },
      { type: 'list', items: [
        `Use the default seven stages for your first campaign; add custom stages only with clear evidence.`,
        `Keep SLAs at the defaults; aggressive SLAs produce false stall warnings that erode trust.`,
        `Run the pipeline validation tool after any change to confirm transitions are complete.`,
        `Review the stall warnings dashboard daily and act on real stalls within 24 hours.`,
        `Use the funnel projection to set realistic close rate expectations with stakeholders.`,
        `Customize stage display names to match your CRM terminology to ease integration.`,
        `Reserve closed_won and closed_lost for terminal states; do not add stages after them.`,
      ]},
      { type: 'callout', variant: 'info', content: `The pipeline stage transition rules are evaluated by the Pipeline Manager agent in real time as events arrive from the cadence execution engine. The agent applies the first matching transition rule, which means rule ordering matters for transitions with overlapping triggers. The platform surfaces a warning if two transition rules from the same stage have overlapping triggers, which is a common source of stuck leads.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If leads appear stuck in a stage beyond the SLA, the most likely cause is a missing transition rule for the event that should have triggered the transition. Open the pipeline configuration panel and verify that every stage has a transition to the next expected stage, and that the trigger events match the events that the cadence execution engine is producing. The second most likely cause is a transition rule ordering issue, where an earlier rule consumes an event that should have been consumed by a later rule; reorder the rules so that more specific triggers come before more general triggers. The third most likely cause is a webhook integration failure that prevents the meeting_booked or deal_won event from reaching the Pipeline Manager; check the webhook delivery logs in the Integrations tab.` },
      { type: 'callout', variant: 'tip', content: `The pipeline configuration panel includes a "Pipeline simulator" tool that lets you test your transition rules against a sample lead lifecycle. Enter a sequence of events (such as reply_received, meeting_booked, meeting_completed, deal_won) and the simulator will show the stage transitions and surface any rule evaluation issues. Run the simulator after any pipeline change to catch rule ordering and coverage issues before they affect production leads.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether pipeline stages can be edited after a campaign is launched, whether custom triggers can be defined, and how pipeline stages map to CRM stages. Pipeline stages can be edited after launch, but only display names and SLAs are editable; structural changes (adding or removing stages, changing transitions) require pausing the campaign and applying the changes to in-flight leads, which is destructive. Custom triggers can be defined via webhooks for Enterprise tiers; the webhook sends an event payload to the Pipeline Manager agent, which evaluates it against your custom transition rules. CRM stage mapping is configured on the Integrations tab per CRM instance; the platform maps each LeadReach AI pipeline stage to a CRM stage by ID, which keeps the two systems in sync bidirectionally.` },
      { type: 'paragraph', content: `Another frequent question is what happens to leads in a stage that is removed from the pipeline. The platform preserves such leads in their current stage and surfaces them in a "Orphaned leads" view in the Pipeline Manager dashboard; the leads can be manually transitioned to a remaining stage via the bulk action toolbar. We recommend resolving all orphaned leads before resuming the campaign, because they will not progress through the cadence without manual intervention. Finally, the pipeline configuration is versioned alongside the campaign configuration, so historical reports always reflect the pipeline as it was at the time the leads were in flight.` },
      { type: 'paragraph', content: `A final consideration is the relationship between pipeline stages and your CRM pipeline stages. The platform's default stage names (Introduced, Engaged, Qualified, Meeting Scheduled, Meeting Held, Closed Won, Closed Lost) are calibrated for B2B SaaS sales motions but may not match your CRM's stage terminology. The platform supports custom display names that map to the platform's internal stage IDs, so you can rename Meeting Scheduled to Demo Booked to match your CRM without breaking the underlying pipeline logic. We recommend keeping the underlying stage IDs intact (which the platform does automatically when you rename) and only changing the display names, because the IDs are referenced in reports, audit logs, and webhook payloads. Changing the underlying IDs requires a destructive migration that pauses the campaign and re-migrates all historical leads, which we recommend avoiding unless absolutely necessary. For teams using a sales methodology like MEDDIC or BANT, the platform supports methodology-specific stage templates that pre-map the platform's stages to the methodology's qualifiers; the templates are accessible from the Pipeline tab's template selector and can be customized further after loading. Methodology-specific templates typically produce cleaner reporting because the stage names align with the qualifiers your sales team is trained to use.` },
      { type: 'divider' },
      { type: 'quote', content: `The pipeline is the spine of your campaign. Get the stages right and the cadence executes cleanly; get them wrong and leads fall through the cracks.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 13. APPROVAL WORKFLOWS
  // ---------------------------------------------------------------------------
  {
    slug: 'campaign-approvals',
    title: 'Approval Workflows',
    description: 'Configure approval workflows that gate which leads enter the cadence, including approver roles, score thresholds, and escalation rules.',
    category: 'Getting Started',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Approval workflows are the quality control gate that determines which discovered leads enter the 14-day, 7-touch cadence. Each campaign can be configured with one of three approval modes: manual (every lead requires explicit approval before entering the cadence), auto (no leads require approval; all accepted leads enter the cadence immediately), or threshold (leads scoring above a configurable threshold bypass approval; the rest require approval). The default mode is manual, which is the recommended starting point for new campaigns because it maintains quality control while the team calibrates its ICP and cadence. Once your team's acceptance rate has stabilized above 70 percent for two consecutive months, switching to threshold mode typically improves throughput by 30 to 40 percent without sacrificing quality.` },
      { type: 'paragraph', content: `Approval workflows are executed by the Pipeline Manager agent (Flow) in coordination with the Orchestrator agent (Atlas). When a lead is accepted into a campaign with manual or threshold approval, the Pipeline Manager routes the lead to the configured approver queue and sends a notification to the assigned approver. The approver can approve, reject, or request more information from the lead card in the Leads inbox; approvals route the lead into the cadence, rejections archive the lead and feed it back into the Lead Qualification agent's calibration set, and requests for more information route the lead back to the Data Enrichment agent for additional enrichment. The platform tracks every approval decision in the audit log with the approver's user ID, the decision, the timestamp, and an optional reason field.` },
      { type: 'heading', level: 2, content: 'Step-by-Step: Configuring Approval Workflows' },
      { type: 'paragraph', content: `The approval configuration panel is the sixth step of the campaign creation wizard and is also accessible from the campaign's settings panel after launch. The panel displays the current approval mode, the approver queue, the score threshold (for threshold mode), and the escalation rules. The default mode is manual with the campaign creator as the sole approver; we recommend adding at least one backup approver for any campaign that will process more than 100 leads per month, to prevent approval delays from blocking the cadence.` },
      { type: 'steps', items: [
        `Open the campaign creation wizard or navigate to an existing campaign's settings panel and click the Approvals tab.`,
        `Select the approval mode: manual, auto, or threshold. For your first campaign, use manual; switch to threshold after 60 days of stable acceptance rate.`,
        `Configure the approver queue by adding user IDs. The platform supports up to 5 approvers per campaign; leads are routed to approvers in round-robin order to balance the workload.`,
        `For threshold mode, set the auto-approve threshold. The default is 90 (super_hot range); leads scoring above this threshold bypass approval and enter the cadence immediately.`,
        `Configure escalation rules by specifying the maximum hours an approval can remain pending before escalating. The default is 24 hours; the escalation routes the approval to the campaign owner with a high-priority notification.`,
        `Optionally configure a second approver for leads above a configurable score threshold. This is useful for high-value deals where two reviewers should sign off on each lead.`,
        `Save the approval configuration. The platform validates the approver queue is non-empty for manual and threshold modes, and surfaces a warning if the queue contains users without approval permissions.`,
      ]},
      { type: 'paragraph', content: `After saving, the panel shows the active approval configuration along with the projected approval throughput and the projected approval delay. Approval throughput is the number of approvals per approver per day based on historical data; the platform's median is 30 approvals per approver per day, with the top quartile achieving 50. Approval delay is the time from lead acceptance to cadence entry; the platform's median is 4 hours in manual mode and 0 hours in auto mode, with the 90th percentile at 18 hours. If your projected approval delay exceeds 24 hours, consider adding more approvers or switching to threshold mode.` },
      { type: 'heading', level: 2, content: 'Approval Configuration Schema' },
      { type: 'paragraph', content: `The approval configuration is serialized as a nested JSON object with the mode, approvers, threshold, and escalation fields. The schema below is a representative configuration for a B2B SaaS campaign using threshold mode with two approvers, a 90-point auto-approve threshold, and 24-hour escalation to the campaign owner.` },
      { type: 'code', language: 'json', caption: 'Example approval configuration for B2B SaaS campaign with threshold mode', code: `{
  "approval": {
    "mode": "threshold",
    "approvers": [
      { "user_id": "user_01HZXK8F", "role": "primary" },
      { "user_id": "user_01HZXK9G", "role": "backup" }
    ],
    "threshold": {
      "auto_approve_score": 90,
      "second_approver_score": 95
    },
    "escalation": {
      "max_pending_hours": 24,
      "escalate_to_user_id": "user_01HZXK7E",
      "notification_priority": "high"
    },
    "round_robin": true,
    "reason_required_on_reject": true
  }
}` },
      { type: 'paragraph', content: `The second_approver_score field is optional and configures a second approval requirement for leads above the specified score; this is useful for high-value deals where two reviewers should sign off. The round_robin flag toggles between round-robin routing (default, true) and least-loaded routing (false); round-robin distributes approvals evenly across approvers, while least-loaded routes to the approver with the fewest pending approvals, which can produce faster turnaround on low-volume campaigns. The reason_required_on_reject flag enforces that rejections include a reason field, which improves the quality of the Lead Qualification agent's calibration data by providing labeled negative examples.` },
      { type: 'heading', level: 3, content: 'Approval Roles Reference' },
      { type: 'paragraph', content: `The table below summarizes the three approval roles, their permissions, and their typical use case. The roles are configured at the workspace level via the Team Settings page and can be assigned to any user with a paid seat. The campaign-level approver queue references users by their user IDs, which are stable across role changes; if a user's role is downgraded, they retain their existing approvals but cannot accept new ones.` },
      { type: 'table', caption: 'Approval roles and their permissions', headers: ['Role', 'Permissions', 'Typical Use Case'], rows: [
        ['Approver', 'Approve, reject, request info', 'Daily lead triage by SDR team lead'],
        ['Senior Approver', 'Approve, reject, request info, override', 'High-value deal sign-off by Sales Director'],
        ['Campaign Owner', 'All approver permissions + config', 'Campaign setup and escalation target'],
      ]},
      { type: 'paragraph', content: `The Approver role is the standard role for daily lead triage; users with this role can approve, reject, or request more information on any lead routed to them, but cannot override a rejection by another approver or modify the campaign configuration. The Senior Approver role adds the override permission, which lets them reverse a rejection by another approver; this is useful for high-value deals where the senior approver wants to override a junior approver's rejection. The Campaign Owner role has all approver permissions plus the ability to modify the campaign configuration and is the default escalation target; we recommend assigning the Campaign Owner role to the user who created the campaign or to a designated team lead.` },
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'paragraph', content: `The most common approval configuration mistake is enabling auto mode too early in the campaign lifecycle, which removes the quality control gate and erodes the team's calibration loop. We recommend keeping manual mode for the first 60 days of any new campaign, then switching to threshold mode after 60 days of stable acceptance rate above 70 percent. A second common mistake is configuring a single approver without a backup, which creates a single point of failure; the approver's vacation or illness blocks the cadence for the duration. The third common mistake is setting the escalation timeout too high, which allows pending approvals to stack up and overwhelms the escalation target; the default 24 hours is appropriate for most campaigns, with 12 hours recommended for high-velocity campaigns.` },
      { type: 'list', items: [
        `Use manual mode for the first 60 days; switch to threshold after stable acceptance rate.`,
        `Configure at least two approvers to avoid single points of failure.`,
        `Set the auto-approve threshold at 90 for steady-state; lower to 80 for high-velocity.`,
        `Use 24-hour escalation for steady-state; 12-hour for high-velocity campaigns.`,
        `Enable reason_required_on_reject to improve calibration data quality.`,
        `Assign the Campaign Owner role to the user who created the campaign.`,
        `Use round_robin routing for even workload distribution across approvers.`,
      ]},
      { type: 'callout', variant: 'danger', content: `Auto-approval mode removes the quality control gate entirely and routes every accepted lead into the cadence without human review. We strongly recommend against using auto mode for any campaign, because it bypasses the calibration loop that the Lead Qualification agent depends on for continuous improvement. If you need maximum throughput, use threshold mode with a low threshold (such as 70) instead, which preserves the calibration loop for lower-scoring leads while still auto-routing high-quality leads.` },
      { type: 'heading', level: 2, content: 'Troubleshooting' },
      { type: 'paragraph', content: `If approvals are stacking up in the pending queue, the most likely cause is insufficient approver capacity; either add more approvers to the queue or switch to threshold mode to reduce the manual approval burden. The second most likely cause is a missing escalation target, which prevents pending approvals from escalating after the timeout; verify that the escalate_to_user_id field is set to a valid user with the Campaign Owner role. The third most likely cause is a notification delivery failure, which prevents approvers from receiving the pending approval notification; check the notification delivery logs in the Settings page and verify that email and in-app notification channels are both enabled for each approver.` },
      { type: 'callout', variant: 'tip', content: `The approval queue's bulk action toolbar supports approving or rejecting up to 50 leads at once with a shared reason. Use the bulk action for routine approvals (leads scoring 80 to 90 that match the ICP cleanly) and reserve individual review for borderline leads (scoring 70 to 80 or with field mismatches). This pattern reduces the average approval time from 90 seconds per lead to 15 seconds per lead for routine cases.` },
      { type: 'heading', level: 2, content: 'Frequently Asked Questions' },
      { type: 'paragraph', content: `Common questions include whether approvals can be delegated, whether rejected leads can be reinstated, and what audit trail is preserved for approval decisions. Approval delegation is supported via the Team Settings page; a user can delegate their approvals to another user for a specified date range, which is useful for vacations and conferences. Rejected leads can be reinstated from the archived view within 30 days of rejection, after which they are permanently deleted; reinstated leads re-enter the cadence at the introduced stage. The audit trail preserves the approver's user ID, the decision, the timestamp, the reason field (if provided), and the lead's score at the time of the decision, with a 7-year retention window on Enterprise tiers to support compliance requirements in regulated industries.` },
      { type: 'paragraph', content: `Another frequent question is whether approval workflows can be customized beyond the three modes. The answer is yes via the Custom Workflows panel on Enterprise tiers, which lets you define multi-step approval processes (such as SDR approval followed by Sales Director approval for leads above 95) and conditional routing based on enrichment fields (such as routing leads in the financial services industry to a specialized approver). Custom workflows use a visual editor that produces a JSON configuration compatible with the standard approval schema, so they remain version-controlled and exportable. We recommend starting with the standard modes and only adopting custom workflows once your team has clear evidence that the standard modes are insufficient.` },
      { type: 'paragraph', content: `A final consideration is the audit trail that approval workflows produce, which is critical for regulated industries and for any team that operates under a sales quality framework such as MEDDIC or BANT. The platform's audit log preserves every approval decision with the approver's user ID, the decision (approve, reject, request_info, override), the timestamp, the lead's score at the time of the decision, the enrichment payload snapshot at the time of the decision, and the optional reason field. This audit trail is queryable via the Audit Log tab and is exportable as CSV for compliance reporting; on Enterprise tiers, the audit log is also streamable via webhook to a SIEM system for real-time monitoring. For teams operating under SOC 2 or ISO 27001 frameworks, the audit trail satisfies the change management control requirement that all decisions affecting production data be attributed to a named individual with a timestamp and reason. We recommend reviewing the audit trail weekly to identify patterns in approval decisions, such as approvers who consistently reject leads above the auto-approve threshold (which suggests the threshold is mis-calibrated) or approvers who consistently approve leads below the typical acceptance threshold (which suggests the approver is rubber-stamping without due diligence). Both patterns indicate calibration issues that should be addressed through training or through threshold adjustments, and the audit trail's queryable format makes pattern detection straightforward with the platform's built-in approver analytics dashboard.` },
      { type: 'divider' },
      { type: 'quote', content: `Approval is the last gate before your team's reputation meets the prospect. Configure it with rigor, because every approved lead is a representative of your brand.` },
    ],
  },
];

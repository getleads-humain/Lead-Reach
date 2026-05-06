# Report Generator Agent — Skills

## Core Skills

### Prospect Spreadsheet Generation
- **Trigger**: User requests lead export or campaign deliverable
- **Input**: Campaign ID, filter criteria, column selection
- **Output**: XLSX or CSV file with all prospect data and KPIs
- **Method**: Query Prisma database, format data, generate spreadsheet via exceljs or similar
- **Columns**: Company Name, Industry, Address, Phone, Email, Website, Employee Count, Revenue, Score, Tier, Stage

### Campaign Performance Report
- **Trigger**: User requests campaign summary or scheduled report
- **Input**: Campaign ID, date range
- **Output**: PDF report with metrics, charts, and recommendations
- **Method**: Aggregate campaign metrics, generate charts, compose PDF
- **Metrics**: Total leads, qualification rate, outreach stats, response rate, pipeline value

### Pipeline Health Dashboard Data
- **Trigger**: User views pipeline dashboard or requests health check
- **Input**: Campaign ID or all campaigns
- **Output**: Pipeline metrics and stage distribution data
- **Method**: Real-time aggregation queries on Prisma database
- **Data**: Stage counts, conversion rates, average time per stage, forecast value

### Custom Data Export
- **Trigger**: User requests specific data in specific format
- **Input**: Field selection, filters, sort order, format (XLSX/CSV/JSON)
- **Output**: Formatted export file
- **Method**: Dynamic query building based on user selections, format conversion

### CRM-Compatible Export
- **Trigger**: User needs to import leads into CRM (Salesforce, HubSpot, Pipedrive)
- **Input**: Target CRM, lead data, field mapping preferences
- **Output**: CRM-compatible CSV with mapped columns
- **Method**: Pre-built field mapping templates for popular CRMs, custom mapping support
- **Supported CRMs**: Salesforce, HubSpot, Pipedrive, Zoho, Custom

### Scheduled Report Delivery
- **Trigger**: Scheduled time reached
- **Input**: Report template, schedule configuration, delivery channels
- **Output**: Generated report delivered via email or dashboard notification
- **Method**: Cron-based scheduling with template rendering
- **Schedules**: Daily summary, Weekly deep-dive, Monthly review

### Data Formatting & Validation
- **Trigger**: Before any report generation
- **Input**: Raw data from database
- **Output**: Cleaned, formatted, validated data ready for export
- **Method**: Type coercion, format standardization, null handling, duplicate check
- **Validations**: Email format, phone format, URL format, number ranges

## Tool Access
- Prisma database (data source for all reports)
- LLM API (for report narrative generation and recommendations)
- No direct Agent-Reach access (operates on collected data)

## Execution Engine Integration

**Runtime Handler**: `executeReportGenerator()` in `src/lib/agent-executor.ts`

This agent is executed at runtime by the Agent Execution Engine. When a task is dispatched to this agent:

1. The engine calls the agent's handler function
2. The handler queries the database (Prisma) for campaign and pipeline data
3. LLM (z-ai-web-dev-sdk) is used for report narrative generation, recommendations, and data synthesis
4. Results are stored in the database (leads, outreach, task output)

**Agent-Reach Bridge Functions Used**:
- None — this agent operates exclusively on database operations and LLM analysis

**API Dispatch**:
```
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "report-generator",
  "taskType": "report",
  "input": { "query": "...", "industry": "...", "location": "..." }
}
```

**Or via AI Chat**:
```
POST /api/ai
{ "message": "Find accounting firms in Dubai" }
```
→ AI parses intent → Dispatches to this agent → Database queries + LLM analysis → Reports generated and stored

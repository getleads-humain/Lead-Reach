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

# Pipeline Manager Agent — Skills

## Core Skills

### Lead Status Management
- **Trigger**: Any pipeline event (new lead, enrichment complete, outreach sent, etc.)
- **Input**: Lead ID, event type, event data
- **Output**: Updated lead status, triggered actions, notifications
- **Method**: State machine with defined transitions and side effects
- **Database**: Prisma for persistent lead state

### Stage Transition Processing
- **Trigger**: Condition met for stage advancement or regression
- **Input**: Current stage, target stage, transition reason
- **Output**: Updated lead record, transition log entry, triggered automations
- **Method**: Validate transition is allowed, execute transition, fire post-transition hooks
- **Transitions**: New → Enriched → Qualified → Contacted → Engaged → Negotiating → Closed-Won/Lost

### Follow-Up Scheduling
- **Trigger**: Lead enters a stage requiring follow-up (Contacted, Engaged, Nurture)
- **Input**: Lead ID, outreach sequence, last contact date
- **Output**: Scheduled follow-up tasks with dates, channels, and message templates
- **Method**: Sequence-based scheduling with timezone-aware timing
- **Default Sequences**: Hot (1d, 3d, 7d), Warm (3d, 7d, 14d), Cold (7d, 14d, 30d)

### Engagement Signal Detection
- **Trigger**: Email/webhook event received
- **Input**: Event type (open, click, reply, bounce), lead ID
- **Output**: Updated engagement score, stage transition if applicable, notification
- **Method**: Event processing with score calculation
- **Signal Scoring**: Reply (+30), Click (+15), Open (+5), Bounce (-20)

### Pipeline Analytics Calculation
- **Trigger**: User requests pipeline metrics or scheduled analytics run
- **Input**: Campaign ID, date range
- **Output**: Pipeline metrics — conversion rates, velocity, distribution, forecast
- **Method**: Aggregate queries on lead database, calculated metrics
- **Metrics**: Stage counts, conversion rates, average days per stage, forecast value

### Alert & Escalation Management
- **Trigger**: Scheduled check or threshold breach detected
- **Input**: Lead records, pipeline rules
- **Output**: Alert notifications with recommended actions
- **Method**: Rule-based monitoring with configurable thresholds
- **Alert Types**: Overdue follow-up, hot lead going cold, stuck deal, data quality issue

### Data Hygiene & Deduplication
- **Trigger**: Scheduled maintenance or duplicate detection event
- **Input**: Lead database
- **Output**: Duplicate merge suggestions, stale data flags, missing field reports
- **Method**: Fuzzy matching on company name + domain + phone for dedup
- **Hygiene Checks**: Missing email, stale data (>30 days), duplicate detection

## Tool Access
- Prisma database (primary state management)
- Internal message bus (event notifications)
- No direct Agent-Reach access (operates on already-collected data)

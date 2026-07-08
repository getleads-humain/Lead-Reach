---
title: "Slack & Microsoft Teams Integration"
category: integration
grade: A
last_reviewed: 2026-07-08
tags: [slack, teams, notifications, alerts, messaging, real-time]
---

# Slack & Microsoft Teams Integration

## 1. Overview

LeadReach integrates with Slack and Microsoft Teams to deliver real-time notifications about high-value prospect activities, agent insights, and pipeline events directly into team communication channels. This ensures that sales teams never miss critical moments and can take immediate action on AI-identified opportunities.

## 2. Slack Integration

### App Configuration

1. Create Slack App at api.slack.com/apps
2. Enable Incoming Webhooks
3. Enable Bot Token Scopes: `chat:write`, `channels:read`, `groups:read`
4. Install App to Workspace
5. Copy Bot Token (xoxb-) to LeadReach settings
6. Invite @LeadReach bot to desired channels

### Webhook Setup

```json
{
  "channel": "#leadreach-alerts",
  "username": "LeadReach AI",
  "icon_emoji": ":zap:",
  "text": "🔥 Hot Lead Alert"
}
```

### Notification Types

| Notification | Channel | Priority |
|-------------|---------|----------|
| Hot lead identified | #hot-leads | 🔴 Critical |
| ICP score > 85 | #qualified-leads | 🟠 High |
| Trigger event detected | #trigger-events | 🟡 Medium |
| Agent enrichment complete | #enrichment-updates | 🔵 Low |
| Daily pipeline digest | #pipeline-summary | ⚪ Info |
| Deal at risk alert | #deal-risk | 🔴 Critical |

### Message Format

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🔥 Hot Lead: Acme Corp"
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*ICP Score:* 92/100"},
        {"type": "mrkdwn", "text": "*Contact:* Jane Smith, CTO"},
        {"type": "mrkdwn", "text": "*Trigger:* Series C funding announced"},
        {"type": "mrkdwn", "text": "*Est. ACV:* $150K"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "View in LeadReach"},
          "url": "https://app.leadreach.ai/leads/acme-corp"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "Start Outreach"},
          "action_id": "start_outreach"
        }
      ]
    }
  ]
}
```

### Interactive Actions

| Action | Description |
|--------|-------------|
| View in LeadReach | Opens lead profile in browser |
| Start Outreach | Triggers Bard agent to begin sequence |
| Enrich Contact | Triggers Forge agent for additional data |
| Schedule Meeting | Opens calendar booking flow |
| Dismiss | Marks alert as reviewed |

## 3. Microsoft Teams Integration

### App Registration

1. Register app in Azure AD > App Registrations
2. Configure redirect URI: `https://app.leadreach.ai/api/integrations/teams/callback`
3. Add API permissions: `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChatMessage.Send`
4. Grant admin consent
5. Copy Application ID and Secret to LeadReach settings

### Webhook (Incoming Webhook)

1. In Teams channel, click ... > Connectors > Incoming Webhook
2. Name: "LeadReach AI"
3. Copy webhook URL to LeadReach settings

### Adaptive Card Format

```json
{
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "Container",
      "style": "emphasis",
      "items": [
        {
          "type": "ColumnSet",
          "columns": [
            {
              "type": "Column",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "🔥 Hot Lead Alert",
                  "weight": "Bolder",
                  "size": "Large"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "FactSet",
      "facts": [
        {"title": "Company", "value": "Acme Corp"},
        {"title": "ICP Score", "value": "92/100"},
        {"title": "Contact", "value": "Jane Smith, CTO"},
        {"title": "Trigger", "value": "Series C funding"},
        {"title": "Est. ACV", "value": "$150K"}
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "View in LeadReach",
      "url": "https://app.leadreach.ai/leads/acme-corp"
    }
  ]
}
```

### Channel Routing

| Team | Channel | Alert Type |
|------|---------|------------|
| Sales | hot-leads | ICP > 85 |
| Sales | deal-alerts | Stage changes |
| Marketing | mql-alerts | MQL conversions |
| SDR | prospecting | New prospects |
| Leadership | daily-digest | Summary |

## 4. Alert Configuration

### Routing Rules

```yaml
alert_rules:
  - name: hot_lead
    conditions:
      - icp_score >= 85
      - lead_status == "new"
    channels:
      - slack: "#hot-leads"
      - teams: "Sales>hot-leads"
    priority: critical
    cooldown: 4h  # Don't re-alert for same company within 4h

  - name: trigger_event
    conditions:
      - trigger_type IN [funding, executive_change, expansion]
    channels:
      - slack: "#trigger-events"
    priority: high
    cooldown: 24h

  - name: deal_at_risk
    conditions:
      - deal_stage == "negotiation"
      - days_in_stage > 14
      - no_activity_days > 5
    channels:
      - slack: "#deal-risk"
      - teams: "Sales>deal-risk"
    priority: critical
    cooldown: 0h  # Always alert
```

### Digest Configuration

| Digest | Frequency | Channel | Content |
|--------|-----------|---------|---------|
| Daily Pipeline | 8:00 AM | #pipeline-summary | Pipeline changes, new leads |
| Weekly Performance | Monday 9:00 AM | #weekly-review | Agent metrics, KPIs |
| Real-time Hot | Immediate | #hot-leads | ICP > 85 leads |

## 5. Rate Limits

| Platform | Limit | Recommendation |
|----------|-------|---------------|
| Slack Webhook | 1 msg/sec/channel | Batch non-urgent alerts |
| Slack API | 1 req/sec (Tier 2) | Use async posting |
| Teams Webhook | 100 msg/min | Batch within 1-second windows |
| Teams API | 30 req/30sec | Cache channel IDs |

## 6. Setup Guide

### Slack Setup (5 minutes)

1. LeadReach Settings > Integrations > Slack
2. Click "Add to Slack"
3. Select workspace and channels
4. Configure alert routing rules
5. Test with sample notification

### Teams Setup (10 minutes)

1. LeadReach Settings > Integrations > Microsoft Teams
2. Click "Connect Teams"
3. Admin consent for Azure AD app
4. Select team and channels
5. Configure adaptive card templates
6. Test with sample notification

## 7. Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|------------|
| No notifications | Bot not in channel | Invite @LeadReach to channel |
| 403 Forbidden | Missing scope | Re-install with correct scopes |
| Rate limited | Too many messages | Add cooldown rules |
| Card rendering error | Invalid Adaptive Card | Validate JSON schema |
| Duplicate alerts | Missing dedup rule | Add cooldown configuration |

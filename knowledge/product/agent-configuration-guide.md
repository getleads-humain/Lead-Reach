---
title: Agent Configuration Guide
category: product
grade: B
last_reviewed: 2026-07-10
tags: [product, api, configuration, documentation]
---

# Agent Configuration Guide

Detailed guide for configuring each of LeadReach's 8 AI agents to match organizational requirements and GTM strategy. Configuration operates at three levels: organization defaults (apply to all agents), agent-specific settings (override defaults per agent), and scenario-specific rules (override per use case). Each agent has configurable parameters including: operating hours (when the agent is active), action limits (max activities per hour/day), approval requirements (which actions need human approval), escalation rules (conditions that trigger human escalation), and knowledge domain weights (which knowledge categories the agent prioritizes). Agent-specific configurations: Atlas (ICP definition weights, territory scoring model, whitespace detection thresholds), Scout (prospect discovery sources, qualification criteria, enrichment depth), Forge (enrichment providers, data confidence thresholds, update frequency), Sage (research depth, competitive analysis scope, signal detection sensitivity), Judge (qualification framework, scoring weights, advancement criteria), Bard (outreach channels, personalization level, cadence templates), Flow (pipeline stage definitions, exit criteria, velocity targets), and Echo (gap report frequency, quality thresholds, notification rules). Configuration changes are versioned and can be rolled back, with audit logs tracking all changes and their impact on agent performance.


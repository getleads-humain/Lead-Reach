# Orchestrator Agent — Skills

## Core Skills

### Campaign Planning
- **Trigger**: User submits a new campaign brief
- **Input**: Natural language description of target market, geography, industry, and desired data points
- **Output**: Structured campaign plan JSON with tasks, agents, dependencies, and milestones
- **Method**: Uses LLM to parse intent, identify key parameters, and generate execution graph

### Task Decomposition
- **Trigger**: Campaign plan created or intermediate results require follow-up
- **Input**: Campaign plan or partial results
- **Output**: Ordered list of tasks with agent assignments and data dependencies
- **Method**: Dependency graph analysis, resource-aware scheduling

### Agent Coordination
- **Trigger**: Tasks ready for execution
- **Input**: Task queue with priorities and dependencies
- **Output**: Dispatched tasks to appropriate agents, monitored execution
- **Method**: Message bus pub/sub, async task execution with retry logic

### Progress Aggregation
- **Trigger**: Agent completes a task or hits a milestone
- **Input**: Agent status updates, partial results
- **Output**: Merged, deduplicated, validated result sets
- **Method**: Streaming aggregation pipeline, fuzzy dedup on company name/domain

### Adaptive Strategy
- **Trigger**: Intermediate results deviate from targets (too few/many leads, low quality)
- **Input**: Current results vs. campaign targets
- **Output**: Adjusted search parameters, expanded/narrowed criteria, or user clarification request
- **Method**: Threshold-based rules + LLM-assisted strategy adjustment

### Quality Validation
- **Trigger**: Before delivering results to user
- **Input**: Final lead list
- **Output**: Validated list with confidence scores, flagged entries
- **Method**: Email format validation, URL reachability check, data completeness scoring

## Tool Access
- Internal message bus (agent communication)
- Campaign state database (Prisma)
- LLM API (z-ai-web-dev-sdk) for intent parsing and strategy
- No direct Agent-Reach channel access (delegates to specialized agents)

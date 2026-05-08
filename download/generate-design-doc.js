const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TableOfContents,
  PageBreak,
  ShadingType,
  BorderStyle,
  Tab,
  TabStopType,
  TabStopPosition,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  convertInchesToTwip,
  UnderlineType,
  SectionType,
  LevelFormat,
} = require("docx");

// ─── DM-1 Deep Cyan Palette ───────────────────────────────
const C = {
  primary:   "0A1628",
  body:      "1A2B40",
  secondary: "6878A0",
  accent:    "5B8DB8",
  surface:   "F4F8FC",
  white:     "FFFFFF",
  black:     "000000",
  lightGray: "E8EDF3",
  divider:   "B0C4DE",
};

// ─── Font Definitions ──────────────────────────────────────
const F_H = { ascii: "Calibri", eastAsia: "SimHei" };
const F_B = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };

// ─── Line Spacing ──────────────────────────────────────────
const LINE_SPACING = 312; // 1.3x

// ─── Helper: body paragraph ────────────────────────────────
function bodyPara(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(
      new TextRun({
        text,
        font: F_B,
        size: 22, // 11pt
        color: C.body,
      })
    );
  } else if (Array.isArray(text)) {
    text.forEach((t) => {
      if (typeof t === "string") {
        runs.push(
          new TextRun({ text: t, font: F_B, size: 22, color: C.body })
        );
      } else {
        runs.push(
          new TextRun({
            text: t.text,
            font: t.font || F_B,
            size: t.size || 22,
            color: t.color || C.body,
            bold: t.bold || false,
            italics: t.italics || false,
            underline: t.underline ? { type: UnderlineType.SINGLE } : undefined,
          })
        );
      }
    });
  }
  return new Paragraph({
    children: runs,
    spacing: { line: LINE_SPACING, after: 160 },
    alignment: opts.align || AlignmentType.LEFT,
    indent: opts.indent ? { left: opts.indent } : undefined,
  });
}

// ─── Helper: heading paragraph ─────────────────────────────
function headingPara(text, level) {
  const sizes = { 1: 36, 2: 30, 3: 26 };
  const sz = sizes[level] || 26;
  const colors = { 1: C.primary, 2: C.primary, 3: C.accent };
  const clr = colors[level] || C.accent;

  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: F_H,
        size: sz,
        color: clr,
        bold: true,
      }),
    ],
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { line: LINE_SPACING, before: level === 1 ? 400 : 320, after: 200 },
    ...(level === 1
      ? {
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
          },
        }
      : {}),
  });
}

// ─── Helper: bullet item ───────────────────────────────────
function bulletItem(text, level = 0) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(
      new TextRun({ text, font: F_B, size: 22, color: C.body })
    );
  } else if (Array.isArray(text)) {
    text.forEach((t) => {
      if (typeof t === "string") {
        runs.push(
          new TextRun({ text: t, font: F_B, size: 22, color: C.body })
        );
      } else {
        runs.push(
          new TextRun({
            text: t.text,
            font: t.font || F_B,
            size: t.size || 22,
            color: t.color || C.body,
            bold: t.bold || false,
            italics: t.italics || false,
          })
        );
      }
    });
  }
  return new Paragraph({
    children: runs,
    bullet: { level },
    spacing: { line: LINE_SPACING, after: 80 },
    indent: { left: 360 + level * 360 },
  });
}

// ─── Helper: divider line ──────────────────────────────────
function dividerLine() {
  return new Paragraph({
    children: [],
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: C.divider },
    },
  });
}

// ─── Helper: spacer ────────────────────────────────────────
function spacer(h = 200) {
  return new Paragraph({ children: [], spacing: { before: h, after: 0 } });
}

// ─── Helper: accent callout box ────────────────────────────
function calloutBox(text, accentColor = C.accent) {
  return new Paragraph({
    children: [
      new TextRun({
        text: "  " + text,
        font: F_B,
        size: 22,
        color: C.primary,
        italics: true,
      }),
    ],
    spacing: { line: LINE_SPACING, before: 160, after: 160 },
    shading: { type: ShadingType.SOLID, color: C.surface },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: accentColor },
    },
    indent: { left: 200 },
  });
}

// ─── Build Cover Page Section ──────────────────────────────
// R4: Top Color Block recipe
function buildCoverSection() {
  return {
    properties: {
      page: {
        margin: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
    },
    children: [
      // Top color block (R4 recipe)
      new Paragraph({
        children: [],
        spacing: { before: 0, after: 0 },
        shading: { type: ShadingType.SOLID, color: C.primary },
      }),
      // Large colored block area
      ...Array.from({ length: 12 }, () =>
        new Paragraph({
          children: [],
          spacing: { before: 0, after: 0 },
          shading: { type: ShadingType.SOLID, color: C.primary },
        })
      ),
      // Title inside the color block
      new Paragraph({
        children: [
          new TextRun({
            text: "Agent Reach",
            font: F_H,
            size: 72,
            color: C.white,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        shading: { type: ShadingType.SOLID, color: C.primary },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "LeadReach AI",
            font: F_H,
            size: 56,
            color: C.accent,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 0 },
        shading: { type: ShadingType.SOLID, color: C.primary },
      }),
      // Accent divider line in block
      new Paragraph({
        children: [],
        spacing: { before: 200, after: 200 },
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.SOLID, color: C.primary },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent },
        },
      }),
      // Subtitle in block
      new Paragraph({
        children: [
          new TextRun({
            text: "Full System Pipeline Design & Implementation Blueprint",
            font: F_H,
            size: 28,
            color: C.lightGray,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        shading: { type: ShadingType.SOLID, color: C.primary },
      }),
      // Bottom padding of block
      ...Array.from({ length: 8 }, () =>
        new Paragraph({
          children: [],
          spacing: { before: 0, after: 0 },
          shading: { type: ShadingType.SOLID, color: C.primary },
        })
      ),
      // Below the color block - meta lines
      spacer(600),
      new Paragraph({
        children: [
          new TextRun({
            text: "Version 1.0",
            font: F_B,
            size: 24,
            color: C.secondary,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "May 2026",
            font: F_B,
            size: 24,
            color: C.secondary,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Agentic Lead Generation Platform",
            font: F_B,
            size: 24,
            color: C.accent,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
      }),
    ],
  };
}

// ─── Build TOC Section ─────────────────────────────────────
function buildTocSection() {
  return {
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.2),
          right: convertInchesToTwip(1),
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Agent Reach — LeadReach AI  |  System Design",
                font: F_B,
                size: 16,
                color: C.secondary,
                italics: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Page ", font: F_B, size: 16, color: C.secondary }),
              new TextRun({ children: [PageNumber.CURRENT], font: F_B, size: 16, color: C.secondary }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: "Table of Contents",
            font: F_H,
            size: 36,
            color: C.primary,
            bold: true,
          }),
        ],
        spacing: { before: 200, after: 300 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent },
        },
      }),
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3",
      }),
      new Paragraph({
        children: [new PageBreak()],
      }),
    ],
  };
}

// ─── Build Main Content Section ────────────────────────────
function buildContentSection() {
  const children = [];

  // ────────────────────────────────────────────────────────
  // SECTION 1: Executive Summary
  // ────────────────────────────────────────────────────────
  children.push(headingPara("1. Executive Summary", 1));

  children.push(
    bodyPara(
      "Agent Reach (LeadReach AI) is an AI-powered agentic lead generation platform that deploys 8 specialized AI agents working autonomously across 17+ internet channels. The platform transforms a simple search query like \"Marketing Firms in Ontario, Canada\" into a complete pipeline of discovered, enriched, qualified, and engaged leads. This document defines the complete system architecture, the 4-stage autonomous pipeline, agent capabilities, data flows, API contracts, and the real-time transparency layer that lets viewers learn from the agents as they work."
    )
  );

  children.push(spacer(100));

  children.push(
    bodyPara(
      "The system operates on a simple yet powerful principle: when a user creates a campaign, the Orchestrator agent builds an execution plan, and then four pipeline stages execute sequentially — Prospect Discovery, Data Enrichment, Lead Qualification, and Outreach Composition. Each stage is powered by Agent-Reach, a tool bridge that gives every agent real internet access to channels like Jina Reader, Exa Search, LinkedIn, Twitter, Reddit, GitHub, YouTube, and more. A 3-tier resilience architecture ensures that even when primary channels fail, fallback methods kick in automatically so the pipeline NEVER returns zero results."
    )
  );

  children.push(calloutBox("Core Principle: The pipeline NEVER returns zero results — 3-tier resilience guarantees lead discovery under all conditions."));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ────────────────────────────────────────────────────────
  // SECTION 2: System Architecture Overview
  // ────────────────────────────────────────────────────────
  children.push(headingPara("2. System Architecture Overview", 1));

  children.push(
    bodyPara(
      "The platform is built on Next.js 16 with React 19, TypeScript, Tailwind CSS 4, and shadcn/ui for the frontend. The backend uses Next.js API Routes with Prisma ORM and SQLite for data persistence. The agent execution engine runs in a separate Node.js worker process to prevent blocking the main server during long-running pipeline execution. State management uses Zustand for the frontend, while the backend relies on Prisma's database transactions for consistency."
    )
  );

  children.push(spacer(100));

  children.push(headingPara("Layered Architecture", 3));

  children.push(
    bodyPara("The architecture follows a layered design:")
  );

  const layers = [
    { name: "Presentation Layer", desc: "React components, Zustand store — handles UI rendering and client-side state" },
    { name: "API Layer", desc: "Next.js Route Handlers — receives HTTP requests, validates input, delegates to services" },
    { name: "Agent Execution Engine", desc: "agent-executor.ts — orchestrates agent tasks and manages pipeline stages" },
    { name: "Agent-Reach Bridge", desc: "agent-reach-bridge.ts — provides real internet access across 17+ channels" },
    { name: "LLM Layer", desc: "z-ai-web-dev-sdk — powers structured data extraction and content generation" },
  ];

  layers.forEach((l) => {
    children.push(
      bulletItem([
        { text: l.name, bold: true, color: C.primary },
        { text: " — " + l.desc },
      ])
    );
  });

  children.push(spacer(100));

  children.push(
    bodyPara(
      "The Pipeline Worker runs as a child process, spawned by the run-pipeline API endpoint, and updates the database in real-time as each stage progresses. The frontend polls the pipeline-status endpoint every 3 seconds to display live progress."
    )
  );

  children.push(calloutBox("Architecture Pattern: Pipeline Worker isolation ensures the Next.js server remains responsive even during long-running agent executions."));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ────────────────────────────────────────────────────────
  // SECTION 3: The 4-Stage Autonomous Pipeline
  // ────────────────────────────────────────────────────────
  children.push(headingPara("3. The 4-Stage Autonomous Pipeline", 1));

  children.push(
    bodyPara(
      "This is the core of the system. When a campaign is created, four stages execute sequentially, each building on the results of the previous stage:"
    )
  );

  // Stage 1
  children.push(spacer(100));
  children.push(headingPara("Stage 1 — Prospect Discovery", 2));

  children.push(
    bodyPara(
      "The Prospect Discovery agent searches across multiple internet channels simultaneously. It uses the z-ai-web-dev-sdk web_search function as the primary discovery method, firing 3 query variations for maximum coverage. It also searches LinkedIn company pages and Reddit in parallel. Raw search results are collected, deduplicated by URL, and then fed to the LLM for structured extraction — turning unstructured web snippets into clean company records with fields like companyName, website, industry, city, country, phone, email, and LinkedIn URL."
    )
  );

  children.push(spacer(60));
  children.push(headingPara("3-Tier Fallback for Discovery", 3));
  children.push(bulletItem("Tier 1: Primary — z-ai-web-dev-sdk web_search with 3 query variations"));
  children.push(bulletItem("Tier 2: LLM Knowledge Generation — the LLM generates a list of real companies based on its training data"));
  children.push(bulletItem("Tier 3: Hardcoded Industry Data — pre-loaded lists of real companies for common industry/location combinations"));

  children.push(calloutBox("If all search channels return zero results, a 3-tier fallback activates, ensuring the pipeline NEVER produces zero leads."));

  // Stage 2
  children.push(spacer(100));
  children.push(headingPara("Stage 2 — Data Enrichment", 2));

  children.push(
    bodyPara(
      "The Data Enrichment agent takes each discovered lead and enriches it with deeper data. For each lead, it reads the company website via Jina Reader to extract contact information, employee count, and services. It searches Exa for additional company data, searches LinkedIn for people and company profiles, and searches Twitter for company accounts. All collected data is aggregated and fed to the LLM, which extracts structured enrichment fields including employee count, estimated revenue, key contacts (CEO, CTO, etc.), social media URLs, and specializations."
    )
  );

  children.push(
    bodyPara(
      "Even if a lead has no website or social presence, the LLM generates reasonable estimates based on industry and location, ensuring every lead reaches the enriched stage."
    )
  );

  // Stage 3
  children.push(spacer(100));
  children.push(headingPara("Stage 3 — Lead Qualification", 2));

  children.push(
    bodyPara(
      "The Lead Qualification agent scores each enriched lead against the campaign's Ideal Customer Profile (ICP). The scoring uses four dimensions:"
    )
  );

  children.push(bulletItem([
    { text: "Firmographic Fit ", bold: true, color: C.accent },
    { text: "(0-25) — industry, company size, location match" },
  ]));
  children.push(bulletItem([
    { text: "Intent Signals ", bold: true, color: C.accent },
    { text: "(0-25) — hiring, expansion, technology adoption" },
  ]));
  children.push(bulletItem([
    { text: "Reachability ", bold: true, color: C.accent },
    { text: "(0-25) — available contact info, social presence" },
  ]));
  children.push(bulletItem([
    { text: "Strategic Value ", bold: true, color: C.accent },
    { text: "(0-25) — market position, growth trajectory" },
  ]));

  children.push(spacer(60));
  children.push(
    bodyPara("Each dimension scores 0-25, producing a total score of 0-100. Leads are classified as:")
  );
  children.push(bulletItem([
    { text: "Hot ", bold: true, color: "C0392B" },
    { text: "(70+) — High-priority leads with strong ICP match" },
  ]));
  children.push(bulletItem([
    { text: "Warm ", bold: true, color: "E67E22" },
    { text: "(40-69) — Moderate match, worth pursuing" },
  ]));
  children.push(bulletItem([
    { text: "Cold ", bold: true, color: C.secondary },
    { text: "(0-39) — Low match, deprioritized" },
  ]));

  children.push(
    bodyPara(
      "The agent also generates a qualification rationale explaining why the lead received its score, making the process fully transparent and educational."
    )
  );

  // Stage 4
  children.push(spacer(100));
  children.push(headingPara("Stage 4 — Outreach Composition", 2));

  children.push(
    bodyPara(
      "The Outreach Composer agent crafts personalized outreach messages for qualified leads (Warm and Hot). For each lead, it uses the LLM to generate a compelling email subject line, email body, LinkedIn connection message, and Twitter DM — all tailored to the specific company, industry, and pain points. The messages reference specific details about the company (their services, recent news, technologies used) to demonstrate genuine research and avoid generic templates."
    )
  );

  children.push(calloutBox("Outreach messages reference specific company details — no generic templates. Every message is unique and research-backed."));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ────────────────────────────────────────────────────────
  // SECTION 4: Agent Definitions & Capabilities
  // ────────────────────────────────────────────────────────
  children.push(headingPara("4. Agent Definitions & Capabilities", 1));

  children.push(
    bodyPara("The platform deploys 8 specialized AI agents, each with a distinct role and codename:")
  );

  const agents = [
    {
      name: "Orchestrator",
      codename: "Atlas",
      desc: "Coordinates multi-agent workflows. Creates execution plans and dispatches sub-tasks. No direct channel access — delegates to specialized agents.",
      channels: "None (delegates only)",
    },
    {
      name: "Prospect Discovery",
      codename: "Scout",
      desc: "The primary lead-finding agent. Searches across Exa, Web (Jina Reader), LinkedIn, GitHub, Twitter, Reddit, and RSS channels. Uses 3-tier fallback resilience to guarantee results.",
      channels: "Exa, Web, LinkedIn, GitHub, Twitter, Reddit, RSS",
    },
    {
      name: "Data Enrichment",
      codename: "Scholar",
      desc: "Enriches leads with deeper data. Reads company websites (Jina Reader), searches LinkedIn profiles and company pages, Exa Search, Twitter, and GitHub for additional information.",
      channels: "Web, LinkedIn, Exa, Twitter, GitHub",
    },
    {
      name: "Web Research",
      codename: "Investigator",
      desc: "Deep-dive research on specific targets. Accesses Web (Jina Reader), Exa Search, LinkedIn, Twitter, YouTube, Reddit, and RSS for comprehensive intelligence gathering.",
      channels: "Web, Exa, LinkedIn, Twitter, YouTube, Reddit, RSS",
    },
    {
      name: "Lead Qualification",
      codename: "Judge",
      desc: "Scores leads against the ICP using multi-criteria scoring across firmographic fit, intent signals, reachability, and strategic value dimensions.",
      channels: "None (database + LLM only)",
    },
    {
      name: "Outreach Composer",
      codename: "Diplomat",
      desc: "Crafts personalized outreach messages across email, LinkedIn, and Twitter channels. Uses LLM to generate context-aware, non-generic messages.",
      channels: "LLM only (message generation)",
    },
    {
      name: "Pipeline Manager",
      codename: "Foreman",
      desc: "Manages the pipeline lifecycle, handles stage transitions, and ensures data integrity. Database-only operations.",
      channels: "Database only",
    },
    {
      name: "Report Generator",
      codename: "Analyst",
      desc: "Produces campaign summary reports and analytics. Database-only operations.",
      channels: "Database only",
    },
  ];

  agents.forEach((a) => {
    children.push(spacer(60));
    children.push(headingPara(`${a.name} (${a.codename})`, 3));
    children.push(bodyPara(a.desc));
    children.push(bulletItem([
      { text: "Channels: ", bold: true, color: C.accent },
      { text: a.channels },
    ]));
  });

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ────────────────────────────────────────────────────────
  // SECTION 5: Agent-Reach Bridge: 17+ Internet Channels
  // ────────────────────────────────────────────────────────
  children.push(headingPara("5. Agent-Reach Bridge: 17+ Internet Channels", 1));

  children.push(
    bodyPara(
      "The Agent-Reach Bridge is the tool execution layer that gives every agent real internet access. It implements 17 channels with 3-tier resilience for each:"
    )
  );

  const channels = [
    {
      name: "Web (Jina Reader)",
      desc: "Zero-config web page reading. API: https://r.jina.ai/URL. Used for reading company websites, LinkedIn pages, and any URL.",
      tiers: "Direct API → Fallback Jina endpoint → Cached results",
    },
    {
      name: "Exa Search (z-ai-web-dev-sdk)",
      desc: "Primary search method. Uses z-ai-web-dev-sdk web_search function. Always available.",
      tiers: "z-ai-web-dev-sdk → mcporter Exa → Jina Search",
    },
    {
      name: "LinkedIn (Multi-Source)",
      desc: "3-tier pipeline: mcporter linkedin-scraper → Jina Reader direct read → Exa semantic search. Finds company pages and professional profiles.",
      tiers: "mcporter scraper → Jina Reader → Exa semantic",
    },
    {
      name: "Twitter/X (Multi-Source)",
      desc: "3-tier pipeline: bird CLI → Exa semantic search → Jina Search. Searches tweets and user accounts.",
      tiers: "bird CLI → Exa semantic → Jina Search",
    },
    {
      name: "Reddit (Public JSON API)",
      desc: "Direct Reddit JSON API with Jina Reader fallback. Searches posts and comments.",
      tiers: "Reddit JSON API → Jina Reader → Exa search",
    },
    {
      name: "GitHub (gh CLI)",
      desc: "Zero-config for public repos. Uses gh search repos command.",
      tiers: "gh CLI → API fallback → Exa search",
    },
    {
      name: "YouTube (yt-dlp)",
      desc: "Video metadata and subtitle extraction. Uses yt-dlp CLI.",
      tiers: "yt-dlp → Invidious API → Exa search",
    },
    {
      name: "RSS (feedparser)",
      desc: "RSS feed reading and parsing.",
      tiers: "feedparser → Jina Reader → Exa search",
    },
  ];

  channels.forEach((ch) => {
    children.push(spacer(60));
    children.push(headingPara(ch.name, 3));
    children.push(bodyPara(ch.desc));
    children.push(bulletItem([
      { text: "3-Tier Fallback: ", bold: true, color: C.accent },
      { text: ch.tiers },
    ]));
  });

  children.push(spacer(80));
  children.push(headingPara("Chinese Platform Channels", 3));
  children.push(
    bodyPara("Additional channels for Chinese market coverage:")
  );

  const cnChannels = [
    "V2EX — Developer community forum",
    "Xueqiu — Financial and investment platform",
    "Weibo — Chinese social media platform",
    "WeChat — Messaging and content platform",
    "XiaoHongShu — Social commerce platform",
    "Douyin — Chinese TikTok (short video)",
    "Bilibili — Video sharing platform",
    "XiaoYuZhou — Podcast platform",
  ];
  cnChannels.forEach((c) => children.push(bulletItem(c)));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ────────────────────────────────────────────────────────
  // SECTION 6: Data Flow & State Management
  // ────────────────────────────────────────────────────────
  children.push(headingPara("6. Data Flow & State Management", 1));

  children.push(
    bodyPara("The data flows through the system as follows:")
  );

  const flowSteps = [
    "User creates campaign via \"Create & Run Pipeline\" button",
    "POST /api/campaigns creates the campaign record and triggers POST /api/campaigns/[id]/run-pipeline",
    "The run-pipeline endpoint spawns a child process: node dist/lib/workers/pipeline-worker.js",
    "The pipeline worker calls runFullPipeline() which executes the 4 stages sequentially:",
  ];
  flowSteps.forEach((s, i) => {
    children.push(bodyPara(`${i + 1}. ${s}`));
  });

  children.push(spacer(40));
  const pipelineSteps = [
    "Creates a prospect-discovery AgentTask record (status: pending → running → completed)",
    "Calls executeProspectDiscovery() → discovers companies → creates Lead records (stage: new)",
    "Creates a data-enrichment AgentTask record",
    "Calls executeDataEnrichment() → enriches leads → updates Lead records (stage: enriched)",
    "Creates a lead-qualification AgentTask record",
    "Calls executeLeadQualification() → scores leads → updates Lead records (stage: qualified, leadTier: hot/warm/cold)",
    "Creates an outreach-composer AgentTask record",
    "Calls executeOutreachComposer() → generates messages → creates Outreach records",
  ];
  pipelineSteps.forEach((s) => {
    children.push(bulletItem(s, 1));
  });

  children.push(spacer(80));
  children.push(headingPara("Frontend Polling", 3));
  children.push(bulletItem("Frontend polls GET /api/campaigns/[id]/pipeline-status every 3 seconds"));
  children.push(bulletItem("The pipeline-status endpoint reads AgentTask records and Lead counts to build a real-time status response"));
  children.push(bulletItem("Frontend displays live progress: current stage, overall percentage, per-stage indicators, and lead counts"));

  children.push(spacer(80));
  children.push(headingPara("Database Models", 3));
  children.push(bulletItem([
    { text: "Campaign ", bold: true },
    { text: "— 8 fields including name, query, location, industry, status" },
  ]));
  children.push(bulletItem([
    { text: "Lead ", bold: true },
    { text: "— 30+ fields including scoring, pipeline stage, enrichment data, contact info" },
  ]));
  children.push(bulletItem([
    { text: "Outreach ", bold: true },
    { text: "— 8 fields including email subject, email body, LinkedIn message, Twitter DM" },
  ]));
  children.push(bulletItem([
    { text: "AgentTask ", bold: true },
    { text: "— 10 fields including agent type, status, progress, output, channel results" },
  ]));
  children.push(bulletItem([
    { text: "AgentReachChannel ", bold: true },
    { text: "— 6 fields for channel health status and availability" },
  ]));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ────────────────────────────────────────────────────────
  // SECTION 7: API Endpoints
  // ────────────────────────────────────────────────────────
  children.push(headingPara("7. API Endpoints", 1));

  children.push(
    bodyPara("The platform exposes the following RESTful API endpoints:")
  );

  const apis = [
    { method: "POST", path: "/api/campaigns", desc: "Create campaign and auto-trigger pipeline" },
    { method: "POST", path: "/api/campaigns/[id]/run-pipeline", desc: "Spawn pipeline worker" },
    { method: "GET", path: "/api/campaigns/[id]/pipeline-status", desc: "Real-time progress polling" },
    { method: "GET", path: "/api/campaigns", desc: "List campaigns with lead counts" },
    { method: "PUT", path: "/api/campaigns/[id]", desc: "Update campaign status" },
    { method: "GET", path: "/api/leads", desc: "List leads with filtering by campaignId, stage, tier" },
    { method: "GET", path: "/api/agents", desc: "List agent tasks" },
    { method: "POST", path: "/api/agents/execute", desc: "Execute specific agent tasks" },
    { method: "GET", path: "/api/agent-reach", desc: "Channel health status" },
    { method: "POST", path: "/api/ai", desc: "AI chat with pipeline trigger" },
  ];

  apis.forEach((api) => {
    const methodColor = api.method === "GET" ? "27AE60" : api.method === "POST" ? "E74C3C" : "F39C12";
    children.push(bulletItem([
      { text: api.method + " ", bold: true, color: methodColor },
      { text: api.path, bold: true, color: C.primary },
      { text: " — " + api.desc },
    ]));
  });

  children.push(calloutBox("All API endpoints use relative paths only. Cross-service requests use the XTransformPort query parameter for gateway routing."));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ────────────────────────────────────────────────────────
  // SECTION 8: Frontend Real-Time Transparency Layer
  // ────────────────────────────────────────────────────────
  children.push(headingPara("8. Frontend Real-Time Transparency Layer", 1));

  children.push(
    bodyPara(
      "The frontend provides complete visibility into the pipeline's operation, designed to be educational as well as functional:"
    )
  );

  children.push(spacer(60));
  children.push(headingPara("Campaign Cards", 3));
  children.push(
    bodyPara(
      "Each campaign card shows real-time pipeline progress with animated stage indicators (Discovery → Enrichment → Qualification → Outreach). A pulsing cyan progress bar shows current stage, while completed stages show green. Lead counts update live as the pipeline discovers, enriches, and qualifies leads."
    )
  );

  children.push(spacer(60));
  children.push(headingPara("Pipeline Status Display", 3));
  children.push(
    bodyPara(
      "When a pipeline is running, the card displays the current stage name, overall progress percentage, and per-stage status indicators. On completion, a banner shows the final result: \"8 found → 6 enriched → 5 qualified (2 hot)\"."
    )
  );

  children.push(spacer(60));
  children.push(headingPara("Agent View", 3));
  children.push(
    bodyPara(
      "The Agents page shows all 8 agents with their current task status, progress, channel activity, and output. This teaches viewers which channels each agent uses, what data they find, and how they make decisions."
    )
  );

  children.push(spacer(60));
  children.push(headingPara("Dashboard", 3));
  children.push(
    bodyPara(
      "The Dashboard provides an overview of all campaigns, lead funnels, agent activity, and recent notifications. Key metrics include total leads discovered, qualified, and contacted across all campaigns."
    )
  );

  children.push(calloutBox("Design Philosophy: The UI is not just a control panel — it's a learning tool. Every agent action is visible, every decision is explainable."));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ────────────────────────────────────────────────────────
  // SECTION 9: Error Handling & Resilience
  // ────────────────────────────────────────────────────────
  children.push(headingPara("9. Error Handling & Resilience", 1));

  children.push(
    bodyPara("The system implements defense-in-depth with multiple resilience layers:")
  );

  children.push(spacer(60));
  children.push(headingPara("3-Tier Channel Fallback", 3));
  children.push(
    bodyPara(
      "Every Agent-Reach channel has 3 access methods. If the primary method fails (e.g., API rate limit returning HTML), the system automatically tries the secondary method (e.g., Jina Reader), and finally the tertiary method (e.g., Jina Search). This ensures channels remain operational even during API outages."
    )
  );

  children.push(spacer(60));
  children.push(headingPara("LLM Fallback Pipeline", 3));
  children.push(
    bodyPara(
      "For lead discovery, if all web search channels return zero results, the system falls back to LLM knowledge generation — the LLM generates a list of real companies based on its training data for the given industry and location. This ensures the pipeline ALWAYS produces results."
    )
  );

  children.push(spacer(60));
  children.push(headingPara("Hardcoded Emergency Fallback", 3));
  children.push(
    bodyPara(
      "As a last resort, the system maintains hardcoded lists of real companies for common industry/location combinations (Marketing in Ontario, Tech in Canada, Accounting firms, etc.). This guarantees the pipeline NEVER returns zero leads under any circumstances."
    )
  );

  children.push(spacer(60));
  children.push(headingPara("HTML Error Detection", 3));
  children.push(
    bodyPara(
      "The system detects when API gateways return HTML error pages instead of JSON (rate limits, maintenance pages, 404s) and handles them gracefully without crashing. Every JSON parse is guarded against HTML responses."
    )
  );

  children.push(spacer(60));
  children.push(headingPara("Worker Process Isolation", 3));
  children.push(
    bodyPara(
      "The pipeline runs in a separate Node.js worker process. If the pipeline crashes, the Next.js server remains operational. The worker automatically marks all running tasks as failed on crash."
    )
  );

  children.push(calloutBox("Resilience Guarantee: The system has 3 independent fallback layers, ensuring zero-result scenarios are impossible."));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ────────────────────────────────────────────────────────
  // SECTION 10: Implementation Priority & Roadmap
  // ────────────────────────────────────────────────────────
  children.push(headingPara("10. Implementation Priority & Roadmap", 1));

  children.push(
    bodyPara("The implementation roadmap prioritizes critical pipeline functionality first, then moves to transparency and expansion features:")
  );

  const priorities = [
    {
      level: "Priority 1 (Critical)",
      color: "C0392B",
      title: "Pipeline Worker Compilation",
      desc: "Fix the pipeline worker compilation so the \"Create & Run Pipeline\" button actually triggers execution. This requires rebuilding dist/lib/workers/pipeline-worker.js from the TypeScript source and ensuring the worker can import the database and agent-executor modules correctly.",
    },
    {
      level: "Priority 2 (Critical)",
      color: "C0392B",
      title: "End-to-End Pipeline Verification",
      desc: "Verify the 4-stage pipeline executes end-to-end: Discovery finds companies → Enrichment adds data → Qualification scores leads → Outreach generates messages. Each stage must create the correct AgentTask records and update Lead records with proper stage progression.",
    },
    {
      level: "Priority 3 (High)",
      color: "E67E22",
      title: "Real-Time Frontend Polling",
      desc: "Ensure frontend polling displays real-time progress. The pipeline-status endpoint must return accurate stage status, progress percentages, and lead counts that update as the pipeline works.",
    },
    {
      level: "Priority 4 (High)",
      color: "E67E22",
      title: "Agent Transparency Features",
      desc: "Add agent transparency features — show channel activity (which channels were used, how many results each returned, any errors) on the Agent view so viewers can learn from the agent's decision-making process.",
    },
    {
      level: "Priority 5 (Medium)",
      color: C.accent,
      title: "Expand Fallback Data & LLM Prompts",
      desc: "Expand hardcoded fallback data to cover more industry/location combinations and improve the LLM knowledge generation prompts for better company recommendations.",
    },
  ];

  priorities.forEach((p) => {
    children.push(spacer(60));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: p.level,
            font: F_H,
            size: 24,
            color: p.color,
            bold: true,
          }),
        ],
        spacing: { line: LINE_SPACING, after: 60 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: p.title,
            font: F_H,
            size: 22,
            color: C.primary,
            bold: true,
          }),
        ],
        spacing: { line: LINE_SPACING, after: 60 },
      })
    );
    children.push(bodyPara(p.desc));
  });

  children.push(spacer(200));
  children.push(dividerLine());

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "End of Document",
          font: F_H,
          size: 22,
          color: C.secondary,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    })
  );

  return {
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.2),
          right: convertInchesToTwip(1),
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Agent Reach — LeadReach AI  |  System Design",
                font: F_B,
                size: 16,
                color: C.secondary,
                italics: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Page ", font: F_B, size: 16, color: C.secondary }),
              new TextRun({ children: [PageNumber.CURRENT], font: F_B, size: 16, color: C.secondary }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
    },
    children,
  };
}

// ─── Assemble Document ─────────────────────────────────────
async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: F_B,
            size: 22,
            color: C.body,
          },
          paragraph: {
            spacing: { line: LINE_SPACING },
          },
        },
        heading1: {
          run: {
            font: F_H,
            size: 36,
            color: C.primary,
            bold: true,
          },
          paragraph: {
            spacing: { line: LINE_SPACING, before: 400, after: 200 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
            },
          },
        },
        heading2: {
          run: {
            font: F_H,
            size: 30,
            color: C.primary,
            bold: true,
          },
          paragraph: {
            spacing: { line: LINE_SPACING, before: 320, after: 200 },
          },
        },
        heading3: {
          run: {
            font: F_H,
            size: 26,
            color: C.accent,
            bold: true,
          },
          paragraph: {
            spacing: { line: LINE_SPACING, before: 240, after: 160 },
          },
        },
        listParagraph: {
          run: {
            font: F_B,
            size: 22,
            color: C.body,
          },
          paragraph: {
            spacing: { line: LINE_SPACING, after: 80 },
          },
        },
      },
    },
    sections: [
      buildCoverSection(),
      buildTocSection(),
      buildContentSection(),
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = "/home/z/my-project/download/AgentReach-System-Design.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("✅ Document generated successfully:", outPath);
  console.log("   File size:", (buffer.length / 1024).toFixed(1), "KB");
}

main().catch((err) => {
  console.error("❌ Error generating document:", err);
  process.exit(1);
});

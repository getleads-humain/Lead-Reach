'use client';

import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { create } from 'zustand';
import type { PipelineState, AgentCommMessage } from '@/lib/prospect-agent/orchestrator-types';
import { AGENT_8_DISPLAY } from '@/lib/prospect-agent/orchestrator-types';

// ============================================================
// Types
// ============================================================

export interface VellumChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  timestamp: number;
  thinkingTimeMs?: number;
  usedMemory?: boolean;
  toolCalls?: ToolExecution[];
  isStreaming?: boolean;
}

export interface ToolExecution {
  id: string;
  name: string;
  status: 'running' | 'complete' | 'error';
  result?: string;
  startedAt: number;
  completedAt?: number;
}

export interface MemoryNode {
  id: string;
  type: 'fact' | 'preference' | 'relationship' | 'insight' | 'procedure';
  content: string;
  confidence: number;
  significance: number;
  source: string;
  createdAt: number;
  connections: string[];
}

export interface Skill {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  activationHints: string[];
  tools: string[];
  isActive: boolean;
  content?: string;
}

export interface Schedule {
  id: string;
  name: string;
  cron: string;
  nextRunAt: number;
  lastRunAt: number | null;
  status: 'active' | 'paused';
  agent: string;
}

export interface FollowUp {
  id: string;
  title: string;
  contactName: string;
  dueAt: number;
  status: 'pending' | 'overdue' | 'completed';
  channel: string;
}

export interface OutreachSequence {
  id: string;
  name: string;
  steps: number;
  completedSteps: number;
  status: 'active' | 'paused' | 'completed';
  progress: number;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  toolCount: number;
  tools: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  serverId: string;
}

export interface VellumSession {
  id: string;
  title: string;
  createdAt: number;
  messageCount: number;
}

// ============================================================
// Zustand Store
// ============================================================

interface VellumState {
  // Session
  currentSessionId: string | null;
  sessions: VellumSession[];
  // Chat
  messages: VellumChatMessage[];
  isStreaming: boolean;
  // Pipeline
  pipelineState: PipelineState;
  // Memory
  memories: MemoryNode[];
  // Skills
  skills: Skill[];
  // Proactivity
  schedules: Schedule[];
  followUps: FollowUp[];
  sequences: OutreachSequence[];
  heartbeat: { lastCheckIn: number | null; nextCheckIn: number | null; status: 'idle' | 'running' | 'error' };
  // MCP
  mcpServers: MCPServer[];
  // Actions
  setCurrentSession: (id: string | null) => void;
  addSession: (session: VellumSession) => void;
  addMessage: (msg: VellumChatMessage) => void;
  updateMessage: (id: string, update: Partial<VellumChatMessage>) => void;
  setStreaming: (v: boolean) => void;
  setPipelineState: (state: PipelineState) => void;
  addMemory: (memory: MemoryNode) => void;
  removeMemory: (id: string) => void;
  toggleSkill: (id: string) => void;
  addSchedule: (schedule: Schedule) => void;
  toggleSchedule: (id: string) => void;
  addFollowUp: (followUp: FollowUp) => void;
  updateFollowUpStatus: (id: string, status: FollowUp['status']) => void;
  addMCPServer: (server: MCPServer) => void;
  removeMCPServer: (id: string) => void;
  setHeartbeat: (hb: Partial<VellumState['heartbeat']>) => void;
  resetSession: () => void;
}

const defaultPipelineState: PipelineState = {
  phase: 'idle',
  thinkStartTime: null,
  totalThinkTimeMs: null,
  agents: Object.fromEntries(
    Object.keys(AGENT_8_DISPLAY).map((key) => [
      key,
      { persona: 'navigator', status: 'idle' as const, currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
    ])
  ),
  commLog: [],
  currentStep: '',
  overallProgress: 0,
};

const defaultSkills: Skill[] = [
  { id: 'company-research', name: 'Company Research', emoji: '🏢', description: 'Deep research on target companies', category: 'Research', activationHints: ['research company', 'company profile', 'company info'], tools: ['web_search', 'linkedin'], isActive: false },
  { id: 'people-finder', name: 'People Finder', emoji: '👤', description: 'Find key decision makers and contacts', category: 'Discovery', activationHints: ['find people', 'decision makers', 'contacts'], tools: ['linkedin', 'web_search'], isActive: false },
  { id: 'icp-builder', name: 'ICP Builder', emoji: '🎯', description: 'Build ideal customer profiles', category: 'Strategy', activationHints: ['build icp', 'ideal customer', 'target profile'], tools: ['analysis', 'web_search'], isActive: false },
  { id: 'market-analysis', name: 'Market Analysis', emoji: '📊', description: 'Analyze market trends and opportunities', category: 'Research', activationHints: ['market analysis', 'market trends', 'industry analysis'], tools: ['web_search', 'analysis'], isActive: false },
  { id: 'outreach-composer', name: 'Outreach Composer', emoji: '✉️', description: 'Craft personalized outreach messages', category: 'Communication', activationHints: ['write email', 'compose message', 'outreach'], tools: ['templates', 'personalization'], isActive: false },
  { id: 'lead-scoring', name: 'Lead Scoring', emoji: '⚖️', description: 'Score and qualify leads', category: 'Analysis', activationHints: ['score lead', 'qualify', 'rate lead'], tools: ['scoring_model', 'data_enrichment'], isActive: false },
  { id: 'competitor-intel', name: 'Competitor Intel', emoji: '🔍', description: 'Gather competitive intelligence', category: 'Research', activationHints: ['competitor', 'competitive intel', 'competitor analysis'], tools: ['web_search', 'analysis'], isActive: false },
  { id: 'sequence-builder', name: 'Sequence Builder', emoji: '🔄', description: 'Build multi-step outreach sequences', category: 'Automation', activationHints: ['build sequence', 'outreach sequence', 'follow-up sequence'], tools: ['templates', 'scheduler'], isActive: false },
  { id: 'data-enrichment', name: 'Data Enrichment', emoji: '⚒️', description: 'Enrich lead data with additional information', category: 'Data', activationHints: ['enrich data', 'enrich lead', 'add data'], tools: ['data_enrichment', 'web_search'], isActive: false },
  { id: 'report-generator', name: 'Report Generator', emoji: '📈', description: 'Generate reports and analytics', category: 'Analytics', activationHints: ['generate report', 'analytics', 'create report'], tools: ['analysis', 'templates'], isActive: false },
];

const defaultMemories: MemoryNode[] = [
  { id: 'mem-1', type: 'fact', content: 'Target industry: SaaS companies with 50-500 employees', confidence: 0.95, significance: 0.9, source: 'user_input', createdAt: Date.now() - 86400000, connections: ['mem-2'] },
  { id: 'mem-2', type: 'preference', content: 'User prefers LinkedIn as primary outreach channel', confidence: 0.85, significance: 0.7, source: 'inferred', createdAt: Date.now() - 72000000, connections: ['mem-1'] },
  { id: 'mem-3', type: 'insight', content: 'CTOs at mid-market SaaS companies respond best to technical case studies', confidence: 0.78, significance: 0.85, source: 'agent_analysis', createdAt: Date.now() - 36000000, connections: ['mem-1'] },
  { id: 'mem-4', type: 'relationship', content: 'TechCorp VP Engineering interested in Q2 pilot', confidence: 0.92, significance: 0.95, source: 'interaction', createdAt: Date.now() - 18000000, connections: [] },
  { id: 'mem-5', type: 'procedure', content: 'Always include ROI metrics in first outreach to finance vertical', confidence: 0.88, significance: 0.75, source: 'agent_analysis', createdAt: Date.now() - 7200000, connections: ['mem-3'] },
];

const defaultSchedules: Schedule[] = [
  { id: 'sch-1', name: 'Daily Lead Scan', cron: '0 9 * * *', nextRunAt: Date.now() + 3600000, lastRunAt: Date.now() - 82800000, status: 'active', agent: 'Scout' },
  { id: 'sch-2', name: 'Weekly Market Report', cron: '0 8 * * 1', nextRunAt: Date.now() + 172800000, lastRunAt: Date.now() - 604800000, status: 'active', agent: 'Sage' },
  { id: 'sch-3', name: 'Follow-up Checker', cron: '*/30 * * * *', nextRunAt: Date.now() + 1200000, lastRunAt: Date.now() - 600000, status: 'active', agent: 'Flow' },
];

const defaultFollowUps: FollowUp[] = [
  { id: 'fu-1', title: 'Follow up with Sarah at TechCorp', contactName: 'Sarah Chen', dueAt: Date.now() + 3600000, status: 'pending', channel: 'LinkedIn' },
  { id: 'fu-2', title: 'Send proposal to Marcus at ScaleUp', contactName: 'Marcus Rodriguez', dueAt: Date.now() - 7200000, status: 'overdue', channel: 'Email' },
  { id: 'fu-3', title: 'Schedule demo with Aisha at NexusAI', contactName: 'Aisha Patel', dueAt: Date.now() + 86400000, status: 'pending', channel: 'Email' },
  { id: 'fu-4', title: 'Thank you note to David at DataVault', contactName: 'David Kim', dueAt: Date.now() - 3600000, status: 'completed', channel: 'LinkedIn' },
];

const defaultSequences: OutreachSequence[] = [
  { id: 'seq-1', name: 'SaaS Decision Makers', steps: 5, completedSteps: 2, status: 'active', progress: 40 },
  { id: 'seq-2', name: 'Tech Vertical Cold Outreach', steps: 4, completedSteps: 4, status: 'completed', progress: 100 },
  { id: 'seq-3', name: 'Re-engagement Campaign', steps: 3, completedSteps: 1, status: 'active', progress: 33 },
];

const defaultMCPServers: MCPServer[] = [
  { id: 'mcp-1', name: 'LinkedIn MCP', url: 'mcp://linkedin:3001', status: 'connected', latency: 45, toolCount: 8, tools: [{ name: 'search_profiles', description: 'Search LinkedIn profiles', serverId: 'mcp-1' }, { name: 'get_company', description: 'Get company details', serverId: 'mcp-1' }, { name: 'send_message', description: 'Send LinkedIn message', serverId: 'mcp-1' }] },
  { id: 'mcp-2', name: 'Web Research MCP', url: 'mcp://websearch:3002', status: 'connected', latency: 120, toolCount: 5, tools: [{ name: 'web_search', description: 'Search the web', serverId: 'mcp-2' }, { name: 'scrape_page', description: 'Scrape a web page', serverId: 'mcp-2' }] },
  { id: 'mcp-3', name: 'CRM MCP', url: 'mcp://crm:3003', status: 'disconnected', latency: 0, toolCount: 0, tools: [] },
];

export const useVellumStore = create<VellumState>()((set) => ({
  currentSessionId: null,
  sessions: [],
  messages: [],
  isStreaming: false,
  pipelineState: defaultPipelineState,
  memories: defaultMemories,
  skills: defaultSkills,
  schedules: defaultSchedules,
  followUps: defaultFollowUps,
  sequences: defaultSequences,
  heartbeat: { lastCheckIn: Date.now() - 300000, nextCheckIn: Date.now() + 2700000, status: 'idle' },
  mcpServers: defaultMCPServers,

  setCurrentSession: (id) => set({ currentSessionId: id }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, update) => set((s) => ({
    messages: s.messages.map((m) => (m.id === id ? { ...m, ...update } : m)),
  })),
  setStreaming: (v) => set({ isStreaming: v }),
  setPipelineState: (state) => set({ pipelineState: state }),
  addMemory: (memory) => set((s) => ({ memories: [memory, ...s.memories] })),
  removeMemory: (id) => set((s) => ({ memories: s.memories.filter((m) => m.id !== id) })),
  toggleSkill: (id) => set((s) => ({
    skills: s.skills.map((sk) => (sk.id === id ? { ...sk, isActive: !sk.isActive } : sk)),
  })),
  addSchedule: (schedule) => set((s) => ({ schedules: [schedule, ...s.schedules] })),
  toggleSchedule: (id) => set((s) => ({
    schedules: s.schedules.map((sc) => (sc.id === id ? { ...sc, status: sc.status === 'active' ? 'paused' : 'active' } : sc)),
  })),
  addFollowUp: (followUp) => set((s) => ({ followUps: [followUp, ...s.followUps] })),
  updateFollowUpStatus: (id, status) => set((s) => ({
    followUps: s.followUps.map((f) => (f.id === id ? { ...f, status } : f)),
  })),
  addMCPServer: (server) => set((s) => ({ mcpServers: [...s.mcpServers, server] })),
  removeMCPServer: (id) => set((s) => ({ mcpServers: s.mcpServers.filter((srv) => srv.id !== id) })),
  setHeartbeat: (hb) => set((s) => ({ heartbeat: { ...s.heartbeat, ...hb } })),
  resetSession: () => set((s) => ({
    currentSessionId: null,
    messages: [],
    isStreaming: false,
    pipelineState: defaultPipelineState,
  })),
}));

// ============================================================
// React Context (for SSE connection management)
// ============================================================

interface VellumContextValue {
  sendChatMessage: (content: string) => void;
  newSession: () => void;
  connected: boolean;
}

const VellumContext = createContext<VellumContextValue>({
  sendChatMessage: () => {},
  newSession: () => {},
  connected: false,
});

export function useVellum() {
  return useContext(VellumContext);
}

// ============================================================
// Provider Component
// ============================================================

export function VellumProvider({ children }: { children: React.ReactNode }) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected] = useState(true);

  const addMessage = useVellumStore((s) => s.addMessage);
  const updateMessage = useVellumStore((s) => s.updateMessage);
  const setStreaming = useVellumStore((s) => s.setStreaming);
  const setPipelineState = useVellumStore((s) => s.setPipelineState);
  const setCurrentSession = useVellumStore((s) => s.setCurrentSession);
  const addSession = useVellumStore((s) => s.addSession);
  const messages = useVellumStore((s) => s.messages);

  const sendChatMessage = useCallback(
    (content: string) => {
      // Add user message
      const userMsg: VellumChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      addMessage(userMsg);

      // Simulate assistant response with thinking
      setStreaming(true);
      const assistantId = `msg-${Date.now()}-assistant`;

      // Simulate thinking phase
      const thinkStart = Date.now();

      // Simulate pipeline activation
      setPipelineState({
        phase: 'thinking',
        thinkStartTime: thinkStart,
        totalThinkTimeMs: null,
        agents: Object.fromEntries(
          Object.keys(AGENT_8_DISPLAY).map((key) => [
            key,
            { persona: 'navigator', status: key === 'atlas' ? 'thinking' as const : 'idle' as const, currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
          ])
        ),
        commLog: [{
          id: `comm-${Date.now()}`,
          from: 'user',
          to: 'atlas',
          type: 'request',
          content: content,
          timestamp: Date.now(),
        }],
        currentStep: 'Analyzing query',
        overallProgress: 5,
      });

      // Simulate assistant thinking then responding
      const thinkTime = 1500 + Math.random() * 2000;
      setTimeout(() => {
        const thinkEnd = Date.now();

        // Add thinking message first
        addMessage({
          id: assistantId,
          role: 'assistant',
          content: '',
          agent: 'atlas',
          timestamp: Date.now(),
          thinkingTimeMs: thinkEnd - thinkStart,
          usedMemory: Math.random() > 0.5,
          isStreaming: true,
        });

        // Simulate progressive content
        const responses = [
          "I'll help you with that. Let me coordinate the right agents to get you comprehensive results.",
          '\n\n🧭 **Atlas** is orchestrating the pipeline...',
          '\n\n🔍 **Scout** is searching across multiple channels...',
          '\n\n⚒️ **Forge** is enriching the data...',
          '\n\n📊 **Sage** is analyzing the market context...',
        ];

        let accumulated = '';
        responses.forEach((chunk, i) => {
          setTimeout(() => {
            accumulated += chunk;
            updateMessage(assistantId, { content: accumulated });

            if (i === responses.length - 1) {
              updateMessage(assistantId, { isStreaming: false });
              setStreaming(false);

              setPipelineState((prev) => ({
                ...prev,
                phase: 'complete',
                totalThinkTimeMs: thinkEnd - thinkStart,
                overallProgress: 100,
                agents: Object.fromEntries(
                  Object.keys(AGENT_8_DISPLAY).map((key) => [
                    key,
                    { persona: 'navigator', status: 'completed' as const, currentStep: 'Done', progress: 100, startedAt: thinkStart, completedAt: Date.now(), thinkTimeMs: null },
                  ])
                ),
              }));
            }
          }, (i + 1) * 600);
        });
      }, thinkTime);
    },
    [addMessage, updateMessage, setStreaming, setPipelineState]
  );

  const newSession = useCallback(() => {
    const sessionId = `session-${Date.now()}`;
    setCurrentSession(sessionId);
    addSession({
      id: sessionId,
      title: `Session ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
      messageCount: 0,
    });
    useVellumStore.getState().resetSession();
  }, [setCurrentSession, addSession]);

  // Simulate SSE connection cleanup
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const value: VellumContextValue = {
    sendChatMessage,
    newSession,
    connected,
  };

  return (
    <VellumContext.Provider value={value}>
      {children}
    </VellumContext.Provider>
  );
}

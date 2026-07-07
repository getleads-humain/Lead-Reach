'use client';

import React, { useState } from 'react';
import { VellumProvider } from '@/components/vellum/vellum-provider';
import { VellumChatPanel } from '@/components/vellum/vellum-chat-panel';
import { PipelineWorkspace } from '@/components/vellum/pipeline-workspace';
import { MemoryPanel } from '@/components/vellum/memory-panel';
import { SkillsPanel } from '@/components/vellum/skills-panel';
import { ProactivityPanel } from '@/components/vellum/proactivity-panel';
import { MCPPanel } from '@/components/vellum/mcp-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Activity,
  MemoryStick,
  Cpu,
  Zap,
  Cable,
  PanelLeftClose,
  PanelLeftOpen,
  Brain,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================
// Sidebar Navigation
// ============================================================

type SidebarPanel = 'pipeline' | 'memory' | 'skills' | 'proactivity' | 'mcp';

const PANEL_CONFIG: Record<SidebarPanel, { label: string; icon: React.ElementType; color: string; description: string }> = {
  pipeline: { label: 'Pipeline', icon: Activity, color: 'text-cyan-400', description: '8-Agent Pipeline' },
  memory: { label: 'Memory', icon: MemoryStick, color: 'text-amber-400', description: 'Knowledge Graph' },
  skills: { label: 'Skills', icon: Cpu, color: 'text-violet-400', description: 'Agent Skills' },
  proactivity: { label: 'Proactivity', icon: Zap, color: 'text-rose-400', description: 'Schedules & Follow-ups' },
  mcp: { label: 'MCP', icon: Cable, color: 'text-teal-400', description: 'MCP Server Connections' },
};

function SidebarNavigation({
  activePanel,
  onPanelChange,
  collapsed,
  onToggleCollapse,
}: {
  activePanel: SidebarPanel;
  onPanelChange: (panel: SidebarPanel) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-3 px-1.5 gap-1 border-r border-border/20 bg-card/30">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-foreground/70 mb-2"
        onClick={onToggleCollapse}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>

      {Object.entries(PANEL_CONFIG).map(([key, config]) => {
        const Icon = config.icon;
        const isActive = activePanel === key;
        return (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 transition-all ${
              isActive
                ? `${config.color} bg-current/10`
                : 'text-muted-foreground/30 hover:text-foreground/60'
            }`}
            onClick={() => onPanelChange(key as SidebarPanel)}
            title={config.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================
// Mobile Bottom Navigation
// ============================================================

function MobileBottomNav({
  activePanel,
  onPanelChange,
}: {
  activePanel: SidebarPanel;
  onPanelChange: (panel: SidebarPanel) => void;
}) {
  return (
    <div className="flex items-center justify-around border-t border-border/20 bg-card/80 backdrop-blur-sm px-1 py-1 lg:hidden">
      {Object.entries(PANEL_CONFIG).map(([key, config]) => {
        const Icon = config.icon;
        const isActive = activePanel === key;
        return (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 rounded-lg transition-all ${
              isActive
                ? `${config.color} bg-current/10`
                : 'text-muted-foreground/40 hover:text-foreground/60'
            }`}
            onClick={() => onPanelChange(key as SidebarPanel)}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[9px] font-medium">{config.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================
// Main Vellum Dashboard
// ============================================================

function VellumDashboard() {
  const [activePanel, setActivePanel] = useState<SidebarPanel>('pipeline');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const renderSidebarPanel = () => {
    switch (activePanel) {
      case 'pipeline':
        return <PipelineWorkspace className="h-full" />;
      case 'memory':
        return <MemoryPanel className="h-full" />;
      case 'skills':
        return <SkillsPanel className="h-full" />;
      case 'proactivity':
        return <ProactivityPanel className="h-full" />;
      case 'mcp':
        return <MCPPanel className="h-full" />;
    }
  };

  return (
    <div className="flex h-screen bg-background noise-bg">
      {/* Main Content Area - Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/20 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Link href="/app" className="text-muted-foreground/40 hover:text-foreground/70 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="rounded-xl p-2 bg-emerald-500/10 glow-emerald-sm">
              <Brain className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground/90 tracking-tight">
                Vellum Core
              </h1>
              <p className="text-[10px] text-muted-foreground/50">
                AgentLoop · 8-Agent Pipeline · Knowledge Graph
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] h-5 px-2 border-emerald-500/20 text-emerald-400">
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              Live
            </Badge>
            <Badge variant="outline" className="text-[9px] h-5 px-2 border-border/30 text-muted-foreground/50">
              <Activity className="h-2.5 w-2.5 mr-1" />
              8 Agents
            </Badge>
            {/* Mobile panel toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-foreground/70 lg:hidden"
              onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        {/* Chat Panel */}
        <div className="flex-1 min-h-0">
          <VellumChatPanel className="h-full rounded-none border-0" />
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav activePanel={activePanel} onPanelChange={setActivePanel} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0 border-l border-border/20">
        <SidebarNavigation
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Panel content */}
        {!sidebarCollapsed && (
          <div className="w-80 xl:w-96 overflow-hidden">
            {renderSidebarPanel()}
          </div>
        )}
      </div>

      {/* Mobile Panel Overlay */}
      {mobilePanelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobilePanelOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border/20 shadow-xl">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground/80">Vellum Panels</span>
                <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-border/30 text-muted-foreground/50">
                  {PANEL_CONFIG[activePanel].description}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground/50"
                onClick={() => setMobilePanelOpen(false)}
              >
                ✕
              </Button>
            </div>
            <div className="h-full overflow-y-auto">
              {renderSidebarPanel()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Page Export
// ============================================================

export default function VellumPage() {
  return (
    <VellumProvider>
      <VellumDashboard />
    </VellumProvider>
  );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Server,
  Plug,
  Wrench,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cable,
} from 'lucide-react';
import { useVellumStore, type MCPServer as MCPServerType } from './vellum-provider';

// ============================================================
// Server Status Badge
// ============================================================

function ServerStatusBadge({ status }: { status: MCPServerType['status'] }) {
  const config = {
    connected: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Wifi, label: 'Connected' },
    disconnected: { color: 'text-muted-foreground/40', bg: 'bg-muted/10', border: 'border-muted/20', icon: WifiOff, label: 'Disconnected' },
    error: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle, label: 'Error' },
  };
  const c = config[status];
  const Icon = c.icon;

  return (
    <Badge variant="outline" className={`text-[8px] h-4 px-1.5 gap-0.5 ${c.color} ${c.border}`}>
      <Icon className="h-2.5 w-2.5" />
      {c.label}
    </Badge>
  );
}

// ============================================================
// MCP Server Item
// ============================================================

function MCPServerItem({ server, onRemove, onExpand, isExpanded }: {
  server: MCPServerType;
  onRemove: () => void;
  onExpand: () => void;
  isExpanded: boolean;
}) {
  return (
    <div className={`rounded-lg border overflow-hidden transition-colors ${
      server.status === 'connected'
        ? 'border-emerald-500/15 bg-emerald-500/3'
        : server.status === 'error'
        ? 'border-red-500/15 bg-red-500/3'
        : 'border-border/20 bg-secondary/5'
    }`}>
      {/* Server header */}
      <button
        onClick={onExpand}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary/10 transition-colors text-left"
      >
        <div className={`rounded-lg p-1.5 ${
          server.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
          server.status === 'error' ? 'bg-red-500/10 text-red-400' :
          'bg-muted/20 text-muted-foreground/40'
        }`}>
          <Server className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground/80">{server.name}</span>
            <ServerStatusBadge status={server.status} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-muted-foreground/30 font-mono">{server.url}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {server.status === 'connected' && (
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 text-muted-foreground/30" />
              <span className="text-[9px] text-muted-foreground/40">{server.latency}ms</span>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/30" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/30" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/10"
          >
            <div className="p-3 space-y-2.5">
              {/* Server health */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-background/50 border border-border/15 p-2 text-center">
                  <span className="text-sm font-bold text-foreground/70">{server.latency}ms</span>
                  <p className="text-[8px] text-muted-foreground/40">Latency</p>
                </div>
                <div className="rounded-md bg-background/50 border border-border/15 p-2 text-center">
                  <span className="text-sm font-bold text-foreground/70">{server.toolCount}</span>
                  <p className="text-[8px] text-muted-foreground/40">Tools</p>
                </div>
                <div className="rounded-md bg-background/50 border border-border/15 p-2 text-center">
                  <span className={`text-sm font-bold ${server.status === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {server.status === 'connected' ? 'UP' : 'DOWN'}
                  </span>
                  <p className="text-[8px] text-muted-foreground/40">Status</p>
                </div>
              </div>

              {/* Tools list */}
              {server.tools.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Wrench className="h-3 w-3 text-cyan-400" />
                    <span className="text-[9px] font-semibold text-foreground/50 uppercase tracking-wider">Available Tools</span>
                  </div>
                  <div className="space-y-1">
                    {server.tools.map((tool) => (
                      <div key={tool.name} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/5 border border-border/10">
                        <Plug className="h-2.5 w-2.5 text-cyan-400/50" />
                        <span className="text-[10px] font-medium text-foreground/60">{tool.name}</span>
                        <span className="text-[9px] text-muted-foreground/30 flex-1 truncate">{tool.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remove button */}
              <div className="flex justify-end pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[9px] gap-1 text-red-400/50 hover:text-red-400 hover:bg-red-500/5"
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                >
                  <Trash2 className="h-2.5 w-2.5" />Remove
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Add Server Form
// ============================================================

function AddServerForm({ onAdd }: { onAdd: (server: MCPServerType) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onAdd({
      id: `mcp-${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      status: 'disconnected',
      latency: 0,
      toolCount: 0,
      tools: [],
    });
    setName('');
    setUrl('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full text-[10px] h-7 gap-1.5 border-border/30 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-3 w-3" />Add Server
      </Button>
    );
  }

  return (
    <motion.form
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      onSubmit={handleSubmit}
      className="rounded-lg border border-border/20 bg-secondary/5 p-3 space-y-2"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Server name..."
        className="h-7 text-xs bg-secondary/20 border-border/30 placeholder:text-muted-foreground/30"
      />
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="mcp://hostname:port"
        className="h-7 text-xs bg-secondary/20 border-border/30 placeholder:text-muted-foreground/30"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-6 text-[9px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">Connect</Button>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[9px] text-muted-foreground/50" onClick={() => setIsOpen(false)}>Cancel</Button>
      </div>
    </motion.form>
  );
}

// ============================================================
// Main MCP Panel
// ============================================================

interface MCPPanelProps {
  className?: string;
}

export function MCPPanel({ className = '' }: MCPPanelProps) {
  const mcpServers = useVellumStore((s) => s.mcpServers);
  const addMCPServer = useVellumStore((s) => s.addMCPServer);
  const removeMCPServer = useVellumStore((s) => s.removeMCPServer);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  const connectedCount = mcpServers.filter((s) => s.status === 'connected').length;
  const totalTools = mcpServers.reduce((sum, s) => sum + s.toolCount, 0);
  const avgLatency = connectedCount > 0
    ? Math.round(mcpServers.filter(s => s.status === 'connected').reduce((sum, s) => sum + s.latency, 0) / connectedCount)
    : 0;

  return (
    <Card className={`flex flex-col border-border/30 bg-card/50 h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-cyan-500/10">
            <Cable className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground/90">MCP Servers</h3>
            <p className="text-[10px] text-muted-foreground/50">{connectedCount} connected</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Overview stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md bg-background/50 border border-border/15 p-2 text-center">
              <Server className="h-3.5 w-3.5 text-cyan-400 mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground/70">{mcpServers.length}</span>
              <p className="text-[8px] text-muted-foreground/40">Servers</p>
            </div>
            <div className="rounded-md bg-background/50 border border-border/15 p-2 text-center">
              <Wrench className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground/70">{totalTools}</span>
              <p className="text-[8px] text-muted-foreground/40">Tools</p>
            </div>
            <div className="rounded-md bg-background/50 border border-border/15 p-2 text-center">
              <Clock className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground/70">{avgLatency}ms</span>
              <p className="text-[8px] text-muted-foreground/40">Avg Latency</p>
            </div>
          </div>

          {/* Servers list */}
          <div className="space-y-2">
            {mcpServers.map((server) => (
              <MCPServerItem
                key={server.id}
                server={server}
                onRemove={() => removeMCPServer(server.id)}
                onExpand={() => setExpandedServer(expandedServer === server.id ? null : server.id)}
                isExpanded={expandedServer === server.id}
              />
            ))}
          </div>

          {mcpServers.length === 0 && (
            <p className="text-[10px] text-muted-foreground/30 italic text-center py-4">
              No MCP servers connected
            </p>
          )}

          {/* Add server */}
          <AddServerForm onAdd={addMCPServer} />
        </div>
      </ScrollArea>
    </Card>
  );
}

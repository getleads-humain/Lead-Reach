'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function TasksView() {
  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { title: 'Total Tasks', value: '0', change: 'No tasks yet', icon: ListTodo, accent: 'emerald' },
          { title: 'In Progress', value: '0', change: 'No data', icon: Clock, accent: 'cyan' },
          { title: 'Completed', value: '0', change: 'No data', icon: CheckCircle2, accent: 'violet' },
          { title: 'Overdue', value: '0', change: 'No data', icon: AlertCircle, accent: 'red' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="card-premium border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn('h-4 w-4', `text-${stat.accent}-400`)} />
                  <Badge variant="outline" className="text-[9px] border-border/20 text-muted-foreground/50">
                    <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground/50 mt-0.5">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      <Card className="card-premium border-border/40 max-w-lg w-full mx-auto">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <ListTodo className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">No Tasks Yet</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No tasks yet. Tasks from your campaigns will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

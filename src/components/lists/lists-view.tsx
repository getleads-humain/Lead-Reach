'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  List,
  Users,
  Share2,
  ArrowUpRight,
  TrendingUp,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ListsView() {
  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { title: 'Total Lists', value: '0', change: 'No lists yet', icon: ListOrdered, accent: 'emerald' },
          { title: 'Total Records', value: '0', change: 'No data', icon: Users, accent: 'cyan' },
          { title: 'Shared Lists', value: '0', change: 'No data', icon: Share2, accent: 'violet' },
          { title: 'AI Generated', value: '0', change: 'No data', icon: TrendingUp, accent: 'amber' },
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
            <List className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">No Lists Yet</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No lists yet. Create lists to organize your leads.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

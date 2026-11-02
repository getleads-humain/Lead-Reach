'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className={`relative flex items-center justify-center w-9 h-9 rounded-lg border border-border/40 bg-secondary/20 ${className}`}>
        <div className="h-4 w-4" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else if (resolvedTheme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  const iconMap = {
    dark: Moon,
    light: Sun,
    system: Monitor,
  };

  const Icon = iconMap[(resolvedTheme === 'dark' || resolvedTheme === 'light' ? resolvedTheme : 'system') as keyof typeof iconMap] || Moon;

  return (
    <button
      onClick={cycleTheme}
      className={`relative flex items-center justify-center w-9 h-9 rounded-lg border border-border/40 bg-secondary/20 hover:bg-secondary/40 hover:border-border/60 transition-all duration-200 group ${className}`}
      title={`Current: ${resolvedTheme} mode. Click to switch.`}
    >
      <Icon className="h-4 w-4 text-foreground/70 group-hover:text-foreground transition-colors" />
      {/* Subtle glow indicator */}
      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-60" />
    </button>
  );
}

export function ThemeToggleExpanded({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`flex items-center gap-1 p-1 rounded-lg border border-border/30 bg-secondary/10 ${className}`}>
        <div className="h-7 w-16" />
        <div className="h-7 w-16" />
        <div className="h-7 w-16" />
      </div>
    );
  }

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className={`flex items-center gap-1 p-1 rounded-lg border border-border/30 bg-secondary/10 ${className}`}>
      {options.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-muted-foreground hover:text-foreground/80 hover:bg-secondary/20'
            }`}
          >
            <opt.icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

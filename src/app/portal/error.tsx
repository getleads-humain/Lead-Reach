'use client';

/**
 * LeadReach — Portal Error Boundary
 * ====================================
 * Catches unhandled errors within the /portal route.
 * Shows a friendly error message with recovery options.
 */

import React from 'react';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[LeadReach] Portal error boundary caught:', error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground/90">Portal Error</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Something went wrong while loading your portal. Please try again.
        </p>
        {error?.message && (
          <p className="text-xs text-red-400/70 font-mono mt-2 max-w-lg break-all">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-95"
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = '/login')}
          className="rounded-lg border border-border/40 bg-secondary/20 px-5 py-2 text-sm font-medium text-foreground/70 transition-all hover:bg-secondary/30 hover:text-foreground active:scale-95"
        >
          Sign In Again
        </button>
      </div>
    </div>
  );
}

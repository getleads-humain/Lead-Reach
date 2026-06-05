'use client';

/**
 * LeadReach — Global Error Boundary
 * ====================================
 * Catches unhandled errors at the root layout level.
 * This is the outermost error boundary — it replaces the entire page.
 *
 * Without this file, Next.js shows a cryptic "This page couldn't load" message.
 */

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[LeadReach] Global error boundary caught:', error);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
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
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white/90">Something went wrong</h1>
            <p className="text-sm text-white/50 max-w-md">
              We encountered an unexpected error. This has been logged and our team will investigate.
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
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-95"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

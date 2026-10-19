/**
 * LeadReach — Portal Route Loading State
 * =========================================
 * Shown while the workspace shell hydrates. Prevents a blank frame on
 * slow connections so the portal always feels responsive.
 */

export default function PlatformLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col gap-6 p-6" aria-busy="true" aria-label="Loading workspace">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 animate-pulse rounded-lg bg-muted/60" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted/40" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-muted/60" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-card/40 p-5">
            <div className="h-3 w-16 animate-pulse rounded bg-muted/50" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted/60" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted/40" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/40 bg-card/40 p-6 lg:col-span-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-muted/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted/40" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/40 p-6">
          <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
          <div className="mt-5 h-40 animate-pulse rounded-lg bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

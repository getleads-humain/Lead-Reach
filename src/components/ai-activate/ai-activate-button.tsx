'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sparkles, Loader2, AlertCircle, CheckCircle2, RefreshCw, X,
} from 'lucide-react';
import { useAIActivate } from '@/hooks/use-ai-activate';
import { cn } from '@/lib/utils';

export interface AIActivateButtonProps {
  /** AI action to invoke (e.g., 'lead.score', 'email.compose') */
  action: string;
  /** Payload to send with the request */
  payload: unknown;
  /** Button label */
  label?: string;
  /** Optional icon to show before the label (defaults to Sparkles) */
  icon?: React.ReactNode;
  /** Variant of the button */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Size of the button */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Render the result in a popover (default) or inline below the button */
  displayMode?: 'dialog' | 'inline';
  /** Custom renderer for the AI result */
  renderResult?: (data: unknown) => React.ReactNode;
  /** Custom className */
  className?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Called when AI result is successfully returned */
  onSuccess?: (data: unknown) => void;
}

/**
 * AIActivateButton — drop-in component that activates any AI feature.
 *
 * Renders a button with a Sparkles icon. When clicked:
 *  1. Calls POST /api/ai-activate with the action + payload
 *  2. Shows a loading spinner
 *  3. On success, displays the AI result in a dialog (or inline)
 *  4. On error, shows the error message
 *
 * Example:
 *   <AIActivateButton
 *     action="lead.score"
 *     payload={{ name: 'John Doe', company: 'Acme Corp', title: 'VP Sales' }}
 *     label="Score with AI"
 *     renderResult={(data) => <LeadScoreCard score={data.score} tier={data.tier} />}
 *   />
 */
export function AIActivateButton({
  action,
  payload,
  label = 'Activate AI',
  icon,
  variant = 'outline',
  size = 'sm',
  displayMode = 'dialog',
  renderResult,
  className,
  disabled,
  onSuccess,
}: AIActivateButtonProps) {
  const [open, setOpen] = useState(false);
  const { activate, data, isLoading, error, reset } = useAIActivate();

  const handleClick = useCallback(async () => {
    if (displayMode === 'dialog') setOpen(true);
    const result = await activate(action, payload);
    if (result && onSuccess) onSuccess(result);
  }, [action, payload, activate, displayMode, onSuccess]);

  const handleClose = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const Icon = icon || <Sparkles className="h-4 w-4" />;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn('gap-2', className)}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon}
        {label}
      </Button>

      {displayMode === 'inline' && (isLoading || data || error) && (
        <div className="mt-3">
          <ResultDisplay
            isLoading={isLoading}
            data={data}
            error={error}
            renderResult={renderResult}
            action={action}
          />
        </div>
      )}

      {displayMode === 'dialog' && (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Result
                <Badge variant="secondary" className="ml-2 text-xs font-mono">
                  {action}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 max-h-[60vh]">
              <div className="p-1">
                <ResultDisplay
                  isLoading={isLoading}
                  data={data}
                  error={error}
                  renderResult={renderResult}
                  action={action}
                />
              </div>
            </ScrollArea>
            <div className="flex items-center justify-between gap-2 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {data && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                {error && <AlertCircle className="h-3 w-3 text-red-500" />}
                <span>
                  {isLoading && 'Generating…'}
                  {data && 'Generated successfully'}
                  {error && `Failed: ${error}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activate(action, payload)}
                  disabled={isLoading}
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClose} className="gap-1">
                  <X className="h-3 w-3" />
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ============================================================
// Internal: result display
// ============================================================

function ResultDisplay({
  isLoading,
  data,
  error,
  renderResult,
  action,
}: {
  isLoading: boolean;
  data: unknown;
  error: string | null;
  renderResult?: (data: unknown) => React.ReactNode;
  action: string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-900">AI request failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-500 mt-2 font-mono">action: {action}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  if (renderResult) {
    return <>{renderResult(data)}</>;
  }

  // Default: pretty-print JSON
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          AI Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-96 whitespace-pre-wrap break-words">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Convenience: AIActivateCard (always-visible card with activate button inside)
// ============================================================

export interface AIActivateCardProps {
  action: string;
  payload: unknown;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  renderResult?: (data: unknown) => React.ReactNode;
  className?: string;
  /** Auto-activate on mount (default false) */
  autoActivate?: boolean;
}

/**
 * AIActivateCard — always-visible card with an embedded AI activation button.
 * Use this for "AI Insights" panels that should appear inline in dashboards.
 */
export function AIActivateCard({
  action, payload, title, description, icon, renderResult, className, autoActivate,
}: AIActivateCardProps) {
  const { activate, data, isLoading, error } = useAIActivate();

  React.useEffect(() => {
    if (autoActivate) activate(action, payload);
  }, [autoActivate, action, payload, activate]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon || <Sparkles className="h-4 w-4 text-purple-500" />}
            <div>
              <CardTitle className="text-sm">{title}</CardTitle>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => activate(action, payload)}
            disabled={isLoading}
            className="gap-1 h-7"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {isLoading ? 'Working…' : 'Generate'}
          </Button>
        </div>
      </CardHeader>
      {(isLoading || data || error) && (
        <CardContent>
          <ResultDisplay
            isLoading={isLoading}
            data={data}
            error={error}
            renderResult={renderResult}
            action={action}
          />
        </CardContent>
      )}
    </Card>
  );
}

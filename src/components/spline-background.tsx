'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * SplineBackground — Fixed, centered, interactive 3D background
 *
 * Embeds a Spline 3D scene as a persistent, sticky background on the Landing Page.
 * The scene responds to pointer movement (playful interaction) while remaining
 * visually transparent enough to not interfere with foreground content.
 *
 * Robustness features:
 * - Error boundary: If the Spline viewer fails to load, falls back to a CSS gradient
 * - Timeout: If the script doesn't load within 10s, falls back gracefully
 * - Lazy: Only loads after the page content has rendered (requestIdleCallback)
 * - Cleanup: Properly removes the script and viewer on unmount
 */
export function SplineBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerCreated = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;

    // Use requestIdleCallback (or setTimeout fallback) to defer loading
    // the heavy Spline viewer until the browser is idle — this prevents
    // the 3D viewer from competing with the initial page render.
    const scheduleLoad = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 200);

    const idleId = scheduleLoad(() => {
      if (!containerRef.current || viewerCreated.current || failed) return;

      // Set a timeout — if the Spline script hasn't loaded in 10 seconds, give up
      const timeoutId = setTimeout(() => {
        console.warn('[SplineBackground] Script load timed out, using fallback');
        setFailed(true);
      }, 10000);

      // Load the Spline viewer script (module) — only once across the entire app
      const existingScript = document.querySelector(
        'script[src*="splinetool/viewer"]'
      );

      const onScriptReady = () => {
        clearTimeout(timeoutId);
        if (!containerRef.current || viewerCreated.current || failed) return;

        try {
          // Create the <spline-viewer> custom element programmatically
          const viewer = document.createElement('spline-viewer');
          viewer.setAttribute(
            'url',
            'https://prod.spline.design/45lp7R7zKo7lKjPR/scene.splinecode'
          );
          Object.assign(viewer.style, {
            width: '100%',
            height: '100%',
            display: 'block',
          });

          // Add error handler on the custom element
          viewer.addEventListener('error', () => {
            console.warn('[SplineBackground] Viewer error, using fallback');
            setFailed(true);
          });

          containerRef.current.appendChild(viewer);
          viewerCreated.current = true;
        } catch (err) {
          console.warn('[SplineBackground] Failed to create viewer:', err);
          setFailed(true);
        }
      };

      if (existingScript) {
        // Script already exists — check if it's loaded
        if (existingScript.getAttribute('data-loaded') === 'true') {
          onScriptReady();
        } else {
          existingScript.addEventListener('load', onScriptReady);
          existingScript.addEventListener('error', () => {
            clearTimeout(timeoutId);
            setFailed(true);
          });
        }
      } else {
        const script = document.createElement('script');
        script.type = 'module';
        script.src =
          'https://unpkg.com/@splinetool/viewer@1.12.92/build/spline-viewer.js';
        script.async = true;
        script.addEventListener('load', () => {
          script.setAttribute('data-loaded', 'true');
          onScriptReady();
        });
        script.addEventListener('error', () => {
          clearTimeout(timeoutId);
          console.warn('[SplineBackground] Script failed to load, using fallback');
          setFailed(true);
        });
        document.head.appendChild(script);
      }
    });

    return () => {
      // Clean up idle callback if possible
      if (typeof idleId === 'number') {
        clearTimeout(idleId);
      }
      // Remove the viewer element if we created it
      if (viewerCreated.current && containerRef.current) {
        const viewer = containerRef.current.querySelector('spline-viewer');
        if (viewer) {
          viewer.remove();
        }
        viewerCreated.current = false;
      }
    };
  }, [failed]);

  // If the Spline viewer failed to load, show a CSS gradient fallback
  if (failed) {
    return (
      <div
        className="fixed inset-0 z-[1]"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 40%, transparent 70%)',
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1] spline-bg-container"
      aria-hidden="true"
    />
  );
}

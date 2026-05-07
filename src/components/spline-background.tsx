'use client';

import React, { useEffect, useRef } from 'react';

/**
 * SplineBackground — Fixed, centered, interactive 3D background
 *
 * Embeds a Spline 3D scene as a persistent, sticky background on the Landing Page.
 * The scene responds to pointer movement (playful interaction) while remaining
 * visually transparent enough to not interfere with foreground content.
 *
 * Architecture:
 * - Fixed position covering full viewport (stays visible during scroll)
 * - z-index: 1 (behind all content, above noise texture)
 * - pointer-events: auto (allows interactive 3D model to respond to cursor)
 * - Container opacity for visual transparency
 * - The Spline viewer script is loaded once; custom element is created programmatically
 *   to avoid React/JSX friction with web components.
 */
export function SplineBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerCreated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || viewerCreated.current) return;

    // Load the Spline viewer script (module) — only once across the entire app
    const existingScript = document.querySelector(
      'script[src*="splinetool/viewer"]'
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src =
        'https://unpkg.com/@splinetool/viewer@1.12.92/build/spline-viewer.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Create the <spline-viewer> custom element programmatically
    // This avoids React's JSX handling of unknown custom elements
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
    containerRef.current.appendChild(viewer);
    viewerCreated.current = true;

    return () => {
      viewer.remove();
      viewerCreated.current = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1] spline-bg-container"
      aria-hidden="true"
    />
  );
}

'use client';

/**
 * Agent Infrastructure Initializer
 * Seeds the agent registry on first app load.
 * Runs once client-side and fires an initialization request to the API.
 * Uses sessionStorage to prevent repeated initialization calls.
 */

import { useEffect } from 'react';

export function AgentInfrastructureInit() {
  useEffect(() => {
    // Skip if already initialized in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('leadreach-agent-infrastructure-initialized')) {
      return;
    }

    // Fire-and-forget initialization of agent infrastructure
    fetch('/api/agent-infrastructure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initialize' }),
    })
      .then(() => {
        // Mark as initialized for this browser session
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('leadreach-agent-infrastructure-initialized', 'true');
        }
      })
      .catch(() => {
        // Non-critical — infrastructure can be initialized later via API
      });
  }, []);

  return null; // No UI output
}

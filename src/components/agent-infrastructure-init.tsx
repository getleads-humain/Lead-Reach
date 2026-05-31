'use client';

/**
 * Agent Infrastructure Initializer
 * Seeds the agent registry on first app load.
 * Runs once client-side and fires an initialization request to the API.
 */

import { useEffect } from 'react';

export function AgentInfrastructureInit() {
  useEffect(() => {
    // Fire-and-forget initialization of agent infrastructure
    fetch('/api/agent-infrastructure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initialize' }),
    }).catch(() => {
      // Non-critical — infrastructure can be initialized later via API
    });
  }, []);

  return null; // No UI output
}

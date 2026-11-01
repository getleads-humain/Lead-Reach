/**
 * Task 18 — Crash reproduction loop for the Ask AI chat.
 * Sends varied prompts through the real UI until the error boundary fires,
 * then dumps window.__platformError (message + stack).
 * Paste into agent-browser eval.
 */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const prompts = [
    'Compare the top 3 outreach channels in a table',
    'Show me a table of leads by industry with counts',
    'Build my ICP for dental clinics in Austin',
    'What are my pipeline stats? Show details',
    'Draft an outreach sequence for law firms',
    'List my campaigns with their status in a table',
    'Score this lead: Acme Corp, 50 employees, Austin',
    'Research the CRM market and summarize with a table',
  ];
  const results = [];
  for (const prompt of prompts) {
    // Find the chat input in the main view
    const input = document.querySelector('textarea[placeholder*="Message LeadReach"], input[placeholder*="Message LeadReach"]');
    if (!input) { results.push({ prompt, error: 'INPUT_NOT_FOUND' }); break; }
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
      || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter.call(input, prompt);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(300);
    const btns = [...document.querySelectorAll('button')];
    const send = btns.find((b) => (b.title || "").includes("Send message"));
    if (!send) { results.push({ prompt, error: 'SEND_NOT_FOUND' }); break; }
    send.click();
    // Wait for response completion (streaming indicator disappears) up to 90s
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      await sleep(2000);
      const crashed = !!window.__platformError;
      if (crashed) {
        return JSON.stringify({ CRASHED_ON: prompt, err: window.__platformError }).slice(0, 2000);
      }
      const streaming = document.querySelector('[class*="animate-pulse"], [class*="typing"]');
      const thinking = document.body.innerText.includes('Thinking');
      if (!streaming && !thinking) break;
    }
    await sleep(2000);
    if (window.__platformError) {
      return JSON.stringify({ CRASHED_ON: prompt, err: window.__platformError }).slice(0, 2000);
    }
    results.push({ prompt, ok: true });
  }
  return JSON.stringify({ completed: results.length, results });
})()

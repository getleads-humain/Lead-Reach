#!/usr/bin/env node
/** Extract the full boundary-error stack from agent-browser console --json (stdin). */
let d = '';
process.stdin.on('data', (c) => (d += c));
process.stdin.on('end', () => {
  try {
    const j = JSON.parse(d);
    const msgs = j.messages || [];
    for (const m of msgs) {
      for (const a of m.args || []) {
        const s = typeof a === 'string' ? a : a.description || a.value || '';
        if (typeof s === 'string' && s.includes('at C0')) {
          console.log(s.slice(0, 3000));
          return;
        }
      }
    }
    console.log('NOT_FOUND (messages:', msgs.length + ')');
  } catch (e) {
    console.log('ERR:' + e.message + ' RAWLEN:' + d.length);
  }
});

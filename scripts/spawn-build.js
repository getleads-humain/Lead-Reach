/**
 * Detached build launcher — mirrors .zscripts/dev.sh's spawn pattern
 * that survives the sandbox's tini process reaper.
 */
const { spawn } = require('child_process');
const fs = require('fs');

const env = { ...process.env };
env.NODE_OPTIONS = '--max-old-space-size=1024';
env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';

const child = spawn(
  '/home/z/my-project/node_modules/.bin/next',
  ['build'],
  {
    cwd: '/home/z/my-project',
    env,
    detached: true,
    stdio: ['ignore', fs.openSync('/tmp/build.log', 'a'), fs.openSync('/tmp/build.log', 'a')],
  }
);
child.unref();
fs.writeFileSync('/tmp/build.pid', String(child.pid));
console.log('[BUILD] started detached PID:', child.pid);

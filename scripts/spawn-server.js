/**
 * Start production server — mirrors .zscripts/dev.sh detached spawn pattern
 * (survives tini reaper; the platform monitor loop restarts via /tmp/next-server.pid).
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const env = { ...process.env };
// Load .env
const envPath = '/home/z/my-project/.env';
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
}
env.NODE_ENV = 'production';
env.HOSTNAME = '0.0.0.0';
env.PORT = '3000';
env.NODE_OPTIONS = '--max-old-space-size=1024';

const child = spawn('/home/z/my-project/node_modules/.bin/next', ['start', '-p', '3000', '-H', '0.0.0.0'], {
  cwd: '/home/z/my-project',
  env,
  detached: true,
  stdio: ['ignore', fs.openSync('/tmp/leadreach-server.log', 'a'), fs.openSync('/tmp/leadreach-server.log', 'a')],
});
child.unref();
fs.writeFileSync('/tmp/next-server.pid', String(child.pid));
console.log('[PROD] Server started with detached PID:', child.pid);

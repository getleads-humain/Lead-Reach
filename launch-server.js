const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', [
  path.join(__dirname, 'node_modules/.bin/next'),
  'start', '-p', '3000', '-H', '0.0.0.0'
], {
  cwd: __dirname,
  detached: true,
  stdio: 'ignore',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    HOSTNAME: '0.0.0.0',
    PORT: '3000',
  }
});

server.unref();
console.log(`Server launched with PID ${server.pid}`);

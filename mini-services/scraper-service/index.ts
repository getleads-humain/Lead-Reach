import { spawn } from 'child_process';
import path from 'path';

const pythonService = spawn('python3', [
  '-m', 'uvicorn', 'app.main:app',
  '--host', '0.0.0.0',
  '--port', '5320',
  '--log-level', 'info',
], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PYTHONUNBUFFERED: '1' },
});

pythonService.on('error', (err: Error) => {
  console.error('[scraper-service] Failed to start Python service:', err);
  process.exit(1);
});

pythonService.on('exit', (code: number | null) => {
  console.error(`[scraper-service] Python service exited with code ${code}`);
  process.exit(code || 1);
});

process.on('SIGTERM', () => {
  pythonService.kill('SIGTERM');
  setTimeout(() => process.exit(0), 3000);
});

process.on('SIGINT', () => {
  pythonService.kill('SIGTERM');
  setTimeout(() => process.exit(0), 3000);
});

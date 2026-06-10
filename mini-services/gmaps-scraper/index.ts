import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SERVICE_DIR = __dirname;
const PORT = 5340;
const LOG_FILE = path.join(SERVICE_DIR, 'gmaps-scraper.log');

let pythonProcess: ChildProcess | null = null;

function log(msg: string) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(line.trim());
}

async function installDeps(): Promise<void> {
  return new Promise((resolve, reject) => {
    log('Installing Python dependencies...');
    const pip = spawn('pip', ['install', '-r', path.join(SERVICE_DIR, 'requirements.txt')], {
      cwd: SERVICE_DIR,
      stdio: ['ignore', fs.openSync(LOG_FILE, 'a'), fs.openSync(LOG_FILE, 'a')]
    });
    pip.on('close', (code) => {
      if (code === 0) {
        log('Python dependencies installed');
        resolve();
      } else {
        log(`pip install exited with code ${code}, continuing anyway...`);
        resolve(); // Don't fail - deps may already be installed
      }
    });
    pip.on('error', (err) => {
      log(`pip install error: ${err.message}, continuing...`);
      resolve();
    });
  });
}

async function installPlaywright(): Promise<void> {
  return new Promise((resolve) => {
    log('Installing Playwright browsers...');
    const pw = spawn('python3', ['-m', 'playwright', 'install', 'chromium'], {
      cwd: SERVICE_DIR,
      stdio: ['ignore', fs.openSync(LOG_FILE, 'a'), fs.openSync(LOG_FILE, 'a')]
    });
    pw.on('close', (code) => {
      log(`Playwright install exited with code ${code}`);
      resolve();
    });
    pw.on('error', (err) => {
      log(`Playwright install error: ${err.message}`);
      resolve();
    });
  });
}

function startServer(): void {
  log(`Starting GMaps Scraper service on port ${PORT}...`);

  const env = { ...process.env, PORT: String(PORT), HOST: '0.0.0.0' };

  pythonProcess = spawn('python3', [
    '-m', 'uvicorn',
    'app.main:app',
    '--host', '0.0.0.0',
    '--port', String(PORT),
    '--log-level', 'info'
  ], {
    cwd: SERVICE_DIR,
    env,
    stdio: ['ignore', fs.openSync(LOG_FILE, 'a'), fs.openSync(LOG_FILE, 'a')]
  });

  pythonProcess.on('error', (err) => {
    log(`Server error: ${err.message}`);
  });

  pythonProcess.on('exit', (code, signal) => {
    log(`Server exited with code ${code}, signal ${signal}`);
    // Auto-restart after 5 seconds
    setTimeout(() => {
      log('Restarting GMaps Scraper service...');
      startServer();
    }, 5000);
  });

  log(`GMaps Scraper service started (PID: ${pythonProcess.pid})`);
}

async function main() {
  log('=== GMaps Scraper Service Launcher ===');

  await installDeps();
  await installPlaywright();
  startServer();

  // Keep process alive
  process.on('SIGINT', () => {
    log('Shutting down...');
    if (pythonProcess) pythonProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('Shutting down...');
    if (pythonProcess) pythonProcess.kill();
    process.exit(0);
  });
}

main().catch((err) => {
  log(`Fatal error: ${err.message}`);
  process.exit(1);
});

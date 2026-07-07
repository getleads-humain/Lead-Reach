// Simulate what the spawned pipeline-worker sees
console.log('cwd:', process.cwd());
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('checking db file...');
import { existsSync } from 'fs';
import { resolve } from 'path';
const dbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || '';
console.log('db path (raw):', dbPath);
console.log('db path (resolved):', resolve(dbPath));
console.log('db exists:', existsSync(dbPath));
console.log('db resolved exists:', existsSync(resolve(dbPath)));

// Now try Prisma
import { db } from '../src/lib/db';
async function main() {
  const count = await db.campaign.count();
  console.log('campaign count:', count);
}
main().then(() => process.exit(0)).catch(e => { console.error('PRISMA ERROR:', e.message); process.exit(1); });

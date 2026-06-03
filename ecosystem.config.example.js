// ============================================================
// LeadReach — PM2 Ecosystem Configuration (TEMPLATE)
// ============================================================
// Copy this file to ecosystem.config.js — it is gitignored.
//
// When running with PM2, ensure the .env file is loaded first:
//   pm2 start ecosystem.config.js --env production
//
// Or use node-foreman / dotenv-cli to preload .env:
//   dotenv -- pm2 start ecosystem.config.js
// ============================================================

module.exports = {
  apps: [{
    name: 'lead-reach',
    script: '.next/standalone/server.js',
    cwd: '/home/z/my-project',
    node_args: '--max-old-space-size=768',
    env: {
      NODE_ENV: 'production',
      HOSTNAME: '0.0.0.0',
      PORT: 3000,
      // All secrets read from environment — never hardcode
      DATABASE_URL: process.env.DATABASE_URL || '',
      DIRECT_URL: process.env.DIRECT_URL || '',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      ZHIPU_API_KEY: process.env.ZHIPU_API_KEY || '',
    }
  }]
};

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
      DATABASE_URL: 'postgresql://postgres:%5BNilay%409909250605%5D@db.ssaskkftdpidfwvpgdwl.supabase.co:5432/postgres',
      DIRECT_URL: 'postgresql://postgres:%5BNilay%409909250605%5D@db.ssaskkftdpidfwvpgdwl.supabase.co:5432/postgres',
      NEXT_PUBLIC_SUPABASE_URL: 'https://ssaskkftdpidfwvpgdwl.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTMyOTYsImV4cCI6MjA5NTU2OTI5Nn0.9B2yYStYtOVTHAAbJn3_czl7F5laVH6rT0VXX0MVScg',
      SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk5MzI5NiwiZXhwIjoyMDk1NTY5Mjk2fQ.5yna1hYhjqmzrLiqoTmVoKKsB6Fr90qILdkTVTqSyF0',
      ZHIPU_API_KEY: 'c68cdeade96b45fa8bf45fbd487707b2.cgpoWSZ5Ae8BHEdO',
    }
  }]
};

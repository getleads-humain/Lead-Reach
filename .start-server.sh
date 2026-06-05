#!/bin/bash
# LeadReach — Preview server (production mode for stability)
# Dev mode (webpack) crashes due to memory issues in constrained environments.
# Production mode is significantly more stable and uses less memory.
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=1024"
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NODE_ENV="production"
export HOSTNAME="0.0.0.0"
export PORT=3000

# Supabase credentials (required for auth middleware)
export NEXT_PUBLIC_SUPABASE_URL="https://ssaskkftdpidfwvpgdwl.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTMyOTYsImV4cCI6MjA5NTU2OTI5Nn0.9B2yYStYtOVTHAAbJn3_czl7F5laVH6rT0VXX0MVScg"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk5MzI5NiwiZXhwIjoyMDk1NTY5Mjk2fQ.5yna1hYhjqmzrLiqoTmVoKKsB6Fr90qILdkTVTqSyF0"
export ZHIPU_API_KEY="c68cdeade96b45fa8bf45fbd487707b2.cgpoWSZ5Ae8BHEdO"

exec node_modules/.bin/next start -p 3000 -H 0.0.0.0

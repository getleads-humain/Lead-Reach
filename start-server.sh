#!/bin/bash
# LeadReach AI - Production Server Start Script
# Sets up the environment and starts the Next.js standalone server

# Resolve the project root directory
PROJECT_ROOT="/home/z/my-project"
STANDALONE_DIR="$PROJECT_ROOT/.next/standalone"

# Ensure the database directory exists relative to the standalone server
# The Prisma schema uses "file:../db/custom.db" which is relative to the prisma directory
# But the standalone server runs from .next/standalone/, so we need to adjust
mkdir -p "$STANDALONE_DIR/db"

# Create symlink if the DB file doesn't exist in standalone dir
if [ ! -f "$STANDALONE_DIR/db/custom.db" ]; then
  # Copy or symlink the database from the project root
  if [ -f "$PROJECT_ROOT/db/custom.db" ]; then
    ln -sf "$PROJECT_ROOT/db/custom.db" "$STANDALONE_DIR/db/custom.db"
  fi
fi

# Also symlink prisma directory for schema access
if [ ! -d "$STANDALONE_DIR/prisma" ]; then
  ln -sf "$PROJECT_ROOT/prisma" "$STANDALONE_DIR/prisma"
fi

# Set environment variables
export DATABASE_URL="file:./db/custom.db"
export PORT=3000
export HOSTNAME="0.0.0.0"
export NODE_ENV="production"

# Start the server
cd "$STANDALONE_DIR"
exec node server.js

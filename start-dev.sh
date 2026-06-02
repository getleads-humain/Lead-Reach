#!/bin/bash
# LeadReach — Persistent dev server starter
# Uses webpack mode (Turbopack has a known panic bug with Next.js 16.2.x)
cd /home/z/my-project
exec node_modules/.bin/next dev -p 3000 -H 0.0.0.0 --webpack

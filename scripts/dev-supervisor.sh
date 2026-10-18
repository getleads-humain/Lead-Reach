#!/bin/bash
# Dev server supervisor — auto-restarts next dev if it dies.
cd /home/z/my-project
while true; do
  echo "[$(date '+%H:%M:%S')] starting next dev..." >> /tmp/supervisor.log
  npm run dev >> /tmp/dev.log 2>&1
  code=$?
  echo "[$(date '+%H:%M:%S')] next dev exited with code $code" >> /tmp/supervisor.log
  sleep 2
done

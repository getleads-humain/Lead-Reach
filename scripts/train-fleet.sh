#!/bin/bash
# LeadReach AI Workforce — full-fleet internet training driver
# Runs N rounds of trainAllOnce() via the live API (1 curriculum unit per agent per round).
# Idempotent + resumable: skips when the fleet reports no remaining units.
# Usage: nohup bash scripts/train-fleet.sh > /tmp/train-fleet.log 2>&1 &

BASE="${TRAIN_BASE:-http://localhost:3000}"
ROUNDS="${TRAIN_ROUNDS:-6}"
SLEEP_BETWEEN_ROUNDS="${TRAIN_SLEEP:-10}"

echo "[train-fleet] start $(date -Is) base=$BASE rounds=$ROUNDS"

for r in $(seq 1 "$ROUNDS"); do
  echo "[train-fleet] ── round $r/$ROUNDS $(date -Is)"
  resp=$(curl -s --max-time 900 -X POST -H "Content-Type: application/json" \
    -d '{"action":"train"}' "$BASE/api/workforce")
  if [ -z "$resp" ]; then
    echo "[train-fleet] round $r: EMPTY RESPONSE (server busy/restarting) — retrying in 60s"
    sleep 60
    resp=$(curl -s --max-time 900 -X POST -H "Content-Type: application/json" \
      -d '{"action":"train"}' "$BASE/api/workforce")
  fi
  echo "$resp" | node -e "
    let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
      try{const j=JSON.parse(s);
        const rows=(j.trained||[]).map(t=>\`  \${t.slug}: \${t.ok ? 'OK '+(t.topic||'') : 'ERR '+(t.error||'').slice(0,90)}\`);
        console.log(\`[train-fleet] round $r done: \${j.summary||('okCount='+j.okCount)}\`);
        if(rows.length) console.log(rows.join('\n'));
      }catch(e){console.log('[train-fleet] round $r unparsable:', s.slice(0,200));}
    })"
  sleep "$SLEEP_BETWEEN_ROUNDS"
done

echo "[train-fleet] finished $(date -Is)"

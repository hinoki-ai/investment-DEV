#!/bin/bash
cd /home/hinoki/HinokiDEV/Investments/web
npx wrangler login --browser=false 2>&1 &
PID=$!
sleep 4
kill $PID 2>/dev/null
wait $PID 2>/dev/null

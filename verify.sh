#!/bin/bash
echo "════════════════════════════════════════════════════════════════"
echo "  🔍 VERIFYING inv.aramac.dev"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "1. DNS Resolution:"
IP=$(dig +short inv.aramac.dev | head -1)
echo "   IP: $IP"
if [ -n "$IP" ]; then
    echo "   ✅ DNS is resolving"
else
    echo "   ❌ DNS not resolving"
fi

echo ""
echo "2. HTTP Status:"
STATUS=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 10 "https://inv.aramac.dev" 2>&1)
if [ "$STATUS" = "200" ]; then
    echo "   Status: $STATUS"
    echo "   ✅ Site is LIVE!"
else
    echo "   Status: $STATUS"
    echo "   ⏳ SSL may still be provisioning"
fi

echo ""
echo "3. API Test:"
API_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 10 "https://inv.aramac.dev/api/health" 2>&1)
if [ "$API_STATUS" = "200" ]; then
    echo "   Status: $API_STATUS"
    echo "   ✅ API is working!"
    echo ""
    echo "   Response:"
    curl -sS "https://inv.aramac.dev/api/health" 2>&1 | head -5
else
    echo "   Status: $API_STATUS"
    echo "   ⏳ API may still be initializing"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

if [ "$STATUS" = "200" ] && [ "$API_STATUS" = "200" ]; then
    echo "🎉 SUCCESS! inv.aramac.dev is FULLY OPERATIONAL!"
else
    echo "⏳ Still provisioning. Run this script again in 2-3 minutes."
fi

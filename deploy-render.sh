#!/bin/bash
# =============================================================================
# DEPLOY TO RENDER - Backend Deployment Script
# =============================================================================

set -e

echo "🚀 Investment Dashboard - Backend Deployment"
echo "=============================================="
echo ""

# Check if render CLI is logged in
if ! render config get 2>/dev/null | grep -q "email"; then
    echo "⚠️  You need to log in to Render first."
    echo ""
    echo "Please run: render login"
    echo "Then re-run this script."
    exit 1
fi

echo "✅ Render CLI authenticated"
echo ""

# Deploy using blueprint
echo "🔄 Deploying from blueprint..."
render blueprint apply --repo https://github.com/hinoki-ai/investment-DEV

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Monitor progress at: https://dashboard.render.com/"

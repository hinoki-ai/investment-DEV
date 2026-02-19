#!/bin/bash
# Deploy to Railway with PostgreSQL - Run this AFTER: railway login
set -e

echo "🚂 Deploying NEXUS to Railway..."

# Check login
if ! railway whoami &>/dev/null; then
    echo "❌ Not logged in. Run: railway login"
    exit 1
fi

# Create project if needed
if [ ! -d .railway ]; then
    echo "📁 Creating project..."
    mkdir -p .railway
    railway init --name nexus-investments
fi

# Add PostgreSQL (free tier, 500MB - plenty for 2 people)
echo "🐘 Setting up PostgreSQL..."
railway add --plugin postgresql || true

# Wait and get DATABASE_URL
echo "⏳ Getting database URL..."
sleep 3
DB_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")

if [ -z "$DB_URL" ]; then
    echo "⚠️  Database URL not ready yet. Check Railway dashboard."
    echo "Then set: railway variables set DATABASE_URL=<your-db-url>"
fi

# Deploy API service
echo "🚀 Deploying API..."
railway up --service api

# Deploy Worker service  
echo "🚀 Deploying Worker..."
railway up --service worker

# Set environment variables
echo "🔧 Setting env vars..."
railway variables set \
    ENVIRONMENT=production \
    STORAGE_ENDPOINT=https://f823a3f5752d5b771fddf73ea67c3056.r2.cloudflarestorage.com \
    STORAGE_ACCESS_KEY=d8500c48485fef1215439c5a76c47b5d \
    STORAGE_SECRET_KEY=bd6ab7634b7c9d6284af68e1a29035eeaf879c9251ebfd72a3d49151c6d0b863 \
    STORAGE_BUCKET=investments \
    STORAGE_REGION=auto \
    JWT_SECRET=$(openssl rand -hex 32) \
    CORS_ORIGINS="https://inv.aramac.dev,https://753f1c6c.investment-aramac.pages.dev" \
    KIMI_API_URL=https://api.moonshot.cn/v1 \
    KIMI_MODEL=kimi-k2-5 \
    WORKER_POLL_INTERVAL=10 \
    MAX_CONCURRENT_JOBS=2

echo ""
echo "✅ Deployment complete!"
echo "🌐 Dashboard: https://railway.app/project/$(cat .railway/project.json 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)"

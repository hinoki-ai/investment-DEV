#!/bin/bash
# Railway Setup Script - One-time browser auth, then fully automated
# Run: ./scripts/railway-setup.sh

set -e

echo "🚂 Railway PostgreSQL Setup"
echo "============================"

# Check if railway is logged in
if ! railway whoami &>/dev/null; then
    echo "⚠️  Railway login required (one-time)"
    echo "Running: railway login --browserless"
    echo ""
    echo "Follow the link to authenticate, then come back and run this script again."
    railway login --browserless
    exit 0
fi

echo "✅ Railway authenticated as: $(railway whoami | grep 'Email' | cut -d: -f2 | tr -d ' ')"

# Create project if not exists
if [ ! -f .railway/project.json ]; then
    echo "📁 Creating Railway project..."
    railway init --name nexus-investments
fi

PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
echo "📌 Project ID: $PROJECT_ID"

# Add PostgreSQL plugin
echo "🐘 Adding PostgreSQL..."
railway add --plugin postgresql

# Get database URL
echo "⏳ Waiting for database to be ready..."
sleep 5

# Link to get environment variables
railway link

# Get the DATABASE_URL
echo "🔑 Fetching database credentials..."
railway variables --json > .railway/vars.json 2>/dev/null || true

# Extract DATABASE_URL
DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")

if [ -n "$DATABASE_URL" ]; then
    echo ""
    echo "✅ PostgreSQL is ready!"
    echo ""
    echo "Add this to your .env file:"
    echo "DATABASE_URL=$DATABASE_URL"
    echo ""
    echo "Or run: railway variables set DATABASE_URL=$DATABASE_URL"
else
    echo "⚠️  Could not fetch DATABASE_URL automatically."
    echo "Go to Railway dashboard → nexus-investments → PostgreSQL → Connect"
fi

echo ""
echo "🚀 Next steps:"
echo "  1. Copy DATABASE_URL to your .env file"
echo "  2. Deploy API: railway up"
echo "  3. Deploy Worker: railway up --service worker"

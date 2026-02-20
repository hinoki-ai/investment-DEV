#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# NEXUS + PRISM - QUICK DEPLOY WRAPPER
# 
# This is a convenience wrapper for the full deployment script.
# For advanced options, use: ./prism/vv/deploy-all
#
# Quick commands:
#   ./deploy-nexus-prism.sh           # Full deployment
#   ./deploy-nexus-prism.sh --skip-apk  # Skip APK build (faster)
#   ./deploy-nexus-prism.sh --dry-run   # Test without deploying
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/prism/vv/deploy-all"

# Colors
C_RESET='\033[0m'
C_INFO='\033[36m'

if [[ ! -f "$DEPLOY_SCRIPT" ]]; then
    echo "Error: Deploy script not found at $DEPLOY_SCRIPT"
    exit 1
fi

echo -e "${C_INFO}Starting NEXUS + PRISM deployment...${C_RESET}"
echo ""

# Pass all arguments to the main script
exec "$DEPLOY_SCRIPT" "$@"

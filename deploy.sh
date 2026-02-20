#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# NEXUS + PRISM Parallel Deployment Pipeline
# Automated build and deploy without manual intervention
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ANDROID_HOME="${ANDROID_HOME:-/home/hinoki/android-sdk}"
APK_OUTPUT="mobile/android/app/build/outputs/apk/debug/app-debug.apk"
WEB_DIST="web/dist"
DEPLOY_LOG="/tmp/deploy-$(date +%Y%m%d-%H%M%S).log"

# Status tracking
APK_STATUS="⏳"
WEB_STATUS="⏳"
APK_URL=""
WEB_URL=""

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOY_LOG"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$DEPLOY_LOG"
}

# =============================================================================
# HEADER
# =============================================================================
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     NEXUS + PRISM Parallel Deployment Pipeline               ║"
echo "║     Build Android APK  +  Deploy Web to Vercel               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
log "Starting parallel deployment..."
log "Log: $DEPLOY_LOG"
echo ""

# =============================================================================
# APK BUILD FUNCTION (Background)
# =============================================================================
build_apk() {
    log "🔨 [APK] Starting Android build..."
    
    export ANDROID_HOME
    export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
    
    cd mobile/android
    
    if ./gradlew assembleDebug --console=plain >> "$DEPLOY_LOG" 2>&1; then
        if [[ -f "app/build/outputs/apk/debug/app-debug.apk" ]]; then
            APK_SIZE=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
            APK_STATUS="✅"
            success "[APK] Build successful - $APK_SIZE"
            APK_URL="file://$(pwd)/app/build/outputs/apk/debug/app-debug.apk"
            return 0
        else
            APK_STATUS="❌"
            error "[APK] Build completed but APK not found"
            return 1
        fi
    else
        APK_STATUS="❌"
        error "[APK] Build failed - check $DEPLOY_LOG"
        return 1
    fi
}

# =============================================================================
# WEB DEPLOY FUNCTION (Background)
# =============================================================================
deploy_web() {
    log "🚀 [WEB] Starting Vercel deployment..."
    
    cd web
    
    # Check if dist exists
    if [[ ! -d "dist" ]]; then
        warn "[WEB] dist/ not found, building first..."
        if ! npm run build >> "$DEPLOY_LOG" 2>&1; then
            WEB_STATUS="❌"
            error "[WEB] Build failed"
            return 1
        fi
    fi
    
    # Deploy to Vercel (non-interactive)
    # Using --prebuilt since we already have dist/
    if vercel deploy --prebuilt --yes --token "" 2>&1 | tee -a "$DEPLOY_LOG" | grep -oE 'https://[^[:space:]]+\.vercel\.app' | head -1 > /tmp/web_url.txt; then
        WEB_URL=$(cat /tmp/web_url.txt)
        WEB_STATUS="✅"
        success "[WEB] Deployed to $WEB_URL"
        return 0
    else
        # Try without token (for already linked projects)
        if vercel deploy --prebuilt --yes 2>&1 | tee -a "$DEPLOY_LOG" | grep -oE 'https://[^[:space:]]+\.vercel\.app' | head -1 > /tmp/web_url.txt; then
            WEB_URL=$(cat /tmp/web_url.txt)
            WEB_STATUS="✅"
            success "[WEB] Deployed to $WEB_URL"
            return 0
        else
            WEB_STATUS="❌"
            error "[WEB] Deployment failed - check $DEPLOY_LOG"
            return 1
        fi
    fi
}

# =============================================================================
# PRE-CHECKS
# =============================================================================
log "Running pre-checks..."

# Check Android SDK
if [[ ! -d "$ANDROID_HOME" ]]; then
    error "Android SDK not found at $ANDROID_HOME"
    exit 1
fi

# Check Vercel CLI
if ! command -v vercel &>/dev/null; then
    error "Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

# Check Java
if ! command -v java &>/dev/null; then
    error "Java not found"
    exit 1
fi

success "Pre-checks passed"
echo ""

# =============================================================================
# PARALLEL EXECUTION
# =============================================================================
log "Launching parallel jobs..."

# Start APK build in background
build_apk &
APK_PID=$!

# Start web deploy in background
deploy_web &
WEB_PID=$!

# =============================================================================
# PROGRESS MONITORING
# =============================================================================
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  Job          Status    Details                              ${BLUE}║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════════╣${NC}"

# Monitor both jobs
while kill -0 $APK_PID 2>/dev/null || kill -0 $WEB_PID 2>/dev/null; do
    printf "\r${BLUE}║${NC}  Android APK  $APK_STATUS      %-35s ${BLUE}║${NC}" "${APK_URL:+Built}"
    sleep 0.5
    printf "\r${BLUE}║${NC}  PRISM Web    $WEB_STATUS      %-35s ${BLUE}║${NC}" "${WEB_URL:+Deployed}"
    sleep 0.5
done

# Wait for completion and get exit codes
wait $APK_PID
APK_EXIT=$?

wait $WEB_PID
WEB_EXIT=$?

echo ""
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# RESULTS
# =============================================================================
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}                     DEPLOYMENT RESULTS                        ${BLUE}║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════════╣${NC}"

if [[ $APK_EXIT -eq 0 ]]; then
    APK_SIZE=$(du -h mobile/android/app/build/outputs/apk/debug/app-debug.apk 2>/dev/null | cut -f1 || echo "Unknown")
    echo -e "${BLUE}║${NC}  📱 Android APK                                               ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}     Status: ${GREEN}SUCCESS${NC}                                          ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}     Size:   $APK_SIZE                                          ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}     Path:   $APK_OUTPUT                     ${BLUE}║${NC}"
else
    echo -e "${BLUE}║${NC}  📱 Android APK                                               ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}     Status: ${RED}FAILED${NC}                                           ${BLUE}║${NC}"
fi

echo -e "${BLUE}║${NC}                                                               ${BLUE}║${NC}"

if [[ $WEB_EXIT -eq 0 ]] && [[ -n "$WEB_URL" ]]; then
    echo -e "${BLUE}║${NC}  🌐 PRISM Web                                                 ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}     Status: ${GREEN}SUCCESS${NC}                                          ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}     URL:    $WEB_URL                        ${BLUE}║${NC}"
else
    echo -e "${BLUE}║${NC}  🌐 PRISM Web                                                 ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}     Status: ${RED}FAILED${NC}                                           ${BLUE}║${NC}"
fi

echo -e "${BLUE}╠═══════════════════════════════════════════════════════════════╣${NC}"

# Overall status
if [[ $APK_EXIT -eq 0 ]] && [[ $WEB_EXIT -eq 0 ]]; then
    echo -e "${BLUE}║${NC}  ${GREEN}🎉 All deployments successful!${NC}                              ${BLUE}║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    log "Deployment complete! 🚀"
    exit 0
else
    echo -e "${BLUE}║${NC}  ${RED}⚠️  Some deployments failed${NC}                                ${BLUE}║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    error "Check logs: $DEPLOY_LOG"
    exit 1
fi

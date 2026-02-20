#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# AI Auto-Deploy: Parallel APK Build + Vercel Deploy
# Usage: ./auto-deploy.sh [--skip-apk] [--skip-web] [--token TOKEN]
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
R='\033[0;31m'
G='\033[0;32m'
Y='\033[1;33m'
B='\033[0;34m'
C='\033[0;36m'
NC='\033[0m'

# Flags
SKIP_APK=false
SKIP_WEB=false
VERCEL_TOKEN=""
PROD=true

# Parse args
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-apk) SKIP_APK=true; shift ;;
        --skip-web) SKIP_WEB=true; shift ;;
        --token) VERCEL_TOKEN="$2"; shift 2 ;;
        --preview) PROD=false; shift ;;
        *) shift ;;
    esac
done

# Config
ANDROID_HOME="${ANDROID_HOME:-/home/hinoki/android-sdk}"
APK_PATH="mobile/android/app/build/outputs/apk/debug/app-debug.apk"

echo -e "${B}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║                    🤖 AI AUTO-DEPLOY                          ║
║          NEXUS Android  +  PRISM Web Dashboard               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# =============================================================================
# APK BUILD
# =============================================================================
build_apk() {
    echo -e "\n${C}▶ Building NEXUS Android APK...${NC}"
    
    export ANDROID_HOME
    export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
    
    cd mobile/android
    
    if ./gradlew assembleDebug --console=plain; then
        if [[ -f "app/build/outputs/apk/debug/app-debug.apk" ]]; then
            local size=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
            echo -e "${G}✓ APK built: $size${NC}"
            echo -e "${C}  → $(pwd)/app/build/outputs/apk/debug/app-debug.apk${NC}"
            return 0
        fi
    fi
    return 1
}

# =============================================================================
# WEB DEPLOY
# =============================================================================
deploy_web() {
    echo -e "\n${C}▶ Deploying PRISM Web to Vercel...${NC}"
    
    cd web
    
    # Build if needed
    if [[ ! -d "dist" ]] || [[ "$(find dist -type f 2>/dev/null | wc -l)" -eq 0 ]]; then
        echo -e "${Y}  Building web...${NC}"
        npm run build
    fi
    
    # Deploy
    local deploy_args=("--prebuilt" "--yes")
    
    if [[ "$PROD" == true ]]; then
        deploy_args+=("--prod")
    fi
    
    if [[ -n "$VERCEL_TOKEN" ]]; then
        deploy_args+=("--token" "$VERCEL_TOKEN")
    fi
    
    echo -e "${Y}  Running: vercel ${deploy_args[*]}${NC}"
    
    # Capture output and extract URL
    local output_file=$(mktemp)
    if vercel "${deploy_args[@]}" 2>&1 | tee "$output_file"; then
        local url=$(grep -oE 'https://[^[:space:]]+\.vercel\.app' "$output_file" | head -1)
        if [[ -n "$url" ]]; then
            echo -e "\n${G}✓ Web deployed:${NC} $url"
            rm -f "$output_file"
            return 0
        fi
    fi
    
    rm -f "$output_file"
    return 1
}

# =============================================================================
# MAIN
# =============================================================================
START_TIME=$(date +%s)
APK_OK=false
WEB_OK=false

# Build APK
if [[ "$SKIP_APK" == false ]]; then
    if build_apk; then
        APK_OK=true
    else
        echo -e "${R}✗ APK build failed${NC}"
    fi
else
    echo -e "${Y}⊘ APK build skipped${NC}"
    APK_OK=true
fi

# Deploy Web
if [[ "$SKIP_WEB" == false ]]; then
    if deploy_web; then
        WEB_OK=true
    else
        echo -e "${R}✗ Web deploy failed${NC}"
    fi
else
    echo -e "${Y}⊘ Web deploy skipped${NC}"
    WEB_OK=true
fi

# Summary
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n${B}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${B}║${NC}                      DEPLOYMENT SUMMARY                       ${B}║${NC}"
echo -e "${B}╠═══════════════════════════════════════════════════════════════╣${NC}"

if [[ "$APK_OK" == true ]]; then
    APK_SIZE=$(du -h "$APK_PATH" 2>/dev/null | cut -f1 || echo "?")
    echo -e "${B}║${NC}  📱 Android APK  ${G}✓ SUCCESS${NC}  ($APK_SIZE)                         ${B}║${NC}"
else
    echo -e "${B}║${NC}  📱 Android APK  ${R}✗ FAILED${NC}                                   ${B}║${NC}"
fi

if [[ "$WEB_OK" == true ]]; then
    echo -e "${B}║${NC}  🌐 PRISM Web    ${G}✓ SUCCESS${NC}                                   ${B}║${NC}"
else
    echo -e "${B}║${NC}  🌐 PRISM Web    ${R}✗ FAILED${NC}                                   ${B}║${NC}"
fi

echo -e "${B}╠═══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${B}║${NC}  ⏱️  Duration: ${DURATION}s                                       ${B}║${NC}"
echo -e "${B}╚═══════════════════════════════════════════════════════════════╝${NC}"

if [[ "$APK_OK" == true && "$WEB_OK" == true ]]; then
    echo -e "\n${G}🎉 All done!${NC}\n"
    exit 0
else
    echo -e "\n${R}⚠️  Some tasks failed${NC}\n"
    exit 1
fi

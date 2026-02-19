# VV - ARAMAC Vercel Deployer

**Project:** Investments Dashboard (inv.aramac.dev)  
**Location:** `./vv/` (project-local copy)

Unified deployment script for this project with Convex and Vercel support.

## Features

- 🚀 Dual deployment (Convex + Vercel)
- 📊 Unified segmented panel UI
- 🎨 Color-coded status indicators
- ⏱️ Live timestamp display
- 🔍 Pre-flight checks

## Usage

```bash
# From project root
./vv/vv                    # Deploy to production
VV_PROD=false ./vv/vv      # Deploy to preview
VV_DRY_RUN=true ./vv/vv    # Dry run
```

## Configuration

Edit `.vvrc` in the project root or set environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VV_PROD` | Deploy to production | `true` |
| `VV_DRY_RUN` | Simulate without deploying | `false` |
| `VV_VERBOSE` | Show detailed output | `true` |
| `VV_OPEN` | Open browser after deploy | `true` |
| `VV_TOKEN` | Vercel API token | - |
| `VV_SCOPE` | Vercel team scope | - |

## Colors

- ΛRΛMΛC: Orange
- Vercel Deployer: Purple  
- Timestamp: White (centered)
- OK checks: Green
- Panel titles: Various

## Version

0.12.5

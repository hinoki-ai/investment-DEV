# PRISM + NEXUS — Future Requirements & Roadmap

> Last updated: 2026-02-20  
> Status: Living document — update as features ship

---

## Table of Contents

1. [Immediate Fixes (Ship Now)](#1-immediate-fixes-ship-now)
2. [Architecture Improvements](#2-architecture-improvements)
3. [PRISM Web — New Features](#3-prism-web--new-features)
4. [NEXUS Android — New Features](#4-nexus-android--new-features)
5. [API & Backend Enhancements](#5-api--backend-enhancements)
6. [AI & Intelligence Layer](#6-ai--intelligence-layer)
7. [Content That Needs Writing](#7-content-that-needs-writing)
8. [Security (Practical, Not Overkill)](#8-security-practical-not-overkill)
9. [Performance & Scalability](#9-performance--scalability)
10. [Design & UX Polish](#10-design--ux-polish)
11. [DevOps & Infrastructure](#11-devops--infrastructure)
12. [Long-Term Vision](#12-long-term-vision)

---

## 1. Immediate Fixes (Ship Now)

These are bugs or gaps found in the current codebase that should be fixed before anything else.

### 1.1 Layout Width Mismatch
- **File**: `web/src/components/Layout.tsx`
- **Issue**: Sidebar is `w-72` (288px) but main content offset is `lg:ml-64` (256px) — causes 32px overlap
- **Fix**: Change `lg:ml-64` → `lg:ml-72` (or match both to the same value)

### 1.2 Delete Stale File
- **File**: `api/=0.2.36` — 34-byte garbage file from a `pip install` typo
- **Fix**: `rm prism/api/=0.2.36`

### 1.3 Add Missing Test Runner
- **File**: `web/package.json`
- **Issue**: `vitest.config.ts` exists but `vitest` is NOT in devDependencies
- **Fix**: `npm install -D vitest @vitest/coverage-v8`

### 1.4 Add React Error Boundary
- **File**: `web/src/App.tsx`
- **Issue**: No error boundary — any unhandled render error crashes the entire app
- **Fix**: Wrap `<Routes>` in an `ErrorBoundary` component with a friendly fallback UI

### 1.5 Fix `datetime.utcnow` Deprecation
- **Files**: `api/models.py` (12+ occurrences)
- **Issue**: `datetime.utcnow` is deprecated in Python 3.12+
- **Fix**: Replace with `datetime.now(timezone.utc)` everywhere

### 1.6 Remove Deploy Trigger Comment
- **File**: `web/src/main.tsx` line 26
- **Issue**: `// Deploy trigger 1771549373` is leftover noise
- **Fix**: Delete the line

### 1.7 Fix Double Logging Configuration
- **File**: `api/logging_config.py`
- **Issue**: `structlog.configure()` called twice (lines 75 and 91), plus `configure_logging()` runs both on import (L267) and in `main.py` (L22)
- **Fix**: Remove the second `structlog.configure()` call and the module-level `configure_logging()` at L267

---

## 2. Architecture Improvements

### 2.1 API Versioning Strategy
- Current: All routes under `/api/v1/`
- **Future**: When breaking changes come, mount under `/api/v2/` alongside v1
- Keep v1 alive for 6+ months during any transition
- Add version header `X-API-Version` to responses

### 2.2 State Management (Frontend)
- Currently using TanStack Query for server state (good)
- Zustand is installed but barely used
- **Future**: Use Zustand for:
  - User preferences / settings
  - UI state (selected filters, sidebar state)
  - Offline queue for mobile-like experience

### 2.3 Shared Types Between API and Web
- **Current**: Types are duplicated — Python models in `api/models.py`, TypeScript types in `web/src/lib/api.ts`
- **Future**: Consider generating TypeScript types from OpenAPI schema
  - Tool: `openapi-typescript` — generates types from FastAPI's auto-generated OpenAPI spec
  - Command: `npx openapi-typescript http://localhost:8000/openapi.json -o src/lib/api-types.ts`

### 2.4 Database Session Improvements
- Add `expire_on_commit=False` to `AsyncSessionLocal` for better caching behavior
- Consider connection pooling with PgBouncer for production

### 2.5 Event-Driven Updates
- **Current**: Frontend polls for data via React Query
- **Future**: Add WebSocket support for real-time updates:
  - File upload progress
  - AI analysis completion notifications
  - Dashboard live stats
- Use FastAPI's built-in WebSocket support + Redis pub/sub

---

## 3. PRISM Web — New Features

### 3.1 Dashboard Enhancements
- [ ] Portfolio performance chart (line chart over time using valuation history)
- [ ] Monthly/quarterly return comparison bars
- [ ] Goal tracker widget (target portfolio value vs. current)
- [ ] Currency conversion display (BRL ↔ USD ↔ CLP)
- [ ] "Quick add" investment button directly from dashboard

### 3.2 Investments Page
- [ ] Bulk edit mode (select multiple, batch update category/status)
- [ ] Map view for land investments (integrate Leaflet or Mapbox)
- [ ] Photo gallery per investment
- [ ] Attachment preview (PDF viewer inline)
- [ ] Export to CSV/Excel
- [ ] Print-friendly investment report

### 3.3 Analytics Page
- [ ] Portfolio allocation treemap (interactive)
- [ ] Monte Carlo simulation visualization
- [ ] Correlation matrix heatmap between investments
- [ ] Historical benchmark comparison chart
- [ ] Tax impact calculator

### 3.4 Chat / AI Assistant
- [ ] Chat history persistence (save conversations to DB)
- [ ] Pre-built prompt templates ("Analyze my portfolio", "Compare my lands", etc.)
- [ ] Voice input (Web Speech API)
- [ ] Export chat as PDF report
- [ ] Attach investment context with one click

### 3.5 Files & Documents
- [ ] Drag-and-drop upload zone
- [ ] Document preview (PDF inline viewer, image lightbox)
- [ ] Folder/tag organization system
- [ ] Bulk upload with progress
- [ ] OCR preview before AI analysis

### 3.6 Settings Page (New)
- [ ] User profile (name, email, avatar)
- [ ] Notification preferences
- [ ] API key management (for external integrations)
- [ ] Theme toggle (dark/light — light mode based on cream palette)
- [ ] Language selection (es/en/pt)
- [ ] Currency preference (BRL/CLP/USD)

### 3.7 Notifications System (New)
- [ ] In-app notification bell
- [ ] AI analysis completed alerts
- [ ] Investment value threshold alerts
- [ ] Upload confirmation notifications

---

## 4. NEXUS Android — New Features

### 4.1 Core Improvements
- [ ] Fix deprecated `getParcelableExtra` — use compat version for Android 13+
- [ ] Add Settings screen (currently described in README but not implemented)
- [ ] Connection status indicator with auto-reconnect
- [ ] Pull-to-refresh file list

### 4.2 New Screens
- [ ] **Dashboard screen** — mirror key portfolio stats from web
- [ ] **Investment list** — browse investments with search/filter
- [ ] **Quick capture** — camera integration for photographing documents
- [ ] **Notification center** — push notifications for analysis completion

### 4.3 Offline Support
- [ ] Queue uploads when offline, auto-sync when connected
- [ ] Cache recent portfolio data for offline viewing
- [ ] Store settings in DataStore (already set up)

### 4.4 Navigation
- [ ] Bottom navigation bar (Dashboard / Upload / Files / Settings)
- [ ] Add Navigation Compose for multi-screen flow
- [ ] Deep links from notifications to specific investments

### 4.5 Upload Enhancements
- [ ] Background upload with WorkManager (dependency exists, needs implementation)
- [ ] Upload progress notification in system tray
- [ ] Auto-categorize documents by file name/type
- [ ] Batch rename before upload

### 4.6 Play Store Preparation
- [ ] ProGuard/R8 minification (currently disabled)
- [ ] Proper release signing with secure keystore
- [ ] Privacy policy page
- [ ] App screenshots (5+ for different screens)
- [ ] Feature graphic (1024x500)
- [ ] Short and full description copy

---

## 5. API & Backend Enhancements

### 5.1 New Endpoints Needed
- [ ] `GET /api/v1/investments/{id}/valuations` — valuation history for charts
- [ ] `POST /api/v1/investments/{id}/valuations` — add manual valuation
- [ ] `GET /api/v1/dashboard/timeline` — portfolio value over time
- [ ] `GET /api/v1/notifications` — user notifications
- [ ] `POST /api/v1/exports/pdf` — generate PDF reports
- [ ] `GET /api/v1/market-data/historical` — historical market data
- [ ] `WebSocket /ws/updates` — real-time event stream

### 5.2 Rate Limiting
- Add rate limiting middleware (currently described in API docs but not implemented)
- Suggested: `slowapi` library for FastAPI
- Limits:
  - Standard: 100 req/min
  - Uploads: 10/min
  - AI Analysis: 5/min
  - Chat: 20/min

### 5.3 Caching Strategy Improvements
- [ ] Add `staleTime` configuration to React Query (suggest 30s for dashboard, 60s for investments)
- [ ] Server-side: ETag support for conditional requests
- [ ] Redis cache warming on startup for dashboard stats

### 5.4 Background Jobs
- [ ] Scheduled valuation updates (daily market price fetch)
- [ ] Weekly portfolio summary email/report generation
- [ ] Automated backup scheduling
- [ ] Stale upload cleanup (delete pending uploads older than 24h)

### 5.5 Multi-Currency Support
- [ ] Store original currency per investment (already have `purchase_currency`)
- [ ] Auto-fetch exchange rates (USD/BRL, USD/CLP, BRL/CLP)
- [ ] Display all values in user's preferred currency
- [ ] Historical exchange rate tracking

---

## 6. AI & Intelligence Layer

### 6.1 Current Providers
- ✅ Kimi K2.5 (primary)
- ✅ OpenAI GPT-4o (secondary)
- ✅ Anthropic Claude (secondary)

### 6.2 AI Feature Roadmap
- [ ] **Smart document classification** — auto-detect document type on upload
- [ ] **Investment recommendations** — based on portfolio analysis
- [ ] **Natural language querying** — "How much did my land investments grow last year?"
- [ ] **Document comparison** — compare two contracts side by side
- [ ] **Automated valuation** — estimate land values based on comparable sales data
- [ ] **Risk alerts** — AI-generated warnings about portfolio concentration

### 6.3 AI Infrastructure
- [ ] Add response streaming to chat (SSE is set up, needs frontend integration polish)
- [ ] Implement prompt versioning (track which prompts generate best results)
- [ ] Add AI response quality scoring
- [ ] Cost tracking per provider (tokens × price)
- [ ] Fallback chain: If Kimi fails → try GPT-4o → try Claude

---

## 7. Content That Needs Writing

Every location across the app that needs human-written content, copy, or descriptions.

### 7.1 Web Pages — Empty States & Onboarding

| Location | What's Needed |
|----------|---------------|
| Dashboard — no investments | Welcome message + "Add your first investment" CTA with explanation |
| Dashboard — no files | Upload prompt with supported file types |
| Investments — empty list | Onboarding guide: what types of investments to track |
| Files — empty list | Upload instructions with drag-drop visual |
| Analytics — no data | Explanation of what analytics become available as data grows |
| Chat — first use | Welcome message from AI assistant with example prompts |
| Land Analyzer — empty | Overview of what the tool does + sample analysis preview |

### 7.2 Investment Categories — Descriptions

| Category | Needs |
|----------|-------|
| Terrenos (Land) | Description of what land investments include, key metrics to track |
| Acciones (Stocks) | Stock tracking explanation, data sources |
| Oro (Gold) | Gold investment types (physical, ETF), pricing sources |
| Crypto | Crypto tracking capabilities, supported assets |
| Inmuebles (Real Estate) | Property investment tracking, rental yield |
| Bonos (Bonds) | Bond types, maturity tracking |
| Otros (Other) | Catch-all category explanation |

### 7.3 Form Fields — Helper Text

| Form | Fields Needing Help Text |
|------|-------------------------|
| Add Investment | All fields need placeholder text and helper descriptions |
| Upload File | Document type selector needs descriptions |
| Chat | Context attachment UI needs instructions |
| Land Analyzer | Calculator inputs need unit explanations |

### 7.4 Market Data Ticker
- Each metric needs a tooltip explaining what it is
- Data source attribution text
- "Markets closed" / "Pre-market" status messages
- Error state: user-friendly "market data temporarily unavailable"

### 7.5 AI Analysis Results
- Summary formatting templates
- Confidence score explanation
- "What does this mean?" contextual help per analysis type
- Actionable recommendations formatting

### 7.6 Project Documentation

| File | Content Needs |
|------|---------------|
| `README.md` | Replace placeholder author, homepage, repo URLs |
| `STRUCTURE.md` | Fix path `mobile/android` → `nexus/mobile`; add Nexus section |
| `package.json` (root) | Update name, author, homepage, repository |
| `CONTRIBUTING.md` | Add mobile development workflow |
| `CHANGELOG.md` | Update to current version history |
| `.env.example` | Add clear inline docs for every variable |

### 7.7 SEO & Meta

| Item | What's Needed |
|------|---------------|
| `og:title` | Page-specific Open Graph titles |
| `og:description` | Compelling meta descriptions per page |
| `og:image` | Social sharing preview image |
| `robots.txt` | Create in `web/public/` |
| `sitemap.xml` | Not needed for SPA, but good for crawlable routes |
| `site.webmanifest` | Referenced in HTML but may not exist — create it |

### 7.8 Nexus Android — Copy

| Screen | Content Needs |
|--------|---------------|
| Upload screen | Upload tips, supported formats, size limits |
| Empty state | First-use onboarding message |
| Error messages | User-friendly error copy for each failure type |
| Settings (when built) | Field descriptions, connection help |
| Play Store listing | Title, short description, full description, changelog |

---

## 8. Security (Practical, Not Overkill)

Keep it simple. This is a family tool, not a bank.

### 8.1 Basic Authentication
- [ ] Add a simple PIN/password gate on the web app
- [ ] Option: Single shared password stored as env var, checked on first load
- [ ] Option: Simple JWT with one user account (no registration flow needed)
- [ ] Store token in localStorage, auto-expire after 30 days

### 8.2 Credential Cleanup
- [ ] Remove hardcoded DB fallback password from `database.py`
- [ ] Move Android release keystore password to environment / CI secrets
- [ ] Ensure `.env` is in `.gitignore` (already is, just verify)

### 8.3 API Protection
- [ ] Add basic API key header check for mobile requests (`X-API-Key`)
- [ ] CORS already configured — keep it locked to known origins
- [ ] Rate limiting (see section 5.2)

### 8.4 Don't Bother With
- ❌ OAuth2 / social login — overkill for family use
- ❌ Role-based access control — everyone is admin
- ❌ Encryption at rest — hosting provider handles this
- ❌ WAF / DDoS protection — not a public-facing product
- ❌ Security audit / pen testing — not needed at this scale

---

## 9. Performance & Scalability

### 9.1 Frontend Performance
- [ ] Add `staleTime: 30_000` to React Query default options (avoid re-fetching on every navigation)
- [ ] Lazy-load `CreditAnalysis.tsx` (50KB — largest component)
- [ ] Add `loading="lazy"` to all images
- [ ] Consider `react-window` or `tanstack-virtual` for large investment lists (50+ items)
- [ ] Preload critical routes with `<link rel="prefetch">`

### 9.2 API Performance
- [ ] Add database query timing to logs (already have `DB_QUERY_DURATION_SECONDS` metric, wire it up)
- [ ] Index `file_registry.uploaded_at` for dashboard recent uploads query
- [ ] Batch Yahoo Finance API calls (already doing this — maintain)
- [ ] Add connection pool monitoring

### 9.3 Scalability When Needed
- [ ] Worker horizontal scaling: Add Redis-based distributed lock to `_claim_job` to prevent double-processing
- [ ] Database read replicas (when data grows past 10K investments)
- [ ] CDN for static assets (Vercel already handles this for web)
- [ ] Consider edge caching for market data (5-minute TTL)

---

## 10. Design & UX Polish

### 10.1 Accessibility
- [ ] Add `aria-label` to all icon-only buttons
- [ ] Add `aria-current="page"` to active navigation items
- [ ] Ensure all interactive elements have `focus-visible` styles
- [ ] Add skip-to-content link
- [ ] Test with screen reader (VoiceOver / TalkBack)

### 10.2 Responsive Design
- [ ] Test and fix all pages at 320px width (smallest phones)
- [ ] Add landscape tablet layout optimization
- [ ] Charts should resize gracefully (some may overflow on mobile)

### 10.3 Animations
- [ ] Add `prefers-reduced-motion` media query support
- [ ] Page transition animations between routes
- [ ] Skeleton loaders on all pages (Dashboard has one, others don't)

### 10.4 Visual Enhancements
- [ ] Add favicon set for all platforms (currently only PNG)
- [ ] Light mode theme option (warm cream on white)
- [ ] Loading progress bar at top of page (NProgress style)
- [ ] Toast notifications for actions (success/error)

---

## 11. DevOps & Infrastructure

### 11.1 CI/CD
- [ ] Add build verification step for web (currently only lint)
- [ ] Add Docker build test in CI
- [ ] Auto-deploy to staging on PR merge
- [ ] Auto-deploy to production on tag/release

### 11.2 Monitoring
- [ ] Connect Prometheus metrics to Grafana dashboard
- [ ] Add uptime monitoring (UptimeRobot or similar — free tier)
- [ ] Add error alerting (Sentry free tier for web + API)
- [ ] Log aggregation (Grafana Loki or just structured JSON logs)

### 11.3 Backups
- [ ] Automated daily PostgreSQL backups to R2/S3
- [ ] Backup verification script (restore to test DB and validate)
- [ ] Document restore procedure

### 11.4 Environments
- [ ] Staging environment (separate DB, same infrastructure)
- [ ] Environment-specific configs already exist (`docker-compose.prod.yml`) — verify they work
- [ ] Add health check endpoint monitoring in production

---

## 12. Long-Term Vision

### 12.1 Multi-Family / Multi-User (If Ever Needed)
- Tenant isolation at database level
- Per-user investment ownership
- Shared vs. private investments
- Family member invite system

### 12.2 Mobile Expansion
- iOS companion app (SwiftUI mirror of Nexus)
- PWA support for web (service worker, offline cache)
- Widget for Android home screen (portfolio value at a glance)

### 12.3 Integrations
- [ ] Bank account linking (Open Banking APIs)
- [ ] Broker integration (fetch stock portfolio automatically)
- [ ] Google Sheets export/sync
- [ ] WhatsApp bot for quick queries ("What's my portfolio worth?")

### 12.4 Data & Analytics
- [ ] Machine learning price prediction for land investments
- [ ] Automated comparable sales analysis
- [ ] Tax optimization suggestions
- [ ] Inflation-adjusted return calculations
- [ ] Geographic investment concentration analysis with maps

---

## Priority Matrix

| Priority | Category | Effort | Impact |
|----------|----------|--------|--------|
| 🔴 P0 | Immediate fixes (Section 1) | Low | High |
| 🟠 P1 | Content writing (Section 7) | Medium | High |
| 🟠 P1 | Nexus Settings screen | Medium | Medium |
| 🟡 P2 | Dashboard charts & timeline | Medium | High |
| 🟡 P2 | Rate limiting | Low | Medium |
| 🟡 P2 | Basic auth gate | Low | Medium |
| 🟢 P3 | WebSocket real-time updates | High | Medium |
| 🟢 P3 | Multi-currency support | Medium | Medium |
| 🔵 P4 | iOS app | Very High | Medium |
| 🔵 P4 | Multi-user support | Very High | Low (for now) |

---

*This is a living document. Check items off as they ship. Add new ideas as they come.*

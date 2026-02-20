# NEXUS & PRISM - Agent Guide

This document provides essential context for AI coding agents working on this project.

---

## 🚨 MEGA RULE: CLI-First Self-Sufficiency

> **Agents MUST attempt to solve ALL tasks themselves using CLI tools and services before asking for user intervention.**

### Core Principles:

1. **Try Everything Yourself First**
   - Use available Shell commands, system tools, and CLI utilities to investigate and fix issues
   - Exhaust all programmatic solutions before requesting user help
   - Research error messages online using web search when stuck

2. **CLI Over GUI**
   - Prefer command-line interfaces over graphical ones
   - Use package managers (`npm`, `pip`, `apt`, etc.) programmatically
   - Automate setup and configuration via scripts

3. **No "I Cannot" Without Exhaustion**
   - Before stating a limitation, confirm:
     - [ ] All relevant files have been examined
     - [ ] All applicable tools have been tried
     - [ ] Online documentation has been consulted
     - [ ] Alternative approaches have been attempted

4. **Proactive Exploration**
   - Don't wait for permission to investigate
   - Read config files, logs, and source code proactively
   - Use `grep`, `find`, `cat`, and other tools to understand the system

### When You MAY Ask for Help:

- Missing credentials or secrets required for external services
- Ambiguous requirements where user intent is unclear
- Irreversible destructive operations (deleting production data)
- Legal or ethical concerns

---

## 🔥 REAL TALK: This Is a Personal Tool

> **This app is built for exactly 2 people: me and my wife.**

### What This Means for Development:

| Aspect | Policy | Why |
|--------|--------|-----|
| **Tests** | Skip 'em | Not shipping to customers, just need it to work for us |
| **Multi-user security** | Not a priority | Only 2 trusted users, no strangers |
| **Auth/permissions** | Keep it simple | If you have the URL, you're one of us |
| **Edge cases** | Handle only OUR real cases | Don't build for hypothetical users |
| **Documentation** | Our needs only | Write what WE need to remember |

### Build for Reality, Not Perfection:
- We know what investments we have -> don't need fancy onboarding
- We trust each other -> don't need audit logs or access control
- We know the codebase -> don't need defensive coding for "future maintainers"
- **We change our minds** -> keep it flexible, easy to hack on

### When in Doubt:
**Ask: "Does this solve OUR actual problem right now?"**
- Yes -> Do it, ship it, move on
- No -> Skip it, document the idea, come back if it hurts

---

## Project Overview

**NEXUS** is the intelligence and coordination engine (backend API + AI worker). **PRISM** is the web dashboard (React frontend). Together they form a personal investment tracking system designed for family asset management.

### Key Features
- Direct phone uploads to storage (no file passes through API)
- Multi-provider AI document analysis (Kimi K2.5, OpenAI GPT-4o, Anthropic Claude, Google Gemini, Ollama)
- PRISM web dashboard for portfolio management
- Native Android app for mobile uploads
- Multi-device access (phones, laptops, tablets)
- Structured storage organization

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 1: STORAGE                            │
│                     Raw binary files only                        │
│              (Cloudflare R2 / AWS S3 / MinIO)                    │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: COORDINATION                         │
│                      (PostgreSQL + Redis)                        │
│   • File registry    • Processing jobs    • Investment data      │
│   • State machine    • Relationships      • Activity log         │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                   LAYER 3: INTELLIGENCE                          │
│        (Multi-Provider: Kimi, GPT-4o, Claude, Gemini, Ollama)    │
│   • Document OCR     • Entity extraction  • Valuation analysis   │
│   • Summarization    • Contract parsing   • Risk detection       │
└─────────────────────────────────────────────────────────────────┘
```

### Service Communication Flow

```
Phone → POST /api/v1/uploads/request-url
              ↓
         Get pre-signed URL (valid 5 min)
              ↓
Phone → PUT {pre-signed-url} (uploads directly to R2/S3)
              ↓
Phone → POST /api/v1/uploads/confirm
              ↓
         File registered + Analysis queued
              ↓
Worker → Polls jobs + Downloads file + AI Analysis
              ↓
         Results saved to database
```

**Key point:** Files NEVER pass through the API server. They go directly from device → storage.

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Backend API** | Python, FastAPI | 3.12+, 0.115.0 |
| **Database ORM** | SQLAlchemy | 2.0.36 |
| **Database** | PostgreSQL | 16 |
| **Cache** | Redis | 7 |
| **AI Worker** | Python | 3.12+ |
| **AI Providers** | OpenAI, Anthropic, Google, Kimi | Latest |
| **Storage** | Cloudflare R2 / AWS S3 / MinIO | S3-compatible |
| **Frontend** | React, TypeScript, Vite | 18, 5.0 |
| **Styling** | Tailwind CSS | 3.3.6 |
| **State Management** | TanStack Query, Zustand | 5.8, 4.4 |
| **Charts** | Recharts | 2.10 |
| **Icons** | Lucide React | 0.294 |
| **Mobile** | Kotlin, Jetpack Compose | 1.9.20 |
| **Container** | Docker, Docker Compose | 3.8 |

---

## Project Structure

```
.
├── api/                          # Layer 2: Coordination API (FastAPI)
│   ├── routers/                  # API endpoint modules
│   │   ├── investments.py        # Investment CRUD operations
│   │   ├── files.py              # File management
│   │   ├── uploads.py            # Direct-to-storage upload flow
│   │   ├── analysis.py           # Analysis results and jobs
│   │   ├── dashboard.py          # Statistics and metrics
│   │   └── chat.py               # AI chat endpoints
│   ├── static/                   # Static assets
│   │   ├── prism_docs.html       # Beautiful PRISM-styled API docs
│   │   └── favicon.svg
│   ├── tests/                    # API tests
│   ├── main.py                   # FastAPI application entry
│   ├── models.py                 # SQLAlchemy ORM models
│   ├── database.py               # Database connection & session
│   ├── storage.py                # Object storage abstraction (S3/R2)
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # API container image
│   └── wrangler.toml             # Cloudflare Workers config
│
├── worker/                       # Layer 3: Intelligence Worker
│   ├── main.py                   # Worker orchestrator (job polling loop)
│   ├── ai_client.py              # Multi-provider AI client
│   ├── kimi_client.py            # Kimi K2.5 specific client
│   ├── storage.py                # Worker storage client
│   ├── temp/                     # Temporary file downloads
│   ├── tests/                    # Worker tests
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile                # Worker container image
│
├── web/                          # PRISM - Web Dashboard (React + Vite)
│   ├── src/
│   │   ├── pages/                # Dashboard, Investments, Files, Analysis, LandAnalyzer, Chat
│   │   ├── components/           # Reusable UI components (Layout, StatCard, MoneyCard, CreditAnalysis)
│   │   ├── lib/                  # API client (api.ts), utilities, landCredit.ts
│   │   ├── hooks/                # Custom React hooks
│   │   ├── App.tsx               # Main app with routes
│   │   ├── main.tsx              # React entry point
│   │   └── index.css             # Global styles with custom design system
│   ├── functions/api/            # Cloudflare Pages Functions (API endpoints)
│   ├── dist/                     # Build output
│   ├── package.json              # Node.js dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vite.config.ts            # Vite configuration
│   ├── tailwind.config.js        # Tailwind with custom theme
│   ├── Dockerfile                # Web container image
│   ├── nginx.conf                # Nginx configuration
│   └── wrangler.toml             # Cloudflare Pages config
│
├── mobile/                       # Mobile applications
│   └── android/                  # Native Android app (Kotlin, Jetpack Compose)
│       ├── app/src/main/...      # Kotlin source files
│       ├── build.gradle.kts      # Gradle build config
│       └── README.md             # Mobile app documentation
│
├── database/                     # Database schema and migrations
│   ├── init.sql                  # PostgreSQL schema + sample data
│   ├── migrations/               # Database migrations
│   └── seeds/                    # Sample data seeds
│
├── shared/                       # Shared code between API and Worker
│   └── models.py                 # Pydantic schemas (if exists)
│
├── scripts/                      # Utility scripts
│   ├── deploy-railway.sh         # Railway deployment
│   ├── railway-setup.sh          # Railway setup
│   ├── setup/init-dev.sh         # Development setup
│   ├── health-check/health.sh    # Health checks
│   └── migration/                # Backup/restore scripts
│
├── vv/                           # VV deployer (Vercel deployment script)
│   ├── vv                        # Main deployment script
│   ├── ui.sh                     # UI helper functions
│   └── vv-simple.sh              # Simplified deployer
│
├── docs/                         # Documentation
│   ├── architecture/             # System architecture docs
│   ├── deployment/               # Deployment guides
│   └── development/              # Development guides
│
├── .github/                      # GitHub configuration
│   └── workflows/                # CI/CD workflows
│
├── docker-compose.yml            # Complete local stack
├── docker-compose.prod.yml       # Production Docker Compose
├── docker-compose.test.yml       # Testing Docker Compose
├── docker-compose.override.yml   # Development overrides
├── Makefile                      # Development commands
├── vercel.json                   # Vercel deployment config
├── railway.json                  # Railway deployment config
├── .vvrc                         # VV deployer configuration
├── package.json                  # Root package.json (build orchestration)
├── pyproject.toml                # Python project configuration, linting, testing
├── .pre-commit-config.yaml       # Pre-commit hooks
└── .env.example                  # Environment configuration template
```

---

## Build and Development Commands

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Start individual services
docker-compose up -d postgres redis minio  # Infrastructure only
docker-compose up api                       # API server
docker-compose up worker                    # AI worker
docker-compose up web                       # Dashboard

# View logs
docker-compose logs -f [service]

# Stop all services
docker-compose down

# Reset everything (DESTROYS DATA)
docker-compose down -v
```

### Makefile Commands

```bash
make help              # Show all available commands
make build             # Build all Docker images
make up                # Start all services
make up-d              # Start all services (detached)
make down              # Stop all services
make logs              # View all logs
make logs-api          # View API logs
make logs-worker       # View Worker logs
make api               # Start API only (with infrastructure)
make worker            # Start only Worker service
make web               # Start only Web service
make db                # Start database services only
make shell-db          # Open psql shell
make clean             # Remove containers and volumes
make reset             # Reset everything (WARNING: destroys data!)

# Development helpers
make dev-web           # Run web dev server locally (cd web && npm run dev)
make dev-api           # Run API locally (cd api && uvicorn main:app --reload)
make dev-worker        # Run Worker locally (cd worker && python main.py)

# Testing (minimal by design)
make test              # Run all tests
make test-api          # Run API tests (pytest)
make test-api-cov      # Run API tests with coverage
make test-worker       # Run Worker tests
make test-web          # Run Web tests

# Linting & Formatting
make lint              # Run all linters
make lint-api          # Lint API code (ruff + mypy)
make lint-worker       # Lint Worker code
make lint-web          # Lint Web code
make format            # Format all code
make format-api        # Format API code
make format-worker     # Format Worker code
make format-web        # Format Web code

# Database
make migrate           # Run database migrations
make migrate-fresh     # Reset database with fresh schema
make db-backup         # Create database backup
make db-restore        # Restore database from backup

# Production
make prod-up           # Start production stack locally
make prod-down         # Stop production stack
make prod-backup       # Backup production database
make prod-logs         # View production logs

# Mobile
make mobile-build      # Build Android app
make mobile-install    # Install Android app to connected device
make mobile-clean      # Clean Android build

# Railway deployment
make railway-login     # Login to Railway (one-time)
make railway-setup     # Setup Railway project and PostgreSQL
make railway-deploy    # Deploy to Railway

# Utilities
make health            # Run health checks
make status            # Show service status
make secrets           # Generate random secrets for .env
make pre-commit        # Run pre-commit hooks on all files
```

### NPM Scripts (Root)

```bash
npm run build          # Build web for production
npm run dev            # Run web dev server
npm run test           # Run all tests
npm run test:api       # Run API tests
npm run test:worker    # Run Worker tests
npm run test:web       # Run Web tests
npm run lint           # Run all linters
npm run lint:api       # Lint API (ruff + mypy)
npm run lint:worker    # Lint Worker
npm run lint:web       # Lint Web
npm run format         # Format all code
npm run format:api     # Format API (ruff)
npm run format:worker  # Format Worker
npm run format:web     # Format Web (prettier)
npm run setup          # Run initial development setup
npm run health         # Run health checks
npm run clean          # Stop and clean Docker containers
```

### Local Development (Without Docker)

```bash
# 1. Start PostgreSQL and Redis (use your preferred method)

# 2. Run migrations
psql $DATABASE_URL -f database/init.sql

# 3. Start API (Python 3.12 required)
cd api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0

# 4. Start Worker (another terminal)
cd worker
pip install -r requirements.txt
python main.py

# 5. Start Web (another terminal)
cd web
npm install
npm run dev
```

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# =============================================================================
# Required
# =============================================================================

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/investments

# Storage (Cloudflare R2, AWS S3, or MinIO)
STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=family-investments
STORAGE_REGION=auto

# AI Provider (at least one required)
AI_API_KEY=your-api-key                    # Generic fallback
KIMI_API_KEY=your-kimi-api-key             # Moonshot AI
OPENAI_API_KEY=your-openai-key             # OpenAI
ANTHROPIC_API_KEY=your-anthropic-key       # Claude
GOOGLE_API_KEY=your-google-key             # Gemini

# =============================================================================
# Optional (have defaults)
# =============================================================================

ENVIRONMENT=development
API_PORT=8000
WEB_PORT=5173
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:5173

# Worker settings
WORKER_POLL_INTERVAL=10
MAX_CONCURRENT_JOBS=3
WORKER_TIMEOUT=300

# Frontend
VITE_API_URL=http://localhost:8000

# Feature flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false

# AI Provider selection
AI_PROVIDER=kimi  # kimi, openai, anthropic, google, ollama
```

### Storage Configuration

- Files are organized as: `{prefix}/{investment_id?}/{uuid}-{filename}`
- Supports any S3-compatible object storage (Cloudflare R2, AWS S3, MinIO)
- Pre-signed URLs for upload/download (5 min default expiration)

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `investments` | Investment assets (land, stocks, gold, crypto, real_estate, bonds, other) |
| `file_registry` | All uploaded files with metadata and status |
| `documents` | Files linked to specific investments with context |
| `processing_jobs` | Queue for AI analysis tasks (queued, running, completed, failed) |
| `analysis_results` | AI analysis output storage (tracks provider used) |
| `valuation_history` | Value tracking over time |
| `activity_log` | Audit trail |

### Key Enums

- **InvestmentCategory:** `land`, `stocks`, `gold`, `crypto`, `real_estate`, `bonds`, `other`
- **FileStatus:** `pending`, `processing`, `completed`, `failed`, `archived`
- **JobType:** `document_analysis`, `valuation`, `ocr`, `summarization`, `custom`
- **JobStatus:** `queued`, `running`, `completed`, `failed`, `cancelled`
- **DocumentType:** `deed`, `contract`, `receipt`, `photo`, `video`, `audio`, `survey`, `appraisal`, `tax_document`, `permit`, `correspondence`, `financial_statement`, `legal`, `other`
- **InvestmentStatus:** `active`, `sold`, `pending`, `under_contract`

### Views

- `investment_summary` - Investment data with latest values, returns, document counts
- `pending_analysis_queue` - Queue of pending AI analysis jobs

---

## API Endpoints

### Documentation URLs

| URL | Description |
|-----|-------------|
| `/` or `/docs` | **Beautiful PRISM-styled documentation** — Interactive API explorer with warm dark theme |
| `/openapi` | Standard Swagger UI (OpenAPI spec) |
| `/redoc` | ReDoc documentation |
| `/health` | Health check endpoint (JSON) |

### Endpoints

```
GET  /health                    # Health check (includes Redis status)
GET  /                         # Beautiful API documentation (HTML)
GET  /docs                      # Redirects to beautiful docs

# Dashboard
GET  /api/v1/dashboard/stats           # Dashboard statistics
GET  /api/v1/dashboard/category-breakdown

# Investments
GET    /api/v1/investments             # List investments (with filters)
POST   /api/v1/investments             # Create investment
GET    /api/v1/investments/{id}        # Get investment details
PUT    /api/v1/investments/{id}        # Update investment
DELETE /api/v1/investments/{id}        # Delete investment

# Files
GET  /api/v1/files                     # List files
GET  /api/v1/files/{id}                # Get file details
GET  /api/v1/files/{id}/download-url   # Generate pre-signed download URL
DELETE /api/v1/files/{id}              # Delete file

# Uploads
POST /api/v1/uploads/request-url       # Get pre-signed upload URL
POST /api/v1/uploads/confirm           # Confirm upload, create document, queue analysis

# Analysis
GET  /api/v1/analysis/results          # List analysis results
GET  /api/v1/analysis/jobs             # List processing jobs
GET  /api/v1/analysis/queue/stats      # Queue statistics

# Chat (Prism)
POST /api/v1/chat                      # Send message (non-streaming)
POST /api/v1/chat/stream               # Send message (streaming SSE)
GET  /api/v1/chat/context/investments  # Get investments for context
GET  /api/v1/chat/context/files        # Get files for context
```

---

## Code Style Guidelines

### Python (API & Worker)

- Use **Python 3.12+** type hints throughout
- Use **async/await** for database operations in API
- Follow **Pydantic v2** patterns for validation
- SQLAlchemy 2.0 style (mapped_column, select())
- Import order: stdlib → third-party → local
- Maximum line length: 88 characters
- Use double quotes for strings
- Use spaces for indentation (4 spaces)
- Use LF line endings

Example:
```python
from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException
```

### TypeScript/React (Web)

- Use **strict TypeScript** configuration
- Use **functional components** with hooks
- Use **TanStack Query** for server state management
- API client in `src/lib/api.ts`
- Components in `src/components/`
- Pages in `src/pages/`
- Custom Tailwind theme in `tailwind.config.js` with warm dark palette
- Maximum line length: 100 characters

Example:
```typescript
import { useQuery } from '@tanstack/react-query'
import { investmentsApi } from '@/lib/api'

export function InvestmentList() {
  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: investmentsApi.list
  })
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div className="grid gap-4">
      {investments?.map(inv => (
        <InvestmentCard key={inv.id} investment={inv} />
      ))}
    </div>
  )
}
```

### Custom Tailwind Theme (Warm Dark Palette)

```javascript
colors: {
  void: { DEFAULT: '#0a0a0a', deep: '#070707' },
  surface: { DEFAULT: '#111111', elevated: '#161616', higher: '#1c1c1c' },
  cream: { DEFAULT: '#e8d5c4', light: '#f5e6d3', dark: '#c9b296', muted: '#a89482' },
  'text-primary': '#f5f2ed',
  'text-secondary': '#8a8279',
  'text-muted': '#5c554d',
  success: { DEFAULT: '#7fb069', dim: 'rgba(127, 176, 105, 0.12)' },
  warning: { DEFAULT: '#d4a373', dim: 'rgba(212, 163, 115, 0.12)' },
  error: { DEFAULT: '#c76b6b', dim: 'rgba(199, 107, 107, 0.12)' },
  info: { DEFAULT: '#6b8cae', dim: 'rgba(107, 140, 174, 0.12)' },
  border: {
    subtle: 'rgba(232, 213, 196, 0.06)',
    DEFAULT: 'rgba(232, 213, 196, 0.1)',
    strong: 'rgba(232, 213, 196, 0.15)'
  }
}
```

---

## Linting and Formatting

### Python

- **Ruff** - Fast Python linter and formatter
  - Line length: 88
  - Target version: Python 3.12
  - Quote style: double
  - Indent: space
  - Line ending: LF
  - Enabled: E, W, F, I, N, D, UP, B, C4, SIM, ASYNC
  - Ignored: D100 (missing docstring in public module), D104 (missing docstring in public package)
- **mypy** - Static type checking (strict mode)

```bash
# API
cd api && ruff check .
cd api && ruff format .
cd api && ruff check --fix .
cd api && mypy . --ignore-missing-imports

# Worker
cd worker && ruff check .
cd worker && ruff format .
```

### TypeScript/JavaScript

- **ESLint** - Linting with TypeScript support
- **Prettier** - Code formatting

```bash
cd web
npm run lint
npx prettier --write 'src/**/*.{ts,tsx}'
```

### Pre-commit Hooks

Configured in `.pre-commit-config.yaml`:
- Trailing whitespace removal
- End-of-file fixer
- YAML/JSON/TOML validation
- Large file checks (max 1000KB)
- Ruff linting and formatting
- mypy type checking
- ESLint for TypeScript
- Hadolint for Dockerfiles
- Commitizen for commit messages
- Gitleaks for secrets detection
- SQLFluff for SQL formatting

```bash
# Install hooks
pre-commit install
pre-commit install --hook-type commit-msg

# Run on all files
pre-commit run --all-files
```

---

## Testing Instructions

### Test Philosophy

> **Tests are intentionally minimal.** This is a personal tool for 2 people, not a product for customers.

### Running Tests

```bash
# API tests (pytest)
cd api
pytest -v

# With coverage
cd api
pytest --cov=. --cov-report=html -v

# Web tests
cd web
npm run test

# All tests from root
make test
```

### Manual Testing

1. Start all services: `make up-d`
2. Access services:
   - Web Dashboard: http://localhost:5173
   - API Docs: http://localhost:8000/docs
   - MinIO Console: http://localhost:9001

---

## Security Considerations

- **Pre-signed URLs** for file uploads/downloads (time-limited, 5 min default)
- **File hashing** (SHA-256) for deduplication
- **No file content** ever stored in database (only metadata)
- **Stateless API** - horizontally scalable
- Files are organized by investment ID for access control
- JWT secret for authentication (when implemented)

### For Private/Family Use:
- Keep `.env` secure
- Use strong passwords for PostgreSQL
- Rotate R2/S3 keys periodically
- Enable 2FA on Cloudflare account

---

## Deployment

### Frontend (Vercel / Cloudflare Pages)

**Quick Deploy:**
```bash
# Deploy to Cloudflare Pages
cd web && npm run build && npx wrangler pages deploy dist --project-name=investment-aramac

# Or use Vercel CLI
cd web && vercel --prod
```

**VV Deployer (Original):**
```bash
# Deploy to production
./vv/vv

# Or with options
VV_PROD=false ./vv/vv      # Deploy to preview
VV_DRY_RUN=true ./vv/vv    # Dry run
```

### Backend (Railway/Render)

The API and Worker are deployed via Docker:
- `railway.json` - Railway deployment configuration
- `render.yaml` - Render deployment configuration
- Both services share the same Docker image with different entrypoints

```bash
# Railway deployment
make railway-login      # One-time setup
make railway-deploy     # Deploy to Railway
```

### Production Docker

```bash
# Start production stack locally
make prod-up

# View production logs
make prod-logs

# Backup production database
make prod-backup
```

---

## Prism Chat

A conversational interface inspired by **T3 Chat** and **Cursor IDE** for natural language interaction with your investment portfolio.

### Features

| Feature | Description |
|---------|-------------|
| **Streaming Responses** | Real-time responses with SSE (Server-Sent Events) |
| **Context Attachments** | Attach investments and files to provide context |
| **Multi-provider** | Works with OpenAI, Anthropic, Google, Kimi |
| **Portfolio Awareness** | Knows your investments, values, and documents |
| **File References** | Can reference Cloudflare R2 files by name |

### Configuration

Set ONE of these environment variables in your `.env`:

```bash
# Option 1: OpenAI (GPT-4o, GPT-4, GPT-3.5)
OPENAI_API_KEY=sk-...

# Option 2: Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
ANTHROPIC_API_KEY=sk-ant-...

# Option 3: Google (Gemini Pro)
GOOGLE_API_KEY=...

# Option 4: Kimi/Moonshot (K2.5)
KIMI_API_KEY=...

# Optional: Override default model
CHAT_MODEL=gpt-4o  # or claude-3-5-sonnet, gemini-1.5-flash, etc.

# Optional: Custom API endpoint (for proxies)
CHAT_API_URL=https://your-proxy.com/v1
```

The system auto-detects which provider to use based on available API keys.

### API Endpoints

```
POST /api/v1/chat              # Non-streaming chat
POST /api/v1/chat/stream       # Streaming chat (SSE)
GET  /api/v1/chat/context/investments  # List investments for context
GET  /api/v1/chat/context/files        # List files for context
```

---

## Mobile App

### Android Mobile App

Located in `mobile/android/`:
- **Language:** Kotlin
- **UI Framework:** Jetpack Compose with Material3
- **Features:** Direct-to-R2 upload, share sheet integration, batch uploads

Build:
```bash
cd mobile/android
./gradlew assembleDebug    # Debug APK
./gradlew assembleRelease  # Release APK
```

The app communicates with the API at:
- Emulator: `http://10.0.2.2:8000`
- Physical device: `http://YOUR_IP:8000`
- Production: `https://api.yourdomain.com`

---

## Troubleshooting

### Common Issues

1. **Database connection fails:**
   - Check `DATABASE_URL` format
   - Ensure PostgreSQL is running
   - Verify credentials

2. **Storage upload fails:**
   - Check `STORAGE_ENDPOINT` (include protocol)
   - Verify bucket exists
   - Check CORS settings for MinIO

3. **Worker not processing jobs:**
   - Check `AI_API_KEY` or provider-specific key is set
   - Verify Redis connection
   - Check worker logs: `make logs-worker`

4. **Frontend can't connect to API:**
   - Check `VITE_API_URL` in environment
   - Verify `CORS_ORIGINS` includes frontend URL

---

## Future Enhancements (Not Implemented)

- [ ] User authentication (JWT)
- [ ] Multi-family support (tenants)
- [ ] Real-time notifications (WebSockets)
- [ ] iOS mobile app
- [ ] Automatic backups
- [ ] Data export (CSV, PDF reports)
- [ ] Tax calculation helpers
- [ ] Market data integration

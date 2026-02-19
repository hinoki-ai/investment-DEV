# Family Investment Dashboard - Agent Guide

This document provides essential context for AI coding agents working on this project.

---

## Project Overview

**Family Investment Dashboard** is a production-ready, three-layer investment tracking system designed for family asset management. It supports multiple investment types (land, stocks, gold, crypto, real estate, bonds) with AI-powered document analysis.

**Key Features:**
- Direct phone uploads to cloud storage (no file passes through API)
- AI document analysis using Kimi K2.5 (Moonshot AI)
- Web dashboard for portfolio management
- Multi-device access (phones, laptops, tablets)
- Structured S3-compatible storage organization

---

## Architecture

The system follows a **three-layer architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 1: STORAGE                            │
│              (Cloudflare R2 / AWS S3 / MinIO)                    │
│                     Raw binary files only                        │
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
│              (Multi-Provider: Kimi, GPT-4o, Claude, Gemini)      │
│   • Document OCR     • Entity extraction  • Valuation analysis   │
│   • Summarization    • Contract parsing   • Risk detection       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Backend API** | Python 3.12, FastAPI, SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16, Redis 7 |
| **AI Worker** | Python, Multi-provider (Kimi, OpenAI, Claude, Gemini, Ollama) |
| **Storage** | S3-compatible (Cloudflare R2, AWS S3, MinIO) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State Management** | TanStack Query (React Query), Zustand |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Deployment** | Docker, Docker Compose, Vercel |

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
│   │   └── dashboard.py          # Statistics and metrics
│   ├── main.py                   # FastAPI application entry
│   ├── models.py                 # SQLAlchemy ORM models
│   ├── database.py               # Database connection & session
│   ├── storage.py                # S3-compatible storage abstraction
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile                # API container image
├── worker/                       # Layer 3: Intelligence Worker
│   ├── main.py                   # Worker orchestrator (job polling loop)
│   ├── kimi_client.py            # Kimi K2.5 API integration
│   ├── storage.py                # Worker storage client
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile                # Worker container image
├── web/                          # Web Dashboard (React + Vite)
│   ├── src/
│   │   ├── pages/                # Dashboard, Investments, Files, Analysis
│   │   ├── components/           # Reusable UI components
│   │   ├── lib/                  # API client (api.ts), utilities
│   │   ├── App.tsx               # Main app with routes
│   │   └── main.tsx              # React entry point
│   ├── package.json              # Node.js dependencies
│   └── Dockerfile                # Web container image
├── database/
│   └── init.sql                  # PostgreSQL schema + sample data
├── shared/
│   └── models.py                 # Shared Pydantic schemas
├── docker-compose.yml            # Complete local stack
├── Makefile                      # Development commands
├── vercel.json                   # Vercel deployment config
└── vv/                           # VV deployer (Vercel deployment script)
    ├── vv                        # Main deployment script
    └── ui.sh                     # UI helper functions
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
make build          # Build all Docker images
make up             # Start all services
make up-d           # Start all services (detached)
make down           # Stop all services
make logs           # View all logs
make logs-api       # View API logs
make logs-worker    # View Worker logs
make api            # Start API only
make worker         # Start Worker only
make web            # Start Web only
make db             # Start database services only
make shell-api      # Open shell in API container
make shell-db       # Open psql shell
make clean          # Remove containers and volumes
make reset          # Reset everything (WARNING: destroys data)
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
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/investments
STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=family-investments
KIMI_API_KEY=your-kimi-api-key  # Get from https://platform.moonshot.cn/

# Optional (have defaults)
ENVIRONMENT=development
API_PORT=8000
WEB_PORT=5173
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:5173
WORKER_POLL_INTERVAL=10
MAX_CONCURRENT_JOBS=3
```

### Storage Configuration

- **Local Development:** MinIO (http://localhost:9000)
- **Production:** Cloudflare R2 or AWS S3
- Files are organized as: `{prefix}/{investment_id?}/{uuid}-{filename}`

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

- **InvestmentCategory:** land, stocks, gold, crypto, real_estate, bonds, other
- **FileStatus:** pending, processing, completed, failed, archived
- **JobType:** document_analysis, valuation, ocr, summarization, custom
- **JobStatus:** queued, running, completed, failed, cancelled
- **DocumentType:** deed, contract, receipt, photo, video, audio, survey, appraisal, tax_document, permit, correspondence, financial_statement, legal, other

### Views

- `investment_summary` - Investment data with latest values, returns, document counts
- `pending_analysis_queue` - Queue of pending AI analysis jobs

---

## API Endpoints

```
GET  /health                    # Health check (includes Redis status)
GET  /                         # API info

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
```

---

## Code Style Guidelines

### Python (API & Worker)

- Use **Python 3.12+** type hints throughout
- Use **async/await** for database operations in API
- Follow **Pydantic v2** patterns for validation
- SQLAlchemy 2.0 style (mapped_column, select())
- Import order: stdlib → third-party → local
- Use `sys.path.insert(0, '/path/to/shared')` to import shared models

Example:
```python
from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException

import sys
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/shared')
from models import InvestmentCreate, InvestmentResponse
```

### TypeScript/React (Web)

- Use **strict TypeScript** configuration
- Use **functional components** with hooks
- Use **TanStack Query** for server state management
- API client in `src/lib/api.ts`
- Components in `src/components/`
- Pages in `src/pages/`

---

## Testing Instructions

### API Testing

```bash
# Run API tests (pytest)
cd api
pytest

# With coverage
pytest --cov=.
```

### Frontend Testing

```bash
# Lint check
cd web
npm run lint

# Type check
npx tsc --noEmit
```

### Manual Testing

1. Start all services: `make up-d`
2. Access services:
   - Web Dashboard: http://localhost:5173
   - API Docs: http://localhost:8000/docs
   - MinIO Console: http://localhost:9001

---

## Deployment

### Production Deployment

**Use the VV deployer (only supported method for frontend):**

```bash
# Deploy to production
./vv/vv

# Or with options
VV_PROD=false ./vv/vv      # Deploy to preview
VV_DRY_RUN=true ./vv/vv    # Dry run
```

### Infrastructure Setup

1. **Cloudflare R2 (Storage):**
   - Create R2 bucket in Cloudflare dashboard
   - Create API token with R2 permissions
   - Update `.env` with R2 credentials

2. **Supabase (PostgreSQL):**
   - Create project at https://supabase.com
   - Run `database/init.sql` in SQL Editor
   - Update `DATABASE_URL` in `.env`

3. **AI Provider API Key:**
   - **Kimi:** Get key from https://platform.moonshot.cn/
   - **OpenAI:** Get key from https://platform.openai.com/
   - **Anthropic:** Get key from https://console.anthropic.com/
   - **Google:** Get key from https://ai.google.dev/
   - Set `AI_API_KEY` (generic) or provider-specific key (e.g., `KIMI_API_KEY`)

---

## Security Considerations

- **Pre-signed URLs** for file uploads/downloads (time-limited, 5 min default)
- **File hashing** (SHA-256) for deduplication
- **No file content** ever stored in database (only metadata)
- **Stateless API** - horizontally scalable
- Files are organized by investment ID for access control
- JWT secret for authentication (when implemented)

---

## Common Patterns

### Direct Upload Flow

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
```

**Key point:** Files NEVER pass through the API server. They go directly from device → storage.

### Worker Job Processing

1. Worker polls `processing_jobs` table for `queued` jobs
2. Uses `SELECT FOR UPDATE SKIP LOCKED` for concurrent workers
3. Downloads file from storage to local temp
4. Calls Kimi K2.5 API for analysis
5. Saves results to `analysis_results` table
6. Updates job status to `completed` or `failed`
7. Cleans up temp file

### Storage Key Structure

```
{prefix}/{investment_id?}/{uuid}-{safe_filename}

Examples:
- uploads/abc-123/document.pdf
- uploads/abc-123/def-456/photo.jpg
```

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
   - Check `KIMI_API_KEY` is set
   - Verify Redis connection
   - Check worker logs: `make logs-worker`

4. **Frontend can't connect to API:**
   - Check `VITE_API_URL` in environment
   - Verify CORS_ORIGINS includes frontend URL

---

## Future Enhancements (Not Implemented)

- [ ] User authentication (JWT)
- [ ] Multi-family support (tenants)
- [ ] Real-time notifications (WebSockets)
- [ ] Mobile app (React Native)
- [ ] Automatic backups
- [ ] Data export (CSV, PDF reports)
- [ ] Tax calculation helpers
- [ ] Market data integration

# 🏡 Family Investment Dashboard

A **production-ready, three-layer investment tracking system** designed for your family's future.

Built with **separation of concerns** at its core:
- **Layer 1: Storage** - Raw files (R2/S3/MinIO)
- **Layer 2: Coordination** - Metadata, state, relationships (PostgreSQL)
- **Layer 3: Intelligence** - AI analysis (Kimi K2.5)

---

## 🎯 What You Get

| Feature | Description |
|---------|-------------|
| 📱 Phone Uploads | Direct upload from phones to cloud storage (no file passes through API) |
| 🧠 AI Analysis | Automatic document analysis with Kimi K2.5 |
| 🗄️ Central Storage | All files organized in structured S3-compatible storage |
| 💻 Web Dashboard | React-based dashboard for viewing and management |
| 🔄 Multi-Device | Access from phones, laptops, tablets |
| 📊 Investment Tracking | Land, stocks, gold, crypto, and more |
| 📈 Portfolio Analytics | Value tracking, returns, document counts |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     PHONE       │     │     LAPTOP      │     │     WORKER      │
│  (Upload files) │     │  (View/Upload)  │     │ (Kimi K2.5 AI)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 1: STORAGE                            │
│              (Cloudflare R2 / AWS S3 / MinIO)                    │
│                     Raw binary files only                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: COORDINATION                         │
│                      (PostgreSQL + Redis)                        │
│   • File registry    • Processing jobs    • Investment data      │
│   • State machine    • Relationships      • Activity log         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
┌─────────────────────────────────────────────────────────────────┐
│                   LAYER 3: INTELLIGENCE                          │
│                        (Kimi K2.5)                               │
│   • Document OCR     • Entity extraction  • Valuation analysis   │
│   • Summarization    • Contract parsing   • Risk detection       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Clone & Configure

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Start with Docker

```bash
# Start all services
docker-compose up -d

# Or start individually
docker-compose up -d postgres redis minio  # Infrastructure
docker-compose up -d api                   # API server
docker-compose up -d worker                # AI worker
docker-compose up -d web                   # Dashboard
```

### 3. Access the Services

| Service | URL | Description |
|---------|-----|-------------|
| Web Dashboard | http://localhost:5173 | React frontend |
| API | http://localhost:8000 | FastAPI backend |
| API Docs | http://localhost:8000/docs | Interactive API docs |
| MinIO Console | http://localhost:9001 | File storage UI |

---

## 🚀 Deploy to Production

**Use the VV deployer (only supported method):**

```bash
# Deploy to production
./vv/vv

# Or with options
VV_PROD=false ./vv/vv      # Deploy to preview
VV_DRY_RUN=true ./vv/vv    # Dry run
```

---

## 📁 Project Structure

```
.
├── api/                    # Layer 2: Coordination API (FastAPI)
│   ├── routers/           # API endpoints
│   ├── storage.py         # Storage abstraction
│   ├── database.py        # Database connection
│   ├── models.py          # SQLAlchemy models
│   └── main.py            # FastAPI app
├── worker/                 # Layer 3: Intelligence
│   ├── kimi_client.py     # Kimi K2.5 integration
│   ├── storage.py         # Worker storage client
│   └── main.py            # Worker orchestrator
├── web/                    # Web Dashboard (React + Vite)
│   ├── src/
│   │   ├── pages/         # Dashboard, Investments, Files, Analysis
│   │   ├── components/    # Reusable components
│   │   └── lib/           # API client
│   └── package.json
├── database/               # Database schema
│   └── init.sql           # Initial schema + sample data
├── shared/                 # Shared types/models
│   └── models.py          # Pydantic schemas
├── docker-compose.yml      # Complete stack
└── .env.example           # Configuration template
```

---

## 📱 Upload Flow (Phone)

```
Phone → POST /api/v1/uploads/request-url
              ↓
         Get pre-signed URL (valid 5 min)
              ↓
Phone → PUT {pre-signed-url} (upload directly to R2/S3)
              ↓
Phone → POST /api/v1/uploads/confirm
              ↓
         File registered + Analysis queued
```

**Key point:** Files NEVER pass through the API server. They go directly from phone → storage.

---

## 🔧 Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/investments

# Storage (R2, S3, or MinIO)
STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=family-investments

# Kimi K2.5 (Get key from https://platform.moonshot.cn/)
KIMI_API_KEY=your-kimi-api-key
```

### Optional Configuration

```env
# Worker
WORKER_POLL_INTERVAL=10          # Seconds between job checks
MAX_CONCURRENT_JOBS=3            # Parallel processing limit

# API
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:5173
```

---

## 📊 Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `investments` | Investment assets (land, stocks, etc.) |
| `file_registry` | All uploaded files with metadata |
| `documents` | Files linked to specific investments |
| `processing_jobs` | Queue for AI analysis tasks |
| `analysis_results` | Kimi K2.5 output storage |
| `valuation_history` | Value tracking over time |
| `activity_log` | Audit trail |

### Investment Categories

- `land` - Land parcels, farms, rural properties
- `stocks` - Stock market investments
- `gold` - Physical gold, ETFs
- `crypto` - Cryptocurrency
- `real_estate` - Buildings, apartments
- `bonds` - Fixed income
- `other` - Everything else

---

## 🤖 AI Analysis Types

| Type | Description |
|------|-------------|
| `document_analysis` | General document analysis |
| `land_analysis` | Specialized for land documents |
| `contract_extraction` | Contract terms extraction |
| `receipt_extraction` | Financial receipt parsing |
| `ocr` | Pure text extraction |
| `summarization` | Document summarization |
| `valuation` | Value estimation |

---

## 🛠️ Development

### Run Without Docker

```bash
# 1. Start PostgreSQL and Redis
# (Use your preferred method - homebrew, apt, etc.)

# 2. Run migrations
psql $DATABASE_URL -f database/init.sql

# 3. Start API
cd api
pip install -r requirements.txt
uvicorn main:app --reload

# 4. Start Worker (in another terminal)
cd worker
pip install -r requirements.txt
python main.py

# 5. Start Web (in another terminal)
cd web
npm install
npm run dev
```

### API Endpoints

```
GET  /health                    # Health check
GET  /api/v1/dashboard/stats    # Dashboard statistics

# Investments
GET    /api/v1/investments      # List investments
POST   /api/v1/investments      # Create investment
GET    /api/v1/investments/{id} # Get investment details
PUT    /api/v1/investments/{id} # Update investment
DELETE /api/v1/investments/{id} # Delete investment

# Files
GET  /api/v1/files              # List files
GET  /api/v1/files/{id}         # Get file details
GET  /api/v1/files/{id}/download-url  # Generate download URL

# Uploads
POST /api/v1/uploads/request-url      # Get pre-signed upload URL
POST /api/v1/uploads/confirm          # Confirm upload complete

# Analysis
GET  /api/v1/analysis/results   # List analysis results
GET  /api/v1/analysis/jobs      # List processing jobs
GET  /api/v1/analysis/queue/stats     # Queue statistics
```

---

## 📦 Production Deployment

### Cloudflare R2 (Recommended)

1. Create R2 bucket in Cloudflare dashboard
2. Create API token with R2 permissions
3. Update `.env` with R2 credentials

### Supabase (PostgreSQL)

1. Create project at https://supabase.com
2. Run `database/init.sql` in SQL Editor
3. Update `DATABASE_URL` in `.env`

### Deploy API + Worker

```bash
# Build images
docker-compose build api worker

# Push to registry
docker tag investment-api:latest your-registry/investment-api:latest
docker push your-registry/investment-api:latest

# Deploy to your platform (Fly.io, Railway, etc.)
```

### Deploy Web Dashboard

```bash
cd web
npm run build
# Deploy dist/ folder to Vercel, Netlify, or static host
```

---

## 🔒 Security

- **Pre-signed URLs** for file uploads/downloads (time-limited)
- **File hashing** for deduplication
- **SHA-256 verification** option
- **No file content** ever stored in database
- **Stateless API** - horizontally scalable

---

## 📝 Future Enhancements

- [ ] User authentication (JWT)
- [ ] Multi-family support (tenants)
- [ ] Real-time notifications (WebSockets)
- [ ] Mobile app (React Native)
- [ ] Automatic backups
- [ ] Data export (CSV, PDF reports)
- [ ] Tax calculation helpers
- [ ] Market data integration

---

## 💪 Built With

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, Redis
- **AI:** Kimi K2.5 (Moonshot AI)
- **Storage:** Cloudflare R2 / AWS S3 compatible
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Infrastructure:** Docker, Docker Compose

---

## 🏠 For Your Family

This system is designed to:
1. **Preserve** - Keep all investment documents safe and organized
2. **Analyze** - Extract insights automatically with AI
3. **Track** - Monitor values and performance over time
4. **Scale** - Start with land, expand to stocks, gold, and beyond
5. **Share** - Access from any device, anywhere

**Built for the future. Built for your family.** 💚

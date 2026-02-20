# Development Setup

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- Git

## Quick Setup

Run the automated setup script:

```bash
./scripts/setup/init-dev.sh
```

## Manual Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/investments.git
cd investments
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Infrastructure

```bash
docker-compose up -d postgres redis minio
```

### 4. Setup API

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 5. Setup Worker

```bash
cd worker
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 6. Setup Web

```bash
cd web
npm install
npm run dev
```

## Verification

Check all services are running:

```bash
./scripts/health-check/health.sh
```

Access points:
- Dashboard: http://localhost:5173
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

## Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Run tests: `make test`
4. Commit: `git commit -m "feat: add feature"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

## Troubleshooting

### Database Connection Issues

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Port Conflicts

Edit `.env` to change ports:
```bash
API_PORT=8001
WEB_PORT=5174
DB_PORT=5433
```

### Permission Issues

```bash
# Fix script permissions
chmod +x scripts/**/*.sh
```

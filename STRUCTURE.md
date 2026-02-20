# Repository Structure

This document describes the industry-standard repository structure for the Family Investment Dashboard.

## Directory Structure

```
.
├── 📁 .github/                 # GitHub configuration
│   └── workflows/              # CI/CD workflows
│       ├── ci.yml              # Main CI pipeline
│       └── security.yml        # Security scanning
│
├── 📁 api/                     # FastAPI backend service
│   ├── routers/                # API endpoint modules
│   ├── static/                 # Static assets (beautiful docs)
│   │   ├── prism_docs.html     # PRISM-styled API documentation
│   │   └── favicon.svg         # API favicon
│   ├── tests/                  # API test suite
│   ├── .dockerignore           # Docker build exclusions
│   ├── conftest.py             # pytest configuration
│   ├── database.py             # Database connection
│   ├── Dockerfile              # Container definition
│   ├── main.py                 # FastAPI application entry
│   ├── models.py               # SQLAlchemy ORM models
│   ├── pytest.ini              # pytest settings
│   ├── requirements.txt        # Python dependencies
│   ├── storage.py              # S3-compatible storage
│   └── wrangler.toml           # Cloudflare Workers config
│
├── 📁 database/                # Database management
│   ├── init.sql                # Initial schema + sample data
│   ├── migrations/             # Database migrations
│   └── seeds/                  # Sample data seeds
│
├── 📁 docs/                    # Documentation
│   ├── architecture/           # System architecture docs
│   ├── deployment/             # Deployment guides
│   └── development/            # Development guides
│
├── 📁 mobile/                  # Mobile applications
│   └── android/                # Native Android app (Kotlin)
│
├── 📁 scripts/                 # DevOps and utility scripts
│   ├── health-check/           # Health monitoring scripts
│   ├── migration/              # Database backup/restore
│   └── setup/                  # Development setup
│
├── 📁 shared/                  # Shared code between services
│   └── models.py               # Pydantic schemas
│
├── 📁 vv/                      # VV deployer (Vercel deployment)
│
├── 📁 web/                     # React frontend dashboard
│   ├── src/
│   │   ├── __tests__/          # Test suite
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities and API client
│   │   └── pages/              # Page components
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vitest.config.ts
│
├── 📁 worker/                  # AI processing worker
│   ├── tests/                  # Worker test suite
│   ├── .dockerignore
│   ├── ai_client.py            # Multi-provider AI client
│   ├── Dockerfile
│   ├── kimi_client.py          # Kimi K2.5 client
│   ├── main.py                 # Worker orchestrator
│   ├── pytest.ini
│   ├── requirements.txt
│   └── storage.py              # Worker storage client
│
├── ⚙️ Configuration Files
│   ├── .dockerignore           # Root Docker exclusions
│   ├── .editorconfig           # Editor configuration
│   ├── .env.example            # Environment template
│   ├── .gitattributes          # Git behavior settings
│   ├── .gitignore              # Git ignore patterns
│   ├── .pre-commit-config.yaml # Pre-commit hooks
│   ├── docker-compose.yml              # Main compose file
│   ├── docker-compose.override.yml     # Development overrides
│   ├── docker-compose.prod.yml         # Production settings
│   ├── docker-compose.test.yml         # Testing configuration
│   ├── Makefile                # Build and dev commands
│   ├── package.json            # Root npm configuration
│   └── pyproject.toml          # Python project settings
│
└── 📄 Documentation
    ├── AGENTS.md               # AI agent guide
    ├── CHANGELOG.md            # Version history
    ├── CONTRIBUTING.md         # Contribution guidelines
    ├── LICENSE                 # MIT License
    ├── README.md               # Main documentation
    └── STRUCTURE.md            # This file
```

## Key Features

### 🔧 Developer Experience
- **Pre-commit hooks**: Automated code quality checks
- **EditorConfig**: Consistent editor settings
- **Make targets**: Simple command interface
- **Health checks**: Service status monitoring
- **Development scripts**: Automated setup

### 🔄 CI/CD
- **GitHub Actions**: Automated testing and linting
- **Security scanning**: Trivy and Gitleaks integration
- **Multi-service builds**: Parallel Docker builds

### 🧪 Testing
- **pytest**: Python testing with async support
- **Vitest**: Frontend testing with coverage
- **Docker Compose**: Isolated test environments

### 📦 Deployment
- **Docker Compose**: Local development stack
- **Override files**: Environment-specific configs
- **Health scripts**: Production monitoring
- **Backup utilities**: Database management

### 📝 Documentation
- **Architecture docs**: System design
- **Development guides**: Setup and testing
- **API reference**: Endpoint documentation
- **Changelog**: Version history

## Standards

### Python
- Python 3.12+ with type hints
- Ruff for linting and formatting
- mypy for type checking
- pytest for testing

### TypeScript/React
- Strict TypeScript configuration
- ESLint + Prettier
- Vitest for testing
- Tailwind CSS for styling

### Docker
- Multi-stage builds
- Layer caching optimization
- Health checks
- Resource limits (production)

### Git
- Conventional commits
- Pre-commit hooks
- Branch protection (CI/CD)
- Automated changelog

## Getting Started

```bash
# Quick setup
make dev-setup

# Start all services
make up-d

# Check health
make health

# Run tests
make test

# View logs
make logs
```

See [docs/development/setup.md](docs/development/setup.md) for detailed instructions.

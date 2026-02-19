# Contributing to NEXUS / Nest

Thank you for your interest in contributing! This document provides guidelines and workflows for contributing to the project.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/investments.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Run tests and linting
6. Commit with conventional commits: `git commit -m "feat: add new feature"`
7. Push and create a Pull Request

## 📋 Development Setup

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Local Development

```bash
# Start infrastructure
docker-compose up -d postgres redis minio

# API development
cd api
pip install -r requirements.txt
uvicorn main:app --reload

# Worker development
cd worker
pip install -r requirements.txt
python main.py

# Web development
cd web
npm install
npm run dev
```

## 🏗️ Project Structure

```
├── api/           # FastAPI backend
├── worker/        # AI processing worker
├── web/           # React frontend
├── mobile/        # Android mobile app
├── shared/        # Shared models
├── database/      # Migrations and schema
└── scripts/       # DevOps and utility scripts
```

## 📝 Code Standards

### Python
- Follow PEP 8
- Use type hints everywhere
- Use async/await for I/O operations
- Write docstrings for all functions
- Maximum line length: 88 characters

### TypeScript/React
- Use strict TypeScript
- Functional components with hooks
- Custom hooks for reusable logic
- Maximum line length: 100 characters

### Commits
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Fix a bug
docs: Update documentation
style: Code style changes
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks
```

## 🧪 Testing

```bash
# API tests
cd api && pytest

# Web tests
cd web && npm run test

# All tests
make test
```

## 🔍 Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers
6. Address review feedback
7. Squash commits if requested

## 🐛 Bug Reports

Please include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

## 💡 Feature Requests

Please include:
- Use case description
- Proposed solution
- Alternatives considered
- Additional context

## 📞 Questions?

- Open a [Discussion](https://github.com/your-org/investments/discussions)
- Join our community chat (coming soon)
- Email: maintainers@example.com

## 🏆 Recognition

Contributors will be listed in README.md and releases.

Thank you for contributing! 🎉

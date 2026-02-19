# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Industry-standard repository structure with comprehensive tooling
- GitHub Actions CI/CD workflows
- Pre-commit hooks with ruff, mypy, and ESLint
- Docker Compose override files for development and production
- Health check scripts
- Database backup and restore scripts
- Comprehensive test infrastructure
- Documentation structure
- EditorConfig and gitattributes
- Security scanning with Trivy and Gitleaks

### Changed
- Improved Makefile with comprehensive commands
- Updated .env.example with detailed configuration options
- Enhanced package.json with npm scripts

## [1.0.0] - 2024-02-19

### Added
- Initial release of Family Investment Dashboard
- Three-layer architecture (Storage, Coordination, Intelligence)
- FastAPI backend with async support
- React + Vite frontend with Tailwind CSS
- AI Worker with multi-provider support (Kimi, GPT-4o, Claude, Gemini, Ollama)
- Android mobile app with Jetpack Compose
- Direct-to-storage upload flow
- Document analysis and OCR capabilities
- Investment tracking for multiple asset types (land, stocks, gold, crypto, real estate, bonds)
- PostgreSQL database with SQLAlchemy ORM
- Redis caching and job queue
- Docker Compose setup for local development
- VV deployer for Vercel deployment

### Features
- Pre-signed URL uploads (files never pass through API)
- Multi-device access (phones, laptops, tablets)
- AI-powered document analysis
- Portfolio dashboard with charts
- File management with metadata
- Processing job queue
- Valuation history tracking
- Activity logging

[Unreleased]: https://github.com/your-org/investments/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/investments/releases/tag/v1.0.0

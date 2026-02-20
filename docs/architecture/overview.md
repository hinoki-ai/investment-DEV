# Architecture Overview

## Three-Layer Architecture

The Family Investment Dashboard uses a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 1: STORAGE                            │
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
│        (Multi-Provider: Kimi, GPT-4o, Claude, Gemini, Ollama)    │
│   • Document OCR     • Entity extraction  • Valuation analysis   │
│   • Summarization    • Contract parsing   • Risk detection       │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Layer 1: Storage
- Stores raw binary files (images, documents, videos)
- S3-compatible object storage API
- Pre-signed URLs for upload/download
- No file content passes through API server

### Layer 2: Coordination
- **PostgreSQL**: Primary database for structured data
- **Redis**: Caching and job queue
- **API**: FastAPI application for HTTP requests
- **Worker**: Background job processor

### Layer 3: Intelligence
- Multi-provider AI support
- Document analysis and OCR
- Valuation assistance
- Risk assessment

## Data Flow

1. **Upload Flow**:
   ```
   Client → API (get upload URL) → Direct to Storage → API (confirm)
   ```

2. **Analysis Flow**:
   ```
   Upload Confirm → Queue Job → Worker → AI Provider → Save Results
   ```

3. **Read Flow**:
   ```
   Client → API → Database → Client
   Client → API (get download URL) → Direct from Storage
   ```

## Security

- Pre-signed URLs with expiration
- File hashing for deduplication
- Stateless API for horizontal scaling
- No file content in database

## Scalability

- API servers can scale horizontally
- Multiple workers can process jobs concurrently
- Database can use read replicas
- Storage is inherently scalable

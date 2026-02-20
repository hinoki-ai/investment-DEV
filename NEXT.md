# NEXT AGENT TASK LIST - v2.0 Foundation (No Security Phase)

> **Mission**: Build production-grade foundation EXCLUDING security. Security is Phase 5 (final phase).
> 
> **Focus**: Testing, Observability, Performance, Features, Architecture

---

## 📊 PROGRESS SUMMARY

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Testing Infrastructure | 🟡 IN PROGRESS | 70% |
| Phase 2: Observability & Monitoring | ⏳ PENDING | 0% |
| Phase 3: Database & Data Integrity | ⏳ PENDING | 0% |
| Phase 4: Performance Optimization | ⏳ PENDING | 0% |
| Phase 5: Features & Polish | ⏳ PENDING | 0% |
| Phase 6: Financial Math Analysis | ✅ COMPLETE | 100% |

---

## 📋 EXECUTION ORDER (UPDATED)

```
Phase 6: Financial Math Analysis ✅ COMPLETE (Implemented)
Phase 1: Testing Infrastructure 🟡 IN PROGRESS
Phase 2: Observability & Monitoring ⏳ PENDING
Phase 3: Database & Data Integrity ⏳ PENDING
Phase 4: Performance Optimization ⏳ PENDING
Phase 5: Features & Polish ⏳ PENDING
Phase 6: Security (FINAL PHASE - DO NOT TOUCH YET)
```

---

## PHASE 6: Advanced Investment Math Analysis ✅ COMPLETE

> **Completed**: 2026-02-19
> **Goal**: Calculate most profitable investments using financial mathematics
> **Status**: All tasks completed and tested

### Task 6.1: Core Financial Metrics Engine ✅
**File**: `prism/api/lib/financial_metrics.py` (23KB)

**Implemented Metrics**:
- ✅ Simple ROI - (Current - Initial) / Initial
- ✅ CAGR - Compound Annual Growth Rate
- ✅ IRR - Internal Rate of Return (numpy_financial)
- ✅ NPV - Net Present Value
- ✅ Payback Period - Time to recover investment
- ✅ Sharpe Ratio - Risk-adjusted return
- ✅ Volatility - Annualized standard deviation
- ✅ Max Drawdown - Largest peak-to-trough decline
- ✅ VaR 95% - Value at Risk
- ✅ Comparative metrics (vs Inflation, CDI, S&P 500)

**Benchmark Rates**:
- Brazil Inflation: 4.5%
- Brazil CDI: 10.75%
- Brazil Selic: 11.5%
- S&P 500 Historical: 10%
- US Treasury 10Y: 4.2%

**Success Criteria**:
- [x] All 12 financial metrics calculated correctly
- [x] Unit tests for each metric with known values
- [x] Handles edge cases (zero values, missing data)

---

### Task 6.2: Portfolio Optimization Engine ✅
**File**: `prism/api/lib/portfolio_optimizer.py` (23KB)

**Features Implemented**:
- ✅ Modern Portfolio Theory (Markowitz Mean-Variance Optimization)
- ✅ Efficient Frontier calculation (up to 50 points)
- ✅ Maximum Sharpe Ratio portfolio optimization
- ✅ Minimum Volatility portfolio optimization
- ✅ Diversification Ratio calculation
- ✅ Covariance and Correlation matrices
- ✅ Rebalancing recommendations with action types (buy/sell/hold)
- ✅ Risk analysis and volatility reduction metrics

**Dependencies**: numpy, scipy

**Success Criteria**:
- [x] Efficient frontier calculated correctly
- [x] Sharpe optimization working
- [x] Diversification metrics computed

---

### Task 6.3: Investment Comparison Engine ✅
**File**: `prism/api/lib/investment_comparison.py` (22KB)

**Features Implemented**:
- ✅ Composite scoring algorithm with configurable weights
- ✅ 3 Risk Profiles: Conservative, Balanced, Aggressive
- ✅ Risk-adjusted rankings (Calmar ratio)
- ✅ Scenario analysis (market crash -20%, correction -10%, boom +30%, inflation -5%)
- ✅ Portfolio concentration analysis
- ✅ Liquidity scoring by category
- ✅ Automated recommendations and warnings

**Success Criteria**:
- [x] Composite scoring algorithm tested
- [x] Risk-adjusted rankings working
- [x] Scenario analysis functional
- [x] Recommendations generated

---

### Task 6.4: Math Analysis API Endpoints ✅
**File**: `prism/api/routers/analytics.py` (20KB)

**Endpoints Implemented**:
```
GET  /api/v1/analytics/investments/{id}/metrics    ✅ Returns full metrics
POST /api/v1/analytics/investments/batch-metrics   ✅ Batch metrics
GET  /api/v1/analytics/portfolio/summary           ✅ Portfolio summary
GET  /api/v1/analytics/portfolio/optimization      ✅ MPT optimization
POST /api/v1/analytics/compare                     ✅ Compare investments
GET  /api/v1/analytics/compare/all                 ✅ Compare all
POST /api/v1/analytics/scenario-analysis           ✅ What-if scenarios
GET  /api/v1/analytics/benchmarks                  ✅ Benchmark rates
```

**Success Criteria**:
- [x] All 8 endpoints implemented and tested
- [x] Integration with database models
- [x] Proper error handling

---

### Task 6.5: Frontend Math Dashboard ✅
**File**: `prism/web/src/pages/Analytics.tsx` (23KB)

**Components Created**:
- ✅ Portfolio summary cards (Total Value, ROI, CAGR)
- ✅ Category allocation visualization
- ✅ Investment rankings table with sorting
- ✅ Risk profile selector (Conservative/Balanced/Aggressive)
- ✅ Individual investment detail modal with all metrics
  - Basic metrics (ROI, Absolute Return)
  - Time-weighted returns (CAGR, Annualized ROI)
  - Advanced metrics (IRR, NPV, Payback)
  - Risk metrics (Sharpe, Volatility, Max Drawdown, VaR)
  - Comparative metrics (vs benchmarks)
- ✅ Recommendations and warnings panel
- ✅ Benchmark rates display
- ✅ Responsive warm-dark theme design

**Updated Files**:
- ✅ `prism/web/src/App.tsx` - Added Analytics route
- ✅ `prism/web/src/components/Layout.tsx` - Added "Análisis" to navigation
- ✅ `prism/web/src/lib/api.ts` - Added analyticsApi with types

**Success Criteria**:
- [x] Analytics page accessible at `/analytics`
- [x] All metrics displayed visually
- [x] Interactive investment detail modal
- [x] Navigation integration complete

---

### Phase 6 Summary Checklist ✅

| Component | Status |
|-----------|--------|
| `financial_metrics.py` with all 12 metrics | ✅ |
| Unit tests with verified calculations | ✅ |
| Edge case handling | ✅ |
| Efficient frontier calculation | ✅ |
| Sharpe ratio optimization | ✅ |
| Minimum volatility portfolio | ✅ |
| Diversification metrics | ✅ |
| Composite scoring algorithm | ✅ |
| Risk-adjusted rankings | ✅ |
| Scenario analysis | ✅ |
| Recommendations generation | ✅ |
| `/analytics/investments/{id}/metrics` endpoint | ✅ |
| `/analytics/compare` endpoint | ✅ |
| `/analytics/portfolio/optimization` endpoint | ✅ |
| `/analytics/portfolio/summary` endpoint | ✅ |
| `/analytics/scenario-analysis` endpoint | ✅ |
| Analytics dashboard page | ✅ |
| Metrics visualization components | ✅ |
| Comparison table | ✅ |

---

## PHASE 1: Testing Infrastructure 🟡 IN PROGRESS

### Task 1.1: API Testing Setup 🟡
**Goal**: Achieve 80% test coverage for API layer

**Files Created**:
- ✅ `prism/api/tests/conftest.py` - Existing fixtures
- ✅ `prism/api/tests/factories.py` - Factory Boy factories for all models
  - InvestmentFactory, FileRegistryFactory, ProcessingJobFactory
  - AnalysisResultFactory, DocumentFactory, ValuationHistoryFactory
  - ActivityLogFactory, batch creation helpers

**Files To Create**:
- [ ] `prism/api/tests/unit/test_models.py` - Unit tests for SQLAlchemy models
- [ ] `prism/api/tests/unit/test_schemas.py` - Pydantic schema tests
- [ ] `prism/api/tests/integration/test_upload_flow.py` - Upload pipeline tests

**Partially Complete**:
- 🟡 `prism/api/tests/integration/test_investments.py` - Basic CRUD tests exist

**Success Criteria**:
- [ ] `pytest --cov=api tests/` shows > 80% coverage
- [ ] All existing tests pass
- [ ] Integration tests run in < 30 seconds

---

### Task 1.2: Worker Testing Setup ⏳
**Goal**: Test AI client and job processing

**Files To Create**:
- [ ] `prism/worker/tests/conftest.py` - Mock fixtures
- [ ] `prism/worker/tests/unit/test_ai_client.py` - AI client tests
- [ ] `prism/worker/tests/unit/test_job_processing.py` - Job processing tests

**Success Criteria**:
- [ ] Worker tests > 70% coverage
- [ ] Mock AI responses for tests

---

### Task 1.3: Unit Tests for Financial Modules ✅
**Status**: COMPLETE - Created comprehensive test suite

**Files Created**:
- ✅ `prism/api/tests/unit/test_financial_metrics.py` (14KB)
  - ROI calculations (basic, edge cases, large numbers)
  - CAGR calculations (doubling, tripling, loss scenarios)
  - IRR calculations (simple, property investment)
  - NPV calculations (positive, negative, zero rate)
  - Payback period tests
  - Risk metrics (volatility, Sharpe, max drawdown, VaR)
  - Full investment analysis integration
  - Portfolio metrics aggregation

- ✅ `prism/api/tests/unit/test_portfolio_optimizer.py` (14KB)
  - AssetReturn data class tests
  - Expected return calculations
  - Covariance matrix calculations
  - Portfolio performance tests
  - Minimum volatility optimization
  - Maximum Sharpe optimization
  - Efficient frontier calculation
  - Diversification ratio tests
  - Edge cases and error handling

- ✅ `prism/api/tests/unit/test_investment_comparison.py` (17KB)
  - Composite scoring tests
  - Investment comparison tests
  - Ranking calculations
  - Recommendation generation
  - Diversification warnings
  - Scenario analysis tests
  - Risk-adjusted metrics
  - Concentration analysis
  - Liquidity scoring

**Test Count**: 50+ unit tests

---

### Task 1.4: Integration Tests for Analytics API ✅
**Status**: COMPLETE

**Files Created**:
- ✅ `prism/api/tests/integration/test_analytics_api.py` (16KB)
  - Investment metrics endpoint tests
  - Batch metrics endpoint tests
  - Portfolio summary endpoint tests
  - Portfolio optimization endpoint tests
  - Compare endpoints tests
  - Scenario analysis endpoint tests
  - Benchmarks endpoint tests
  - Error handling tests

**Test Count**: 15+ integration tests

---

### Task 1.5: Frontend Testing Setup ⏳
**Goal**: Component and integration tests

**Files To Create**:
- [ ] `prism/web/src/__tests__/setup.ts`
- [ ] `prism/web/src/__tests__/components/StatCard.test.tsx`
- [ ] `prism/web/src/__tests__/pages/Dashboard.test.tsx`
- [ ] `prism/web/src/__tests__/lib/api.test.ts`

**Success Criteria**:
- [ ] `npm run test` passes
- [ ] Component tests for all major components
- [ ] API mocking with MSW

---

## PHASE 2: Observability & Monitoring ⏳ PENDING

### Task 2.1: Structured Logging ⏳
**Goal**: Replace all print statements with structured logging

**Files To Create**:
- [ ] `prism/api/logging_config.py` - Structlog configuration
- [ ] Update `prism/api/main.py` - Integrate logging

**Requirements**:
```python
import structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
)
```

**Files to Update**:
- [ ] `prism/api/main.py` - Replace prints
- [ ] `prism/api/routers/*.py` - Replace prints
- [ ] `prism/worker/main.py` - Replace prints
- [ ] `prism/worker/ai_client.py` - Replace prints

**Success Criteria**:
- [ ] No print statements remain (except in CLI scripts)
- [ ] All logs output JSON
- [ ] Log levels (DEBUG, INFO, WARNING, ERROR) used appropriately

---

### Task 2.2: Metrics & Monitoring ⏳
**Goal**: Add Prometheus metrics endpoint

**Dependencies**: `pip install prometheus-client`

**Files To Create**:
- [ ] `prism/api/metrics.py` - Prometheus metrics definitions
- [ ] `prism/api/middleware.py` - MetricsMiddleware
- [ ] `prism/api/routers/health.py` - `/metrics` endpoint

**Metrics to Implement**:
- HTTP request counters and duration histograms
- Business metrics (investments, files, analyses)
- AI provider metrics (requests, tokens, latency)

**Success Criteria**:
- [ ] `/metrics` endpoint returns Prometheus format
- [ ] All major operations have metrics

---

### Task 2.3: Health Checks Expansion ⏳
**Goal**: Comprehensive health checks

**File To Create**: `prism/api/routers/health.py`

**Endpoints**:
- `GET /health` - Comprehensive health check
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe

**Success Criteria**:
- [ ] Health check tests all dependencies
- [ ] Returns 503 if critical services down
- [ ] Includes version and timestamp

---

## PHASE 3: Database & Data Integrity ⏳ PENDING

### Task 3.1: Database Migrations (Alembic) ⏳
**Goal**: Production-ready schema management

**Commands**:
```bash
pip install alembic
alembic init prism/database/migrations
```

**Files To Create**:
- [ ] `prism/database/migrations/alembic.ini`
- [ ] `prism/database/migrations/env.py`
- [ ] `prism/database/migrations/versions/001_initial_schema.py`

**Success Criteria**:
- [ ] `alembic upgrade head` works
- [ ] Can create new migrations
- [ ] Can rollback migrations

---

### Task 3.2: Missing Database Indexes ⏳
**Goal**: Optimize query performance

**File To Create**: `prism/database/migrations/versions/002_add_indexes.py`

**Indexes to Add**:
- Analysis results: confidence_score, created_at
- File registry: file_hash, status+created_at
- Activity log: performed_by
- Investments: current_value, purchase_date

**Success Criteria**:
- [ ] All queries use indexes (check with EXPLAIN)
- [ ] Migration runs successfully

---

### Task 3.3: Database Backup System ⏳
**Goal**: Automated backups

**Files To Create**:
- [ ] `prism/scripts/backup.py`
- [ ] `prism/scripts/restore.py`

**Features**:
- Automated PostgreSQL backup with gzip
- Backup listing with sizes
- Restore with confirmation
- Automatic retention (7 days default)

**Success Criteria**:
- [ ] `python scripts/backup.py` creates backup
- [ ] `python scripts/restore.py FILE` restores
- [ ] Automatic cleanup of old backups

---

## PHASE 4: Performance Optimization ⏳ PENDING

### Task 4.1: Frontend Code Splitting ⏳
**Goal**: Reduce initial bundle size

**File**: `prism/web/src/App.tsx`

```typescript
import { lazy, Suspense } from 'react'

// Lazy load heavy pages
const LandAnalyzer = lazy(() => import('./pages/LandAnalyzer'))
const Chat = lazy(() => import('./pages/Chat'))
const Analysis = lazy(() => import('./pages/Analysis'))
const Analytics = lazy(() => import('./pages/Analytics'))  // Already done ✅
```

**Success Criteria**:
- [ ] Initial bundle < 200KB
- [ ] Lighthouse performance score > 90

---

### Task 4.2: API Response Caching ⏳
**Goal**: Cache expensive queries

**File**: `prism/api/middleware.py`

```python
def cache_response(expire_seconds: int = 60):
    """Cache API responses in Redis."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"cache:{func.__name__}:{hash(str(args))}"
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, expire_seconds, json.dumps(result, default=str))
            return result
        return wrapper
    return decorator
```

**Apply to**:
- Dashboard stats endpoint
- Category breakdown
- Investment list

**Success Criteria**:
- [ ] Cached responses return in < 10ms
- [ ] Cache invalidation on data changes

---

### Task 4.3: Database Query Optimization ⏳
**Goal**: Fix N+1 queries

**File**: `prism/api/routers/investments.py`

```python
# Use selectinload to avoid N+1
result = await db.execute(
    select(Investment)
    .options(
        selectinload(Investment.documents),
        selectinload(Investment.files),
        selectinload(Investment.valuations)
    )
    .where(Investment.id == investment_id)
)
```

**Success Criteria**:
- [ ] All list endpoints use eager loading
- [ ] Query count < 3 per endpoint

---

### Task 4.4: AI Response Caching ⏳
**Goal**: Don't re-analyze identical files

**File**: `prism/worker/main.py`

```python
def process_job(self, job):
    file_hash = get_file_hash(job['file_id'])
    cached_result = self._get_cached_analysis(file_hash)
    if cached_result:
        logger.info("using_cached_analysis", file_hash=file_hash)
        self._complete_job(job['id'], cached_result['id'])
        return
    # Continue with analysis...
```

**Success Criteria**:
- [ ] Same file_hash returns cached result
- [ ] Cache TTL: 30 days

---

## PHASE 5: Features & Polish ⏳ PENDING

### Task 5.1: Pagination for List Endpoints ⏳
**Goal**: Handle large datasets

**File**: `prism/api/routers/investments.py`

```python
@router.get("")
async def list_investments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = None,
):
    # Implement cursor-based pagination
    # Return: { items: [], next_cursor: "xyz", total: 100 }
```

**Success Criteria**:
- [ ] `/investments` paginated
- [ ] `/files` paginated
- [ ] Frontend uses infinite scroll

---

### Task 5.2: Real-time Job Updates ⏳
**Goal**: Show analysis progress

**File**: `prism/api/routers/analysis.py`

```python
from fastapi import WebSocket

@router.websocket("/ws/jobs")
async def job_updates(websocket: WebSocket):
    await websocket.accept()
    # Subscribe to Redis pub/sub for job updates
```

**File**: `prism/web/src/hooks/useJobStatus.ts`

```typescript
export function useJobStatus(jobId: string) {
  // WebSocket connection for job status
  // Return: { status, progress, result }
}
```

**Success Criteria**:
- [ ] Job status updates in real-time
- [ ] Progress bar shows analysis progress

---

### Task 5.3: Document Search ⏳
**Goal**: Full-text search on documents

**File**: `prism/api/routers/search.py`

```python
@router.get("/search")
async def search_documents(q: str, filters: Optional[SearchFilters] = None):
    # Use PostgreSQL full-text search
    # Search in: file names, analysis text, extracted entities
```

**Success Criteria**:
- [ ] Search by file name
- [ ] Search by content (analyzed text)
- [ ] Filter by date, type, investment

---

## SUMMARY CHECKLIST

### Phase 6: Financial Analysis ✅
- [x] `financial_metrics.py` with 12 metrics
- [x] Unit tests with verified calculations
- [x] Edge case handling
- [x] Efficient frontier calculation
- [x] Sharpe ratio optimization
- [x] Minimum volatility portfolio
- [x] Diversification metrics
- [x] Composite scoring algorithm
- [x] Risk-adjusted rankings
- [x] Scenario analysis
- [x] Recommendations generation
- [x] All 8 analytics API endpoints
- [x] Analytics dashboard page
- [x] Navigation integration

### Phase 1: Testing 🟡
- [x] API test factories
- [x] Financial modules unit tests (50+)
- [x] Analytics API integration tests (15+)
- [ ] Model validation tests
- [ ] Schema tests
- [ ] Upload flow tests
- [ ] Frontend tests

### Phase 2: Observability ⏳
- [ ] Structured logging
- [ ] Prometheus metrics
- [ ] Health checks expansion

### Phase 3: Database ⏳
- [ ] Alembic migrations
- [ ] Additional indexes
- [ ] Backup/restore scripts

### Phase 4: Performance ⏳
- [ ] Frontend code splitting (Analytics already lazy-loaded ✅)
- [ ] API response caching
- [ ] Query optimization
- [ ] AI response caching

### Phase 5: Features ⏳
- [ ] Pagination
- [ ] Real-time job updates
- [ ] Document search

### Phase 6: Security (DO NOT TOUCH YET) ⏸️
- [ ] JWT authentication
- [ ] Rate limiting
- [ ] Error handling fixes
- [ ] CORS restrictions

---

## IMPORTANT RULES

1. **NO SECURITY CHANGES** - That comes in final phase
2. **TEST EVERYTHING** - Every change must have tests
3. **KEEP IT WORKING** - Don't break existing functionality
4. **DOCUMENT CHANGES** - Update AGENTS.md if patterns change
5. **MEASURE BEFORE/AFTER** - Show performance improvements

---

## SUCCESS METRICS

| Metric | Before | Target After | Current |
|--------|--------|--------------|---------|
| Test Coverage | ~15% | 80% | 🟡 60% |
| API Response (p95) | Unknown | < 200ms | TBD |
| Frontend Bundle | Unknown | < 200KB | TBD |
| Database Queries | N+1 issues | < 3 per endpoint | ⏳ Pending |
| Uptime Monitoring | None | Health checks | ⏳ Pending |
| Log Searchability | Print statements | Structured JSON | ⏳ Pending |
| Financial Metrics | Basic ROI | 12+ advanced metrics | ✅ COMPLETE |
| Portfolio Analysis | None | MPT optimization | ✅ COMPLETE |

---

## NEW DEPENDENCIES ADDED

```bash
# Financial calculations (Phase 6)
pip install numpy==2.1.3 scipy==1.14.1 numpy-financial==1.0.0

# Observability (Phase 2 - pending)
pip install structlog==24.4.0 prometheus-client==0.21.0

# Database (Phase 3 - pending)
pip install alembic==1.14.0
```

---

## FILES CREATED IN THIS BATCH

### Backend (Python)
```
prism/api/lib/
├── __init__.py
├── financial_metrics.py      # 23KB - 12 financial metrics
├── portfolio_optimizer.py    # 23KB - MPT optimization
└── investment_comparison.py  # 22KB - Ranking & analysis

prism/api/routers/
└── analytics.py              # 20KB - 8 API endpoints

prism/api/tests/
├── factories.py              # 12KB - Test data factories
├── unit/
│   ├── test_financial_metrics.py      # 14KB
│   ├── test_portfolio_optimizer.py    # 14KB
│   └── test_investment_comparison.py  # 17KB
└── integration/
    └── test_analytics_api.py          # 16KB
```

### Frontend (TypeScript)
```
prism/web/src/
├── pages/
│   └── Analytics.tsx         # 23KB - Dashboard
└── lib/
    └── api.ts                # Updated with analyticsApi
```

### Updated Files
- `prism/api/main.py` - Analytics router registration
- `prism/api/requirements.txt` - New dependencies
- `prism/web/src/App.tsx` - Analytics route
- `prism/web/src/components/Layout.tsx` - Navigation

---

## NEXT STEPS

1. **Complete Phase 1 Testing**: Model validation, schema tests, upload flow tests
2. **Phase 2 Observability**: Structured logging, Prometheus metrics
3. **Phase 3 Database**: Alembic migrations, indexes, backups
4. **Phase 4 Performance**: Caching, query optimization
5. **Phase 5 Features**: Pagination, real-time updates, search

---

**Last Updated**: 2026-02-19
**Phase 6 Status**: ✅ COMPLETE
**Overall Progress**: 35%

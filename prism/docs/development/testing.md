# Testing Guide

## Overview

We use different testing frameworks for each component:

- **API**: pytest with async support
- **Worker**: pytest
- **Web**: Vitest + React Testing Library
- **E2E**: Playwright (planned)

## Running Tests

### All Tests

```bash
make test
```

### API Tests

```bash
cd api
pytest

# With coverage
pytest --cov=. --cov-report=html

# Specific test
pytest tests/test_investments.py::test_create_investment -v
```

### Worker Tests

```bash
cd worker
pytest
```

### Web Tests

```bash
cd web
npm run test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Writing Tests

### API Test Example

```python
# tests/test_feature.py
def test_create_resource(client):
    response = client.post("/api/v1/resource", json={
        "name": "Test"
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Test"
```

### Web Test Example

```typescript
// src/__tests__/Component.test.tsx
import { render, screen } from '@testing-library/react';
import { Component } from '../components/Component';

test('renders component', () => {
  render(<Component />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## Test Markers

Use markers to categorize tests:

```python
@pytest.mark.slow  # Slow tests
@pytest.mark.integration  # Integration tests
@pytest.mark.unit  # Unit tests
```

Run specific markers:

```bash
pytest -m "not slow"  # Skip slow tests
pytest -m "integration"  # Only integration tests
```

## Test Data

Use fixtures for test data:

```python
@pytest.fixture
def sample_investment(db_session):
    investment = Investment(name="Test", ...)
    db_session.add(investment)
    db_session.commit()
    return investment
```

## Coverage

Minimum coverage requirements:

- API: 80%
- Worker: 70%
- Web: 70%

View coverage reports:

- API: `open htmlcov/index.html`
- Web: `open coverage/index.html`

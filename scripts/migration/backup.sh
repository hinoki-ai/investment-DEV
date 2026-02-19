#!/bin/bash
# =============================================================================
# Database Backup Script
# =============================================================================
set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-investments}"
DB_USER="${DB_USER:-investor}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Creating database backup...${NC}"

# Check if running in Docker
if docker-compose ps postgres | grep -q "Up" 2>/dev/null; then
    echo "Using Docker PostgreSQL..."
    docker-compose exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}"
else
    echo "Using local PostgreSQL..."
    pg_dump -U "$DB_USER" -d "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}"
fi

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo -e "${GREEN}✓ Backup created: ${BACKUP_DIR}/${BACKUP_FILE}.gz${NC}"

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete 2>/dev/null || true

echo -e "${GREEN}✓ Old backups cleaned up${NC}"

#!/bin/bash
# =============================================================================
# Database Restore Script
# =============================================================================
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}Usage: $0 <backup_file>${NC}"
    echo ""
    echo "Available backups:"
    ls -1 backups/ 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-investments}"
DB_USER="${DB_USER:-investor}"

# Check if backup exists
if [ ! -f "$BACKUP_FILE" ]; then
    if [ -f "backups/$BACKUP_FILE" ]; then
        BACKUP_FILE="backups/$BACKUP_FILE"
    else
        echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}Warning: This will overwrite the current database!${NC}"
read -p "Are you sure? [y/N] " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Handle compressed files
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup..."
    gunzip -c "$BACKUP_FILE" > /tmp/restore_temp.sql
    BACKUP_FILE="/tmp/restore_temp.sql"
fi

echo "Restoring database from: $BACKUP_FILE"

# Check if running in Docker
if docker-compose ps postgres | grep -q "Up" 2>/dev/null; then
    echo "Using Docker PostgreSQL..."
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
else
    echo "Using local PostgreSQL..."
    psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

# Clean up temp file
if [ -f /tmp/restore_temp.sql ]; then
    rm /tmp/restore_temp.sql
fi

echo -e "${GREEN}✓ Database restored successfully${NC}"

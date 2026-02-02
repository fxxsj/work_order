#!/bin/bash
#
# Automated backup script for workorder system
# Backs up database and media files daily
#

set -e

# Configuration
BACKUP_DIR="/var/backups/workorder"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Load environment variables
if [ -f /opt/workorder/backend/.env ]; then
    source /opt/workorder/backend/.env
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Database backup
echo "[$(date)] Backing up database..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "${POSTGRES_HOST:-localhost}" \
    -U "${POSTGRES_USER:-workorder}" \
    -d "${POSTGRES_DB:-workorder}" \
    --no-owner --no-acl | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Verify database backup
if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1)
    echo "[$(date)] Database backup completed: $SIZE"
else
    echo "[$(date)] ERROR: Database backup failed!"
    exit 1
fi

# Media files backup
echo "[$(date)] Backing up media files..."
if [ -d /opt/workorder/backend/media ]; then
    tar -czf "$BACKUP_DIR/media_$DATE.tar.gz" -C /opt/workorder/backend media
    SIZE=$(du -h "$BACKUP_DIR/media_$DATE.tar.gz" | cut -f1)
    echo "[$(date)] Media backup completed: $SIZE"
fi

# Static files backup (optional - can be regenerated)
# tar -czf "$BACKUP_DIR/static_$DATE.tar.gz" -C /opt/workorder/backend staticfiles

# Remove old backups
echo "[$(date)] Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "media_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# List current backups
echo "[$(date)] Current backups:"
ls -lh "$BACKUP_DIR/" | tail -10

echo "[$(date)] Backup completed successfully!"

# Optional: Upload to cloud storage
# aws s3 sync "$BACKUP_DIR/" s3://workorder-backups/

# Optional: Send notification
# if command -v mail &> /dev/null; then
#     echo "Backup completed at $(date)" | mail -s "Workorder Backup" admin@example.com
# fi

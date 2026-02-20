#!/usr/bin/env python3
"""
===============================================================================
DATABASE BACKUP SCRIPT
===============================================================================
Automated PostgreSQL backup with rotation.

Usage:
    python backup.py                    # Create backup
    python backup.py --list             # List backups
    python backup.py --restore FILE     # Restore from backup
    python backup.py --cleanup          # Remove old backups (keep 7 days)
"""
import argparse
import gzip
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
BACKUP_DIR = Path(os.getenv("BACKUP_DIR", "/home/hinoki/HinokiDEV/Investments/backups"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://investor:family_future_2024@localhost:5432/investments")
RETENTION_DAYS = int(os.getenv("BACKUP_RETENTION_DAYS", "7"))


def ensure_backup_dir():
    """Ensure backup directory exists."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def create_backup() -> Path:
    """Create a new database backup."""
    ensure_backup_dir()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"investments_{timestamp}.sql.gz"
    
    print(f"🔄 Creating backup: {backup_file.name}")
    
    # Create backup using pg_dump
    try:
        # Run pg_dump and compress with gzip
        with gzip.open(backup_file, 'wb') as f:
            result = subprocess.run(
                ["pg_dump", DATABASE_URL],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
            )
            f.write(result.stdout)
        
        # Get file size
        size_mb = backup_file.stat().st_size / (1024 * 1024)
        print(f"✅ Backup created: {backup_file.name} ({size_mb:.2f} MB)")
        
        return backup_file
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Backup failed: {e.stderr.decode()}")
        if backup_file.exists():
            backup_file.unlink()
        sys.exit(1)
    except FileNotFoundError:
        print("❌ pg_dump not found. Please install PostgreSQL client tools.")
        sys.exit(1)


def list_backups():
    """List all available backups."""
    ensure_backup_dir()
    
    backups = sorted(BACKUP_DIR.glob("investments_*.sql.gz"), reverse=True)
    
    if not backups:
        print("📂 No backups found")
        return
    
    print(f"\n📦 Found {len(backups)} backup(s):\n")
    print(f"{'Date':<20} {'Size':>12} {'Filename'}")
    print("-" * 80)
    
    for backup in backups:
        date_str = datetime.fromtimestamp(backup.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        size_mb = backup.stat().st_size / (1024 * 1024)
        print(f"{date_str:<20} {size_mb:>10.2f} MB  {backup.name}")


def restore_backup(backup_file: Path):
    """Restore database from backup."""
    if not backup_file.exists():
        # Try in backup directory
        backup_file = BACKUP_DIR / backup_file
        if not backup_file.exists():
            print(f"❌ Backup file not found: {backup_file}")
            sys.exit(1)
    
    print(f"⚠️  WARNING: This will replace the current database!")
    print(f"📂 Backup: {backup_file.name}")
    print(f"🎯 Database: {DATABASE_URL}")
    
    confirm = input("\nType 'RESTORE' to continue: ")
    if confirm != "RESTORE":
        print("❌ Restore cancelled")
        return
    
    print(f"\n🔄 Restoring from backup...")
    
    try:
        # Decompress and restore
        with gzip.open(backup_file, 'rb') as f:
            result = subprocess.run(
                ["psql", DATABASE_URL],
                stdin=f,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
            )
        
        print("✅ Restore completed successfully")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Restore failed: {e.stderr.decode()}")
        sys.exit(1)
    except FileNotFoundError:
        print("❌ psql not found. Please install PostgreSQL client tools.")
        sys.exit(1)


def cleanup_old_backups():
    """Remove backups older than retention period."""
    ensure_backup_dir()
    
    cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
    backups = list(BACKUP_DIR.glob("investments_*.sql.gz"))
    
    deleted = 0
    total_freed = 0
    
    for backup in backups:
        backup_date = datetime.fromtimestamp(backup.stat().st_mtime)
        if backup_date < cutoff_date:
            size = backup.stat().st_size
            backup.unlink()
            deleted += 1
            total_freed += size
            print(f"🗑️  Deleted: {backup.name}")
    
    freed_mb = total_freed / (1024 * 1024)
    print(f"\n✅ Cleaned up {deleted} old backup(s), freed {freed_mb:.2f} MB")
    print(f"📅 Retention policy: {RETENTION_DAYS} days")


def main():
    parser = argparse.ArgumentParser(
        description="Database backup and restore tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                    Create a new backup
  %(prog)s --list             List all backups
  %(prog)s --restore FILE     Restore from backup file
  %(prog)s --cleanup          Remove old backups
        """,
    )
    
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List all available backups",
    )
    
    parser.add_argument(
        "--restore", "-r",
        metavar="FILE",
        help="Restore database from backup file",
    )
    
    parser.add_argument(
        "--cleanup", "-c",
        action="store_true",
        help="Remove backups older than retention period",
    )
    
    parser.add_argument(
        "--retention",
        type=int,
        default=RETENTION_DAYS,
        help=f"Backup retention in days (default: {RETENTION_DAYS})",
    )
    
    args = parser.parse_args()
    
    global RETENTION_DAYS
    RETENTION_DAYS = args.retention
    
    if args.list:
        list_backups()
    elif args.restore:
        restore_backup(Path(args.restore))
    elif args.cleanup:
        cleanup_old_backups()
    else:
        # Create backup by default
        backup_file = create_backup()
        cleanup_old_backups()
        print(f"\n💾 Backup location: {backup_file}")


if __name__ == "__main__":
    main()

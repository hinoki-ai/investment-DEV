"""
===============================================================================
COMMON IMPORTS HELPER - Properly loads db_models and schemas without conflicts
===============================================================================
"""
import sys

# Add paths for imports
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/prism/api')
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/prism/shared')

# Import database
from database import get_async_db, redis_client

# Import API SQLAlchemy models
import models as db_models

# Import shared Pydantic schemas (from schemas.py)
import schemas

# Storage is loaded lazily to avoid connection errors during import
_storage_module = None

def get_storage_service():
    """Lazy load storage service to avoid connection errors during import."""
    global _storage_module
    if _storage_module is None:
        from storage import get_storage_service as _get_storage
        _storage_module = _get_storage
    return _storage_module()

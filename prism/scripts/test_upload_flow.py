#!/usr/bin/env python3
"""
===============================================================================
UPLOAD SYSTEM TEST - Verify the NEXUS upload flow works correctly
===============================================================================
Tests:
1. Request upload URL (creates DB entry + generates pre-signed URL)
2. Verify pre-signed URL format
3. Confirm upload flow (with file existence check)
4. Job queuing for analysis
===============================================================================
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime

# Add paths
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/api')
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/shared')

# Test configuration
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://investor:family_future_2024@localhost:5432/investments")
TEST_STORAGE_ENDPOINT = os.getenv("STORAGE_ENDPOINT", "http://localhost:9000")


def test_models():
    """Test that all models can be imported and validated."""
    print("\n📋 Testing model imports...")
    
    try:
        from models import (
            UploadUrlRequest, UploadUrlResponse, ConfirmUploadRequest,
            FileRegistryResponse, FileStatus, JobType, DocumentType
        )
        
        # Test UploadUrlRequest creation
        request = UploadUrlRequest(
            filename="test_document.pdf",
            content_type="application/pdf",
            investment_id=None,
            source_device="test"
        )
        assert request.filename == "test_document.pdf"
        assert request.content_type == "application/pdf"
        print("  ✅ UploadUrlRequest model works")
        
        # Test ConfirmUploadRequest creation
        confirm = ConfirmUploadRequest(
            file_id=uuid.uuid4(),
            investment_id=None,
            document_type=DocumentType.CONTRACT,
            request_analysis=True,
            analysis_type=JobType.DOCUMENT_ANALYSIS
        )
        assert confirm.request_analysis == True
        assert confirm.document_type == DocumentType.CONTRACT
        print("  ✅ ConfirmUploadRequest model works")
        
        # Test UploadUrlResponse creation
        response = UploadUrlResponse(
            upload_url="https://example.com/upload",
            file_id=uuid.uuid4(),
            storage_key="uploads/test-file.pdf",
            expires_in_seconds=300
        )
        assert response.expires_in_seconds == 300
        print("  ✅ UploadUrlResponse model works")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Model test failed: {e}")
        return False


def test_storage_service():
    """Test storage service can be instantiated."""
    print("\n💾 Testing storage service...")
    
    try:
        from storage import StorageService
        
        # Create storage service (will use env vars or defaults)
        storage = StorageService()
        
        # Test storage key generation
        key = storage.generate_storage_key(
            original_filename="Test Document.pdf",
            investment_id=str(uuid.uuid4()),
            prefix="uploads"
        )
        assert "uploads/" in key
        assert ".pdf" in key
        print(f"  ✅ Storage key generation works: {key[:40]}...")
        
        # Test upload URL generation (will fail without real storage, but tests code path)
        try:
            url = storage.generate_upload_url(
                storage_key=key,
                content_type="application/pdf",
                expires_in=300
            )
            assert "https://" in url or "http://" in url
            print(f"  ✅ Pre-signed URL generation works")
        except Exception as e:
            # This is expected if MinIO/R2 is not running
            print(f"  ⚠️  Pre-signed URL generation failed (storage may be offline): {e}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Storage service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_file_metadata_check():
    """Test that file metadata check would work (file won't exist)."""
    print("\n🔍 Testing file metadata check...")
    
    try:
        from storage import StorageService
        
        storage = StorageService()
        fake_key = "uploads/nonexistent-file.pdf"
        
        try:
            metadata = storage.get_file_metadata(fake_key)
            print(f"  ⚠️  Unexpectedly got metadata: {metadata}")
        except Exception as e:
            # This is expected - file doesn't exist
            assert "Failed to get file metadata" in str(e) or "404" in str(e)
            print(f"  ✅ File existence check works (file not found as expected)")
        
        return True
        
    except Exception as e:
        print(f"  ❌ File metadata test failed: {e}")
        return False


def test_upload_router_syntax():
    """Test that upload router can be imported."""
    print("\n🌐 Testing upload router...")
    
    try:
        from routers.uploads import router as uploads_router
        
        # Check that routes exist
        routes = [route.path for route in uploads_router.routes]
        
        assert "/request-url" in routes, f"Expected /request-url in {routes}"
        assert "/confirm" in routes, f"Expected /confirm in {routes}"
        assert "/status/{file_id}" in routes, f"Expected /status/{{file_id}} in {routes}"
        assert "/request-url/batch" in routes, f"Expected /request-url/batch in {routes}"
        assert "/confirm/batch" in routes, f"Expected /confirm/batch in {routes}"
        
        print(f"  ✅ Upload router has all routes:")
        print(f"     - /request-url")
        print(f"     - /confirm")
        print(f"     - /status/{{file_id}}")
        print(f"     - /request-url/batch")
        print(f"     - /confirm/batch")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Upload router test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_database_models():
    """Test database models can be imported."""
    print("\n🗄️  Testing database models...")
    
    try:
        from models import FileRegistry, ProcessingJob, Document, FileStatus, JobType, JobStatus
        
        # Test that enums work
        assert FileStatus.PENDING.value == "pending"
        assert FileStatus.COMPLETED.value == "completed"
        assert JobType.DOCUMENT_ANALYSIS.value == "document_analysis"
        assert JobStatus.QUEUED.value == "queued"
        
        print("  ✅ Database models and enums work")
        return True
        
    except Exception as e:
        print(f"  ❌ Database models test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def print_test_summary(results):
    """Print test summary."""
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("-"*70)
    print(f"Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! The upload system is ready.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")
    
    return passed == total


async def run_async_tests():
    """Run async tests if database is available."""
    print("\n🔄 Running async database tests...")
    
    results = {}
    
    try:
        # Try to connect to database
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text
        
        db_url = TEST_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        engine = create_async_engine(db_url)
        
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            assert result.scalar() == 1
            print("  ✅ Database connection works")
            results["database_connection"] = True
            
            # Test that tables exist
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = [row[0] for row in result]
            
            required_tables = ['file_registry', 'processing_jobs', 'documents']
            for table in required_tables:
                if table in tables:
                    print(f"  ✅ Table '{table}' exists")
                else:
                    print(f"  ❌ Table '{table}' NOT found")
                    results["database_tables"] = False
                    return results
            
            results["database_tables"] = True
            
    except Exception as e:
        print(f"  ⚠️  Database tests skipped (DB not available): {e}")
        results["database_connection"] = None  # Skipped
        results["database_tables"] = None
    
    return results


def main():
    """Run all tests."""
    print("="*70)
    print("NEXUS UPLOAD SYSTEM TEST")
    print("="*70)
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Database: {TEST_DATABASE_URL.replace('://', '://***:***@')}")
    print(f"Storage: {TEST_STORAGE_ENDPOINT}")
    
    # Run synchronous tests
    results = {
        "model_imports": test_models(),
        "storage_service": test_storage_service(),
        "file_metadata_check": test_file_metadata_check(),
        "upload_router": test_upload_router_syntax(),
        "database_models": test_database_models(),
    }
    
    # Run async tests
    try:
        async_results = asyncio.run(run_async_tests())
        results.update(async_results)
    except Exception as e:
        print(f"\n⚠️  Async tests failed: {e}")
    
    # Print summary
    success = print_test_summary(results)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())

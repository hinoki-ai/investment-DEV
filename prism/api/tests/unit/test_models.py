"""
===============================================================================
UNIT TESTS - SQLAlchemy Models
===============================================================================
"""
import pytest
from datetime import date, datetime
from decimal import Decimal

from models import (
    Investment, InvestmentCategory, InvestmentStatus,
    FileRegistry, FileStatus,
    ProcessingJob, JobType, JobStatus,
    AnalysisResult,
    Document, DocumentType,
    ValuationHistory,
    ActivityLog,
)


# =============================================================================
# INVESTMENT MODEL TESTS
# =============================================================================

class TestInvestmentModel:
    """Test cases for Investment model."""
    
    @pytest.mark.asyncio
    async def test_create_investment(self, db_session):
        """Test creating a basic investment."""
        investment = Investment(
            name="Test Land Investment",
            category=InvestmentCategory.LAND,
            purchase_price=Decimal("100000.00"),
            current_value=Decimal("120000.00"),
            purchase_date=date(2024, 1, 1),
            status=InvestmentStatus.ACTIVE,
        )
        
        db_session.add(investment)
        await db_session.commit()
        await db_session.refresh(investment)
        
        assert investment.id is not None
        assert investment.name == "Test Land Investment"
        assert investment.category == InvestmentCategory.LAND
        assert investment.purchase_price == Decimal("100000.00")
        assert investment.current_value == Decimal("120000.00")
        assert investment.status == InvestmentStatus.ACTIVE
        assert investment.created_at is not None
        assert investment.updated_at is not None
    
    @pytest.mark.asyncio
    async def test_investment_categories(self, db_session):
        """Test all investment categories can be created."""
        categories = [
            InvestmentCategory.LAND,
            InvestmentCategory.STOCKS,
            InvestmentCategory.GOLD,
            InvestmentCategory.CRYPTO,
            InvestmentCategory.REAL_ESTATE,
            InvestmentCategory.BONDS,
            InvestmentCategory.OTHER,
        ]
        
        for i, category in enumerate(categories):
            investment = Investment(
                name=f"Test {category.value}",
                category=category,
                purchase_price=Decimal(f"{100000 + i * 10000}.00"),
            )
            db_session.add(investment)
        
        await db_session.commit()
        
        # Query and verify
        from sqlalchemy import select
        result = await db_session.execute(
            select(Investment).where(Investment.category.in_(categories))
        )
        investments = result.scalars().all()
        
        assert len(investments) == len(categories)
    
    @pytest.mark.asyncio
    async def test_investment_status_transitions(self, db_session):
        """Test investment status can be updated."""
        investment = Investment(
            name="Status Test Investment",
            category=InvestmentCategory.LAND,
            status=InvestmentStatus.PENDING,
        )
        
        db_session.add(investment)
        await db_session.commit()
        
        # Update status
        investment.status = InvestmentStatus.ACTIVE
        await db_session.commit()
        await db_session.refresh(investment)
        
        assert investment.status == InvestmentStatus.ACTIVE
    
    @pytest.mark.asyncio
    async def test_investment_relationships(self, db_session):
        """Test investment relationships are set up correctly."""
        investment = Investment(
            name="Relationship Test",
            category=InvestmentCategory.REAL_ESTATE,
        )
        
        db_session.add(investment)
        await db_session.commit()
        await db_session.refresh(investment)
        
        # Test that relationship attributes exist
        assert hasattr(investment, 'files')
        assert hasattr(investment, 'documents')
        assert hasattr(investment, 'processing_jobs')
        assert hasattr(investment, 'analysis_results')
        assert hasattr(investment, 'valuations')


# =============================================================================
# FILE REGISTRY MODEL TESTS
# =============================================================================

class TestFileRegistryModel:
    """Test cases for FileRegistry model."""
    
    @pytest.mark.asyncio
    async def test_create_file_registry(self, db_session):
        """Test creating a file registry entry."""
        file = FileRegistry(
            original_filename="test-document.pdf",
            storage_key="uploads/abc123/test-document.pdf",
            storage_bucket="investments-bucket",
            file_size_bytes=1024000,
            mime_type="application/pdf",
            file_hash="a" * 64,
            status=FileStatus.PENDING,
        )
        
        db_session.add(file)
        await db_session.commit()
        await db_session.refresh(file)
        
        assert file.id is not None
        assert file.original_filename == "test-document.pdf"
        assert file.storage_bucket == "investments-bucket"
        assert file.status == FileStatus.PENDING
        assert file.created_at is not None
    
    @pytest.mark.asyncio
    async def test_file_status_transitions(self, db_session):
        """Test file status transitions."""
        file = FileRegistry(
            original_filename="status-test.pdf",
            storage_key="uploads/status-test.pdf",
            storage_bucket="test-bucket",
            status=FileStatus.PENDING,
        )
        
        db_session.add(file)
        await db_session.commit()
        
        # Test status transitions
        file.status = FileStatus.PROCESSING
        await db_session.commit()
        await db_session.refresh(file)
        assert file.status == FileStatus.PROCESSING


# =============================================================================
# PROCESSING JOB MODEL TESTS
# =============================================================================

class TestProcessingJobModel:
    """Test cases for ProcessingJob model."""
    
    @pytest.mark.asyncio
    async def test_create_processing_job(self, db_session):
        """Test creating a processing job."""
        # Create a file first
        file = FileRegistry(
            original_filename="job-test.pdf",
            storage_key="uploads/job-test.pdf",
            storage_bucket="test-bucket",
        )
        db_session.add(file)
        await db_session.commit()
        
        # Create job
        job = ProcessingJob(
            job_type=JobType.DOCUMENT_ANALYSIS,
            status=JobStatus.QUEUED,
            priority=5,
            file_id=file.id,
            max_retries=3,
        )
        
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)
        
        assert job.id is not None
        assert job.job_type == JobType.DOCUMENT_ANALYSIS
        assert job.status == JobStatus.QUEUED
        assert job.priority == 5
        assert job.retry_count == 0


# =============================================================================
# ANALYSIS RESULT MODEL TESTS
# =============================================================================

class TestAnalysisResultModel:
    """Test cases for AnalysisResult model."""
    
    @pytest.mark.asyncio
    async def test_create_analysis_result(self, db_session):
        """Test creating an analysis result."""
        # Create file first
        file = FileRegistry(
            original_filename="analysis-test.pdf",
            storage_key="uploads/analysis-test.pdf",
            storage_bucket="test-bucket",
        )
        db_session.add(file)
        await db_session.commit()
        
        # Create analysis result
        result = AnalysisResult(
            file_id=file.id,
            analysis_type="document_analysis",
            model_version="gpt-4o-2024-08-06",
            raw_text="Test analysis content",
            structured_data={"key": "value"},
            summary="Test summary",
            confidence_score=Decimal("0.85"),
            tokens_used=500,
            processing_time_ms=1200,
        )
        
        db_session.add(result)
        await db_session.commit()
        await db_session.refresh(result)
        
        assert result.id is not None
        assert result.analysis_type == "document_analysis"
        assert result.confidence_score == Decimal("0.85")
        assert result.tokens_used == 500


# =============================================================================
# DOCUMENT MODEL TESTS
# =============================================================================

class TestDocumentModel:
    """Test cases for Document model."""
    
    @pytest.mark.asyncio
    async def test_create_document(self, db_session):
        """Test creating a document."""
        # Create investment and file
        investment = Investment(
            name="Document Test Investment",
            category=InvestmentCategory.LAND,
        )
        db_session.add(investment)
        await db_session.commit()
        
        file = FileRegistry(
            original_filename="document-test.pdf",
            storage_key="uploads/document-test.pdf",
            storage_bucket="test-bucket",
        )
        db_session.add(file)
        await db_session.commit()
        
        # Create document
        document = Document(
            investment_id=investment.id,
            file_id=file.id,
            document_type=DocumentType.DEED,
            title="Property Deed",
            description="Official property deed document",
            is_key_document=True,
        )
        
        db_session.add(document)
        await db_session.commit()
        await db_session.refresh(document)
        
        assert document.id is not None
        assert document.document_type == DocumentType.DEED
        assert document.title == "Property Deed"
        assert document.is_key_document is True


# =============================================================================
# VALUATION HISTORY MODEL TESTS
# =============================================================================

class TestValuationHistoryModel:
    """Test cases for ValuationHistory model."""
    
    @pytest.mark.asyncio
    async def test_create_valuation(self, db_session):
        """Test creating a valuation history entry."""
        # Create investment
        investment = Investment(
            name="Valuation Test Investment",
            category=InvestmentCategory.LAND,
        )
        db_session.add(investment)
        await db_session.commit()
        
        # Create valuation
        valuation = ValuationHistory(
            investment_id=investment.id,
            valuation_date=date(2024, 6, 1),
            value=Decimal("150000.00"),
            currency="BRL",
            valuation_method="market_comparison",
            valuer_name="John Appraiser",
            notes="Annual valuation update",
        )
        
        db_session.add(valuation)
        await db_session.commit()
        await db_session.refresh(valuation)
        
        assert valuation.id is not None
        assert valuation.value == Decimal("150000.00")
        assert valuation.currency == "BRL"


# =============================================================================
# ACTIVITY LOG MODEL TESTS
# =============================================================================

class TestActivityLogModel:
    """Test cases for ActivityLog model."""
    
    @pytest.mark.asyncio
    async def test_create_activity_log(self, db_session):
        """Test creating an activity log entry."""
        import uuid
        
        log = ActivityLog(
            entity_type="investment",
            entity_id=uuid.uuid4(),
            action="created",
            performed_by="test_user",
            new_values={"name": "New Investment", "category": "land"},
            ip_address="127.0.0.1",
            user_agent="TestBrowser/1.0",
        )
        
        db_session.add(log)
        await db_session.commit()
        await db_session.refresh(log)
        
        assert log.id is not None
        assert log.entity_type == "investment"
        assert log.action == "created"
        assert log.performed_by == "test_user"

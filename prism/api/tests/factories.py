"""
===============================================================================
TEST FACTORIES - Factory Boy Factories for Test Data Generation
===============================================================================
"""
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal

import factory
from factory import Faker, SubFactory, LazyAttribute, Sequence
from factory.alchemy import SQLAlchemyModelFactory

from models import (
    Investment, InvestmentCategory, InvestmentStatus,
    FileRegistry, FileStatus,
    ProcessingJob, JobType, JobStatus,
    AnalysisResult,
    Document, DocumentType,
    ValuationHistory,
    ActivityLog,
)
from database import Base


class BaseFactory(SQLAlchemyModelFactory):
    """Base factory with common configuration."""
    
    class Meta:
        abstract = True
        sqlalchemy_session = None  # Set in conftest.py
        sqlalchemy_session_persistence = "commit"


class InvestmentFactory(BaseFactory):
    """Factory for Investment model."""
    
    class Meta:
        model = Investment
    
    id = factory.LazyFunction(uuid.uuid4)
    name = factory.Sequence(lambda n: f"Test Investment {n}")
    category = factory.Iterator([
        InvestmentCategory.LAND,
        InvestmentCategory.STOCKS,
        InvestmentCategory.GOLD,
        InvestmentCategory.CRYPTO,
        InvestmentCategory.REAL_ESTATE,
    ])
    description = Faker("text", max_nb_chars=200)
    
    address = Faker("street_address")
    city = Faker("city")
    state = Faker("state_abbr")
    country = "Brazil"
    
    purchase_price = factory.LazyAttribute(lambda _: Decimal(str(Faker("pydecimal", min_value=50000, max_value=500000, right_digits=2).generate())))
    purchase_currency = "BRL"
    purchase_date = factory.LazyFunction(lambda: date.today() - timedelta(days=Faker("random_int", min=30, max=3650).generate()))
    
    current_value = factory.LazyAttribute(lambda o: o.purchase_price * Decimal(str(Faker("pydecimal", min_value=0.8, max_value=2.5, right_digits=2).generate())))
    last_valuation_date = factory.LazyFunction(date.today)
    
    land_area_m2 = factory.LazyAttribute(lambda _: Decimal(str(Faker("pydecimal", min_value=100, max_value=10000, right_digits=2).generate())) if Faker("boolean", chance_of_getting_true=50).generate() else None)
    zoning_type = factory.Iterator(["residential", "commercial", "industrial", "rural", None])
    
    ownership_percentage = Decimal("100.00")
    co_owners = factory.LazyFunction(list)
    
    status = InvestmentStatus.ACTIVE
    tags = factory.LazyFunction(lambda: Faker("words", nb=3).generate())
    custom_metadata = factory.LazyFunction(dict)
    
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)
    created_by = Faker("email")
    
    @factory.post_generation
    def set_current_value_based_on_roi(obj, create, extracted, **kwargs):
        """Set current value to achieve a target ROI if specified."""
        if extracted is not None:
            target_roi = extracted  # e.g., 0.25 for 25% ROI
            obj.current_value = obj.purchase_price * Decimal(1 + target_roi)


class FileRegistryFactory(BaseFactory):
    """Factory for FileRegistry model."""
    
    class Meta:
        model = FileRegistry
    
    id = factory.LazyFunction(uuid.uuid4)
    original_filename = factory.LazyFunction(lambda: f"{Faker('file_name').generate()}.pdf")
    storage_key = factory.LazyFunction(lambda: f"uploads/{uuid.uuid4()}/{Faker('file_name').generate()}.pdf")
    storage_bucket = "investments-uploads"
    file_size_bytes = factory.Faker("random_int", min=1024, max=10485760)
    mime_type = factory.Iterator(["application/pdf", "image/jpeg", "image/png", "image/tiff"])
    file_hash = factory.Faker("sha256")
    
    uploaded_by = Faker("email")
    uploaded_at = factory.LazyFunction(datetime.utcnow)
    source_device = factory.Iterator(["web", "mobile", "api", None])
    
    status = FileStatus.PENDING
    
    investment = factory.SubFactory(InvestmentFactory)
    document = None
    
    tags = factory.LazyFunction(list)
    custom_metadata = factory.LazyFunction(dict)
    
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)


class ProcessingJobFactory(BaseFactory):
    """Factory for ProcessingJob model."""
    
    class Meta:
        model = ProcessingJob
    
    id = factory.LazyFunction(uuid.uuid4)
    job_type = factory.Iterator([
        JobType.DOCUMENT_ANALYSIS,
        JobType.VALUATION,
        JobType.OCR,
        JobType.SUMMARIZATION,
    ])
    status = JobStatus.QUEUED
    priority = factory.Faker("random_int", min=1, max=10)
    
    file = factory.SubFactory(FileRegistryFactory)
    investment = factory.SubFactory(InvestmentFactory)
    
    worker_id = None
    started_at = None
    completed_at = None
    retry_count = 0
    max_retries = 3
    
    parameters = factory.LazyFunction(lambda: {"analysis_type": "document_extraction"})
    result_id = None
    error_message = None
    
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)
    scheduled_at = None
    
    class Params:
        """Factory parameters for different states."""
        
        running = factory.Trait(
            status=JobStatus.RUNNING,
            worker_id=factory.Faker("uuid4"),
            started_at=factory.LazyFunction(datetime.utcnow),
        )
        
        completed = factory.Trait(
            status=JobStatus.COMPLETED,
            worker_id=factory.Faker("uuid4"),
            started_at=factory.LazyFunction(lambda: datetime.utcnow() - timedelta(minutes=5)),
            completed_at=factory.LazyFunction(datetime.utcnow),
        )
        
        failed = factory.Trait(
            status=JobStatus.FAILED,
            worker_id=factory.Faker("uuid4"),
            started_at=factory.LazyFunction(lambda: datetime.utcnow() - timedelta(minutes=2)),
            completed_at=factory.LazyFunction(datetime.utcnow),
            error_message=factory.Faker("sentence"),
            retry_count=3,
        )


class AnalysisResultFactory(BaseFactory):
    """Factory for AnalysisResult model."""
    
    class Meta:
        model = AnalysisResult
    
    id = factory.LazyFunction(uuid.uuid4)
    job_id = None
    
    file = factory.SubFactory(FileRegistryFactory)
    investment = factory.SubFactory(InvestmentFactory)
    
    analysis_type = factory.Iterator(["document_extraction", "valuation", "ocr", "entity_extraction"])
    model_version = "gpt-4o-2024-08-06"
    
    raw_text = Faker("text", max_nb_chars=1000)
    structured_data = factory.LazyFunction(lambda: {
        "extracted_fields": {
            "property_address": Faker("address").generate(),
            "area_m2": Faker("random_int", min=100, max=10000).generate(),
            "value": Faker("random_int", min=50000, max=1000000).generate(),
        }
    })
    summary = Faker("sentence")
    
    extracted_entities = factory.LazyFunction(lambda: {
        "persons": [Faker("name").generate() for _ in range(2)],
        "organizations": [Faker("company").generate() for _ in range(1)],
        "locations": [Faker("city").generate() for _ in range(2)],
    })
    extracted_dates = factory.LazyFunction(lambda: [
        (date.today() - timedelta(days=i*30)).isoformat() 
        for i in range(3)
    ])
    extracted_amounts = factory.LazyFunction(lambda: [
        {"value": float(Faker("pydecimal", min_value=1000, max_value=100000, right_digits=2).generate()), "currency": "BRL"}
        for _ in range(3)
    ])
    
    confidence_score = factory.Faker("pydecimal", min_value=0.7, max_value=1.0, right_digits=2)
    quality_flags = factory.LazyFunction(list)
    
    processing_time_ms = factory.Faker("random_int", min=1000, max=30000)
    tokens_used = factory.Faker("random_int", min=100, max=10000)
    
    created_at = factory.LazyFunction(datetime.utcnow)


class DocumentFactory(BaseFactory):
    """Factory for Document model."""
    
    class Meta:
        model = Document
    
    id = factory.LazyFunction(uuid.uuid4)
    investment = factory.SubFactory(InvestmentFactory)
    file = factory.SubFactory(FileRegistryFactory)
    
    document_type = factory.Iterator([
        DocumentType.DEED,
        DocumentType.CONTRACT,
        DocumentType.RECEIPT,
        DocumentType.PHOTO,
        DocumentType.SURVEY,
        DocumentType.APPRAISAL,
    ])
    title = factory.LazyFunction(lambda: f"{Faker('word').generate().title()} Document")
    description = Faker("text", max_nb_chars=100)
    document_date = factory.LazyFunction(lambda: date.today() - timedelta(days=Faker("random_int", min=1, max=365).generate()))
    
    is_key_document = factory.Faker("boolean", chance_of_getting_true=20)
    
    tags = factory.LazyFunction(list)
    custom_metadata = factory.LazyFunction(dict)
    
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)


class ValuationHistoryFactory(BaseFactory):
    """Factory for ValuationHistory model."""
    
    class Meta:
        model = ValuationHistory
    
    id = factory.LazyFunction(uuid.uuid4)
    investment = factory.SubFactory(InvestmentFactory)
    
    valuation_date = factory.Sequence(lambda n: date.today() - timedelta(days=n * 90))
    value = factory.Faker("pydecimal", min_value=50000, max_value=1000000, right_digits=2)
    currency = "BRL"
    
    valuation_method = factory.Iterator(["market_comparison", "income_approach", "cost_approach", "appraisal"])
    valuer_name = Faker("name")
    source_document_id = None
    
    notes = Faker("sentence")
    
    created_at = factory.LazyFunction(datetime.utcnow)
    created_by = Faker("email")


class ActivityLogFactory(BaseFactory):
    """Factory for ActivityLog model."""
    
    class Meta:
        model = ActivityLog
    
    id = factory.LazyFunction(uuid.uuid4)
    entity_type = factory.Iterator(["investment", "file", "document", "job"])
    entity_id = factory.LazyFunction(uuid.uuid4)
    action = factory.Iterator(["created", "updated", "deleted", "viewed", "analyzed"])
    
    performed_by = Faker("email")
    performed_at = factory.LazyFunction(datetime.utcnow)
    
    old_values = None
    new_values = factory.LazyFunction(lambda: {"status": "active"})
    ip_address = factory.Faker("ipv4")
    user_agent = factory.Faker("user_agent")


# =============================================================================
# Batch Creation Helpers
# =============================================================================

def create_investment_with_valuations(valuation_count: int = 5, **kwargs):
    """Create an investment with valuation history."""
    investment = InvestmentFactory(**kwargs)
    
    # Create valuations with increasing dates and values
    base_value = float(investment.purchase_price)
    for i in range(valuation_count):
        ValuationHistoryFactory(
            investment=investment,
            valuation_date=investment.purchase_date + timedelta(days=i * 90),
            value=Decimal(str(base_value * (1 + i * 0.05))),
        )
    
    return investment


def create_investment_with_files(file_count: int = 3, **kwargs):
    """Create an investment with associated files."""
    investment = InvestmentFactory(**kwargs)
    
    for _ in range(file_count):
        file_registry = FileRegistryFactory(investment=investment)
        DocumentFactory(investment=investment, file=file_registry)
    
    return investment


def create_completed_job_with_result(**kwargs):
    """Create a completed processing job with analysis result."""
    job = ProcessingJobFactory(status=JobStatus.COMPLETED, **kwargs)
    
    result = AnalysisResultFactory(
        job_id=job.id,
        file=job.file,
        investment=job.investment,
    )
    
    job.result_id = result.id
    return job, result

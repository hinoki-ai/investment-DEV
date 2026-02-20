"""
===============================================================================
SQLALCHEMY MODELS - Database Schema Implementation
===============================================================================
"""
import enum
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    JSON,
    ARRAY,
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


# =============================================================================
# ENUMS
# =============================================================================

class InvestmentCategory(enum.Enum):
    LAND = "land"
    STOCKS = "stocks"
    GOLD = "gold"
    CRYPTO = "crypto"
    REAL_ESTATE = "real_estate"
    BONDS = "bonds"
    OTHER = "other"


class FileStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class JobType(enum.Enum):
    DOCUMENT_ANALYSIS = "document_analysis"
    VALUATION = "valuation"
    OCR = "ocr"
    SUMMARIZATION = "summarization"
    CUSTOM = "custom"


class JobStatus(enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DocumentType(enum.Enum):
    DEED = "deed"
    CONTRACT = "contract"
    RECEIPT = "receipt"
    PHOTO = "photo"
    VIDEO = "video"
    AUDIO = "audio"
    SURVEY = "survey"
    APPRAISAL = "appraisal"
    TAX_DOCUMENT = "tax_document"
    PERMIT = "permit"
    CORRESPONDENCE = "correspondence"
    FINANCIAL_STATEMENT = "financial_statement"
    LEGAL = "legal"
    OTHER = "other"


class InvestmentStatus(enum.Enum):
    ACTIVE = "active"
    SOLD = "sold"
    PENDING = "pending"
    UNDER_CONTRACT = "under_contract"


# =============================================================================
# FILE REGISTRY
# =============================================================================

class FileRegistry(Base):
    __tablename__ = "file_registry"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    original_filename = Column(String(500), nullable=False)
    storage_key = Column(String(1000), nullable=False)
    storage_bucket = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    file_hash = Column(String(64), nullable=True)
    
    uploaded_by = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    source_device = Column(String(50), nullable=True)
    
    status = Column(Enum(FileStatus), default=FileStatus.PENDING, nullable=False)
    
    investment_id = Column(UUID(as_uuid=True), ForeignKey("investments.id"), nullable=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    
    tags = Column(ARRAY(String), default=list)
    custom_metadata = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    investment = relationship("Investment", back_populates="files", foreign_keys=[investment_id])
    document = relationship("Document", back_populates="file", foreign_keys=[document_id], uselist=False)
    processing_jobs = relationship("ProcessingJob", back_populates="file")
    analysis_results = relationship("AnalysisResult", back_populates="file")
    
    __table_args__ = (
        UniqueConstraint('storage_bucket', 'storage_key', name='unique_storage_key'),
        Index('idx_file_registry_status', 'status'),
        Index('idx_file_registry_investment', 'investment_id'),
        Index('idx_file_registry_uploaded_at', uploaded_at.desc()),
    )


# =============================================================================
# PROCESSING JOBS
# =============================================================================

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    job_type = Column(Enum(JobType), nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED, nullable=False)
    priority = Column(Integer, default=5)
    
    file_id = Column(UUID(as_uuid=True), ForeignKey("file_registry.id"), nullable=False)
    investment_id = Column(UUID(as_uuid=True), ForeignKey("investments.id"), nullable=True)
    
    worker_id = Column(String(100), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    parameters = Column(JSON, default=dict)
    
    result_id = Column(UUID(as_uuid=True), ForeignKey("analysis_results.id"), nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    file = relationship("FileRegistry", back_populates="processing_jobs")
    investment = relationship("Investment", back_populates="processing_jobs")
    result = relationship("AnalysisResult", back_populates="job", foreign_keys=[result_id], uselist=False)
    
    __table_args__ = (
        Index('idx_processing_jobs_status', 'status', 'priority', created_at.desc()),
        Index('idx_processing_jobs_file', 'file_id'),
        Index('idx_processing_jobs_investment', 'investment_id'),
    )


# =============================================================================
# ANALYSIS RESULTS
# =============================================================================

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    job_id = Column(UUID(as_uuid=True), ForeignKey("processing_jobs.id"), nullable=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("file_registry.id"), nullable=False)
    investment_id = Column(UUID(as_uuid=True), ForeignKey("investments.id"), nullable=True)
    
    analysis_type = Column(String(50), nullable=False)
    model_version = Column(String(100), nullable=True)
    
    raw_text = Column(Text, nullable=True)
    structured_data = Column(JSON, default=dict)
    summary = Column(Text, nullable=True)
    
    extracted_entities = Column(JSON, default=dict)
    extracted_dates = Column(JSON, default=dict)
    extracted_amounts = Column(JSON, default=dict)
    
    confidence_score = Column(Numeric(3, 2), nullable=True)
    quality_flags = Column(ARRAY(String), default=list)
    
    processing_time_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    job = relationship("ProcessingJob", back_populates="result", foreign_keys=[job_id])
    file = relationship("FileRegistry", back_populates="analysis_results")
    investment = relationship("Investment", back_populates="analysis_results")
    
    __table_args__ = (
        Index('idx_analysis_results_file', 'file_id'),
        Index('idx_analysis_results_investment', 'investment_id'),
        Index('idx_analysis_results_type', 'analysis_type'),
    )


# =============================================================================
# INVESTMENTS
# =============================================================================

class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(500), nullable=False)
    category = Column(Enum(InvestmentCategory), nullable=False)
    description = Column(Text, nullable=True)
    
    address = Column(Text, nullable=True)
    city = Column(String(255), nullable=True)
    state = Column(String(255), nullable=True)
    country = Column(String(100), default="Brazil")
    # coordinates = Column(Geometry('POINT'), nullable=True)  # Requires PostGIS
    
    purchase_price = Column(Numeric(18, 2), nullable=True)
    purchase_currency = Column(String(3), default="BRL")
    purchase_date = Column(Date, nullable=True)
    current_value = Column(Numeric(18, 2), nullable=True)
    last_valuation_date = Column(Date, nullable=True)
    
    land_area_m2 = Column(Numeric(12, 2), nullable=True)
    land_area_hectares = Column(Numeric(10, 4), nullable=True)
    zoning_type = Column(String(100), nullable=True)
    
    ownership_percentage = Column(Numeric(5, 2), default=100.00)
    co_owners = Column(ARRAY(String), default=list)
    
    status = Column(Enum(InvestmentStatus), default=InvestmentStatus.ACTIVE)
    
    tags = Column(ARRAY(String), default=list)
    custom_metadata = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255), nullable=True)
    
    # Relationships
    files = relationship("FileRegistry", back_populates="investment", foreign_keys=[FileRegistry.investment_id])
    documents = relationship("Document", back_populates="investment")
    processing_jobs = relationship("ProcessingJob", back_populates="investment")
    analysis_results = relationship("AnalysisResult", back_populates="investment")
    valuations = relationship("ValuationHistory", back_populates="investment")
    
    __table_args__ = (
        Index('idx_investments_category', 'category'),
        Index('idx_investments_status', 'status'),
        Index('idx_investments_location', 'state', 'city'),
    )


# =============================================================================
# DOCUMENTS
# =============================================================================

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    investment_id = Column(UUID(as_uuid=True), ForeignKey("investments.id"), nullable=False)
    file_id = Column(UUID(as_uuid=True), ForeignKey("file_registry.id"), nullable=False, unique=True)
    
    document_type = Column(Enum(DocumentType), nullable=False)
    title = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    document_date = Column(Date, nullable=True)
    
    is_key_document = Column(Boolean, default=False)
    
    tags = Column(ARRAY(String), default=list)
    custom_metadata = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    investment = relationship("Investment", back_populates="documents")
    file = relationship("FileRegistry", back_populates="document", foreign_keys=[FileRegistry.document_id], uselist=False)
    
    __table_args__ = (
        Index('idx_documents_investment', 'investment_id'),
        Index('idx_documents_type', 'document_type'),
        Index('idx_documents_key', 'is_key_document'),
    )


# =============================================================================
# VALUATION HISTORY
# =============================================================================

class ValuationHistory(Base):
    __tablename__ = "valuation_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    investment_id = Column(UUID(as_uuid=True), ForeignKey("investments.id"), nullable=False)
    
    valuation_date = Column(Date, nullable=False)
    value = Column(Numeric(18, 2), nullable=False)
    currency = Column(String(3), default="BRL")
    
    valuation_method = Column(String(100), nullable=True)
    valuer_name = Column(String(255), nullable=True)
    source_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_by = Column(String(255), nullable=True)
    
    # Relationships
    investment = relationship("Investment", back_populates="valuations")
    
    __table_args__ = (
        Index('idx_valuation_investment', 'investment_id', valuation_date.desc()),
    )


# =============================================================================
# ACTIVITY LOG
# =============================================================================

class ActivityLog(Base):
    __tablename__ = "activity_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(String(50), nullable=False)
    
    performed_by = Column(String(255), nullable=True)
    performed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    
    __table_args__ = (
        Index('idx_activity_entity', 'entity_type', 'entity_id'),
        Index('idx_activity_time', performed_at.desc()),
    )

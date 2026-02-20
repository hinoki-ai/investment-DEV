"""
===============================================================================
SHARED MODELS - Pydantic schemas shared across API and Worker
===============================================================================
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


# =============================================================================
# ENUMS
# =============================================================================

class InvestmentCategory(str, Enum):
    LAND = "land"
    STOCKS = "stocks"
    GOLD = "gold"
    CRYPTO = "crypto"
    REAL_ESTATE = "real_estate"
    BONDS = "bonds"
    OTHER = "other"


class FileStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class JobType(str, Enum):
    DOCUMENT_ANALYSIS = "document_analysis"
    VALUATION = "valuation"
    OCR = "ocr"
    SUMMARIZATION = "summarization"
    CUSTOM = "custom"


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DocumentType(str, Enum):
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


class InvestmentStatus(str, Enum):
    ACTIVE = "active"
    SOLD = "sold"
    PENDING = "pending"
    UNDER_CONTRACT = "under_contract"


# =============================================================================
# FILE REGISTRY MODELS
# =============================================================================

class FileRegistryBase(BaseModel):
    original_filename: str = Field(..., max_length=500)
    mime_type: Optional[str] = Field(None, max_length=100)
    file_size_bytes: Optional[int] = None
    source_device: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    investment_id: Optional[UUID] = None
    document_id: Optional[UUID] = None


class FileRegistryCreate(FileRegistryBase):
    pass


class FileRegistryUpdate(BaseModel):
    status: Optional[FileStatus] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    processed_at: Optional[datetime] = None


class FileRegistryResponse(FileRegistryBase):
    id: UUID
    storage_key: str
    storage_bucket: str
    file_hash: Optional[str] = None
    uploaded_by: Optional[str] = None
    uploaded_at: datetime
    status: FileStatus
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =============================================================================
# PROCESSING JOB MODELS
# =============================================================================

class ProcessingJobBase(BaseModel):
    job_type: JobType
    file_id: UUID
    investment_id: Optional[UUID] = None
    priority: int = Field(default=5, ge=1, le=10)
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    max_retries: int = Field(default=3, ge=0, le=10)


class ProcessingJobCreate(ProcessingJobBase):
    pass


class ProcessingJobUpdate(BaseModel):
    status: Optional[JobStatus] = None
    worker_id: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: Optional[int] = None


class ProcessingJobResponse(ProcessingJobBase):
    id: UUID
    status: JobStatus
    worker_id: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int
    result_id: Optional[UUID] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# ANALYSIS RESULTS MODELS
# =============================================================================

class AnalysisResultBase(BaseModel):
    analysis_type: str
    raw_text: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    summary: Optional[str] = None
    extracted_entities: Optional[Dict[str, Any]] = Field(default_factory=dict)
    extracted_dates: Optional[Dict[str, Any]] = Field(default_factory=dict)
    extracted_amounts: Optional[Dict[str, Any]] = Field(default_factory=dict)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    quality_flags: Optional[List[str]] = Field(default_factory=list)
    processing_time_ms: Optional[int] = None
    tokens_used: Optional[int] = None


class AnalysisResultCreate(AnalysisResultBase):
    model_config = ConfigDict(protected_namespaces=())
    
    job_id: Optional[UUID] = None
    file_id: UUID
    investment_id: Optional[UUID] = None
    model_version: Optional[str] = None


class AnalysisResultResponse(AnalysisResultBase):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)
    
    id: UUID
    job_id: Optional[UUID] = None
    file_id: UUID
    investment_id: Optional[UUID] = None
    model_version: Optional[str] = None
    created_at: datetime


# =============================================================================
# INVESTMENT MODELS
# =============================================================================

class InvestmentBase(BaseModel):
    name: str = Field(..., max_length=500)
    category: InvestmentCategory
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=255)
    state: Optional[str] = Field(None, max_length=255)
    country: str = Field(default="Brazil", max_length=100)
    purchase_price: Optional[Decimal] = None
    purchase_currency: str = Field(default="BRL", max_length=3)
    purchase_date: Optional[datetime] = None
    current_value: Optional[Decimal] = None
    last_valuation_date: Optional[datetime] = None
    land_area_m2: Optional[Decimal] = None
    land_area_hectares: Optional[Decimal] = None
    zoning_type: Optional[str] = Field(None, max_length=100)
    ownership_percentage: Decimal = Field(default=100.00, ge=0, le=100)
    co_owners: Optional[List[str]] = Field(default_factory=list)
    status: InvestmentStatus = InvestmentStatus.ACTIVE
    tags: Optional[List[str]] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @field_validator('purchase_price', 'current_value', 'land_area_m2', 'land_area_hectares', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == '' or v == 'null':
            return None
        return v


class InvestmentCreate(InvestmentBase):
    pass


class InvestmentUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=255)
    state: Optional[str] = Field(None, max_length=255)
    purchase_price: Optional[Decimal] = None
    purchase_date: Optional[datetime] = None
    current_value: Optional[Decimal] = None
    last_valuation_date: Optional[datetime] = None
    land_area_m2: Optional[Decimal] = None
    land_area_hectares: Optional[Decimal] = None
    zoning_type: Optional[str] = Field(None, max_length=100)
    ownership_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    co_owners: Optional[List[str]] = None
    status: Optional[InvestmentStatus] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class InvestmentResponse(InvestmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True


class InvestmentSummaryResponse(InvestmentResponse):
    latest_value: Optional[Decimal] = None
    latest_valuation_date: Optional[datetime] = None
    return_percentage: Optional[float] = None
    document_count: int = 0
    file_count: int = 0


# =============================================================================
# DOCUMENT MODELS
# =============================================================================

class DocumentBase(BaseModel):
    investment_id: UUID
    file_id: UUID
    document_type: DocumentType
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    document_date: Optional[datetime] = None
    is_key_document: bool = False
    tags: Optional[List[str]] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    document_type: Optional[DocumentType] = None
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    document_date: Optional[datetime] = None
    is_key_document: Optional[bool] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class DocumentResponse(DocumentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    file: Optional[FileRegistryResponse] = None

    class Config:
        from_attributes = True


# =============================================================================
# UPLOAD MODELS
# =============================================================================

class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    investment_id: Optional[UUID] = None
    source_device: Optional[str] = "phone"
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class UploadUrlResponse(BaseModel):
    upload_url: str
    file_id: UUID
    storage_key: str
    expires_in_seconds: int = 300


class ConfirmUploadRequest(BaseModel):
    file_id: UUID
    investment_id: Optional[UUID] = None
    document_type: Optional[DocumentType] = None
    request_analysis: bool = True
    analysis_type: Optional[JobType] = JobType.DOCUMENT_ANALYSIS


# =============================================================================
# DASHBOARD / STATS MODELS
# =============================================================================

class DashboardStats(BaseModel):
    total_investments: int
    total_value: Decimal
    total_files: int
    pending_analyses: int
    completed_analyses: int
    investments_by_category: Dict[str, int]
    recent_uploads: List[FileRegistryResponse]
    recent_analyses: List[AnalysisResultResponse]


class CategoryBreakdown(BaseModel):
    category: str
    count: int
    total_value: Decimal
    percentage: float

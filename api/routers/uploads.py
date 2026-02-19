"""
===============================================================================
UPLOAD ROUTER - Direct-to-Storage Upload Flow
===============================================================================
Phone → Gets pre-signed URL → Uploads directly to R2/S3 → Confirms upload → Creates job
===============================================================================
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import sys
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/shared')
from models import UploadUrlRequest, UploadUrlResponse, ConfirmUploadRequest, FileRegistryResponse

from database import get_async_db, redis_client
from storage import get_storage_service
from models import FileRegistry, ProcessingJob, FileStatus, JobType, JobStatus, Document


router = APIRouter()
storage = get_storage_service()


@router.post("/request-url", response_model=UploadUrlResponse)
async def request_upload_url(
    request: UploadUrlRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Request a pre-signed URL for direct upload from phone.
    
    1. Creates database entry for the file
    2. Generates pre-signed URL
    3. Phone uploads directly to storage
    4. Phone calls /confirm-upload to complete
    """
    # Generate storage key
    storage_key = storage.generate_storage_key(
        original_filename=request.filename,
        investment_id=str(request.investment_id) if request.investment_id else None,
        prefix="uploads"
    )
    
    # Create file registry entry
    file_entry = FileRegistry(
        original_filename=request.filename,
        storage_key=storage_key,
        storage_bucket=storage.bucket,
        mime_type=request.content_type,
        source_device=request.source_device,
        investment_id=request.investment_id,
        metadata=request.metadata,
        status=FileStatus.PENDING
    )
    
    db.add(file_entry)
    await db.commit()
    await db.refresh(file_entry)
    
    # Generate pre-signed URL
    upload_url = storage.generate_upload_url(
        storage_key=storage_key,
        content_type=request.content_type,
        expires_in=300  # 5 minutes
    )
    
    return UploadUrlResponse(
        upload_url=upload_url,
        file_id=file_entry.id,
        storage_key=storage_key,
        expires_in_seconds=300
    )


@router.post("/confirm", response_model=dict)
async def confirm_upload(
    request: ConfirmUploadRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Confirm upload completion and optionally queue for analysis.
    
    Phone calls this after uploading file to storage.
    Creates processing job if requested.
    """
    # Get file entry
    result = await db.execute(
        select(FileRegistry).where(FileRegistry.id == request.file_id)
    )
    file_entry = result.scalar_one_or_none()
    
    if not file_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Update file status
    file_entry.status = FileStatus.COMPLETED
    file_entry.investment_id = request.investment_id or file_entry.investment_id
    
    await db.commit()
    
    response = {
        "message": "Upload confirmed",
        "file_id": file_entry.id,
        "status": "completed"
    }
    
    # Create document if investment is specified
    if request.document_type and request.investment_id:
        document = Document(
            investment_id=request.investment_id,
            file_id=file_entry.id,
            document_type=request.document_type,
            title=file_entry.original_filename
        )
        db.add(document)
        await db.commit()
        response["document_created"] = True
    
    # Queue for analysis if requested
    if request.request_analysis:
        job = ProcessingJob(
            job_type=request.analysis_type or JobType.DOCUMENT_ANALYSIS,
            file_id=file_entry.id,
            investment_id=request.investment_id,
            priority=5,
            status=JobStatus.QUEUED
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        response["analysis_queued"] = True
        response["job_id"] = job.id
        
        # Publish to Redis for worker notification
        redis_client.publish(
            "jobs:new",
            str(job.id)
        )
    
    return response


@router.get("/status/{file_id}", response_model=FileRegistryResponse)
async def get_upload_status(
    file_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get upload status and metadata."""
    result = await db.execute(
        select(FileRegistry).where(FileRegistry.id == file_id)
    )
    file_entry = result.scalar_one_or_none()
    
    if not file_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileRegistryResponse.model_validate(file_entry)

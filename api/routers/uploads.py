"""
===============================================================================
UPLOAD ROUTER - Direct-to-Storage Upload Flow
===============================================================================
Phone → Gets pre-signed URL → Uploads directly to R2/S3 → Confirms upload → Creates job
===============================================================================
"""
import sys
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Import API SQLAlchemy models (local models.py) - use alias to avoid conflict
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/api')
import models as db_models
from database import get_async_db, redis_client

# Import shared Pydantic schemas - use alias to avoid conflict
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/shared')
import models as schemas

from storage import get_storage_service


router = APIRouter()
storage = get_storage_service()


@router.post("/request-url", response_model=schemas.UploadUrlResponse)
async def request_upload_url(
    request: schemas.UploadUrlRequest,
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
    file_entry = db_models.FileRegistry(
        original_filename=request.filename,
        storage_key=storage_key,
        storage_bucket=storage.bucket,
        mime_type=request.content_type,
        source_device=request.source_device,
        investment_id=request.investment_id,
        metadata=request.metadata,
        status=db_models.FileStatus.PENDING
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
    
    return schemas.UploadUrlResponse(
        upload_url=upload_url,
        file_id=file_entry.id,
        storage_key=storage_key,
        expires_in_seconds=300
    )


@router.post("/confirm", response_model=dict)
async def confirm_upload(
    request: schemas.ConfirmUploadRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Confirm upload completion and optionally queue for analysis.
    
    Phone calls this after uploading file to storage.
    Creates processing job if requested.
    """
    # Get file entry
    result = await db.execute(
        select(db_models.FileRegistry).where(db_models.FileRegistry.id == request.file_id)
    )
    file_entry = result.scalar_one_or_none()
    
    if not file_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Verify file exists in storage and get metadata
    try:
        file_metadata = storage.get_file_metadata(file_entry.storage_key)
        file_entry.file_size_bytes = file_metadata.get('size')
    except Exception as e:
        # File doesn't exist in storage yet
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File not found in storage. Please upload the file first. Error: {str(e)}"
        )
    
    # Update file status
    file_entry.status = db_models.FileStatus.COMPLETED
    file_entry.investment_id = request.investment_id or file_entry.investment_id
    
    await db.commit()
    
    response = {
        "message": "Upload confirmed",
        "file_id": str(file_entry.id),
        "status": "completed",
        "file_size_bytes": file_entry.file_size_bytes
    }
    
    # Create document if investment is specified
    document = None
    if request.document_type and request.investment_id:
        document = db_models.Document(
            investment_id=request.investment_id,
            file_id=file_entry.id,
            document_type=request.document_type,
            title=file_entry.original_filename
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)
        
        # Link document to file registry
        file_entry.document_id = document.id
        await db.commit()
        
        response["document_created"] = True
        response["document_id"] = str(document.id)
    
    # Queue for analysis if requested
    if request.request_analysis:
        job = db_models.ProcessingJob(
            job_type=request.analysis_type or db_models.JobType.DOCUMENT_ANALYSIS,
            file_id=file_entry.id,
            investment_id=request.investment_id,
            priority=5,
            status=db_models.JobStatus.QUEUED
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        response["analysis_queued"] = True
        response["job_id"] = str(job.id)
        
        # Publish to Redis for worker notification
        try:
            redis_client.publish(
                "jobs:new",
                str(job.id)
            )
        except Exception as e:
            # Log but don't fail if Redis is unavailable
            print(f"Warning: Failed to publish to Redis: {e}")
    
    return response


@router.get("/status/{file_id}", response_model=schemas.FileRegistryResponse)
async def get_upload_status(
    file_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get upload status and metadata."""
    result = await db.execute(
        select(db_models.FileRegistry).where(db_models.FileRegistry.id == file_id)
    )
    file_entry = result.scalar_one_or_none()
    
    if not file_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return schemas.FileRegistryResponse.model_validate(file_entry)


@router.post("/request-url/batch", response_model=list)
async def request_upload_urls_batch(
    requests: list[schemas.UploadUrlRequest],
    db: AsyncSession = Depends(get_async_db)
):
    """
    Request multiple pre-signed URLs for batch upload.
    
    This is useful when uploading multiple files at once from the phone.
    Returns a list of upload URLs in the same order as the requests.
    """
    responses = []
    
    for request in requests:
        # Generate storage key
        storage_key = storage.generate_storage_key(
            original_filename=request.filename,
            investment_id=str(request.investment_id) if request.investment_id else None,
            prefix="uploads"
        )
        
        # Create file registry entry
        file_entry = db_models.FileRegistry(
            original_filename=request.filename,
            storage_key=storage_key,
            storage_bucket=storage.bucket,
            mime_type=request.content_type,
            source_device=request.source_device,
            investment_id=request.investment_id,
            metadata=request.metadata,
            status=db_models.FileStatus.PENDING
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
        
        responses.append(schemas.UploadUrlResponse(
            upload_url=upload_url,
            file_id=file_entry.id,
            storage_key=storage_key,
            expires_in_seconds=300
        ))
    
    return responses


@router.post("/confirm/batch", response_model=list)
async def confirm_uploads_batch(
    requests: list[schemas.ConfirmUploadRequest],
    db: AsyncSession = Depends(get_async_db)
):
    """
    Confirm multiple uploads at once.
    
    This is useful for batch confirmation after uploading multiple files.
    """
    responses = []
    
    for request in requests:
        try:
            # Get file entry
            result = await db.execute(
                select(db_models.FileRegistry).where(db_models.FileRegistry.id == request.file_id)
            )
            file_entry = result.scalar_one_or_none()
            
            if not file_entry:
                responses.append({
                    "file_id": str(request.file_id),
                    "status": "error",
                    "error": "File not found"
                })
                continue
            
            # Verify file exists in storage and get metadata
            try:
                file_metadata = storage.get_file_metadata(file_entry.storage_key)
                file_entry.file_size_bytes = file_metadata.get('size')
            except Exception as e:
                responses.append({
                    "file_id": str(request.file_id),
                    "status": "error",
                    "error": f"File not found in storage: {str(e)}"
                })
                continue
            
            # Update file status
            file_entry.status = db_models.FileStatus.COMPLETED
            file_entry.investment_id = request.investment_id or file_entry.investment_id
            
            await db.commit()
            
            response = {
                "file_id": str(file_entry.id),
                "status": "completed",
                "file_size_bytes": file_entry.file_size_bytes
            }
            
            # Create document if investment is specified
            if request.document_type and request.investment_id:
                document = db_models.Document(
                    investment_id=request.investment_id,
                    file_id=file_entry.id,
                    document_type=request.document_type,
                    title=file_entry.original_filename
                )
                db.add(document)
                await db.commit()
                await db.refresh(document)
                
                # Link document to file registry
                file_entry.document_id = document.id
                await db.commit()
                
                response["document_created"] = True
                response["document_id"] = str(document.id)
            
            # Queue for analysis if requested
            if request.request_analysis:
                job = db_models.ProcessingJob(
                    job_type=request.analysis_type or db_models.JobType.DOCUMENT_ANALYSIS,
                    file_id=file_entry.id,
                    investment_id=request.investment_id,
                    priority=5,
                    status=db_models.JobStatus.QUEUED
                )
                db.add(job)
                await db.commit()
                await db.refresh(job)
                
                response["analysis_queued"] = True
                response["job_id"] = str(job.id)
                
                # Publish to Redis for worker notification
                try:
                    redis_client.publish(
                        "jobs:new",
                        str(job.id)
                    )
                except Exception as e:
                    print(f"Warning: Failed to publish to Redis: {e}")
            
            responses.append(response)
            
        except Exception as e:
            responses.append({
                "file_id": str(request.file_id),
                "status": "error",
                "error": str(e)
            })
    
    return responses

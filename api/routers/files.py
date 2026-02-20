"""
===============================================================================
FILES ROUTER - File registry management
===============================================================================
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/shared')
from models import FileRegistryResponse, FileStatus

from database import get_async_db
from storage import get_storage_service
import models as db_models


router = APIRouter()
storage = get_storage_service()


@router.get("", response_model=List[FileRegistryResponse])
async def list_files(
    status: Optional[FileStatus] = None,
    investment_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_async_db)
):
    """List files in the registry."""
    query = select(db_models.FileRegistry).order_by(desc(db_models.FileRegistry.created_at))
    
    if status:
        query = query.where(db_models.FileRegistry.status == status)
    if investment_id:
        query = query.where(db_models.FileRegistry.investment_id == investment_id)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    files = result.scalars().all()
    
    return [FileRegistryResponse.model_validate(f) for f in files]


@router.get("/{file_id}", response_model=FileRegistryResponse)
async def get_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get file details."""
    result = await db.execute(
        select(db_models.FileRegistry)
        .options(
            selectinload(db_models.FileRegistry.processing_jobs),
            selectinload(db_models.FileRegistry.analysis_results)
        )
        .where(db_models.FileRegistry.id == file_id)
    )
    file_entry = result.scalar_one_or_none()
    
    if not file_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileRegistryResponse.model_validate(file_entry)


@router.get("/{file_id}/download-url")
async def get_download_url(
    file_id: UUID,
    expires_in: int = Query(3600, ge=60, le=604800),
    db: AsyncSession = Depends(get_async_db)
):
    """Generate a temporary download URL for a file."""
    result = await db.execute(
        select(db_models.FileRegistry).where(db_models.FileRegistry.id == file_id)
    )
    file_entry = result.scalar_one_or_none()
    
    if not file_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    url = storage.generate_download_url(
        storage_key=file_entry.storage_key,
        expires_in=expires_in,
        filename=file_entry.original_filename
    )
    
    return {
        "download_url": url,
        "expires_in_seconds": expires_in
    }


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: UUID,
    delete_from_storage: bool = True,
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a file from registry and optionally from storage."""
    result = await db.execute(
        select(db_models.FileRegistry).where(db_models.FileRegistry.id == file_id)
    )
    file_entry = result.scalar_one_or_none()
    
    if not file_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete from storage
    if delete_from_storage:
        storage.delete_file(file_entry.storage_key)
    
    # Delete from database
    await db.delete(file_entry)
    await db.commit()
    
    return None


@router.post("/{file_id}/reanalyze")
async def reanalyze_file(
    file_id: UUID,
    job_type: str = "document_analysis",
    db: AsyncSession = Depends(get_async_db)
):
    """Queue a file for re-analysis."""
    from models import JobType, JobStatus
    
    result = await db.execute(
        select(db_models.FileRegistry).where(db_models.FileRegistry.id == file_id)
    )
    file_entry = result.scalar_one_or_none()
    
    if not file_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Create processing job
    job = db_models.ProcessingJob(
        job_type=db_models.JobType(job_type),
        file_id=file_id,
        investment_id=file_entry.investment_id,
        status=db_models.JobStatus.QUEUED,
        priority=4  # Slightly higher priority for reanalysis
    )
    
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    return {
        "message": "File queued for reanalysis",
        "job_id": job.id
    }

"""
===============================================================================
ANALYSIS ROUTER - Analysis results and job management
===============================================================================
"""
import sys
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

# Import API SQLAlchemy models first (local)
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/api')
from models import AnalysisResult, ProcessingJob, FileRegistry

# Then import shared Pydantic schemas
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/shared')
from models import AnalysisResultResponse, JobStatus

from database import get_async_db


router = APIRouter()


@router.get("/results", response_model=List[AnalysisResultResponse])
async def list_analysis_results(
    investment_id: Optional[UUID] = None,
    file_id: Optional[UUID] = None,
    analysis_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_async_db)
):
    """List analysis results with optional filtering."""
    query = select(AnalysisResult).order_by(desc(AnalysisResult.created_at))
    
    if investment_id:
        query = query.where(AnalysisResult.investment_id == investment_id)
    if file_id:
        query = query.where(AnalysisResult.file_id == file_id)
    if analysis_type:
        query = query.where(AnalysisResult.analysis_type == analysis_type)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    analyses = result.scalars().all()
    
    return [AnalysisResultResponse.model_validate(a) for a in analyses]


@router.get("/results/{analysis_id}", response_model=AnalysisResultResponse)
async def get_analysis_result(
    analysis_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get a single analysis result."""
    result = await db.execute(
        select(AnalysisResult).where(AnalysisResult.id == analysis_id)
    )
    analysis = result.scalar_one_or_none()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis result not found"
        )
    
    return AnalysisResultResponse.model_validate(analysis)


@router.get("/jobs", response_model=List[dict])
async def list_processing_jobs(
    status: Optional[JobStatus] = None,
    investment_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_async_db)
):
    """List processing jobs."""
    query = select(ProcessingJob, FileRegistry.original_filename).join(
        FileRegistry, ProcessingJob.file_id == FileRegistry.id
    ).order_by(desc(ProcessingJob.created_at))
    
    if status:
        query = query.where(ProcessingJob.status == status)
    if investment_id:
        query = query.where(ProcessingJob.investment_id == investment_id)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    jobs_with_filenames = result.all()
    
    return [
        {
            "id": str(job.id),
            "job_type": job.job_type.value,
            "status": job.status.value,
            "file_id": str(job.file_id),
            "filename": filename,
            "priority": job.priority,
            "retry_count": job.retry_count,
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat(),
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        }
        for job, filename in jobs_with_filenames
    ]


@router.get("/jobs/{job_id}")
async def get_processing_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get a single processing job."""
    result = await db.execute(
        select(ProcessingJob).where(ProcessingJob.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return {
        "id": str(job.id),
        "job_type": job.job_type.value,
        "status": job.status.value,
        "file_id": str(job.file_id),
        "investment_id": str(job.investment_id) if job.investment_id else None,
        "priority": job.priority,
        "worker_id": job.worker_id,
        "retry_count": job.retry_count,
        "max_retries": job.max_retries,
        "error_message": job.error_message,
        "parameters": job.parameters,
        "created_at": job.created_at.isoformat(),
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    }


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Cancel a queued or running job."""
    result = await db.execute(
        select(ProcessingJob).where(ProcessingJob.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.status not in [JobStatus.QUEUED, JobStatus.RUNNING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job with status: {job.status.value}"
        )
    
    job.status = JobStatus.CANCELLED
    await db.commit()
    
    return {"message": "Job cancelled", "job_id": str(job_id)}


@router.get("/queue/stats")
async def get_queue_stats(
    db: AsyncSession = Depends(get_async_db)
):
    """Get statistics about the processing queue."""
    from sqlalchemy import func
    
    # Count by status
    result = await db.execute(
        select(ProcessingJob.status, func.count(ProcessingJob.id))
        .group_by(ProcessingJob.status)
    )
    status_counts = {status.value: count for status, count in result.all()}
    
    # Count by job type
    result = await db.execute(
        select(ProcessingJob.job_type, func.count(ProcessingJob.id))
        .group_by(ProcessingJob.job_type)
    )
    type_counts = {job_type.value: count for job_type, count in result.all()}
    
    return {
        "by_status": status_counts,
        "by_type": type_counts,
        "total": sum(status_counts.values())
    }

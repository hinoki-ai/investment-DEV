"""
===============================================================================
INVESTMENTS ROUTER - CRUD for Investments (Land, Stocks, Gold, etc.)
===============================================================================
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

import sys

# Import database helper
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/api')
from database import get_async_db

# Import API SQLAlchemy models (local models.py) - use alias to avoid conflict
import models as db_models

# Import shared Pydantic schemas - use alias to avoid conflict
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/shared')
import models as schemas


router = APIRouter()


@router.post("", response_model=schemas.InvestmentResponse, status_code=status.HTTP_201_CREATED)
async def create_investment(
    data: schemas.InvestmentCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new investment."""
    investment = db_models.Investment(**data.model_dump(exclude_unset=True))
    db.add(investment)
    await db.commit()
    await db.refresh(investment)
    return schemas.InvestmentResponse.model_validate(investment)


@router.get("", response_model=List[schemas.InvestmentSummaryResponse])
async def list_investments(
    category: Optional[schemas.InvestmentCategory] = None,
    status: Optional[schemas.InvestmentStatus] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_async_db)
):
    """List investments with optional filtering."""
    query = select(db_models.Investment)
    
    if category:
        query = query.where(db_models.Investment.category == category)
    if status:
        query = query.where(db_models.Investment.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            db_models.Investment.name.ilike(search_filter) | 
            db_models.Investment.description.ilike(search_filter) |
            db_models.Investment.city.ilike(search_filter) |
            db_models.Investment.state.ilike(search_filter)
        )
    
    query = query.offset(skip).limit(limit).order_by(db_models.Investment.created_at.desc())
    
    result = await db.execute(query)
    investments = result.scalars().all()
    
    # For now, return basic response. Full summary with joins can be added later.
    return [schemas.InvestmentSummaryResponse.model_validate(inv) for inv in investments]


@router.get("/{investment_id}", response_model=schemas.InvestmentSummaryResponse)
async def get_investment(
    investment_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get a single investment with full details."""
    result = await db.execute(
        select(db_models.Investment)
        .options(
            selectinload(db_models.Investment.documents).selectinload(db_models.Document.file),
            selectinload(db_models.Investment.files),
        )
        .where(db_models.Investment.id == investment_id)
    )
    investment = result.scalar_one_or_none()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    return schemas.InvestmentSummaryResponse.model_validate(investment)


@router.put("/{investment_id}", response_model=schemas.InvestmentResponse)
async def update_investment(
    investment_id: UUID,
    data: schemas.InvestmentUpdate,
    db: AsyncSession = Depends(get_async_db)
):
    """Update an investment."""
    result = await db.execute(
        select(db_models.Investment).where(db_models.Investment.id == investment_id)
    )
    investment = result.scalar_one_or_none()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(investment, field, value)
    
    await db.commit()
    await db.refresh(investment)
    return schemas.InvestmentResponse.model_validate(investment)


@router.delete("/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_investment(
    investment_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Delete an investment."""
    result = await db.execute(
        select(db_models.Investment).where(db_models.Investment.id == investment_id)
    )
    investment = result.scalar_one_or_none()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    await db.delete(investment)
    await db.commit()
    return None


@router.get("/{investment_id}/documents")
async def get_investment_documents(
    investment_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Get all documents for an investment."""
    result = await db.execute(
        select(db_models.Document)
        .options(selectinload(db_models.Document.file))
        .where(db_models.Document.investment_id == investment_id)
        .order_by(db_models.Document.created_at.desc())
    )
    documents = result.scalars().all()
    return documents

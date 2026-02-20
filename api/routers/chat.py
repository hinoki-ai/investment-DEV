"""
===============================================================================
CHAT ROUTER - AI Conversational Interface
===============================================================================
Enables conversational AI about investments and files.
Inspired by T3 Chat and Cursor IDE interfaces.

Features:
- Streaming responses for real-time chat feel
- Context-aware with investment and file data
- Multi-provider AI support (same as worker)
- Conversation history
===============================================================================
"""
import json
import os
from typing import AsyncGenerator, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

import sys
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/shared')
from models import InvestmentResponse, FileRegistryResponse

from database import get_async_db
from storage import get_storage_service
from models import Investment, FileRegistry, AnalysisResult

# Try to import AI client, fallback to OpenAI directly
try:
    sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/worker')
    from ai_client import get_ai_client, create_ai_client
    HAS_AI_CLIENT = True
except ImportError:
    HAS_AI_CLIENT = False

router = APIRouter()
storage = get_storage_service()


# =============================================================================
# MODELS
# =============================================================================

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str
    attachments: Optional[List[dict]] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    investment_id: Optional[str] = None
    file_ids: Optional[List[str]] = None
    stream: bool = True
    model: Optional[str] = None


class ChatResponse(BaseModel):
    message: ChatMessage
    usage: Optional[dict] = None
    model: str


# =============================================================================
# SYSTEM PROMPT
# =============================================================================

NEXUS_SYSTEM_PROMPT = """You are NEXUS, the AI assistant for the family investment dashboard.

Your role is to help the family manage and understand their investment portfolio.
You have access to:
- Investment data (land, stocks, real estate, gold, crypto, bonds)
- Uploaded files and documents (stored in Cloudflare R2)
- Analysis results from document processing

Guidelines:
1. Be concise but thorough - this is a personal tool for 2 people
2. Reference specific investments by name when relevant
3. When discussing files, mention you can access them from Cloudflare storage
4. Use financial terminology appropriately but explain complex terms
5. If asked about specific documents, offer to analyze or summarize them
6. Be helpful with investment decisions but include appropriate disclaimers
7. Respond in the same language as the user (English, Spanish, Portuguese)

Current context: You are chatting within the PRISM web dashboard.
"""


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def get_investment_context(db: AsyncSession, investment_id: str) -> dict:
    """Get investment data for context."""
    result = await db.execute(
        select(Investment).where(Investment.id == investment_id)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        return {}
    
    return {
        "name": inv.name,
        "category": inv.category.value if inv.category else None,
        "description": inv.description,
        "address": inv.address,
        "city": inv.city,
        "state": inv.state,
        "country": inv.country,
        "purchase_price": float(inv.purchase_price) if inv.purchase_price else None,
        "purchase_date": inv.purchase_date.isoformat() if inv.purchase_date else None,
        "current_value": float(inv.current_value) if inv.current_value else None,
        "status": inv.status.value if inv.status else None,
        "land_area_hectares": float(inv.land_area_hectares) if inv.land_area_hectares else None,
        "zoning_type": inv.zoning_type,
    }


async def get_files_context(db: AsyncSession, file_ids: List[str]) -> List[dict]:
    """Get file metadata for context."""
    if not file_ids:
        return []
    
    result = await db.execute(
        select(FileRegistry).where(FileRegistry.id.in_(file_ids))
    )
    files = result.scalars().all()
    
    return [
        {
            "id": str(f.id),
            "filename": f.original_filename,
            "mime_type": f.mime_type,
            "size_bytes": f.file_size_bytes,
            "status": f.status.value if f.status else None,
            "uploaded_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in files
    ]


async def get_portfolio_summary(db: AsyncSession) -> dict:
    """Get portfolio summary for general context."""
    result = await db.execute(select(Investment))
    investments = result.scalars().all()
    
    total_value = sum(
        float(inv.current_value) for inv in investments 
        if inv.current_value and inv.status.value == 'active'
    )
    
    category_counts = {}
    for inv in investments:
        cat = inv.category.value if inv.category else 'other'
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    return {
        "total_investments": len(investments),
        "total_active_value": total_value,
        "categories": category_counts,
    }


def build_context_prompt(
    investment_context: dict = None,
    files_context: List[dict] = None,
    portfolio_summary: dict = None
) -> str:
    """Build the context prompt with available data."""
    context_parts = []
    
    if portfolio_summary:
        context_parts.append(f"""
Portfolio Summary:
- Total Investments: {portfolio_summary['total_investments']}
- Total Active Value: ${portfolio_summary['total_active_value']:,.2f}
- Categories: {', '.join(f"{k}: {v}" for k, v in portfolio_summary['categories'].items())}
""")
    
    if investment_context:
        context_parts.append(f"""
Selected Investment: {investment_context['name']}
- Category: {investment_context['category']}
- Status: {investment_context['status']}
- Location: {investment_context['city']}, {investment_context['state']}, {investment_context['country']}
- Purchase Price: ${investment_context['purchase_price']:,.2f}""" if investment_context.get('purchase_price') else """
- Purchase Date: {investment_context['purchase_date']}""" if investment_context.get('purchase_date') else ""
- Current Value: ${investment_context['current_value']:,.2f}""" if investment_context.get('current_value') else ""
- Land Area: {investment_context['land_area_hectares']} hectares""" if investment_context.get('land_area_hectares') else ""
- Description: {investment_context['description']}""")
    
    if files_context:
        files_list = "\n".join([
            f"- {f['filename']} ({f['mime_type']}, {f['size_bytes'] or 0 / 1024:.1f} KB)"
            for f in files_context
        ])
        context_parts.append(f"""
Attached Files:
{files_list}
""")
    
    return "\n".join(context_parts)


# =============================================================================
# AI CLIENT HELPERS
# =============================================================================

def get_openai_client():
    """Get OpenAI client for chat completions."""
    try:
        from openai import AsyncOpenAI
        
        # Determine which API to use based on env vars
        api_key = os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("KIMI_API_KEY")
        base_url = os.getenv("AI_API_URL") or os.getenv("OPENAI_API_URL")
        
        # Default to Kimi URL if using Kimi key and no URL specified
        if not base_url and os.getenv("KIMI_API_KEY"):
            base_url = os.getenv("KIMI_API_URL", "https://api.moonshot.cn/v1")
        
        if not api_key:
            raise ValueError("No AI API key configured")
        
        return AsyncOpenAI(api_key=api_key, base_url=base_url)
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI package not installed"
        )


def get_model_name() -> str:
    """Get the model name to use."""
    return os.getenv("AI_MODEL") or os.getenv("OPENAI_MODEL") or os.getenv("KIMI_MODEL", "gpt-4o")


# =============================================================================
# STREAMING RESPONSE GENERATOR
# =============================================================================

async def generate_chat_stream(
    messages: List[dict],
    model: str
) -> AsyncGenerator[str, None]:
    """Generate streaming chat response."""
    try:
        client = get_openai_client()
        
        stream = await client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=4096,
        )
        
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                data = json.dumps({
                    "type": "content",
                    "content": chunk.choices[0].delta.content
                })
                yield f"data: {data}\n\n"
        
        # Send done signal
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        
    except Exception as e:
        error_data = json.dumps({
            "type": "error",
            "error": str(e)
        })
        yield f"data: {error_data}\n\n"


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Send a chat message and get a response.
    Non-streaming version for simple requests.
    """
    try:
        # Build context
        context_parts = []
        portfolio_summary = await get_portfolio_summary(db)
        context_parts.append(build_context_prompt(portfolio_summary=portfolio_summary))
        
        if request.investment_id:
            inv_context = await get_investment_context(db, request.investment_id)
            files_context = await get_files_context(db, request.file_ids or [])
            context_parts.append(build_context_prompt(inv_context, files_context))
        
        context = "\n".join(context_parts)
        
        # Build messages
        messages = [
            {"role": "system", "content": NEXUS_SYSTEM_PROMPT + "\n\n" + context}
        ]
        
        for msg in request.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Get AI response
        client = get_openai_client()
        model = request.model or get_model_name()
        
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=4096,
        )
        
        assistant_message = response.choices[0].message.content
        
        return ChatResponse(
            message=ChatMessage(
                role="assistant",
                content=assistant_message
            ),
            usage={
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0,
            },
            model=model
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Send a chat message and get a streaming response.
    Returns Server-Sent Events (SSE) for real-time updates.
    """
    try:
        # Build context
        context_parts = []
        portfolio_summary = await get_portfolio_summary(db)
        context_parts.append(build_context_prompt(portfolio_summary=portfolio_summary))
        
        if request.investment_id:
            inv_context = await get_investment_context(db, request.investment_id)
            files_context = await get_files_context(db, request.file_ids or [])
            context_parts.append(build_context_prompt(inv_context, files_context))
        
        context = "\n".join(context_parts)
        
        # Build messages
        messages = [
            {"role": "system", "content": NEXUS_SYSTEM_PROMPT + "\n\n" + context}
        ]
        
        for msg in request.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        model = request.model or get_model_name()
        
        return StreamingResponse(
            generate_chat_stream(messages, model),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stream error: {str(e)}"
        )


@router.get("/context/investments")
async def get_investments_for_context(
    db: AsyncSession = Depends(get_async_db)
):
    """Get investments list for chat context selection."""
    result = await db.execute(
        select(Investment).order_by(Investment.name)
    )
    investments = result.scalars().all()
    
    return [
        {
            "id": str(inv.id),
            "name": inv.name,
            "category": inv.category.value if inv.category else None,
            "city": inv.city,
            "status": inv.status.value if inv.status else None,
        }
        for inv in investments
    ]


@router.get("/context/files")
async def get_files_for_context(
    investment_id: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db)
):
    """Get files list for chat attachment selection."""
    query = select(FileRegistry).order_by(desc(FileRegistry.created_at))
    
    if investment_id:
        query = query.where(FileRegistry.investment_id == investment_id)
    
    result = await db.execute(query.limit(50))
    files = result.scalars().all()
    
    return [
        {
            "id": str(f.id),
            "filename": f.original_filename,
            "mime_type": f.mime_type,
            "size_bytes": f.file_size_bytes,
            "status": f.status.value if f.status else None,
            "investment_id": str(f.investment_id) if f.investment_id else None,
        }
        for f in files
    ]

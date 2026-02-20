from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import json

app = FastAPI()

@app.get("/")
def root():
    return {"message": "NEXUS API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "api"}

@app.get("/api/v1/dashboard/stats")
def dashboard_stats():
    return {
        "total_investments": 0,
        "total_value": 0,
        "categories": []
    }

@app.get("/api/v1/investments")
def list_investments():
    return {"items": [], "total": 0}

class InvestmentCreate(BaseModel):
    name: str
    category: str
    initial_value: float

@app.post("/api/v1/investments")
def create_investment(inv: InvestmentCreate):
    return {"id": "new-id", "name": inv.name, "category": inv.category}

# Cloudflare Workers handler
def handle_request(request):
    from asgi import ASGI
    return ASGI(app)(request)

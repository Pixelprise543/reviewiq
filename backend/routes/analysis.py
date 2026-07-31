from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, List
from services.ai_service import analyze_reviews, generate_weekly_report

router = APIRouter()

class AnalyzeRequest(BaseModel):
    business_name: str
    reviews: List[Any]   # bare `list` can behave unexpectedly in some Pydantic v2 builds
    category: str = 'Business'

class ReportRequest(BaseModel):
    business_name: str
    analysis: dict
    trends: dict = {}

@router.post('/analyze')
async def analyze(req: AnalyzeRequest):
    print(f"[analyze] business={req.business_name!r} category={req.category!r} reviews={len(req.reviews)}")
    try:
        result = await analyze_reviews(req.business_name, req.reviews, req.category)
        return {'success': True, 'data': result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/report')
async def weekly_report(req: ReportRequest):
    try:
        report = await generate_weekly_report(req.business_name, req.analysis, req.trends)
        return {'success': True, 'data': {'report': report}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

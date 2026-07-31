from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import generate_reply

router = APIRouter()

class ReplyRequest(BaseModel):
    review_text: str
    rating: float  # accept int or float; SerpAPI can return either
    business_name: str
    personality: str = 'professional'

@router.post('/generate')
async def generate(req: ReplyRequest):
    if req.personality not in ['professional', 'empathetic', 'direct']:
        raise HTTPException(status_code=400, detail='Personality must be: professional, empathetic, or direct')
    try:
        reply = await generate_reply(req.review_text, req.rating, req.business_name, req.personality)
        return {'success': True, 'data': {'reply': reply, 'personality': req.personality}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

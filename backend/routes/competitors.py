from fastapi import APIRouter, HTTPException, Query
from services.demo_data import get_demo_competitors

router = APIRouter()

@router.get('/compare')
async def compare_competitors(business: str = Query(...)):
    try:
        competitors = get_demo_competitors(business)
        return {'success': True, 'data': {'competitors': competitors, 'business_name': business}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

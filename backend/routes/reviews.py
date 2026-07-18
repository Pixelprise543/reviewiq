from fastapi import APIRouter, HTTPException, Query
from services.review_service import search_business, compute_monthly_trends

router = APIRouter()

@router.get('/search')
async def search(q: str = Query(..., min_length=2)):
    try:
        business = await search_business(q)
        if business.get('reviews'):
            business['monthly_trends'] = compute_monthly_trends(business['reviews'])
        else:
            business['monthly_trends'] = {}
        return {'success': True, 'data': business}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

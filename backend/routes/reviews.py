from fastapi import APIRouter, HTTPException, Query
from services.review_service import search_business, compute_monthly_trends

router = APIRouter()

@router.get('/search')
async def search(q: str = Query(..., min_length=1)):
    try:
        business = await search_business(q)
        if business.get('reviews'):
            business['monthly_trends'] = compute_monthly_trends(business['reviews'])
        else:
            business['monthly_trends'] = {}
        return {'success': True, 'data': business}
    except ValueError as e:
        # No results found
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        # API or config error
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

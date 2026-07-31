from fastapi import APIRouter, HTTPException, Query
from services.competitor_service import find_competitors

router = APIRouter()

@router.get('/compare')
async def compare_competitors(
    business: str = Query(...),
    address: str = Query(...)):
    print("COMPETITOR QUERY RECEIVED:", business)
    print("COMPETITOR ROUTE HIT:", business)

    try:
        competitors = await find_competitors(f"{business} {address}")

        print("RETURNING:", competitors)

        return {
            'success': True,
            'data': {
                'competitors': competitors,
                'business_name': business
            }
        }

    except ValueError as e:
        print("COMPETITOR NOT FOUND:", e)
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        print("COMPETITOR API ERROR:", e)
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        print("COMPETITOR UNEXPECTED ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
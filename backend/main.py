"""
ReviewIQ Backend — FastAPI
Proof-of-concept demo backend for the ReviewIQ hackathon project.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn
import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

_log = logging.getLogger("reviewiq")

# Always load from backend/.env regardless of where the server is started from
_env_path = Path(__file__).parent / ".env"
load_dotenv(_env_path)
print(f"[startup] .env path: {_env_path} (exists={_env_path.exists()})")
print(f"[startup] SERPAPI_KEY set: {bool(os.getenv('SERPAPI_KEY'))}")
print(f"[startup] GROQ_API_KEY set: {bool(os.getenv('GROQ_API_KEY'))}")

from routes.reviews import router as reviews_router
from routes.analysis import router as analysis_router
from routes.replies import router as replies_router
from routes.competitors import router as competitors_router
from services import serp_keys

app = FastAPI(
    title="ReviewIQ API",
    description="AI-powered review intelligence for businesses",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reviews_router, prefix="/api/reviews", tags=["reviews"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["analysis"])
app.include_router(replies_router, prefix="/api/replies", tags=["replies"])
app.include_router(competitors_router, prefix="/api/competitors", tags=["competitors"])


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Log every 422 so we can see the exact failing field in the uvicorn output."""
    body_bytes = await request.body()
    try:
        body_preview = json.dumps(json.loads(body_bytes), default=str)[:800]
    except Exception:
        body_preview = body_bytes.decode(errors="replace")[:800]

    _log.error("━━━ 422 on %s %s ━━━", request.method, request.url.path)
    _log.error("query_params: %s", dict(request.query_params))
    _log.error("body preview: %s", body_preview)
    for err in exc.errors():
        _log.error(
            "  FIELD %-40s  TYPE %-25s  MSG %s  INPUT %.120r",
            ".".join(str(x) for x in err["loc"]),
            err["type"],
            err["msg"],
            err.get("input"),
        )
    _log.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/serp-keys/status")
async def serp_key_status():
    """Return current key pool status (slot count, availability, backoff state)."""
    return serp_keys.pool_status()


@app.post("/api/serp-keys/reload")
async def serp_key_reload():
    """Re-read SERPAPI_KEY / SERPAPI_KEY_1-5 from env without restarting."""
    serp_keys.reload_keys()
    return {"ok": True, **serp_keys.pool_status()}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

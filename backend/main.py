"""
ReviewIQ Backend — FastAPI
Proof-of-concept demo backend for the ReviewIQ hackathon project.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from routes.reviews import router as reviews_router
from routes.analysis import router as analysis_router
from routes.replies import router as replies_router
from routes.competitors import router as competitors_router

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


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

"""FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routes import alerts, analytics, model_metrics, predictions, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # --- Startup ---
    init_db()
    yield
    # --- Shutdown ---


app = FastAPI(
    title="Fraud Intelligence API",
    description="AI-Powered Fraud Detection System — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(predictions.router)
app.include_router(transactions.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(model_metrics.router)


# --- Health check ---
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }



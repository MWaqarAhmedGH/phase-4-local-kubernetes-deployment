"""FastAPI backend entry point for AI-powered Todo Chatbot."""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import create_db_and_tables
from routes.tasks import router as tasks_router
from routes.chat import router as chat_router

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    create_db_and_tables()
    yield


app = FastAPI(
    title="AI Todo Chatbot API",
    description="Phase 3 AI-Powered Todo Chatbot with MCP Tools",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration - allow frontend to communicate with backend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [frontend_url]

# Add localhost origins only in development
if "localhost" in frontend_url or "127.0.0.1" in frontend_url:
    allowed_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3004",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks_router)
app.include_router(chat_router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "phase-3"}

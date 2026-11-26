from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from pathlib import Path
from typing import Any

import ollama
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from rag_service import OLLAMA_URL, RagService
from schemas import ChatRequest, ChatResponse

load_dotenv(Path(__file__).resolve().parent / ".env")

AUTH_SECRET = os.getenv("AUTH_SECRET", "uva-local-dev-secret-change-in-production")

app = FastAPI(
    title="UVa Document Search Backend",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_service = RagService()


def _b64url_decode(data: str) -> bytes:
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def verify_professor_token(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")

    token = authorization[7:].strip()
    parts = token.split(".")
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Invalid token format.")

    encoded, sig = parts
    expected_sig = _b64url_encode(
        hmac.new(
            AUTH_SECRET.encode("utf-8"),
            encoded.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    )
    if not hmac.compare_digest(sig, expected_sig):
        raise HTTPException(status_code=401, detail="Invalid token signature.")

    try:
        claims = json.loads(_b64url_decode(encoded).decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Corrupted token payload.") from exc

    exp_ms = claims.get("exp", 0)
    if not claims.get("accountId") or exp_ms < int(time.time() * 1000):
        raise HTTPException(status_code=401, detail="Expired or incomplete session.")

    if claims.get("role") != "professor":
        raise HTTPException(
            status_code=403,
            detail="Only authenticated professor accounts may access document RAG services.",
        )

    return claims


@app.get("/api/health")
async def health():
    try:
        db_status = rag_service.check_health()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Qdrant storage is not ready: {exc}",
        ) from exc

    try:
        client = ollama.AsyncClient(host=OLLAMA_URL)
        tags = await client.list()
        models = getattr(tags, "models", None) or (tags.get("models", []) if isinstance(tags, dict) else [])
        model_names = [
            getattr(m, "model", None) or (m.get("name") or m.get("model") if isinstance(m, dict) else str(m))
            for m in models
        ]
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama service ({OLLAMA_URL}) is unavailable: {exc}",
        ) from exc

    return {
        "ok": True,
        "rag": db_status,
        "installed_ollama_models": model_names,
    }


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    course_id: str = Form(default=""),
    document_id: str = Form(default=""),
    claims: dict[str, Any] = Depends(verify_professor_token),
):
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    try:
        return await rag_service.ingest_uploaded_file(
            filename=file.filename or "material.txt",
            raw_bytes=raw_bytes,
            professor_id=str(claims["accountId"]),
            course_id=course_id,
            document_id=document_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to index file with Ollama ({OLLAMA_URL}): {exc}",
        ) from exc


@app.delete("/api/documents/{source_name}")
async def delete_document(
    source_name: str,
    claims: dict[str, Any] = Depends(verify_professor_token),
):
    try:
        return rag_service.delete_document_vectors(
            professor_id=str(claims["accountId"]),
            source_name=source_name,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to remove vectors for '{source_name}': {exc}",
        ) from exc


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    claims: dict[str, Any] = Depends(verify_professor_token),
):
    try:
        answer, sources, debug = await rag_service.answer_question(
            professor_id=str(claims["accountId"]),
            payload=payload,
        )
        return ChatResponse(answer=answer, sources=sources, debug=debug)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Local search backend is temporarily unavailable: {exc}",
        ) from exc


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

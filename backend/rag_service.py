from __future__ import annotations

import io
import os
import re
import uuid
from pathlib import Path
from typing import Any

import ollama
from docx import Document as DocxDocument
from dotenv import load_dotenv
from pypdf import PdfReader
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    FilterSelector,
    MatchValue,
    PointStruct,
    VectorParams,
)
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

from schemas import ChatRequest

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "bge-m3")
CHAT_MODEL = os.getenv("CHAT_MODEL", "qwen2.5:7b")
RERANKER_MODEL = os.getenv("RERANKER_MODEL", "BAAI/bge-reranker-v2-m3")
QDRANT_PATH_RAW = os.getenv("QDRANT_PATH", "./qdrant_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "knowledge_base")

QDRANT_DIR = (
    (BASE_DIR / QDRANT_PATH_RAW).resolve()
    if not Path(QDRANT_PATH_RAW).is_absolute()
    else Path(QDRANT_PATH_RAW)
)
DATA_DIR = BASE_DIR / "data"

SYSTEM_PROMPT = (
    "Відповідай як академічний довідковий сервіс.\n"
    "Правила:\n"
    "1. Відповідай на запитання виключно тією мовою, якою написано запит (українською, англійською або іспанською).\n"
    "2. Якщо надано фрагменти контексту курсу, спирайся виключно на них та не вигадуй фактів, дат чи цифр, яких немає у джерелах.\n"
    "3. Враховуй усі педагогічні та просторові параметри (рівень освіти, групу, тип завдання, складність, тривалість, цілі навчання, координати).\n"
    "4. Якщо контекст порожній через вимкнений репозиторій (use_repo=false), сформуй методичну відповідь на запит без вигадування посилань на файли."
)


def tokenize_text(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower(), flags=re.UNICODE)


def extract_text_from_bytes(filename: str, raw_bytes: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(raw_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    if lower.endswith(".docx"):
        doc = DocxDocument(io.BytesIO(raw_bytes))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
    return raw_bytes.decode("utf-8", errors="ignore").strip()


def chunk_text(text: str, chunk_size: int = 700, overlap: int = 100) -> list[str]:
    normalized = " ".join(text.split())
    if not normalized:
        return []
    chunks: list[str] = []
    step = max(chunk_size - overlap, 100)
    start = 0
    while start < len(normalized):
        segment = normalized[start : start + chunk_size].strip()
        if segment:
            chunks.append(segment)
        if start + chunk_size >= len(normalized):
            break
        start += step
    return chunks


def extract_embeddings(response: object) -> list[list[float]]:
    if hasattr(response, "embeddings"):
        return [list(vec) for vec in getattr(response, "embeddings")]
    if isinstance(response, dict) and "embeddings" in response:
        return [list(vec) for vec in response["embeddings"]]
    raise RuntimeError("Invalid response format from Ollama /api/embed.")


def build_owner_filter(professor_id: str, course_id: str | None = None) -> Filter:
    conditions = [
        FieldCondition(key="professor_id", match=MatchValue(value=professor_id))
    ]
    if course_id and course_id.strip():
        conditions.append(
            FieldCondition(key="course_id", match=MatchValue(value=course_id.strip()))
        )
    return Filter(must=conditions)


def build_pedagogical_block(payload: ChatRequest) -> str:
    lines: list[str] = []
    if payload.subject:
        lines.append(f"- Предмет / Subject: {payload.subject}")
    if payload.poi_name:
        lines.append(f"- Об'єкт дослідження (POI): {payload.poi_name}")
    if payload.education_level:
        lines.append(f"- Рівень освіти / Education level: {payload.education_level}")
    if payload.academic_group:
        lines.append(f"- Академічна група / Group: {payload.academic_group}")
    if payload.task_type:
        lines.append(f"- Формат завдання / Task type: {payload.task_type}")
    if payload.difficulty_level:
        lines.append(f"- Складність / Difficulty: {payload.difficulty_level}")
    if payload.duration:
        lines.append(f"- Тривалість / Duration: {payload.duration}")
    if payload.learning_objectives:
        lines.append(f"- Навчальні цілі / Learning objectives: {payload.learning_objectives}")
    if payload.geo_coordinates or payload.geo_radius:
        coords = payload.geo_coordinates or "-"
        radius = f" (радіус / radius: {payload.geo_radius})" if payload.geo_radius else ""
        lines.append(f"- Геоприв'язка / Coordinates: {coords}{radius}")
    return "\n".join(lines)


class RagService:
    def __init__(self) -> None:
        self._qdrant: QdrantClient | None = None
        self._reranker: CrossEncoder | None = None
        self._ollama_client = ollama.AsyncClient(host=OLLAMA_URL)

    def _get_qdrant(self, create_if_missing: bool = False) -> QdrantClient:
        if self._qdrant is None:
            if not QDRANT_DIR.exists():
                if not create_if_missing:
                    raise RuntimeError(
                        "Qdrant storage is not initialized. Upload a file or run ingest.py."
                    )
                QDRANT_DIR.mkdir(parents=True, exist_ok=True)
            self._qdrant = QdrantClient(path=str(QDRANT_DIR))

        if not create_if_missing and not self._qdrant.collection_exists(collection_name=COLLECTION_NAME):
            raise RuntimeError(
                f"Qdrant collection '{COLLECTION_NAME}' not found. Upload a file or run ingest.py."
            )
        return self._qdrant

    def _get_reranker(self) -> CrossEncoder:
        if self._reranker is None:
            self._reranker = CrossEncoder(RERANKER_MODEL)
        return self._reranker

    def check_health(self) -> dict[str, Any]:
        qdrant = self._get_qdrant()
        info = qdrant.get_collection(collection_name=COLLECTION_NAME)
        points_count = getattr(info, "points_count", 0) or 0
        return {
            "qdrant_path": str(QDRANT_DIR),
            "collection": COLLECTION_NAME,
            "indexed_chunks": points_count,
            "ollama_url": OLLAMA_URL,
            "embed_model": EMBED_MODEL,
            "chat_model": CHAT_MODEL,
            "reranker_model": RERANKER_MODEL,
        }

    async def ingest_uploaded_file(
        self,
        filename: str,
        raw_bytes: bytes,
        professor_id: str,
        course_id: str = "",
        document_id: str = "",
    ) -> dict[str, Any]:
        safe_name = Path(filename or "uploaded_material.txt").name.replace("..", "_")
        prof_dir = DATA_DIR / professor_id
        prof_dir.mkdir(parents=True, exist_ok=True)
        dest_path = prof_dir / safe_name
        dest_path.write_bytes(raw_bytes)

        text = extract_text_from_bytes(safe_name, raw_bytes)
        chunks = chunk_text(text, chunk_size=700, overlap=100)
        if not chunks:
            raise ValueError(f"No readable text found in '{safe_name}'.")

        vectors: list[list[float]] = []
        batch_size = 16
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            resp = await self._ollama_client.embed(model=EMBED_MODEL, input=batch)
            vectors.extend(extract_embeddings(resp))

        qdrant = self._get_qdrant(create_if_missing=True)
        vector_dim = len(vectors[0])
        if not qdrant.collection_exists(collection_name=COLLECTION_NAME):
            qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=vector_dim, distance=Distance.COSINE),
            )

        doc_id = document_id.strip() or f"qdoc-{uuid.uuid4().hex[:12]}"
        clean_course_id = course_id.strip()
        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vectors[idx],
                payload={
                    "text": chunks[idx],
                    "source": safe_name,
                    "chunk_index": idx,
                    "professor_id": professor_id,
                    "course_id": clean_course_id,
                    "document_id": doc_id,
                },
            )
            for idx in range(len(chunks))
        ]
        qdrant.upsert(collection_name=COLLECTION_NAME, points=points)

        return {
            "ok": True,
            "filename": safe_name,
            "professor_id": professor_id,
            "course_id": clean_course_id,
            "document_id": doc_id,
            "chunks_indexed": len(points),
            "chunks": chunks,
            "storage_path": f"backend/data/{professor_id}/{safe_name}",
            "qdrant_path": str(QDRANT_DIR),
            "collection": COLLECTION_NAME,
        }

    def delete_document_vectors(self, professor_id: str, source_name: str) -> dict[str, Any]:
        safe_name = Path(source_name).name.replace("..", "_")
        qdrant = self._get_qdrant(create_if_missing=False)
        delete_filter = Filter(
            must=[
                FieldCondition(key="professor_id", match=MatchValue(value=professor_id)),
                FieldCondition(key="source", match=MatchValue(value=safe_name)),
            ]
        )
        qdrant.delete(
            collection_name=COLLECTION_NAME,
            points_selector=FilterSelector(filter=delete_filter),
        )
        file_path = DATA_DIR / professor_id / safe_name
        if file_path.exists():
            file_path.unlink()
        return {"ok": True, "deleted_source": safe_name}

    def _load_all_chunks(
        self, qdrant: QdrantClient, professor_id: str, course_id: str | None = None
    ) -> list[dict[str, Any]]:
        documents: list[dict[str, Any]] = []
        next_offset = None
        owner_filter = build_owner_filter(professor_id, course_id)

        while True:
            records, next_offset = qdrant.scroll(
                collection_name=COLLECTION_NAME,
                scroll_filter=owner_filter,
                limit=256,
                offset=next_offset,
                with_payload=True,
                with_vectors=False,
            )
            for rec in records:
                payload = rec.payload or {}
                text = str(payload.get("text", "")).strip()
                if text:
                    documents.append(
                        {
                            "id": str(rec.id),
                            "text": text,
                            "source": str(payload.get("source", "document")),
                            "chunk_index": int(payload.get("chunk_index", 0)),
                            "professor_id": str(payload.get("professor_id", professor_id)),
                            "course_id": str(payload.get("course_id", "")),
                        }
                    )
            if next_offset is None:
                break

        return documents

    def _vector_search(
        self,
        qdrant: QdrantClient,
        query_vector: list[float],
        professor_id: str,
        course_id: str | None = None,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        owner_filter = build_owner_filter(professor_id, course_id)
        if hasattr(qdrant, "query_points"):
            result = qdrant.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                query_filter=owner_filter,
                limit=limit,
                with_payload=True,
            )
            hits = getattr(result, "points", [])
        else:
            hits = qdrant.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                query_filter=owner_filter,
                limit=limit,
                with_payload=True,
            )

        candidates: list[dict[str, Any]] = []
        for hit in hits:
            payload = hit.payload or {}
            text = str(payload.get("text", "")).strip()
            score = getattr(hit, "score", None)
            if text:
                candidates.append(
                    {
                        "id": str(hit.id),
                        "text": text,
                        "source": str(payload.get("source", "document")),
                        "chunk_index": int(payload.get("chunk_index", 0)),
                        "vector_score": round(float(score), 4) if score is not None else None,
                        "bm25_score": None,
                        "rerank_score": None,
                    }
                )
        return candidates

    def _bm25_search(
        self, question: str, all_chunks: list[dict[str, Any]], limit: int = 10
    ) -> list[dict[str, Any]]:
        if not all_chunks:
            return []

        tokenized_corpus = [tokenize_text(doc["text"]) for doc in all_chunks]
        bm25 = BM25Okapi(tokenized_corpus)
        query_tokens = tokenize_text(question)
        if not query_tokens:
            return []

        scores = bm25.get_scores(query_tokens)
        ranked_indices = sorted(
            range(len(all_chunks)),
            key=lambda idx: float(scores[idx]),
            reverse=True,
        )

        results: list[dict[str, Any]] = []
        for idx in ranked_indices[:limit]:
            score_val = float(scores[idx])
            if score_val > 0:
                item = dict(all_chunks[idx])
                item["vector_score"] = None
                item["bm25_score"] = round(score_val, 4)
                item["rerank_score"] = None
                results.append(item)
        return results

    def _hybrid_candidates(
        self,
        qdrant: QdrantClient,
        question: str,
        query_vector: list[float],
        professor_id: str,
        course_id: str | None = None,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        vector_hits = self._vector_search(
            qdrant, query_vector, professor_id=professor_id, course_id=course_id, limit=10
        )
        all_chunks = self._load_all_chunks(
            qdrant, professor_id=professor_id, course_id=course_id
        )
        bm25_hits = self._bm25_search(question, all_chunks, limit=10)

        merged_map: dict[tuple[str, int, str], dict[str, Any]] = {}
        merged: list[dict[str, Any]] = []

        for item in vector_hits + bm25_hits:
            dedup_key = (item["source"], item["chunk_index"], item["text"])
            existing = merged_map.get(dedup_key)
            if existing is not None:
                if item.get("bm25_score") is not None:
                    existing["bm25_score"] = item["bm25_score"]
                if item.get("vector_score") is not None:
                    existing["vector_score"] = item["vector_score"]
                continue
            copy_item = dict(item)
            merged_map[dedup_key] = copy_item
            merged.append(copy_item)
            if len(merged) >= 15:
                break

        return merged, all_chunks

    def _rerank_top_k(
        self, question: str, candidates: list[dict[str, Any]], top_k: int = 3
    ) -> list[dict[str, Any]]:
        if not candidates:
            return []
        if len(candidates) == 1:
            return candidates

        reranker = self._get_reranker()
        pairs = [(question, cand["text"]) for cand in candidates]
        scores = reranker.predict(pairs)

        scored = sorted(
            zip(candidates, scores),
            key=lambda pair: float(pair[1]),
            reverse=True,
        )
        top_items: list[dict[str, Any]] = []
        for item, score in scored[:top_k]:
            enriched = dict(item)
            enriched["rerank_score"] = round(float(score), 4)
            top_items.append(enriched)
        return top_items

    async def answer_question(
        self, professor_id: str, payload: ChatRequest
    ) -> tuple[str, list[str], dict[str, Any]]:
        question = payload.question.strip()
        ped_block = build_pedagogical_block(payload)

        top_chunks: list[dict[str, Any]] = []
        all_chunks: list[dict[str, Any]] = []

        if payload.use_repo:
            try:
                qdrant = self._get_qdrant(create_if_missing=False)
                embed_resp = await self._ollama_client.embed(model=EMBED_MODEL, input=question)
                query_vector = extract_embeddings(embed_resp)[0]
                candidates, all_chunks = self._hybrid_candidates(
                    qdrant,
                    question,
                    query_vector,
                    professor_id=professor_id,
                    course_id=payload.course_id,
                )
                top_chunks = self._rerank_top_k(question, candidates, top_k=3)
            except RuntimeError:
                all_chunks = []
                top_chunks = []

            if not top_chunks:
                no_info_msg = "У базі знань поточного викладача немає релевантних фрагментів для цього запиту."
                final_prompt = "\n".join(
                    part
                    for part in [
                        SYSTEM_PROMPT,
                        f"Параметри запиту:\n{ped_block}" if ped_block else "",
                        f"Питання: {question}",
                    ]
                    if part
                )
                debug = {
                    "use_repo": True,
                    "engine": "ollama",
                    "model": CHAT_MODEL,
                    "document_chunks": all_chunks,
                    "retrieved_chunks": [],
                    "final_prompt": final_prompt,
                    "raw_llm_response": no_info_msg,
                }
                return no_info_msg, [], debug

        context_sections = [
            f"[Фрагмент {idx + 1} | Джерело: {chunk['source']}]\n{chunk['text']}"
            for idx, chunk in enumerate(top_chunks)
        ]
        context_block = "\n\n".join(context_sections) if context_sections else "Репозиторій документів вимкнено (use_repo=false)."
        system_content = "\n\n".join(
            part
            for part in [
                SYSTEM_PROMPT,
                f"Параметри завдання та курсу:\n{ped_block}" if ped_block else "",
                f"Контекст:\n{context_block}",
            ]
            if part
        )

        messages: list[dict[str, str]] = [
            {
                "role": "system",
                "content": system_content,
            }
        ]

        for turn in payload.history[-8:]:
            role = "assistant" if turn.role == "assistant" else "user"
            content = turn.content.strip()
            if content:
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": question})

        chat_resp = await self._ollama_client.chat(
            model=CHAT_MODEL,
            messages=messages,
            stream=False,
        )

        if hasattr(chat_resp, "message") and hasattr(chat_resp.message, "content"):
            answer = (chat_resp.message.content or "").strip()
        elif isinstance(chat_resp, dict):
            answer = str((chat_resp.get("message") or {}).get("content", "")).strip()
        else:
            answer = ""

        raw_response = answer
        if not answer:
            answer = "У мене немає інформації з цього питання в базі знань"

        sources = [
            f"[{chunk['source']}, #{chunk['chunk_index'] + 1}] {chunk['text']}"
            for chunk in top_chunks
        ]
        debug = {
            "use_repo": payload.use_repo,
            "engine": "ollama",
            "model": CHAT_MODEL,
            "document_chunks": all_chunks,
            "retrieved_chunks": top_chunks,
            "final_prompt": system_content,
            "raw_llm_response": raw_response,
        }
        return answer, sources, debug

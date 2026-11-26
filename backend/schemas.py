from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    history: list[Message] = Field(default_factory=list)
    course_id: str | None = None
    use_repo: bool = True
    subject: str | None = None
    poi_name: str | None = None
    education_level: str | None = None
    academic_group: str | None = None
    task_type: str | None = None
    difficulty_level: str | None = None
    duration: str | None = None
    learning_objectives: str | None = None
    geo_coordinates: str | None = None
    geo_radius: str | None = None
    lang: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    debug: dict[str, Any] | None = None

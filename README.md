# UVa Academic Task Suite

The UVa Academic Task Suite combines three main parts: a React and TypeScript client interface, a primary Node.js server with an SQLite database, and a separate Python microservice for local document search and answer generation (RAG). The system runs locally and supports three interface languages: Ukrainian, English, and Spanish.

## Architecture Overview

At the architecture level, the user interacts with a web application running on port 3000. Depending on the action, requests go either to the main Express server (also on port 3000), which handles authentication, course management, document storage, and each teacher's history, or directly to the Python FastAPI service (port 8000), which handles file uploads, text indexing, and hybrid search. Both backends connect to a locally running Ollama instance (port 11434) for generating vector embeddings (`bge-m3` or `all-minilm`) and building tasks and answers with the `qwen2.5` language model.

## Roles and Access Control

Access rights are separated across three roles, enforced both in the interface and on server routes:

- **Guest (unauthenticated):** Can view the university home page, change the language and theme, and use the task generator in chat mode with the local RAG service, including uploading documents there. The teacher portal, admin panel, and query history remain closed.
- **Teacher:** After signing in with a login and password, gets full access to manage their own courses and material library, generate three task variants from selected documents, view and edit personal history, and export task cards to Word format. Other teachers' courses, other teachers' history, and account management are blocked.
- **Administrator (account manager):** Only has access to the teacher management panel, where they can create, edit, or delete teacher accounts, with no access to courses or the task generator.

## Core Workflows

1. **Teacher account lifecycle:** The manager signs into their panel, receives a signed authorization token, and manages the list of teachers in the SQLite database, after which a newly created teacher can immediately sign in with their credentials.
2. **Courses and document repositories:** Once signed in, the teacher sees **New chat** and **History** buttons in the sidebar and can create or archive courses and upload `txt`, `md`, `pdf`, or `docx` files in their portal. During upload, the server extracts text from the document, splits it into overlapping chunks, computes vector representations through Ollama, and saves everything in SQLite.
3. **Quick upload and vectorization from the generator:** When a user selects a file through the folder button on the task generator screen, it is sent to the Python FastAPI service, where the original file is saved to disk and the text is split into 700-character chunks and written to the local Qdrant vector database. If the user is signed in as a teacher with an active course, the file metadata is also synced to their repository in SQLite.
4. **Task generation and hybrid RAG chat:** When a user enters a location or landmark name (such as University of Lviv or Sagrada Familia), the system pulls structured historical and architectural facts linked to Wikidata identifiers in the selected language. If an authenticated teacher triggers generation, the server retrieves chunks specifically from their selected course documents, sends the request to Ollama, and produces three task types: field task, analytical case, and assessment quiz, saving the result to history. If a query goes through the unauthenticated chat, FastAPI runs hybrid search by combining Qdrant vector search results and BM25 lexical search results, then passes the candidates through a CrossEncoder reranker to select the top three passages. Using only those three passages, `qwen2.5` builds an answer with source citations. A teacher can edit generated task cards manually or export them to a `.doc` file.
5. **Isolated teacher history:** All generated tasks and chat queries are written to the history table linked to the specific teacher's ID. In the history section, a teacher sees only their own records and can reopen any previous query in the generator with all its settings and sources or delete it. On sign-out or account switch, all local browser state is cleared.

## Local Data Storage

To persist all data, the system uses three local storage locations on disk:

- `data/uva.sqlite`: SQLite database storing accounts, courses, document metadata, text chunks, and generation history.
- `backend/data/`: directory storing original uploaded files.
- `backend/qdrant_db/`: local Qdrant vector database holding indexed text chunks along with their vector embeddings.

## Technical Specification

### 1. Overall System Architecture

The platform connects three local processes without external cloud APIs:

- **Frontend (React + TypeScript, port 3000):** renders the task generator form (course, documents, Point of Interest, pedagogical and spatial parameters), reviewable activity cards (`Edit`, `Approve & Save`, `Reject`), the collapsible RAG trace panel, and the professor and account manager dashboards.
- **Express Application Server (`server.ts`, port 3000):** verifies HMAC-SHA256 Bearer tokens, enforces role-based access control, manages SQLite storage (`data/uva.sqlite` with `accounts`, `courses`, `documents`, `document_chunks`, `generated_history`, and `activities`), resolves POI metadata, and orchestrates task generation through Ollama.
- **Python FastAPI Microservice (`backend/main.py` and `backend/rag_service.py`, port 8000):** authenticates professor requests using the same HMAC-SHA256 secret, stores uploaded files in `backend/data/<professor_id>/`, indexes chunks into local Qdrant (`backend/qdrant_db/`), and executes hybrid dense + BM25 search with CrossEncoder reranking.
- **Ollama Server (port 11434):** serves embedding endpoints (`/api/embed` with `all-minilm` or `bge-m3`) and text generation (`/api/chat` with `qwen2.5:3b` or `qwen2.5:7b`) for both backends.

Simple flow across components:

`Frontend (Port 3000) -> Express Server (Port 3000) -> SQLite (data/uva.sqlite) + Ollama (Port 11434)`

`Frontend (Port 3000) -> Python FastAPI (Port 8000) -> Qdrant (backend/qdrant_db/) + BM25 + CrossEncoder + Ollama (Port 11434)`

### 2. End-to-End Activity Workflow (Query Formation to Storage and Retrieval)

1. **Query formation in the frontend:** The teacher opens the generator, selects a course and specific course documents (or turns off the course repository toggle for a non-RAG baseline), fills in the Point of Interest, subject, and notes, and specifies the pedagogical and spatial fields (education level, academic group, task format, difficulty level, duration, learning objectives, geographic coordinates, and search radius).
2. **Submission to Express:** Submitting the form sends `POST /api/tasks/generate` with the Bearer token and form payload.
3. **Authentication and context lookup:** Express verifies that the token belongs to a `professor` account. It gathers POI facts (build year, architectural style, historical events, Wikidata ID) and, when `useRepo` is `true`, loads only SQLite `document_chunks` belonging to that `professor_id`, the selected `courseId`, and the checked `documentIds`.
4. **Embedding and ranking:** Express sends the search query (`subject`, `poiName`, `teacherNote`, learning objectives, and task type) to Ollama `/api/embed` (`all-minilm`), ranks the scoped chunks by cosine similarity plus a lexical overlap boost (or lexical scoring when offline), and keeps the top 4 chunks.
5. **Prompt construction and generation via Ollama:** Express builds the final prompt with `buildRagPrompt` and sends it to `POST http://127.0.0.1:11434/api/chat` in JSON output mode using `qwen2.5`. If Ollama is unavailable, a deterministic local template fallback formats the three variants using the same retrieved chunks and pedagogical fields, and marks the engine label in the response.
6. **Draft storage in SQLite:** Express inserts three rows into the `activities` table with `status = 'draft'`, saving `course_id`, `professor_id`, `document_ids_json`, `metadata_json`, and `source_chunks_json`, and also appends a record to `generated_history`. It returns the three variants, the created draft activity records, and a `debug` trace object containing document chunks, retrieved chunks, the final prompt, and the raw model response.
7. **Review, editing, approval, and retrieval:** In the UI, the teacher can inspect the `debug` trace panel, edit any task (`PUT /api/activities/:id`), approve and save it (`status = 'approved'`), or reject it (`status = 'rejected'`). In `ProfessorDashboard` under the **Saved Activities** tab, `GET /api/activities?courseId=...&status=...` retrieves saved records from SQLite for filtering by course, status, or search text, editing, or deletion (`DELETE /api/activities/:id`).

Step-by-step sequence:

1. `Frontend -> Express: POST /api/tasks/generate (POI, courseId, documentIds, pedagogical fields, useRepo)`
2. `Express -> SQLite: SELECT scoped chunks WHERE professor_id = ? AND course_id = ?`
3. `Express -> Ollama: POST /api/embed -> returns query embedding vector`
4. `Express -> Express: rank top 4 chunks -> buildRagPrompt()`
5. `Express -> Ollama: POST /api/chat -> returns JSON (variant1, variant2, variant3)`
6. `Express -> SQLite: INSERT 3 rows into activities (status = 'draft') + INSERT generated_history`
7. `Express -> Frontend: HTTP 200 (tasks, draftActivities, retrievedChunks, debug trace)`
8. `Frontend -> Express: PUT /api/activities/:id (edited title, body, status = 'approved')`
9. `Frontend -> Express: GET /api/activities?courseId=... -> renders Saved Activities in dashboard`

### 3. Document Processing, Chunking, Embeddings, and Retrieval

- **Text extraction:** Uploaded `.txt`, `.md`, `.pdf`, and `.docx` files are parsed in Node.js (`pdf-parse` for PDF, `mammoth` for DOCX, UTF-8 decoding for text/Markdown) and in Python (`pypdf`, `python-docx`, UTF-8 decoding). Full extracted text is saved in SQLite (`documents.full_text`) so teachers can open and inspect complete document contents from the repository view (`GET /api/documents/:id/content`).
- **Chunking:** Express splits text via `chunkText` into **550-character windows** with **90 characters of overlap**, aligning splits to line breaks, sentence endings, or spaces. Python splits text via `chunk_text` into **700-character windows** with **100 characters of overlap**.
- **Vector indexing:** Express embeds batches via Ollama `all-minilm` and stores vectors in SQLite `document_chunks`. Python embeds batches of 16 via Ollama `bge-m3` and writes points to Qdrant (`knowledge_base`, cosine distance) with payload `{ text, source, chunk_index, professor_id, course_id, document_id }`, while saving the original file under `backend/data/<professor_id>/<filename>`.
- **Retrieval and reranking:**
  - In Express task generation (`useRepo = true`), `rankRelevantChunks` computes cosine similarity plus a `0.08` lexical term-overlap boost and returns up to 4 chunks strictly for that professor and course.
  - In Python chat (`POST /api/chat` with `use_repo = true`), `verify_professor_token` validates the professor token, Qdrant returns up to 10 vector hits filtered by `Filter(must=[professor_id, course_id?])`, and `BM25Okapi` scores all chunks within that same professor/course filter for up to 10 lexical hits. Up to 15 deduplicated candidates are scored by `CrossEncoder` (`BAAI/bge-reranker-v2-m3`) to select the top 3 chunks passed to `qwen2.5:7b`. When `use_repo = false`, retrieval is skipped so generation can be compared without document context.

### 4. Prompt Construction

`buildRagPrompt` (Express) and `_build_user_prompt` (Python) assemble prompts in a fixed order:

1. Role instruction (`university pedagogy methodologist`) and strict output language constraint (`Ukrainian`, `English`, or `Spanish`).
2. Course subject, Point of Interest name, teacher notes, and structured POI metadata (chronology, architectural style, historical events).
3. Pedagogical and spatial parameters (education level, academic group, task format, difficulty level, duration, learning objectives, geographic coordinates, search radius).
4. Retrieved repository excerpts labeled with document title, chunk number, and relevance score (or an explicit note when repository search is disabled).
5. Output contract requiring strict JSON with keys `variant1` (fieldwork), `variant2` (analytical case), and `variant3` (3-question quiz), each having `title`, `body`, and `source`.

### 5. Concrete Examples of Data Exchanged Between Components

**1) Frontend -> Express (`POST /api/tasks/generate`):**

```json
{
  "courseId": "crs-arch-1",
  "documentIds": ["drv-101"],
  "subject": "History of Architecture",
  "poiName": "Palacio de Santa Cruz",
  "teacherNote": "Focus on Plateresque stone reliefs on the main facade",
  "lang": "en",
  "useRepo": true,
  "educationLevel": "Bachelor (Grado)",
  "academicGroup": "ARCH-201",
  "taskType": "Fieldwork & Analysis",
  "difficultyLevel": "Intermediate",
  "duration": "60 min",
  "learningObjectives": "Identify late Gothic to early Renaissance transitions",
  "geoCoordinates": "41.6523, -4.7245",
  "geoRadius": "500 m"
}
```

**2) Express -> Ollama (`POST http://127.0.0.1:11434/api/embed` and `/api/chat`):**

```json
{
  "model": "all-minilm",
  "input": ["History of Architecture Palacio de Santa Cruz Focus on Plateresque stone reliefs"]
}
```

```json
{
  "model": "qwen2.5:3b",
  "stream": false,
  "format": "json",
  "messages": [
    {
      "role": "system",
      "content": "You output strict valid JSON containing variant1, variant2, variant3."
    },
    {
      "role": "user",
      "content": "You are an experienced university pedagogy methodologist at Universidad de Valladolid.\nWrite ALL titles, descriptions, questions, and source notes strictly in English.\n\nCourse Subject: History of Architecture\nPoint of Interest (POI): Palacio de Santa Cruz\nTeacher Instructions: Focus on Plateresque stone reliefs on the main facade\n\nPedagogical & Spatial Configuration:\n- Education Level: Bachelor (Grado)\n- Academic Group: ARCH-201\n- Preferred Task Format / Work Mode: Fieldwork & Analysis\n- Difficulty Level: Intermediate\n- Estimated Duration: 60 min\n- Learning Objectives & Competencies: Identify late Gothic to early Renaissance transitions\n- Geographic Coordinates: 41.6523, -4.7245\n- Fieldwork Search Radius: 500 m\n\nPOI Linked Open Data (Wikidata):\n- Year / Chronology: 1486 (Palacio de Santa Cruz)\n- Style / Category: Plateresque / Early Renaissance\n\nRetrieved Course Repository Excerpts (RAG Context):\n[Excerpt #1 | Document: \"Lectures 1-8\" | Chunk #1 | Score: 0.8379]\nLecture presentations with structural floor plans and order analysis..."
    }
  ]
}
```

**3) Express -> Frontend (`POST /api/tasks/generate` response):**

```json
{
  "engine": "ollama",
  "model": "qwen2.5:3b",
  "tasks": {
    "variant1": {
      "id": 1,
      "tag": "Variant 1: Field Task",
      "title": "Plateresque Facade Survey at Palacio de Santa Cruz",
      "body": "Within a 500 m radius of 41.6523, -4.7245 (60 min, ARCH-201), document three late Gothic buttress and Plateresque relief transitions...",
      "source": "Ollama (qwen2.5:3b) + RAG"
    },
    "variant2": {
      "id": 2,
      "tag": "Variant 2: Analytical Case",
      "title": "Comparative Order Analysis",
      "body": "Compare the courtyard arcade proportions against the structural floor plans in Lectures 1-8...",
      "source": "Ollama (qwen2.5:3b) + RAG"
    },
    "variant3": {
      "id": 3,
      "tag": "Variant 3: Express Quiz",
      "title": "Santa Cruz Architectural Check",
      "body": "1. Which charter established the Colegio Mayor? 2. How do cushioned ashlar blocks contrast with Gothic pinnacles?...",
      "source": "Ollama (qwen2.5:3b) + RAG"
    }
  },
  "draftActivities": [
    {
      "id": "act-1764091200001-4210",
      "professorId": "prof-1",
      "courseId": "crs-arch-1",
      "status": "draft",
      "variantType": "fieldwork",
      "variantIndex": 1
    }
  ],
  "debug": {
    "useRepo": true,
    "engine": "ollama",
    "model": "qwen2.5:3b",
    "documentChunks": [
      { "id": "drv-101-chk-0", "documentTitle": "Lectures 1-8", "chunkIndex": 0, "content": "..." }
    ],
    "retrievedChunks": [
      { "id": "drv-101-chk-0", "documentTitle": "Lectures 1-8", "chunkIndex": 0, "score": 0.8379, "method": "embedding" }
    ],
    "finalPrompt": "...",
    "rawLlmResponse": "{\"variant1\": ...}"
  }
}
```

**4) Activity Approval (`PUT /api/activities/:id`) and Python Hybrid Search (`POST http://localhost:8000/api/chat`):**

```json
{
  "title": "Plateresque Facade Survey (Approved for ARCH-201)",
  "body": "Revised fieldwork instructions saved by the instructor.",
  "status": "approved"
}
```

```json
{
  "answer": "According to lecture_notes.pdf, the main portal combines late Gothic buttresses with Renaissance medallions [lecture_notes.pdf, #2].",
  "sources": [
    "[lecture_notes.pdf, #2] The main portal of Palacio de Santa Cruz introduces cushioned ashlar and Renaissance grotesques..."
  ],
  "debug": {
    "use_repo": true,
    "engine": "ollama-hybrid-rag",
    "model": "qwen2.5:7b",
    "retrieved_chunks": [
      {
        "source": "lecture_notes.pdf",
        "chunk_index": 1,
        "vector_score": 0.8124,
        "bm25_score": 4.7512,
        "rerank_score": 0.9341,
        "text": "The main portal of Palacio de Santa Cruz introduces cushioned ashlar and Renaissance grotesques..."
      }
    ],
    "final_prompt": "...",
    "raw_llm_response": "..."
  }
}
```

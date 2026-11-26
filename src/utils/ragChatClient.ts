export type ChatLang = 'uk' | 'en' | 'es';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatUiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  createdAt?: string;
}

export interface LocalRagDebugTrace {
  use_repo?: boolean;
  engine?: string;
  model?: string;
  document_chunks?: Array<{
    id?: string;
    source?: string;
    chunk_index?: number;
    text?: string;
  }>;
  retrieved_chunks?: Array<{
    id?: string;
    source?: string;
    chunk_index?: number;
    text?: string;
    vector_score?: number | null;
    bm25_score?: number | null;
    rerank_score?: number | null;
  }>;
  final_prompt?: string;
  raw_llm_response?: string;
}

export interface LocalRagChatRequest {
  question: string;
  history: ChatHistoryMessage[];
  course_id?: string;
  use_repo?: boolean;
  subject?: string;
  poi_name?: string;
  education_level?: string;
  academic_group?: string;
  task_type?: string;
  difficulty_level?: string;
  duration?: string;
  learning_objectives?: string;
  geo_coordinates?: string;
  geo_radius?: string;
}

export interface LocalRagChatResponse {
  answer: string;
  sources: string[];
  debug?: LocalRagDebugTrace;
}

export interface LocalRagUploadResponse {
  ok: boolean;
  filename: string;
  chunks_indexed: number;
  chunks?: string[];
  storage_path: string;
  qdrant_path: string;
  collection: string;
}

export function resolveChatApiUrl(envUrl?: string): string {
  const trimmed = (envUrl || '').trim();
  return trimmed || 'http://localhost:8000/api/chat';
}

export function resolveUploadApiUrl(chatApiUrl: string): string {
  const clean = resolveChatApiUrl(chatApiUrl).replace(/\/+$/, '');
  if (clean.endsWith('/api/chat')) {
    return clean.slice(0, -'/api/chat'.length) + '/api/upload';
  }
  return `${clean}/api/upload`;
}

export function buildRagChatPayload(
  question: string,
  history: ReadonlyArray<ChatHistoryMessage>,
  extras?: Omit<LocalRagChatRequest, 'question' | 'history'>
): LocalRagChatRequest {
  const cleanQuestion = question.trim();
  const cleanHistory: ChatHistoryMessage[] = history
    .map((msg) => ({
      role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: String(msg.content || '').trim(),
    }))
    .filter((msg) => msg.content.length > 0);

  const payload: LocalRagChatRequest = {
    question: cleanQuestion,
    history: cleanHistory,
  };

  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v !== undefined && v !== '') {
        (payload as unknown as Record<string, unknown>)[k] = v;
      }
    }
  }
  return payload;
}

export function parseRagChatResponse(raw: unknown, lang: ChatLang = 'uk'): LocalRagChatResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error(
      lang === 'en'
        ? 'The local server returned an invalid response format.'
        : lang === 'es'
        ? 'El servidor local devolvió un formato de respuesta no válido.'
        : 'Локальний сервер повернув некоректний формат відповіді.'
    );
  }
  const obj = raw as { answer?: unknown; sources?: unknown; debug?: unknown };
  const answer = typeof obj.answer === 'string' ? obj.answer.trim() : '';
  if (!answer) {
    throw new Error(
      lang === 'en'
        ? 'The local server returned an empty answer.'
        : lang === 'es'
        ? 'El servidor local devolvió una respuesta vacía.'
        : 'Локальний сервер повернув порожню відповідь.'
    );
  }

  const rawSources = Array.isArray(obj.sources) ? obj.sources : [];
  const sources = rawSources
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && 'content' in item) {
        const chunk = item as { documentTitle?: unknown; content?: unknown };
        const title = typeof chunk.documentTitle === 'string' ? `[${chunk.documentTitle}] ` : '';
        const text = typeof chunk.content === 'string' ? chunk.content.trim() : '';
        return text ? `${title}${text}` : '';
      }
      return '';
    })
    .filter((s) => s.length > 0);

  const debug =
    obj.debug && typeof obj.debug === 'object' ? (obj.debug as LocalRagDebugTrace) : undefined;

  return { answer, sources, debug };
}

export function formatLocalRagError(
  err: unknown,
  apiUrl: string,
  lang: ChatLang = 'uk'
): string {
  if (err instanceof Error) {
    const msg = err.message || '';
    const lower = msg.toLowerCase();
    if (
      err.name === 'TypeError' ||
      err.name === 'AbortError' ||
      lower.includes('failed to fetch') ||
      lower.includes('networkerror') ||
      lower.includes('load failed') ||
      lower.includes('econnrefused') ||
      lower.includes('fetch')
    ) {
      if (lang === 'en') {
        return `Could not connect to the local backend server (${apiUrl}). Make sure the Python server is running in VS Code ("uvicorn main:app --reload --port 8000") and Ollama is active.`;
      }
      if (lang === 'es') {
        return `No se pudo conectar con el servidor local (${apiUrl}). Asegúrese de que el backend en Python esté iniciado en VS Code ("uvicorn main:app --reload --port 8000") y Ollama activo.`;
      }
      return `Не вдалося підключитися до локального сервера (${apiUrl}). Переконайтеся, що Python-бекенд запущений у VS Code командою «uvicorn main:app --reload --port 8000», а локальний AI-сервіс працює.`;
    }
    if (msg.trim().length > 0) {
      return msg;
    }
  }
  if (lang === 'en') {
    return `An error occurred while contacting the local server (${apiUrl}). Check that the backend and Ollama are running.`;
  }
  if (lang === 'es') {
    return `Se produjo un error al comunicarse con el servidor local (${apiUrl}). Verifique que el backend y Ollama estén en ejecución.`;
  }
  return `Сталася помилка під час звернення до локального сервера (${apiUrl}). Перевірте, що бекенд запущений.`;
}

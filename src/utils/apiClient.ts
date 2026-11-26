import type {
  AdminProfile,
  CourseInput,
  DocumentInput,
  ProfessorCourse,
  ProfessorDatabaseRecord,
  ProfessorDriveItem,
  ProfessorProfile,
  TeacherInput,
} from './professorsDb.ts';
import type {
  ActivityRecord,
  ActivityStatus,
  PedagogicalParams,
  RagDebugTrace,
  SupportedLanguage,
  TaskVariants,
  WikidataInfo,
} from './taskGenerator.ts';
import {
  buildRagChatPayload,
  formatLocalRagError,
  parseRagChatResponse,
  resolveChatApiUrl,
  resolveUploadApiUrl,
  type ChatHistoryMessage,
  type ChatLang,
  type LocalRagChatRequest,
  type LocalRagChatResponse,
  type LocalRagUploadResponse,
} from './ragChatClient.ts';

export type { ChatHistoryMessage, LocalRagChatResponse, LocalRagUploadResponse };

const AUTH_TOKEN_KEY = 'uva_auth_token_v1';

export interface RankedRagChunkClient {
  id: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  score: number;
  method: 'embedding' | 'lexical';
}

export interface ServerHistoryRecord {
  id: string;
  professorId: string;
  courseId: string;
  subject: string;
  poiName: string;
  teacherNote: string;
  wikidata: WikidataInfo;
  tasks: TaskVariants;
  sources: RankedRagChunkClient[];
  engineUsed: string;
  createdAt: string;
}

export interface DocumentFullContent {
  id: string;
  fileName: string;
  fileFormat: string;
  fullText: string;
  chunks: Array<{
    id: string;
    chunkIndex: number;
    content: string;
  }>;
}

export interface HealthStatus {
  ok: boolean;
  database: string;
  ollama: {
    baseUrl: string;
    online: boolean;
    chatModel: string;
    embedModel: string;
    installedModels: string[];
  };
}

export function getStoredAuthToken(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
  return null;
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
  } catch {
    // ignore
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const payload = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(payload.error || `Request failed (${res.status})`);
  }
  return payload;
}

export async function apiGetHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/api/health');
}

export async function apiLogin(
  login: string,
  password: string
): Promise<
  | { token: string; role: 'manager'; manager: AdminProfile }
  | {
      token: string;
      role: 'professor';
      professor: ProfessorProfile;
      history: ServerHistoryRecord[];
      activities: ActivityRecord[];
    }
> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
}

export async function apiGetMe(): Promise<
  | { role: 'manager'; manager: AdminProfile }
  | {
      role: 'professor';
      professor: ProfessorProfile;
      history: ServerHistoryRecord[];
      activities: ActivityRecord[];
    }
> {
  return apiFetch('/api/auth/me');
}

export async function apiGetTeachers(): Promise<{ teachers: ProfessorDatabaseRecord[] }> {
  return apiFetch('/api/accounts/teachers');
}

export async function apiCreateTeacher(
  input: TeacherInput
): Promise<{ teacher: ProfessorDatabaseRecord; teachers: ProfessorDatabaseRecord[] }> {
  return apiFetch('/api/accounts/teachers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiUpdateTeacher(
  teacherId: string,
  updates: Partial<TeacherInput>
): Promise<{ teacher: ProfessorDatabaseRecord; teachers: ProfessorDatabaseRecord[] }> {
  return apiFetch(`/api/accounts/teachers/${encodeURIComponent(teacherId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteTeacher(
  teacherId: string
): Promise<{ ok: boolean; teachers: ProfessorDatabaseRecord[] }> {
  return apiFetch(`/api/accounts/teachers/${encodeURIComponent(teacherId)}`, {
    method: 'DELETE',
  });
}

export async function apiCreateCourse(
  input: CourseInput
): Promise<{ createdCourse: ProfessorCourse; professor: ProfessorProfile }> {
  return apiFetch('/api/courses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiUpdateCourse(
  courseId: string,
  updates: Partial<CourseInput>
): Promise<{ course: ProfessorCourse; professor: ProfessorProfile }> {
  return apiFetch(`/api/courses/${encodeURIComponent(courseId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteCourse(
  courseId: string
): Promise<{ ok: boolean; professor: ProfessorProfile }> {
  return apiFetch(`/api/courses/${encodeURIComponent(courseId)}`, {
    method: 'DELETE',
  });
}

export async function apiUploadDocument(
  input: DocumentInput,
  file?: File | null
): Promise<{
  document: ProfessorDriveItem;
  chunksIndexed: number;
  embedProvider: string;
  professor: ProfessorProfile;
}> {
  const form = new FormData();
  form.append('courseId', input.courseId);
  form.append('name', typeof input.name === 'string' ? input.name : input.name.uk);
  form.append('description', typeof input.description === 'string' ? input.description : input.description.uk);
  form.append('folderCategory', input.folderCategory);
  form.append('type', input.type);
  form.append('group', input.group || '');
  form.append('academicYear', input.academicYear || '2026/2027');
  form.append('size', input.size || '1.0 MB');
  form.append('fileName', input.fileName || 'material.txt');
  form.append('fileFormat', input.fileFormat || 'TXT');
  if (input.contentPreview) {
    form.append('contentPreview', input.contentPreview);
  }
  if (file) {
    form.append('file', file);
  }

  return apiFetch('/api/documents/upload', {
    method: 'POST',
    body: form,
  });
}

export async function apiUpdateDocument(
  documentId: string,
  updates: Partial<DocumentInput>
): Promise<{ document: ProfessorDriveItem; professor: ProfessorProfile }> {
  return apiFetch(`/api/documents/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteDocument(
  documentId: string
): Promise<{ ok: boolean; professor: ProfessorProfile }> {
  return apiFetch(`/api/documents/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}

export async function apiGetDocumentContent(
  documentId: string
): Promise<{ document: DocumentFullContent }> {
  return apiFetch(`/api/documents/${encodeURIComponent(documentId)}/content`);
}

export async function apiGenerateRagTasks(
  payload: {
    courseId?: string;
    documentIds?: string[];
    subject: string;
    poiName: string;
    teacherNote: string;
    wikidata: WikidataInfo;
    lang: SupportedLanguage;
    useRepo: boolean;
  } & PedagogicalParams
): Promise<{
  tasks: TaskVariants;
  draftActivities?: ActivityRecord[];
  activities?: ActivityRecord[];
  retrievedChunks: RankedRagChunkClient[];
  engine: 'ollama' | 'local-rag-fallback';
  model: string;
  historyRecord: ServerHistoryRecord;
  history: ServerHistoryRecord[];
  debug?: RagDebugTrace;
}> {
  return apiFetch('/api/tasks/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetActivities(filters?: {
  courseId?: string;
  status?: ActivityStatus;
}): Promise<{ activities: ActivityRecord[] }> {
  const params = new URLSearchParams();
  if (filters?.courseId && filters.courseId !== 'all') {
    params.set('courseId', filters.courseId);
  }
  if (filters?.status) {
    params.set('status', filters.status);
  }
  const qs = params.toString();
  return apiFetch(`/api/activities${qs ? `?${qs}` : ''}`);
}

export async function apiCreateActivity(payload: {
  courseId?: string;
  documentIds?: string[];
  subject: string;
  poiName: string;
  teacherNote?: string;
  title: string;
  body: string;
  variantType?: string;
  variantIndex?: number;
  status?: ActivityStatus;
  metadata?: PedagogicalParams & { source?: string };
  sourceChunks?: RankedRagChunkClient[];
  engineUsed?: string;
}): Promise<{ activity: ActivityRecord; activities: ActivityRecord[] }> {
  return apiFetch('/api/activities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateActivity(
  activityId: string,
  updates: {
    title?: string;
    body?: string;
    status?: ActivityStatus;
    courseId?: string;
    metadata?: PedagogicalParams & { source?: string };
  }
): Promise<{ activity: ActivityRecord; activities: ActivityRecord[] }> {
  return apiFetch(`/api/activities/${encodeURIComponent(activityId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteActivity(
  activityId: string
): Promise<{ ok: boolean; activities: ActivityRecord[] }> {
  return apiFetch(`/api/activities/${encodeURIComponent(activityId)}`, {
    method: 'DELETE',
  });
}

export async function apiSaveHistory(payload: {
  courseId?: string;
  subject: string;
  poiName: string;
  teacherNote?: string;
  wikidata?: WikidataInfo;
  tasks: TaskVariants;
  sources?: RankedRagChunkClient[];
  engineUsed?: string;
}): Promise<{ historyRecord: ServerHistoryRecord; history: ServerHistoryRecord[] }> {
  return apiFetch('/api/history', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteHistory(
  historyId: string
): Promise<{ ok: boolean; history: ServerHistoryRecord[] }> {
  return apiFetch(`/api/history/${encodeURIComponent(historyId)}`, {
    method: 'DELETE',
  });
}

export function getLocalChatApiUrl(): string {
  const envUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL
      : undefined;
  return resolveChatApiUrl(envUrl);
}

/**
 * Відправляє HTTP POST-запит до локального Python FastAPI бекенду з токеном викладача.
 */
export async function apiSendLocalRagChat(
  payload: {
    question: string;
    history: ChatHistoryMessage[];
    lang?: ChatLang;
  } & Omit<LocalRagChatRequest, 'question' | 'history'>
): Promise<LocalRagChatResponse> {
  const apiUrl = getLocalChatApiUrl();
  const lang: ChatLang = payload.lang || 'uk';
  const { question, history, lang: _lang, ...extras } = payload;
  const requestBody = buildRagChatPayload(question, history, extras);
  const token = getStoredAuthToken();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = (await res.json().catch(() => ({}))) as {
      detail?: string;
      error?: string;
      answer?: string;
      sources?: string[];
      debug?: unknown;
    };

    if (!res.ok) {
      const serverDetail = data.detail || data.error;
      throw new Error(
        serverDetail ||
          (lang === 'en'
            ? `Local server returned error (${res.status}).`
            : lang === 'es'
            ? `El servidor local devolvió un error (${res.status}).`
            : `Локальний сервер повернув помилку (${res.status}).`)
      );
    }

    return parseRagChatResponse(data, lang);
  } catch (err) {
    throw new Error(formatLocalRagError(err, apiUrl, lang));
  }
}

/**
 * Завантажує файл напряму до локального Python FastAPI /api/upload з прив'язкою до викладача та курсу.
 */
export async function apiUploadFileToLocalRag(
  file: File,
  lang: ChatLang = 'uk',
  courseId = ''
): Promise<LocalRagUploadResponse> {
  const uploadUrl = resolveUploadApiUrl(getLocalChatApiUrl());
  const form = new FormData();
  form.append('file', file);
  if (courseId) {
    form.append('course_id', courseId);
  }

  const token = getStoredAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: form,
    });

    const data = (await res.json().catch(() => ({}))) as {
      detail?: string;
      error?: string;
    } & LocalRagUploadResponse;

    if (!res.ok) {
      const serverDetail = data.detail || data.error;
      throw new Error(
        serverDetail ||
          (lang === 'en'
            ? `Upload failed (${res.status}).`
            : lang === 'es'
            ? `Error al subir archivo (${res.status}).`
            : `Помилка завантаження (${res.status}).`)
      );
    }

    return data;
  } catch (err) {
    throw new Error(formatLocalRagError(err, uploadUrl, lang));
  }
}

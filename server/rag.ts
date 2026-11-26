import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import {
  analyzePoiData,
  generateTaskVariants,
  type PedagogicalParams,
  type SupportedLanguage,
  type TaskVariants,
  type WikidataInfo,
} from '../src/utils/taskGenerator.ts';

export type AccountRole = 'manager' | 'professor';

export interface RagChunkRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  courseId: string;
  chunkIndex: number;
  content: string;
  embedding: number[] | null;
}

export interface RankedRagChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  score: number;
  method: 'embedding' | 'lexical';
}

export interface OllamaGenerationResult {
  tasks: TaskVariants;
  retrievedChunks: RankedRagChunk[];
  engine: 'ollama' | 'local-rag-fallback';
  model: string;
  promptUsed: string;
  rawLlmResponse: string;
}

/**
 * Pure RBAC guard: Account Manager ("manager") is strictly restricted to account management only
 * and cannot access teacher courses, documents, RAG task generation, activities, or task history.
 */
export function isEndpointAllowedForRole(
  role: AccountRole,
  resource: 'accounts' | 'courses' | 'documents' | 'tasks' | 'activities' | 'history' | 'workspace'
): boolean {
  if (role === 'manager') {
    return resource === 'accounts';
  }
  if (role === 'professor') {
    return resource !== 'accounts';
  }
  return false;
}

/**
 * Splits extracted document text into overlapping semantic chunks for vector indexing.
 */
export function chunkText(rawText: string, chunkSize = 550, overlap = 90): string[] {
  const cleaned = (rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) return [cleaned];

  const safeOverlap = Math.max(0, Math.min(overlap, Math.floor(chunkSize / 2)));
  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);
    if (end < cleaned.length) {
      // Try snapping to sentence or word boundary so words are not split mid-token
      const windowSlice = cleaned.slice(start, end);
      const lastBreak = Math.max(
        windowSlice.lastIndexOf('\n'),
        windowSlice.lastIndexOf('. '),
        windowSlice.lastIndexOf(' ')
      );
      if (lastBreak > chunkSize * 0.45) {
        end = start + lastBreak + 1;
      }
    }

    const piece = cleaned.slice(start, end).trim();
    if (piece.length > 0) {
      chunks.push(piece);
    }

    if (end >= cleaned.length) break;
    const nextStart = end - safeOverlap;
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}

/**
 * Standard vector cosine similarity in [-1, 1], returning 0 for empty or mismatched vectors.
 */
export function cosineSimilarity(a: number[] | null | undefined, b: number[] | null | undefined): number {
  if (!a || !b || a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'are', 'was',
  'для', 'або', 'також', 'про', 'від', 'при', 'над', 'під', 'що', 'як',
  'para', 'con', 'los', 'las', 'del', 'una', 'por', 'que', 'como'
]);

export function tokenizeForLexical(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

export function lexicalSimilarity(query: string, chunkContent: string): number {
  const qTokens = tokenizeForLexical(query);
  const dTokens = tokenizeForLexical(chunkContent);
  if (qTokens.length === 0 || dTokens.length === 0) return 0;

  const dFreq = new Map<string, number>();
  for (const tok of dTokens) {
    dFreq.set(tok, (dFreq.get(tok) || 0) + 1);
  }

  let matchedScore = 0;
  const seen = new Set<string>();
  for (const qTok of qTokens) {
    if (seen.has(qTok)) continue;
    seen.add(qTok);
    const exactCount = dFreq.get(qTok) || 0;
    if (exactCount > 0) {
      matchedScore += 1 + Math.log1p(exactCount) * 0.35;
      continue;
    }
    // Partial stem prefix match for inflected Ukrainian/Spanish/English terms
    if (qTok.length >= 4) {
      const stem = qTok.slice(0, 4);
      for (const dTok of dFreq.keys()) {
        if (dTok.startsWith(stem)) {
          matchedScore += 0.65;
          break;
        }
      }
    }
  }

  return matchedScore / Math.sqrt(qTokens.length + 1);
}

/**
 * Ranks chunks across selected documents using Ollama embeddings when available,
 * or lexical relevance fallback when offline / embeddings absent.
 */
export function rankRelevantChunks(
  query: string,
  chunks: RagChunkRecord[],
  queryEmbedding: number[] | null,
  topK = 4,
  allowedDocumentIds?: string[]
): RankedRagChunk[] {
  const allowedSet = allowedDocumentIds && allowedDocumentIds.length > 0 ? new Set(allowedDocumentIds) : null;
  const scoped = allowedSet ? chunks.filter((c) => allowedSet.has(c.documentId)) : chunks;

  if (scoped.length === 0) return [];

  const scored: RankedRagChunk[] = scoped.map((chunk) => {
    const canUseEmbedding =
      Array.isArray(queryEmbedding) &&
      queryEmbedding.length > 0 &&
      Array.isArray(chunk.embedding) &&
      chunk.embedding.length === queryEmbedding.length;

    if (canUseEmbedding) {
      const embScore = cosineSimilarity(queryEmbedding, chunk.embedding);
      const lexBoost = lexicalSimilarity(query, chunk.content) * 0.08;
      return {
        id: chunk.id,
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        score: Number((embScore + lexBoost).toFixed(4)),
        method: 'embedding',
      };
    }

    const lex = lexicalSimilarity(query, `${chunk.documentTitle} ${chunk.content}`);
    return {
      id: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      score: Number(lex.toFixed(4)),
      method: 'lexical',
    };
  });

  scored.sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex);
  return scored.slice(0, topK);
}

/**
 * Extracts readable text from uploaded PDF, DOCX, TXT, MD, CSV, JSON buffers.
 */
export async function extractTextFromUpload(
  buffer: Uint8Array,
  mimetype: string,
  originalName: string
): Promise<string> {
  const lower = (originalName || '').toLowerCase();

  if (lower.endsWith('.pdf') || mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const res = await parser.getText();
      return (res.text || '').trim();
    } finally {
      await parser.destroy();
    }
  }

  if (
    lower.endsWith('.docx') ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const nodeBuffer = globalThis.Buffer.from(buffer);
    const result = await mammoth.extractRawText({ buffer: nodeBuffer });
    return (result.value || '').trim();
  }

  // TXT, MD, CSV, JSON, plain text
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return decoder.decode(buffer).trim();
}

export async function checkOllamaHealth(baseUrl: string): Promise<{
  online: boolean;
  models: string[];
}> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(`${cleanBase}/api/tags`, { signal: controller.signal });
    if (!res.ok) return { online: false, models: [] };
    const data = (await res.json()) as { models?: Array<{ name?: string }> };
    return {
      online: true,
      models: (data.models || []).map((m) => m.name || '').filter(Boolean),
    };
  } catch {
    return { online: false, models: [] };
  } finally {
    clearTimeout(timeout);
  }
}

export async function embedTextsWithOllama(
  texts: string[],
  baseUrl: string,
  embedModel: string
): Promise<{ embeddings: number[][] | null; provider: 'ollama' | 'lexical-fallback' }> {
  if (texts.length === 0) {
    return { embeddings: [], provider: 'lexical-fallback' };
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${cleanBase}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: embedModel,
        input: texts,
      }),
    });

    if (!res.ok) {
      return { embeddings: null, provider: 'lexical-fallback' };
    }

    const data = (await res.json()) as { embeddings?: number[][] };
    if (!Array.isArray(data.embeddings) || data.embeddings.length !== texts.length) {
      return { embeddings: null, provider: 'lexical-fallback' };
    }
    return { embeddings: data.embeddings, provider: 'ollama' };
  } catch {
    return { embeddings: null, provider: 'lexical-fallback' };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildRagPrompt(params: {
  lang: SupportedLanguage;
  subject: string;
  poiName: string;
  teacherNote: string;
  wikidata: WikidataInfo;
  retrievedChunks: RankedRagChunk[];
  pedagogical?: PedagogicalParams;
}): string {
  const langLabel =
    params.lang === 'uk' ? 'Ukrainian' : params.lang === 'es' ? 'Spanish' : 'English';

  const ped = params.pedagogical || {};
  const pedLines = [
    ped.educationLevel ? `- Education Level: ${ped.educationLevel}` : null,
    ped.academicGroup ? `- Academic Group: ${ped.academicGroup}` : null,
    ped.taskType ? `- Preferred Task Format / Work Mode: ${ped.taskType}` : null,
    ped.difficultyLevel ? `- Difficulty Level: ${ped.difficultyLevel}` : null,
    ped.duration ? `- Estimated Duration: ${ped.duration}` : null,
    ped.learningObjectives ? `- Learning Objectives & Competencies: ${ped.learningObjectives}` : null,
    ped.geoCoordinates ? `- Geographic Coordinates: ${ped.geoCoordinates}` : null,
    ped.geoRadius ? `- Fieldwork Search Radius: ${ped.geoRadius}` : null,
  ].filter(Boolean);

  const ragBlock =
    params.retrievedChunks.length > 0
      ? params.retrievedChunks
          .map(
            (c, idx) =>
              `[Excerpt #${idx + 1} | Document: "${c.documentTitle}" | Chunk #${c.chunkIndex + 1} | Score: ${c.score}]\n${c.content}`
          )
          .join('\n\n')
      : 'No course documents were attached for this request.';

  return [
    `You are an experienced university pedagogy methodologist at Universidad de Valladolid.`,
    `Write ALL titles, descriptions, questions, and source notes strictly in ${langLabel}.`,
    `Generate EXACTLY THREE pedagogical task variants grounded in both the POI facts, the pedagogical constraints, and the retrieved course document excerpts.`,
    ``,
    `Course Subject: ${params.subject}`,
    `Point of Interest (POI): ${params.poiName}`,
    `Teacher Instructions: ${params.teacherNote || 'None'}`,
    ...(pedLines.length > 0 ? ['', 'Pedagogical & Spatial Configuration:', ...pedLines] : []),
    ``,
    `POI Linked Open Data (Wikidata):`,
    `- Year / Chronology: ${params.wikidata.buildYear}`,
    `- Style / Category: ${params.wikidata.style}`,
    `- Related Events: ${params.wikidata.events.join(', ')}`,
    ``,
    `Retrieved Course Repository Excerpts (RAG Context):`,
    ragBlock,
    ``,
    `Return ONLY valid JSON with keys "variant1", "variant2", "variant3". Each object must have strings: "title", "body", "source".`,
    `- variant1: On-site Field Task referencing concrete details from the POI, coordinates/radius if provided, and retrieved excerpts.`,
    `- variant2: Analytical / Comparative Case synthesizing the course excerpts with the POI historical context and learning objectives.`,
    `- variant3: Assessment Quiz with 3 concrete questions grounded in the excerpts and POI at the requested difficulty level.`,
  ].join('\n');
}

export function parseOllamaTaskJson(
  rawText: string,
  fallback: TaskVariants,
  modelLabel: string
): TaskVariants | null {
  try {
    const trimmed = rawText.trim();
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;
    const parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as Record<
      string,
      { title?: string; body?: string; source?: string } | undefined
    >;

    if (!parsed.variant1 || !parsed.variant2 || !parsed.variant3) return null;

    return {
      variant1: {
        ...fallback.variant1,
        title: (parsed.variant1.title || fallback.variant1.title).trim(),
        body: (parsed.variant1.body || fallback.variant1.body).trim(),
        source: (parsed.variant1.source || `Ollama (${modelLabel}) + RAG`).trim(),
      },
      variant2: {
        ...fallback.variant2,
        title: (parsed.variant2.title || fallback.variant2.title).trim(),
        body: (parsed.variant2.body || fallback.variant2.body).trim(),
        source: (parsed.variant2.source || `Ollama (${modelLabel}) + RAG`).trim(),
      },
      variant3: {
        ...fallback.variant3,
        title: (parsed.variant3.title || fallback.variant3.title).trim(),
        body: (parsed.variant3.body || fallback.variant3.body).trim(),
        source: (parsed.variant3.source || `Ollama (${modelLabel}) + RAG`).trim(),
      },
    };
  } catch {
    return null;
  }
}

export async function generateTasksWithOllamaOrFallback(params: {
  lang: SupportedLanguage;
  subject: string;
  poiName: string;
  teacherNote: string;
  wikidata?: WikidataInfo;
  pedagogical?: PedagogicalParams;
  chunks: RagChunkRecord[];
  selectedDocumentIds?: string[];
  useRepo: boolean;
  ollamaBaseUrl: string;
  chatModel: string;
  embedModel: string;
}): Promise<OllamaGenerationResult> {
  const wiki = params.wikidata || analyzePoiData(params.poiName, params.lang);
  const ped = params.pedagogical || {};
  const queryText = [
    params.subject,
    params.poiName,
    params.teacherNote,
    ped.learningObjectives || '',
    ped.taskType || '',
  ]
    .filter(Boolean)
    .join(' ');

  let retrievedChunks: RankedRagChunk[] = [];
  if (params.useRepo && params.chunks.length > 0) {
    const hasVectors = params.chunks.some((c) => Array.isArray(c.embedding) && c.embedding.length > 0);
    let queryEmbedding: number[] | null = null;
    if (hasVectors) {
      const embRes = await embedTextsWithOllama(
        [queryText],
        params.ollamaBaseUrl,
        params.embedModel
      );
      queryEmbedding = embRes.embeddings?.[0] || null;
    }
    retrievedChunks = rankRelevantChunks(
      queryText,
      params.chunks,
      queryEmbedding,
      4,
      params.selectedDocumentIds
    );
  }

  const promptUsed = buildRagPrompt({
    lang: params.lang,
    subject: params.subject,
    poiName: params.poiName,
    teacherNote: params.teacherNote,
    wikidata: wiki,
    retrievedChunks,
    pedagogical: ped,
  });

  const baseFallback = generateTaskVariants(
    params.lang,
    params.subject,
    params.poiName,
    params.teacherNote,
    wiki
  );

  // Append pedagogical metadata summary into fallback tasks so parameters are never lost offline
  const pedSummaryParts = [
    ped.educationLevel ? `${params.lang === 'uk' ? 'Рівень' : params.lang === 'es' ? 'Nivel' : 'Level'}: ${ped.educationLevel}` : null,
    ped.academicGroup ? `${params.lang === 'uk' ? 'Група' : params.lang === 'es' ? 'Grupo' : 'Group'}: ${ped.academicGroup}` : null,
    ped.difficultyLevel ? `${params.lang === 'uk' ? 'Складність' : params.lang === 'es' ? 'Dificultad' : 'Difficulty'}: ${ped.difficultyLevel}` : null,
    ped.duration ? `${params.lang === 'uk' ? 'Тривалість' : params.lang === 'es' ? 'Duración' : 'Duration'}: ${ped.duration}` : null,
    ped.taskType ? `${params.lang === 'uk' ? 'Формат' : params.lang === 'es' ? 'Formato' : 'Format'}: ${ped.taskType}` : null,
    ped.learningObjectives ? `${params.lang === 'uk' ? 'Цілі' : params.lang === 'es' ? 'Objetivos' : 'Objectives'}: ${ped.learningObjectives}` : null,
    ped.geoCoordinates ? `${params.lang === 'uk' ? 'Координати' : params.lang === 'es' ? 'Coordenadas' : 'Coordinates'}: ${ped.geoCoordinates}${ped.geoRadius ? ` (${ped.geoRadius})` : ''}` : null,
  ].filter(Boolean);

  if (pedSummaryParts.length > 0) {
    const pedLine = `\n[${pedSummaryParts.join(' · ')}]`;
    baseFallback.variant1 = { ...baseFallback.variant1, body: baseFallback.variant1.body + pedLine };
    baseFallback.variant2 = { ...baseFallback.variant2, body: baseFallback.variant2.body + pedLine };
  }

  // Attempt live Ollama chat generation first
  const cleanBase = params.ollamaBaseUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let capturedRawResponse = '';
  try {
    const res = await fetch(`${cleanBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: params.chatModel,
        stream: false,
        format: 'json',
        messages: [
          {
            role: 'system',
            content: 'You output strict valid JSON containing variant1, variant2, variant3.',
          },
          {
            role: 'user',
            content: promptUsed,
          },
        ],
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { message?: { content?: string } };
      const content = data.message?.content || '';
      capturedRawResponse = content;
      const parsed = parseOllamaTaskJson(content, baseFallback, params.chatModel);
      if (parsed) {
        return {
          tasks: parsed,
          retrievedChunks,
          engine: 'ollama',
          model: params.chatModel,
          promptUsed,
          rawLlmResponse: content,
        };
      }
    } else {
      capturedRawResponse = `[Ollama HTTP ${res.status} — deterministic template fallback activated]`;
    }
  } catch (err) {
    capturedRawResponse = `[Ollama unreachable (${err instanceof Error ? err.message : 'connection error'}) — deterministic template fallback activated]`;
  } finally {
    clearTimeout(timeout);
  }

  // Enrich deterministic fallback tasks with actual retrieved RAG chunk excerpts & file citations
  const citedTitles = Array.from(new Set(retrievedChunks.map((c) => c.documentTitle)));
  const topExcerpt = retrievedChunks[0]
    ? retrievedChunks[0].content.slice(0, 220).trim() + (retrievedChunks[0].content.length > 220 ? '…' : '')
    : '';
  const secondExcerpt = retrievedChunks[1]
    ? retrievedChunks[1].content.slice(0, 200).trim() + (retrievedChunks[1].content.length > 200 ? '…' : '')
    : '';

  if (citedTitles.length > 0) {
    const citationLabel =
      params.lang === 'uk'
        ? `Локальний RAG: ${citedTitles.join(', ')}`
        : params.lang === 'es'
        ? `RAG Local: ${citedTitles.join(', ')}`
        : `Local RAG: ${citedTitles.join(', ')}`;

    const snippetNote1 =
      params.lang === 'uk'
        ? `\n\n[Контекст із файлу "${retrievedChunks[0].documentTitle}"]: «${topExcerpt}»`
        : params.lang === 'es'
        ? `\n\n[Contexto de "${retrievedChunks[0].documentTitle}"]: «${topExcerpt}»`
        : `\n\n[Context from "${retrievedChunks[0].documentTitle}"]: "${topExcerpt}"`;

    const snippetNote2 = secondExcerpt
      ? params.lang === 'uk'
        ? `\n\n[Додатковий фрагмент із "${retrievedChunks[1].documentTitle}"]: «${secondExcerpt}»`
        : params.lang === 'es'
        ? `\n\n[Fragmento adicional de "${retrievedChunks[1].documentTitle}"]: «${secondExcerpt}»`
        : `\n\n[Additional excerpt from "${retrievedChunks[1].documentTitle}"]: "${secondExcerpt}"`
      : snippetNote1;

    baseFallback.variant1 = {
      ...baseFallback.variant1,
      body: baseFallback.variant1.body + snippetNote1,
      source: citationLabel,
    };
    baseFallback.variant2 = {
      ...baseFallback.variant2,
      body: baseFallback.variant2.body + snippetNote2,
      source: citationLabel,
    };
    baseFallback.variant3 = {
      ...baseFallback.variant3,
      body:
        baseFallback.variant3.body +
        (params.lang === 'uk'
          ? `\n4. Прокоментуйте положення з документа «${retrievedChunks[0].documentTitle}» у прив’язці до об’єкта ${params.poiName}.`
          : params.lang === 'es'
          ? `\n4. Comente los conceptos del documento «${retrievedChunks[0].documentTitle}» en relación con ${params.poiName}.`
          : `\n4. Relate the key concept from "${retrievedChunks[0].documentTitle}" to ${params.poiName}.`),
      source: citationLabel,
    };
  }

  return {
    tasks: baseFallback,
    retrievedChunks,
    engine: 'local-rag-fallback',
    model: params.chatModel,
    promptUsed,
    rawLlmResponse: capturedRawResponse || JSON.stringify(baseFallback, null, 2),
  };
}

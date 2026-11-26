import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { formatFileSize, type CourseInput, type DocumentInput, type TeacherInput } from './src/utils/professorsDb.ts';
import type {
  ActivityStatus,
  PedagogicalParams,
  SupportedLanguage,
  WikidataInfo,
} from './src/utils/taskGenerator.ts';
import { UvaSqliteDb } from './server/db.ts';
import {
  checkOllamaHealth,
  chunkText,
  embedTextsWithOllama,
  extractTextFromUpload,
  generateTasksWithOllamaOrFallback,
  isEndpointAllowedForRole,
  type AccountRole,
  type RankedRagChunk,
} from './server/rag.ts';

const PORT = Number(process.env.PORT) || 3000;
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './data/uva.sqlite';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:3b';
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'all-minilm';
const AUTH_SECRET = process.env.AUTH_SECRET || 'uva-local-dev-secret-change-in-production';

interface SessionClaims {
  accountId: string;
  login: string;
  role: AccountRole;
  exp: number;
}

interface AuthedRequest extends Request {
  auth?: SessionClaims;
}

function signToken(claims: Omit<SessionClaims, 'exp'>): string {
  const payload: SessionClaims = {
    accountId: claims.accountId,
    login: claims.login,
    role: claims.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = globalThis.Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): SessionClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(globalThis.Buffer.from(sig), globalThis.Buffer.from(expected))) {
      return null;
    }
    const parsed = JSON.parse(globalThis.Buffer.from(encoded, 'base64url').toString('utf8')) as SessionClaims;
    if (!parsed.accountId || !parsed.role || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function requireRole(
  resource: 'accounts' | 'courses' | 'documents' | 'tasks' | 'activities' | 'history' | 'workspace'
) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const claims = token ? verifyToken(token) : null;
    if (!claims) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!isEndpointAllowedForRole(claims.role, resource)) {
      res.status(403).json({
        error:
          claims.role === 'manager'
            ? 'Account Manager role is strictly limited to managing teacher accounts only.'
            : 'Insufficient permissions for this resource.',
      });
      return;
    }
    req.auth = claims;
    next();
  };
}

async function startServer() {
  const db = await UvaSqliteDb.create(SQLITE_DB_PATH);
  const app = express();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
  });

  app.use(express.json({ limit: '4mb' }));

  // =========================================================================
  // 1. HEALTH & OLLAMA STATUS
  // =========================================================================
  app.get('/api/health', async (_req, res) => {
    const ollama = await checkOllamaHealth(OLLAMA_BASE_URL);
    res.json({
      ok: true,
      database: SQLITE_DB_PATH,
      ollama: {
        baseUrl: OLLAMA_BASE_URL,
        online: ollama.online,
        chatModel: OLLAMA_CHAT_MODEL,
        embedModel: OLLAMA_EMBED_MODEL,
        installedModels: ollama.models,
      },
    });
  });

  // =========================================================================
  // 2. AUTHENTICATION
  // =========================================================================
  app.post('/api/auth/login', (req, res) => {
    const { login, password } = (req.body || {}) as { login?: string; password?: string };
    if (!login || !password) {
      res.status(400).json({ error: 'Login and password are required' });
      return;
    }

    const result = db.authenticate(login, password);
    if (!result) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({
      accountId: result.accountId,
      login: result.login,
      role: result.role,
    });

    if (result.role === 'manager') {
      res.json({
        token,
        role: 'manager',
        manager: result.managerProfile,
      });
      return;
    }

    const history = db.listHistory(result.accountId);
    const activities = db.listActivities(result.accountId);
    res.json({
      token,
      role: 'professor',
      professor: result.professorProfile,
      history,
      activities,
    });
  });

  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const claims = token ? verifyToken(token) : null;
    if (!claims) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    if (claims.role === 'manager') {
      const manager = db.getManagerProfile(claims.accountId);
      if (!manager) {
        res.status(401).json({ error: 'Account not found' });
        return;
      }
      res.json({ role: 'manager', manager });
      return;
    }

    const professor = db.getProfessorProfile(claims.accountId);
    if (!professor) {
      res.status(401).json({ error: 'Professor account not found' });
      return;
    }
    const history = db.listHistory(claims.accountId);
    const activities = db.listActivities(claims.accountId);
    res.json({ role: 'professor', professor, history, activities });
  });

  // =========================================================================
  // 3. ACCOUNT MANAGER ROUTES (Strictly Account CRUD ONLY)
  // =========================================================================
  app.get('/api/accounts/teachers', requireRole('accounts'), (_req, res) => {
    res.json({ teachers: db.listTeachers() });
  });

  app.post('/api/accounts/teachers', requireRole('accounts'), (req, res) => {
    try {
      const input = req.body as TeacherInput;
      if (!input?.login || !input?.name) {
        res.status(400).json({ error: 'Login and teacher name are required' });
        return;
      }
      const created = db.createTeacher(input);
      res.status(201).json({ teacher: created, teachers: db.listTeachers() });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create teacher' });
    }
  });

  app.put('/api/accounts/teachers/:id', requireRole('accounts'), (req, res) => {
    try {
      const updated = db.updateTeacher(req.params.id, req.body as Partial<TeacherInput>);
      if (!updated) {
        res.status(404).json({ error: 'Teacher account not found' });
        return;
      }
      res.json({ teacher: updated, teachers: db.listTeachers() });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update teacher' });
    }
  });

  app.delete('/api/accounts/teachers/:id', requireRole('accounts'), (req, res) => {
    const ok = db.deleteTeacher(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Teacher account not found' });
      return;
    }
    res.json({ ok: true, teachers: db.listTeachers() });
  });

  // =========================================================================
  // 4. PROFESSOR WORKSPACE, COURSES & DOCUMENTS (RAG INDEXING)
  // =========================================================================
  app.get('/api/professor/workspace', requireRole('workspace'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const professor = db.getProfessorProfile(profId);
    if (!professor) {
      res.status(404).json({ error: 'Professor not found' });
      return;
    }
    const history = db.listHistory(profId);
    res.json({ professor, history });
  });

  app.post('/api/courses', requireRole('courses'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const input = req.body as CourseInput;
    if (!input?.code || !input?.title) {
      res.status(400).json({ error: 'Course code and title are required' });
      return;
    }
    const createdCourse = db.createCourse(profId, input);
    const professor = db.getProfessorProfile(profId);
    res.status(201).json({ createdCourse, professor });
  });

  app.put('/api/courses/:id', requireRole('courses'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const updated = db.updateCourse(profId, req.params.id, req.body as Partial<CourseInput>);
    if (!updated) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    const professor = db.getProfessorProfile(profId);
    res.json({ course: updated, professor });
  });

  app.delete('/api/courses/:id', requireRole('courses'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const ok = db.deleteCourse(profId, req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    const professor = db.getProfessorProfile(profId);
    res.json({ ok: true, professor });
  });

  app.post(
    '/api/documents/upload',
    requireRole('documents'),
    upload.single('file'),
    async (req: AuthedRequest, res) => {
      try {
        const profId = req.auth!.accountId;
        const body = req.body as Record<string, string | undefined>;
        const courseId = (body.courseId || '').trim();
        const name = (body.name || '').trim();
        const description = (body.description || '').trim();

        if (!courseId || !name || !description) {
          res.status(400).json({ error: 'courseId, name, and description are required' });
          return;
        }

        const prof = db.getProfessorProfile(profId);
        if (!prof || !prof.courses.some((c) => c.id === courseId)) {
          res.status(404).json({ error: 'Target course not found for this professor' });
          return;
        }

        let extractedText = '';
        let fileName = (body.fileName || 'material.txt').trim();
        let fileFormat = (body.fileFormat || 'TXT').trim().toUpperCase();
        let size = (body.size || '12 KB').trim();

        if (req.file) {
          fileName = req.file.originalname || fileName;
          const ext = fileName.split('.').pop()?.toUpperCase();
          if (ext) fileFormat = ext;
          size = formatFileSize(req.file.size);
          extractedText = await extractTextFromUpload(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname
          );
        }

        const manualText = (body.contentPreview || '').trim();
        const fullText = [extractedText, manualText, description].filter(Boolean).join('\n\n');
        const chunks = chunkText(fullText);

        const embedResult = await embedTextsWithOllama(
          chunks,
          OLLAMA_BASE_URL,
          OLLAMA_EMBED_MODEL
        );

        const docInput: DocumentInput = {
          name,
          courseId,
          folderCategory: (body.folderCategory as DocumentInput['folderCategory']) || 'lectures',
          type: (body.type as DocumentInput['type']) || 'lecture',
          group: (body.group || '').trim(),
          academicYear: (body.academicYear || '2026/2027').trim(),
          size,
          fileName,
          fileFormat,
          contentPreview: (extractedText || manualText || description).slice(0, 1400),
          description,
        };

        const createdDocument = db.createDocumentWithChunks({
          professorId: profId,
          input: docInput,
          fullText,
          chunks,
          embeddings: embedResult.embeddings,
          embedProvider: embedResult.provider,
        });

        const updatedProfessor = db.getProfessorProfile(profId);
        res.status(201).json({
          document: createdDocument,
          chunksIndexed: chunks.length,
          embedProvider: embedResult.provider,
          professor: updatedProfessor,
        });
      } catch (err) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Document upload and indexing failed',
        });
      }
    }
  );

  app.put('/api/documents/:id', requireRole('documents'), async (req: AuthedRequest, res) => {
    try {
      const profId = req.auth!.accountId;
      const updates = req.body as Partial<DocumentInput>;

      let reindexedChunks: string[] | undefined;
      let reindexedEmbeddings: number[][] | null | undefined;
      let embedProvider: 'ollama' | 'lexical-fallback' | undefined;

      if (updates.contentPreview !== undefined || updates.description !== undefined) {
        const textToIndex = [
          updates.contentPreview || '',
          typeof updates.description === 'string' ? updates.description : '',
        ]
          .filter(Boolean)
          .join('\n\n');
        if (textToIndex) {
          reindexedChunks = chunkText(textToIndex);
          const emb = await embedTextsWithOllama(
            reindexedChunks,
            OLLAMA_BASE_URL,
            OLLAMA_EMBED_MODEL
          );
          reindexedEmbeddings = emb.embeddings;
          embedProvider = emb.provider;
        }
      }

      const updated = db.updateDocumentWithChunks({
        professorId: profId,
        documentId: req.params.id,
        updates,
        reindexedChunks,
        reindexedEmbeddings,
        embedProvider,
      });

      if (!updated) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      const professor = db.getProfessorProfile(profId);
      res.json({ document: updated, professor });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update document' });
    }
  });

  app.delete('/api/documents/:id', requireRole('documents'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const ok = db.deleteDocument(profId, req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    const professor = db.getProfessorProfile(profId);
    res.json({ ok: true, professor });
  });

  app.get('/api/documents/:id/content', requireRole('documents'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const doc = db.getDocumentContent(profId, req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    res.json({ document: doc });
  });

  // =========================================================================
  // 5. LOCAL RAG + OLLAMA TASK GENERATION & HISTORY
  // =========================================================================
  app.post('/api/tasks/generate', requireRole('tasks'), async (req: AuthedRequest, res) => {
    try {
      const profId = req.auth!.accountId;
      const body = (req.body || {}) as {
        courseId?: string;
        documentIds?: string[];
        subject?: string;
        poiName?: string;
        teacherNote?: string;
        wikidata?: WikidataInfo;
        lang?: SupportedLanguage;
        useRepo?: boolean;
        educationLevel?: string;
        academicGroup?: string;
        taskType?: string;
        difficultyLevel?: string;
        duration?: string;
        learningObjectives?: string;
        geoCoordinates?: string;
        geoRadius?: string;
      };

      const lang: SupportedLanguage =
        body.lang === 'en' || body.lang === 'es' ? body.lang : 'uk';
      const subject = (body.subject || '').trim() || 'History of Architecture';
      const poiName = (body.poiName || '').trim() || 'Universidad de Valladolid';
      const teacherNote = (body.teacherNote || '').trim();
      const courseId = (body.courseId || '').trim();
      const useRepo = body.useRepo !== false;

      const pedagogical: PedagogicalParams = {
        educationLevel: (body.educationLevel || '').trim() || undefined,
        academicGroup: (body.academicGroup || '').trim() || undefined,
        taskType: (body.taskType || '').trim() || undefined,
        difficultyLevel: (body.difficultyLevel || '').trim() || undefined,
        duration: (body.duration || '').trim() || undefined,
        learningObjectives: (body.learningObjectives || '').trim() || undefined,
        geoCoordinates: (body.geoCoordinates || '').trim() || undefined,
        geoRadius: (body.geoRadius || '').trim() || undefined,
      };

      const selectedDocIds = Array.isArray(body.documentIds) ? body.documentIds : [];
      const chunks = useRepo ? db.getRagChunksForCourse(profId, courseId, lang) : [];
      const scopedDebugChunks = (
        selectedDocIds.length > 0 ? chunks.filter((c) => selectedDocIds.includes(c.documentId)) : chunks
      ).map((c) => ({
        id: c.id,
        documentId: c.documentId,
        documentTitle: c.documentTitle,
        chunkIndex: c.chunkIndex,
        content: c.content,
      }));

      const generation = await generateTasksWithOllamaOrFallback({
        lang,
        subject,
        poiName,
        teacherNote,
        wikidata: body.wikidata,
        pedagogical,
        chunks,
        selectedDocumentIds: selectedDocIds,
        useRepo,
        ollamaBaseUrl: OLLAMA_BASE_URL,
        chatModel: OLLAMA_CHAT_MODEL,
        embedModel: OLLAMA_EMBED_MODEL,
      });

      const historyRecord = db.saveHistory({
        professorId: profId,
        courseId,
        subject,
        poiName,
        teacherNote,
        wikidata: body.wikidata || {
          buildYear: '',
          style: '',
          events: [],
        },
        tasks: generation.tasks,
        sources: generation.retrievedChunks,
        engineUsed: generation.engine,
      });

      const draftActivities = db.createActivities([
        {
          professorId: profId,
          courseId,
          documentIds: selectedDocIds,
          subject,
          poiName,
          teacherNote,
          title: generation.tasks.variant1.title,
          body: generation.tasks.variant1.body,
          variantType: 'fieldwork',
          variantIndex: 1,
          status: 'draft',
          metadata: { ...pedagogical, source: generation.tasks.variant1.source },
          sourceChunks: generation.retrievedChunks,
          engineUsed: generation.engine,
        },
        {
          professorId: profId,
          courseId,
          documentIds: selectedDocIds,
          subject,
          poiName,
          teacherNote,
          title: generation.tasks.variant2.title,
          body: generation.tasks.variant2.body,
          variantType: 'analytical',
          variantIndex: 2,
          status: 'draft',
          metadata: { ...pedagogical, source: generation.tasks.variant2.source },
          sourceChunks: generation.retrievedChunks,
          engineUsed: generation.engine,
        },
        {
          professorId: profId,
          courseId,
          documentIds: selectedDocIds,
          subject,
          poiName,
          teacherNote,
          title: generation.tasks.variant3.title,
          body: generation.tasks.variant3.body,
          variantType: 'quiz',
          variantIndex: 3,
          status: 'draft',
          metadata: { ...pedagogical, source: generation.tasks.variant3.source },
          sourceChunks: generation.retrievedChunks,
          engineUsed: generation.engine,
        },
      ]);

      res.json({
        tasks: generation.tasks,
        draftActivities,
        activities: db.listActivities(profId),
        retrievedChunks: generation.retrievedChunks,
        engine: generation.engine,
        model: generation.model,
        historyRecord,
        history: db.listHistory(profId),
        debug: {
          useRepo,
          engine: generation.engine,
          model: generation.model,
          documentChunks: scopedDebugChunks,
          retrievedChunks: generation.retrievedChunks,
          finalPrompt: generation.promptUsed,
          rawLlmResponse: generation.rawLlmResponse,
        },
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Task generation failed',
      });
    }
  });

  // =========================================================================
  // 5b. ACTIVITIES LIFECYCLE CRUD (draft -> approved / rejected -> DB)
  // =========================================================================
  app.get('/api/activities', requireRole('activities'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId.trim() : undefined;
    const rawStatus = typeof req.query.status === 'string' ? req.query.status.trim() : undefined;
    const status: ActivityStatus | undefined =
      rawStatus === 'draft' || rawStatus === 'approved' || rawStatus === 'rejected' ? rawStatus : undefined;
    res.json({ activities: db.listActivities(profId, { courseId, status }) });
  });

  app.post('/api/activities', requireRole('activities'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const body = (req.body || {}) as {
      courseId?: string;
      documentIds?: string[];
      subject?: string;
      poiName?: string;
      teacherNote?: string;
      title?: string;
      body?: string;
      variantType?: string;
      variantIndex?: number;
      status?: ActivityStatus;
      metadata?: PedagogicalParams & { source?: string };
      sourceChunks?: RankedRagChunk[];
      engineUsed?: string;
    };
    const title = (body.title || '').trim();
    const taskBody = (body.body || '').trim();
    if (!title || !taskBody) {
      res.status(400).json({ error: 'title and body are required' });
      return;
    }
    const status: ActivityStatus =
      body.status === 'approved' || body.status === 'rejected' ? body.status : 'approved';
    const created = db.createActivities([
      {
        professorId: profId,
        courseId: (body.courseId || '').trim(),
        documentIds: Array.isArray(body.documentIds) ? body.documentIds : [],
        subject: (body.subject || '').trim() || 'Academic Activity',
        poiName: (body.poiName || '').trim() || 'Universidad de Valladolid',
        teacherNote: (body.teacherNote || '').trim(),
        title,
        body: taskBody,
        variantType: body.variantType || 'fieldwork',
        variantIndex: Number(body.variantIndex) || 1,
        status,
        metadata: body.metadata || {},
        sourceChunks: Array.isArray(body.sourceChunks) ? body.sourceChunks : [],
        engineUsed: body.engineUsed || 'local-rag-fallback',
      },
    ]);
    res.status(201).json({ activity: created[0], activities: db.listActivities(profId) });
  });

  app.put('/api/activities/:id', requireRole('activities'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const body = (req.body || {}) as {
      title?: string;
      body?: string;
      status?: ActivityStatus;
      courseId?: string;
      metadata?: PedagogicalParams & { source?: string };
    };
    if (
      body.status !== undefined &&
      body.status !== 'draft' &&
      body.status !== 'approved' &&
      body.status !== 'rejected'
    ) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    const updated = db.updateActivity(profId, req.params.id, {
      title: body.title,
      body: body.body,
      status: body.status,
      courseId: body.courseId,
      metadata: body.metadata,
    });
    if (!updated) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.json({ activity: updated, activities: db.listActivities(profId) });
  });

  app.delete('/api/activities/:id', requireRole('activities'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const ok = db.deleteActivity(profId, req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.json({ ok: true, activities: db.listActivities(profId) });
  });

  app.post('/api/history', requireRole('history'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    const body = (req.body || {}) as {
      courseId?: string;
      subject?: string;
      poiName?: string;
      teacherNote?: string;
      wikidata?: WikidataInfo;
      tasks?: import('./src/utils/taskGenerator.ts').TaskVariants;
      sources?: RankedRagChunk[];
      engineUsed?: string;
    };
    const subject = (body.subject || '').trim() || 'Academic Query';
    const poiName = (body.poiName || '').trim() || subject;
    if (!body.tasks) {
      res.status(400).json({ error: 'tasks payload is required' });
      return;
    }

    const historyRecord = db.saveHistory({
      professorId: profId,
      courseId: (body.courseId || '').trim(),
      subject,
      poiName,
      teacherNote: (body.teacherNote || '').trim(),
      wikidata: body.wikidata || { buildYear: '', style: '', events: [] },
      tasks: body.tasks,
      sources: Array.isArray(body.sources) ? body.sources : [],
      engineUsed: body.engineUsed || 'local-chat',
    });

    res.status(201).json({
      historyRecord,
      history: db.listHistory(profId),
    });
  });

  app.delete('/api/history/:id', requireRole('history'), (req: AuthedRequest, res) => {
    const profId = req.auth!.accountId;
    db.deleteHistory(profId, req.params.id);
    res.json({ ok: true, history: db.listHistory(profId) });
  });

  app.post('/api/chat', requireRole('tasks'), async (req: AuthedRequest, res) => {
    try {
      const profId = req.auth!.accountId;
      const body = (req.body || {}) as {
        question?: string;
        history?: Array<{ role: 'user' | 'assistant'; content: string }>;
        lang?: SupportedLanguage;
        courseId?: string;
        course_id?: string;
        useRepo?: boolean;
        use_repo?: boolean;
        subject?: string;
        poiName?: string;
        poi_name?: string;
        teacherNote?: string;
        educationLevel?: string;
        education_level?: string;
        academicGroup?: string;
        academic_group?: string;
        taskType?: string;
        task_type?: string;
        difficultyLevel?: string;
        difficulty_level?: string;
        duration?: string;
        learningObjectives?: string;
        learning_objectives?: string;
        geoCoordinates?: string;
        geo_coordinates?: string;
        geoRadius?: string;
        geo_radius?: string;
      };
      const question = (body.question || '').trim();
      if (!question) {
        res.status(400).json({ error: 'question is required' });
        return;
      }
      const lang: SupportedLanguage =
        body.lang === 'en' || body.lang === 'es' ? body.lang : 'uk';
      const courseId = (body.courseId || body.course_id || '').trim();
      const useRepo = body.useRepo !== undefined ? body.useRepo !== false : body.use_repo !== false;
      const pedagogical: PedagogicalParams = {
        educationLevel: (body.educationLevel || body.education_level || '').trim() || undefined,
        academicGroup: (body.academicGroup || body.academic_group || '').trim() || undefined,
        taskType: (body.taskType || body.task_type || '').trim() || undefined,
        difficultyLevel: (body.difficultyLevel || body.difficulty_level || '').trim() || undefined,
        duration: (body.duration || '').trim() || undefined,
        learningObjectives: (body.learningObjectives || body.learning_objectives || '').trim() || undefined,
        geoCoordinates: (body.geoCoordinates || body.geo_coordinates || '').trim() || undefined,
        geoRadius: (body.geoRadius || body.geo_radius || '').trim() || undefined,
      };
      const historyNote = Array.isArray(body.history) && body.history.length > 0
        ? body.history.slice(-4).map((m) => `${m.role}: ${m.content}`).join(' | ')
        : '';
      const chunks = useRepo ? db.getRagChunksForCourse(profId, courseId, lang) : [];
      const generation = await generateTasksWithOllamaOrFallback({
        lang,
        subject: (body.subject || '').trim() || 'History of Architecture',
        poiName: (body.poiName || body.poi_name || '').trim() || question.slice(0, 60),
        teacherNote: [body.teacherNote || question, historyNote].filter(Boolean).join('\n'),
        pedagogical,
        chunks,
        useRepo,
        ollamaBaseUrl: OLLAMA_BASE_URL,
        chatModel: OLLAMA_CHAT_MODEL,
        embedModel: OLLAMA_EMBED_MODEL,
      });

      res.json({
        answer: `${generation.tasks.variant1.title}\n${generation.tasks.variant1.body}`,
        tasks: generation.tasks,
        sources: generation.retrievedChunks,
        engine: generation.engine,
        model: generation.model,
        debug: {
          use_repo: useRepo,
          engine: generation.engine,
          model: generation.model,
          document_chunks: chunks.map((c) => ({
            id: c.id,
            source: c.documentTitle,
            chunk_index: c.chunkIndex,
            text: c.content,
          })),
          retrieved_chunks: generation.retrievedChunks.map((c) => ({
            id: c.id,
            source: c.documentTitle,
            chunk_index: c.chunkIndex,
            text: c.content,
            rerank_score: c.score,
          })),
          final_prompt: generation.promptUsed,
          raw_llm_response: generation.rawLlmResponse,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Chat error' });
    }
  });

  // =========================================================================
  // 6. FRONTEND SERVING (Vite middlewares in dev, static dist/ in prod)
  // =========================================================================
  const distDir = path.resolve(process.cwd(), 'dist');
  const isDevLifecycle =
    process.env.npm_lifecycle_event === 'dev' || process.env.NODE_ENV === 'development';
  if (!isDevLifecycle && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UVa Full-Stack Server listening on http://0.0.0.0:${PORT}`);
    console.log(`SQLite DB: ${path.resolve(process.cwd(), SQLITE_DB_PATH)}`);
    console.log(`Ollama Endpoint: ${OLLAMA_BASE_URL} (Chat: ${OLLAMA_CHAT_MODEL}, Embed: ${OLLAMA_EMBED_MODEL})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

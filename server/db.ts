import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import {
  INITIAL_PROFESSORS_DB,
  makeLocStr,
  type AdminProfile,
  type CourseInput,
  type DocumentInput,
  type LocalizedString,
  type ProfessorCourse,
  type ProfessorDatabaseRecord,
  type ProfessorDriveItem,
  type ProfessorProfile,
  type TeacherInput,
} from '../src/utils/professorsDb.ts';
import type {
  ActivityRecord,
  ActivityStatus,
  PedagogicalParams,
  SupportedLanguage,
  TaskVariants,
  WikidataInfo,
} from '../src/utils/taskGenerator.ts';
import { chunkText, type AccountRole, type RagChunkRecord, type RankedRagChunk } from './rag.ts';

export interface StoredHistoryRecord {
  id: string;
  professorId: string;
  courseId: string;
  subject: string;
  poiName: string;
  teacherNote: string;
  wikidata: WikidataInfo;
  tasks: TaskVariants;
  sources: RankedRagChunk[];
  engineUsed: string;
  createdAt: string;
}

export interface AuthResult {
  role: AccountRole;
  accountId: string;
  login: string;
  managerProfile?: AdminProfile;
  professorProfile?: ProfessorProfile;
}

export class UvaSqliteDb {
  private sql: SqlJsStatic;
  private db: Database;
  private dbPath: string;

  private constructor(sql: SqlJsStatic, db: Database, dbPath: string) {
    this.sql = sql;
    this.db = db;
    this.dbPath = dbPath;
  }

  static async create(dbPath: string): Promise<UvaSqliteDb> {
    const wasmDir = path.resolve(process.cwd(), 'node_modules/sql.js/dist');
    const sql = await initSqlJs({
      locateFile: (file: string) => path.join(wasmDir, file),
      useOldExtensionFunctions: false,
    });

    const absPath = path.resolve(process.cwd(), dbPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });

    let db: Database;
    if (fs.existsSync(absPath)) {
      const fileBuffer = fs.readFileSync(absPath);
      db = new sql.Database(fileBuffer);
    } else {
      db = new sql.Database();
    }

    const instance = new UvaSqliteDb(sql, db, absPath);
    instance.initSchema();
    instance.seedIfEmpty();
    return instance;
  }

  private persist(): void {
    const binary = this.db.export();
    fs.writeFileSync(this.dbPath, globalThis.Buffer.from(binary));
  }

  private initSchema(): void {
    this.db.run(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        login TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('manager', 'professor')),
        name_json TEXT NOT NULL,
        title_json TEXT NOT NULL,
        faculty_json TEXT NOT NULL,
        department_json TEXT NOT NULL,
        specialty_json TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        avatar_bg TEXT NOT NULL DEFAULT 'bg-[#7A1C30]',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        professor_id TEXT NOT NULL,
        code TEXT NOT NULL,
        title_json TEXT NOT NULL,
        semester_json TEXT NOT NULL,
        credits INTEGER NOT NULL DEFAULT 6,
        groups_json TEXT NOT NULL,
        enrolled_students INTEGER NOT NULL DEFAULT 25,
        academic_year TEXT NOT NULL DEFAULT '2026/2027',
        is_current_year INTEGER NOT NULL DEFAULT 1,
        syllabus_topic_json TEXT,
        passed_students INTEGER,
        FOREIGN KEY (professor_id) REFERENCES accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        professor_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        name_json TEXT NOT NULL,
        type TEXT NOT NULL,
        folder_category TEXT NOT NULL,
        group_name TEXT NOT NULL DEFAULT '',
        academic_year TEXT NOT NULL DEFAULT '2026/2027',
        updated_at_json TEXT NOT NULL,
        size TEXT NOT NULL DEFAULT '1.0 MB',
        file_name TEXT NOT NULL DEFAULT 'document.pdf',
        file_format TEXT NOT NULL DEFAULT 'PDF',
        content_preview TEXT,
        full_text TEXT,
        description_json TEXT NOT NULL,
        generated_tasks_count INTEGER DEFAULT 0,
        embed_provider TEXT NOT NULL DEFAULT 'lexical-fallback',
        FOREIGN KEY (professor_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        professor_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding_json TEXT,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (professor_id) REFERENCES accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS generated_history (
        id TEXT PRIMARY KEY,
        professor_id TEXT NOT NULL,
        course_id TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL,
        poi_name TEXT NOT NULL,
        teacher_note TEXT NOT NULL DEFAULT '',
        wikidata_json TEXT NOT NULL,
        tasks_json TEXT NOT NULL,
        sources_json TEXT NOT NULL,
        engine_used TEXT NOT NULL DEFAULT 'local-rag-fallback',
        created_at TEXT NOT NULL,
        FOREIGN KEY (professor_id) REFERENCES accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        professor_id TEXT NOT NULL,
        course_id TEXT NOT NULL DEFAULT '',
        document_ids_json TEXT NOT NULL DEFAULT '[]',
        subject TEXT NOT NULL,
        poi_name TEXT NOT NULL,
        teacher_note TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        variant_type TEXT NOT NULL DEFAULT 'fieldwork',
        variant_index INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL CHECK(status IN ('draft', 'approved', 'rejected')) DEFAULT 'draft',
        metadata_json TEXT NOT NULL DEFAULT '{}',
        source_chunks_json TEXT NOT NULL DEFAULT '[]',
        engine_used TEXT NOT NULL DEFAULT 'local-rag-fallback',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (professor_id) REFERENCES accounts(id) ON DELETE CASCADE
      );
    `);
  }

  private queryAll<T extends Record<string, unknown>>(sqlStr: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sqlStr);
    stmt.bind(params as (string | number | Uint8Array | null)[]);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return rows;
  }

  private queryOne<T extends Record<string, unknown>>(sqlStr: string, params: unknown[] = []): T | null {
    const rows = this.queryAll<T>(sqlStr, params);
    return rows[0] || null;
  }

  private exec(sqlStr: string, params: unknown[] = []): void {
    const stmt = this.db.prepare(sqlStr);
    stmt.bind(params as (string | number | Uint8Array | null)[]);
    stmt.step();
    stmt.free();
  }

  private seedIfEmpty(): void {
    const existing = this.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM accounts');
    if (existing && Number(existing.cnt) > 0) {
      return;
    }

    const nowIso = new Date().toISOString();

    // 1. Seed Dedicated Account Manager accounts (ONLY manage accounts, nothing else)
    const managerName: LocalizedString = {
      uk: 'Менеджер акаунтів UVa',
      en: 'UVa Account Manager',
      es: 'Gestor de Cuentas UVa',
    };
    const managerRoleTitle: LocalizedString = {
      uk: 'Керування лише обліковими записами викладачів та доступом',
      en: 'Dedicated Teacher & Faculty Account Management Only',
      es: 'Gestión exclusiva de cuentas de profesores',
    };

    const insertAccount = `
      INSERT INTO accounts (
        id, login, password_hash, role, name_json, title_json,
        faculty_json, department_json, specialty_json, email, avatar_bg, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.exec(insertAccount, [
      'mgr-1',
      'manager',
      'manager',
      'manager',
      JSON.stringify(managerName),
      JSON.stringify(managerRoleTitle),
      JSON.stringify(makeLocStr('Rectorado UVa')),
      JSON.stringify(makeLocStr('Identity & Account Registry')),
      JSON.stringify(makeLocStr('Account Provisioning')),
      'accounts.manager@uva.es',
      'bg-[#581221]',
      nowIso,
    ]);

    this.exec(insertAccount, [
      'mgr-admin',
      'admin',
      'admin',
      'manager',
      JSON.stringify(managerName),
      JSON.stringify(managerRoleTitle),
      JSON.stringify(makeLocStr('Rectorado UVa')),
      JSON.stringify(makeLocStr('Identity & Account Registry')),
      JSON.stringify(makeLocStr('Account Provisioning')),
      'admin.accounts@uva.es',
      'bg-[#581221]',
      nowIso,
    ]);

    // 2. Seed initial Professors, Courses, Documents & initial searchable RAG chunks
    for (const rec of INITIAL_PROFESSORS_DB) {
      const p = rec.profile;
      this.exec(insertAccount, [
        rec.id,
        rec.login,
        rec.passwordHash,
        'professor',
        JSON.stringify(p.name),
        JSON.stringify(p.title),
        JSON.stringify(p.faculty),
        JSON.stringify(p.department),
        JSON.stringify(p.specialty),
        `${rec.login}@docencia.uva.es`,
        p.avatarBg,
        nowIso,
      ]);

      for (const crs of p.courses) {
        this.exec(
          `INSERT INTO courses (
            id, professor_id, code, title_json, semester_json, credits,
            groups_json, enrolled_students, academic_year, is_current_year,
            syllabus_topic_json, passed_students
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crs.id,
            rec.id,
            crs.code,
            JSON.stringify(crs.title),
            JSON.stringify(crs.semester),
            crs.credits,
            JSON.stringify(crs.groups),
            crs.enrolledStudents,
            crs.academicYear,
            crs.isCurrentYear ? 1 : 0,
            crs.syllabusTopic ? JSON.stringify(crs.syllabusTopic) : null,
            crs.passedStudents ?? null,
          ]
        );
      }

      for (const doc of p.driveItems) {
        const seedText =
          doc.contentPreview ||
          `${doc.name.uk} | ${doc.name.en} | ${doc.name.es}\n${doc.description.uk}\n${doc.description.en}`;

        this.exec(
          `INSERT INTO documents (
            id, professor_id, course_id, name_json, type, folder_category,
            group_name, academic_year, updated_at_json, size, file_name,
            file_format, content_preview, full_text, description_json,
            generated_tasks_count, embed_provider
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            doc.id,
            rec.id,
            doc.courseId,
            JSON.stringify(doc.name),
            doc.type,
            doc.folderCategory,
            doc.group || '',
            doc.academicYear,
            JSON.stringify(doc.updatedAt),
            doc.size || '1.0 MB',
            doc.fileName || `${doc.id}.pdf`,
            doc.fileFormat || 'PDF',
            seedText.slice(0, 1200),
            seedText,
            JSON.stringify(doc.description),
            doc.generatedTasksCount || 0,
            'lexical-fallback',
          ]
        );

        const chunks = chunkText(seedText);
        chunks.forEach((chunkContent, idx) => {
          this.exec(
            `INSERT INTO document_chunks (
              id, document_id, course_id, professor_id, chunk_index, content, embedding_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [`${doc.id}-chk-${idx}`, doc.id, doc.courseId, rec.id, idx, chunkContent, null]
          );
        });
      }
    }

    this.persist();
  }

  authenticate(login: string, password: string): AuthResult | null {
    const cleanLogin = login.trim();
    const cleanPass = password.trim();
    if (!cleanLogin || !cleanPass) return null;

    const row = this.queryOne<Record<string, unknown>>(
      'SELECT * FROM accounts WHERE LOWER(login) = LOWER(?)',
      [cleanLogin]
    );
    if (!row || String(row.password_hash) !== cleanPass) {
      return null;
    }

    const role = String(row.role) as AccountRole;
    const id = String(row.id);

    if (role === 'manager') {
      const managerProfile: AdminProfile = {
        id,
        login: String(row.login),
        role: 'manager',
        name: JSON.parse(String(row.name_json)) as LocalizedString,
        roleTitle: JSON.parse(String(row.title_json)) as LocalizedString,
        email: String(row.email || 'accounts.manager@uva.es'),
      };
      return { role: 'manager', accountId: id, login: managerProfile.login, managerProfile };
    }

    const prof = this.getProfessorProfile(id);
    if (!prof) return null;
    return { role: 'professor', accountId: id, login: prof.login, professorProfile: prof };
  }

  getManagerProfile(accountId: string): AdminProfile | null {
    const row = this.queryOne<Record<string, unknown>>(
      `SELECT * FROM accounts WHERE id = ? AND role = 'manager'`,
      [accountId]
    );
    if (!row) return null;
    return {
      id: String(row.id),
      login: String(row.login),
      role: 'manager',
      name: JSON.parse(String(row.name_json)) as LocalizedString,
      roleTitle: JSON.parse(String(row.title_json)) as LocalizedString,
      email: String(row.email || 'accounts.manager@uva.es'),
    };
  }

  listTeachers(): ProfessorDatabaseRecord[] {
    const accountRows = this.queryAll<Record<string, unknown>>(
      `SELECT * FROM accounts WHERE role = 'professor' ORDER BY created_at ASC, id ASC`
    );
    return accountRows.map((row) => {
      const id = String(row.id);
      const profile = this.buildProfessorProfile(row);
      return {
        id,
        login: String(row.login),
        passwordHash: String(row.password_hash),
        profile,
      };
    });
  }

  getProfessorProfile(professorId: string): ProfessorProfile | null {
    const row = this.queryOne<Record<string, unknown>>(
      `SELECT * FROM accounts WHERE id = ? AND role = 'professor'`,
      [professorId]
    );
    if (!row) return null;
    return this.buildProfessorProfile(row);
  }

  private buildProfessorProfile(accountRow: Record<string, unknown>): ProfessorProfile {
    const profId = String(accountRow.id);

    const courseRows = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM courses WHERE professor_id = ? ORDER BY is_current_year DESC, academic_year DESC, code ASC',
      [profId]
    );
    const courses: ProfessorCourse[] = courseRows.map((c) => ({
      id: String(c.id),
      code: String(c.code),
      title: JSON.parse(String(c.title_json)) as LocalizedString,
      semester: JSON.parse(String(c.semester_json)) as LocalizedString,
      credits: Number(c.credits),
      groups: JSON.parse(String(c.groups_json)) as string[],
      enrolledStudents: Number(c.enrolled_students),
      academicYear: String(c.academic_year),
      isCurrentYear: Number(c.is_current_year) === 1,
      syllabusTopic: c.syllabus_topic_json
        ? (JSON.parse(String(c.syllabus_topic_json)) as LocalizedString)
        : undefined,
      passedStudents: c.passed_students != null ? Number(c.passed_students) : undefined,
    }));

    const chunkCounts = new Map<string, number>();
    const countRows = this.queryAll<{ document_id: string; cnt: number }>(
      'SELECT document_id, COUNT(*) as cnt FROM document_chunks WHERE professor_id = ? GROUP BY document_id',
      [profId]
    );
    for (const cr of countRows) {
      chunkCounts.set(String(cr.document_id), Number(cr.cnt));
    }

    const docRows = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM documents WHERE professor_id = ? ORDER BY rowid DESC',
      [profId]
    );
    const driveItems: ProfessorDriveItem[] = docRows.map((d) => ({
      id: String(d.id),
      name: JSON.parse(String(d.name_json)) as LocalizedString,
      type: String(d.type) as ProfessorDriveItem['type'],
      folderCategory: String(d.folder_category) as ProfessorDriveItem['folderCategory'],
      courseId: String(d.course_id),
      group: d.group_name ? String(d.group_name) : '',
      academicYear: String(d.academic_year),
      updatedAt: JSON.parse(String(d.updated_at_json)) as LocalizedString,
      size: String(d.size),
      fileName: String(d.file_name),
      fileFormat: String(d.file_format),
      contentPreview: d.content_preview ? String(d.content_preview) : undefined,
      description: JSON.parse(String(d.description_json)) as LocalizedString,
      generatedTasksCount: d.generated_tasks_count ? Number(d.generated_tasks_count) : undefined,
      chunksCount: chunkCounts.get(String(d.id)) || 0,
      embedProvider: d.embed_provider ? String(d.embed_provider) : 'lexical-fallback',
    }));

    const historyRows = this.queryAll<{ id: string }>(
      'SELECT id FROM generated_history WHERE professor_id = ? ORDER BY rowid DESC',
      [profId]
    );

    return {
      id: profId,
      login: String(accountRow.login),
      name: JSON.parse(String(accountRow.name_json)) as LocalizedString,
      title: JSON.parse(String(accountRow.title_json)) as LocalizedString,
      faculty: JSON.parse(String(accountRow.faculty_json)) as LocalizedString,
      department: JSON.parse(String(accountRow.department_json)) as LocalizedString,
      specialty: JSON.parse(String(accountRow.specialty_json)) as LocalizedString,
      avatarBg: String(accountRow.avatar_bg || 'bg-[#7A1C30]'),
      courses,
      driveItems,
      historyIds: historyRows.map((h) => String(h.id)),
    };
  }

  // =========================================================================
  // ACCOUNT MANAGER CRUD (Strictly teachers only)
  // =========================================================================
  createTeacher(input: TeacherInput): ProfessorDatabaseRecord {
    const cleanLogin = input.login.trim();
    if (!cleanLogin) throw new Error('Login is required');

    const conflict = this.queryOne<{ id: string }>(
      'SELECT id FROM accounts WHERE LOWER(login) = LOWER(?)',
      [cleanLogin]
    );
    if (conflict) {
      throw new Error(`Login "${cleanLogin}" is already in use`);
    }

    const id = `prof-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pass = input.password.trim() || cleanLogin;
    const nowIso = new Date().toISOString();

    this.exec(
      `INSERT INTO accounts (
        id, login, password_hash, role, name_json, title_json,
        faculty_json, department_json, specialty_json, email, avatar_bg, created_at
      ) VALUES (?, ?, ?, 'professor', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cleanLogin,
        pass,
        JSON.stringify(makeLocStr(input.name)),
        JSON.stringify(makeLocStr(input.title)),
        JSON.stringify(makeLocStr(input.faculty)),
        JSON.stringify(makeLocStr(input.department)),
        JSON.stringify(makeLocStr(input.specialty)),
        `${cleanLogin}@docencia.uva.es`,
        input.avatarBg || 'bg-[#7A1C30]',
        nowIso,
      ]
    );
    this.persist();

    const profile = this.getProfessorProfile(id)!;
    return { id, login: cleanLogin, passwordHash: pass, profile };
  }

  updateTeacher(teacherId: string, updates: Partial<TeacherInput>): ProfessorDatabaseRecord | null {
    const existing = this.queryOne<Record<string, unknown>>(
      `SELECT * FROM accounts WHERE id = ? AND role = 'professor'`,
      [teacherId]
    );
    if (!existing) return null;

    const nextLogin = updates.login !== undefined ? updates.login.trim() : String(existing.login);
    if (nextLogin.toLowerCase() !== String(existing.login).toLowerCase()) {
      const conflict = this.queryOne<{ id: string }>(
        'SELECT id FROM accounts WHERE LOWER(login) = LOWER(?) AND id != ?',
        [nextLogin, teacherId]
      );
      if (conflict) {
        throw new Error(`Login "${nextLogin}" is already in use`);
      }
    }

    const nextPass =
      updates.password !== undefined && updates.password.trim() !== ''
        ? updates.password.trim()
        : String(existing.password_hash);

    const nextName =
      updates.name !== undefined ? JSON.stringify(makeLocStr(updates.name)) : String(existing.name_json);
    const nextTitle =
      updates.title !== undefined ? JSON.stringify(makeLocStr(updates.title)) : String(existing.title_json);
    const nextFaculty =
      updates.faculty !== undefined ? JSON.stringify(makeLocStr(updates.faculty)) : String(existing.faculty_json);
    const nextDept =
      updates.department !== undefined ? JSON.stringify(makeLocStr(updates.department)) : String(existing.department_json);
    const nextSpec =
      updates.specialty !== undefined ? JSON.stringify(makeLocStr(updates.specialty)) : String(existing.specialty_json);
    const nextBg = updates.avatarBg || String(existing.avatar_bg);

    this.exec(
      `UPDATE accounts SET
        login = ?, password_hash = ?, name_json = ?, title_json = ?,
        faculty_json = ?, department_json = ?, specialty_json = ?, avatar_bg = ?
      WHERE id = ? AND role = 'professor'`,
      [nextLogin, nextPass, nextName, nextTitle, nextFaculty, nextDept, nextSpec, nextBg, teacherId]
    );
    this.persist();

    const profile = this.getProfessorProfile(teacherId)!;
    return { id: teacherId, login: nextLogin, passwordHash: nextPass, profile };
  }

  deleteTeacher(teacherId: string): boolean {
    const existing = this.queryOne<{ id: string }>(
      `SELECT id FROM accounts WHERE id = ? AND role = 'professor'`,
      [teacherId]
    );
    if (!existing) return false;
    this.exec(`DELETE FROM document_chunks WHERE professor_id = ?`, [teacherId]);
    this.exec(`DELETE FROM documents WHERE professor_id = ?`, [teacherId]);
    this.exec(`DELETE FROM courses WHERE professor_id = ?`, [teacherId]);
    this.exec(`DELETE FROM activities WHERE professor_id = ?`, [teacherId]);
    this.exec(`DELETE FROM generated_history WHERE professor_id = ?`, [teacherId]);
    this.exec(`DELETE FROM accounts WHERE id = ? AND role = 'professor'`, [teacherId]);
    this.persist();
    return true;
  }

  // =========================================================================
  // PROFESSOR COURSES CRUD
  // =========================================================================
  createCourse(professorId: string, input: CourseInput): ProfessorCourse {
    const id = `crs-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const code = input.code.trim().toUpperCase();
    const groups = input.groups.length > 0 ? input.groups : ['GRP-01'];

    this.exec(
      `INSERT INTO courses (
        id, professor_id, code, title_json, semester_json, credits,
        groups_json, enrolled_students, academic_year, is_current_year, syllabus_topic_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        professorId,
        code,
        JSON.stringify(makeLocStr(input.title)),
        JSON.stringify(makeLocStr(input.semester)),
        Number(input.credits) || 6,
        JSON.stringify(groups),
        Number(input.enrolledStudents) || 25,
        input.academicYear || '2026/2027',
        input.isCurrentYear ? 1 : 0,
        input.syllabusTopic ? JSON.stringify(makeLocStr(input.syllabusTopic)) : null,
      ]
    );
    this.persist();

    return {
      id,
      code,
      title: makeLocStr(input.title),
      semester: makeLocStr(input.semester),
      credits: Number(input.credits) || 6,
      groups,
      enrolledStudents: Number(input.enrolledStudents) || 25,
      academicYear: input.academicYear || '2026/2027',
      isCurrentYear: input.isCurrentYear,
      syllabusTopic: input.syllabusTopic ? makeLocStr(input.syllabusTopic) : undefined,
    };
  }

  updateCourse(professorId: string, courseId: string, updates: Partial<CourseInput>): ProfessorCourse | null {
    const existing = this.queryOne<Record<string, unknown>>(
      'SELECT * FROM courses WHERE id = ? AND professor_id = ?',
      [courseId, professorId]
    );
    if (!existing) return null;

    const code = updates.code !== undefined ? updates.code.trim().toUpperCase() : String(existing.code);
    const titleJson = updates.title !== undefined ? JSON.stringify(makeLocStr(updates.title)) : String(existing.title_json);
    const semJson = updates.semester !== undefined ? JSON.stringify(makeLocStr(updates.semester)) : String(existing.semester_json);
    const credits = updates.credits !== undefined ? Number(updates.credits) : Number(existing.credits);
    const groupsJson = updates.groups !== undefined ? JSON.stringify(updates.groups) : String(existing.groups_json);
    const enrolled = updates.enrolledStudents !== undefined ? Number(updates.enrolledStudents) : Number(existing.enrolled_students);
    const year = updates.academicYear !== undefined ? updates.academicYear : String(existing.academic_year);
    const isCur = updates.isCurrentYear !== undefined ? (updates.isCurrentYear ? 1 : 0) : Number(existing.is_current_year);
    const topicJson =
      updates.syllabusTopic !== undefined
        ? JSON.stringify(makeLocStr(updates.syllabusTopic))
        : (existing.syllabus_topic_json as string | null);

    this.exec(
      `UPDATE courses SET
        code = ?, title_json = ?, semester_json = ?, credits = ?,
        groups_json = ?, enrolled_students = ?, academic_year = ?,
        is_current_year = ?, syllabus_topic_json = ?
      WHERE id = ? AND professor_id = ?`,
      [code, titleJson, semJson, credits, groupsJson, enrolled, year, isCur, topicJson, courseId, professorId]
    );
    this.persist();

    const profile = this.getProfessorProfile(professorId);
    return profile?.courses.find((c) => c.id === courseId) || null;
  }

  deleteCourse(professorId: string, courseId: string): boolean {
    const existing = this.queryOne<{ id: string }>(
      'SELECT id FROM courses WHERE id = ? AND professor_id = ?',
      [courseId, professorId]
    );
    if (!existing) return false;
    this.exec('DELETE FROM document_chunks WHERE course_id = ? AND professor_id = ?', [courseId, professorId]);
    this.exec('DELETE FROM documents WHERE course_id = ? AND professor_id = ?', [courseId, professorId]);
    this.exec('DELETE FROM courses WHERE id = ? AND professor_id = ?', [courseId, professorId]);
    this.persist();
    return true;
  }

  // =========================================================================
  // PROFESSOR DOCUMENTS & RAG CHUNKS CRUD
  // =========================================================================
  createDocumentWithChunks(params: {
    professorId: string;
    input: DocumentInput;
    fullText: string;
    chunks: string[];
    embeddings: number[][] | null;
    embedProvider: 'ollama' | 'lexical-fallback';
  }): ProfessorDriveItem {
    const id = `drv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowUk = new Date().toLocaleDateString('uk-UA');
    const nowEn = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const nowEs = new Date().toLocaleDateString('es-ES');
    const updatedAt = { uk: nowUk, en: nowEn, es: nowEs };

    const preview = params.input.contentPreview || params.fullText.slice(0, 1200);

    this.exec(
      `INSERT INTO documents (
        id, professor_id, course_id, name_json, type, folder_category,
        group_name, academic_year, updated_at_json, size, file_name,
        file_format, content_preview, full_text, description_json,
        generated_tasks_count, embed_provider
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        id,
        params.professorId,
        params.input.courseId,
        JSON.stringify(makeLocStr(params.input.name)),
        params.input.type || 'lecture',
        params.input.folderCategory || 'lectures',
        params.input.group || '',
        params.input.academicYear || '2026/2027',
        JSON.stringify(updatedAt),
        params.input.size || '1.0 MB',
        params.input.fileName || 'document.pdf',
        params.input.fileFormat || 'PDF',
        preview,
        params.fullText,
        JSON.stringify(makeLocStr(params.input.description)),
        params.embedProvider,
      ]
    );

    params.chunks.forEach((chunkContent, idx) => {
      const emb = params.embeddings && params.embeddings[idx] ? JSON.stringify(params.embeddings[idx]) : null;
      this.exec(
        `INSERT INTO document_chunks (
          id, document_id, course_id, professor_id, chunk_index, content, embedding_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`${id}-chk-${idx}`, id, params.input.courseId, params.professorId, idx, chunkContent, emb]
      );
    });

    this.persist();

    return {
      id,
      name: makeLocStr(params.input.name),
      type: params.input.type || 'lecture',
      folderCategory: params.input.folderCategory || 'lectures',
      courseId: params.input.courseId,
      group: params.input.group || '',
      academicYear: params.input.academicYear || '2026/2027',
      updatedAt,
      size: params.input.size || '1.0 MB',
      fileName: params.input.fileName || 'document.pdf',
      fileFormat: params.input.fileFormat || 'PDF',
      contentPreview: preview,
      description: makeLocStr(params.input.description),
      chunksCount: params.chunks.length,
      embedProvider: params.embedProvider,
    };
  }

  updateDocumentWithChunks(params: {
    professorId: string;
    documentId: string;
    updates: Partial<DocumentInput>;
    reindexedChunks?: string[];
    reindexedEmbeddings?: number[][] | null;
    embedProvider?: 'ollama' | 'lexical-fallback';
  }): ProfessorDriveItem | null {
    const existing = this.queryOne<Record<string, unknown>>(
      'SELECT * FROM documents WHERE id = ? AND professor_id = ?',
      [params.documentId, params.professorId]
    );
    if (!existing) return null;

    const u = params.updates;
    const nowUk = new Date().toLocaleDateString('uk-UA');
    const nowEn = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const nowEs = new Date().toLocaleDateString('es-ES');
    const updatedAtJson = JSON.stringify({ uk: nowUk, en: nowEn, es: nowEs });

    const nextCourseId = u.courseId ?? String(existing.course_id);
    const nextNameJson = u.name !== undefined ? JSON.stringify(makeLocStr(u.name)) : String(existing.name_json);
    const nextDescJson =
      u.description !== undefined ? JSON.stringify(makeLocStr(u.description)) : String(existing.description_json);
    const nextPreview =
      u.contentPreview !== undefined ? u.contentPreview : (existing.content_preview as string | null);

    this.exec(
      `UPDATE documents SET
        course_id = ?, name_json = ?, type = ?, folder_category = ?,
        group_name = ?, academic_year = ?, updated_at_json = ?,
        size = ?, file_name = ?, file_format = ?, content_preview = ?,
        description_json = ?, embed_provider = ?
      WHERE id = ? AND professor_id = ?`,
      [
        nextCourseId,
        nextNameJson,
        u.type ?? String(existing.type),
        u.folderCategory ?? String(existing.folder_category),
        u.group ?? String(existing.group_name),
        u.academicYear ?? String(existing.academic_year),
        updatedAtJson,
        u.size ?? String(existing.size),
        u.fileName ?? String(existing.file_name),
        u.fileFormat ?? String(existing.file_format),
        nextPreview,
        nextDescJson,
        params.embedProvider ?? String(existing.embed_provider || 'lexical-fallback'),
        params.documentId,
        params.professorId,
      ]
    );

    if (params.reindexedChunks) {
      this.exec('DELETE FROM document_chunks WHERE document_id = ? AND professor_id = ?', [
        params.documentId,
        params.professorId,
      ]);
      params.reindexedChunks.forEach((chunkContent, idx) => {
        const emb =
          params.reindexedEmbeddings && params.reindexedEmbeddings[idx]
            ? JSON.stringify(params.reindexedEmbeddings[idx])
            : null;
        this.exec(
          `INSERT INTO document_chunks (
            id, document_id, course_id, professor_id, chunk_index, content, embedding_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`${params.documentId}-chk-${idx}`, params.documentId, nextCourseId, params.professorId, idx, chunkContent, emb]
        );
      });
    }

    this.persist();
    const prof = this.getProfessorProfile(params.professorId);
    return prof?.driveItems.find((d) => d.id === params.documentId) || null;
  }

  deleteDocument(professorId: string, documentId: string): boolean {
    const existing = this.queryOne<{ id: string }>(
      'SELECT id FROM documents WHERE id = ? AND professor_id = ?',
      [documentId, professorId]
    );
    if (!existing) return false;
    this.exec('DELETE FROM document_chunks WHERE document_id = ? AND professor_id = ?', [documentId, professorId]);
    this.exec('DELETE FROM documents WHERE id = ? AND professor_id = ?', [documentId, professorId]);
    this.persist();
    return true;
  }

  getDocumentContent(professorId: string, documentId: string): {
    id: string;
    fileName: string;
    fileFormat: string;
    fullText: string;
    chunks: Array<{ id: string; chunkIndex: number; content: string }>;
  } | null {
    const row = this.queryOne<Record<string, unknown>>(
      'SELECT id, file_name, file_format, full_text, content_preview FROM documents WHERE id = ? AND professor_id = ?',
      [documentId, professorId]
    );
    if (!row) return null;

    const chunkRows = this.queryAll<Record<string, unknown>>(
      'SELECT id, chunk_index, content FROM document_chunks WHERE document_id = ? AND professor_id = ? ORDER BY chunk_index ASC',
      [documentId, professorId]
    );

    return {
      id: String(row.id),
      fileName: String(row.file_name || 'document.pdf'),
      fileFormat: String(row.file_format || 'PDF'),
      fullText: String(row.full_text || row.content_preview || ''),
      chunks: chunkRows.map((c) => ({
        id: String(c.id),
        chunkIndex: Number(c.chunk_index),
        content: String(c.content),
      })),
    };
  }

  getRagChunksForCourse(
    professorId: string,
    courseId: string,
    lang: SupportedLanguage
  ): RagChunkRecord[] {
    const sqlStr = courseId
      ? `SELECT dc.*, d.name_json
         FROM document_chunks dc
         JOIN documents d ON d.id = dc.document_id
         WHERE dc.professor_id = ? AND dc.course_id = ?
         ORDER BY dc.document_id, dc.chunk_index ASC`
      : `SELECT dc.*, d.name_json
         FROM document_chunks dc
         JOIN documents d ON d.id = dc.document_id
         WHERE dc.professor_id = ?
         ORDER BY dc.document_id, dc.chunk_index ASC`;

    const params = courseId ? [professorId, courseId] : [professorId];
    const rows = this.queryAll<Record<string, unknown>>(sqlStr, params);

    return rows.map((r) => {
      const locName = JSON.parse(String(r.name_json)) as LocalizedString;
      const docTitle = locName[lang] || locName.en || locName.uk || locName.es || 'Document';
      let embedding: number[] | null = null;
      if (r.embedding_json) {
        try {
          embedding = JSON.parse(String(r.embedding_json)) as number[];
        } catch {
          embedding = null;
        }
      }
      return {
        id: String(r.id),
        documentId: String(r.document_id),
        documentTitle: docTitle,
        courseId: String(r.course_id),
        chunkIndex: Number(r.chunk_index),
        content: String(r.content),
        embedding,
      };
    });
  }

  // =========================================================================
  // GENERATED TASK HISTORY CRUD
  // =========================================================================
  saveHistory(record: Omit<StoredHistoryRecord, 'id' | 'createdAt'>): StoredHistoryRecord {
    const id = `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();

    this.exec(
      `INSERT INTO generated_history (
        id, professor_id, course_id, subject, poi_name, teacher_note,
        wikidata_json, tasks_json, sources_json, engine_used, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        record.professorId,
        record.courseId || '',
        record.subject,
        record.poiName,
        record.teacherNote || '',
        JSON.stringify(record.wikidata),
        JSON.stringify(record.tasks),
        JSON.stringify(record.sources),
        record.engineUsed,
        createdAt,
      ]
    );
    this.persist();

    return {
      ...record,
      id,
      createdAt,
    };
  }

  listHistory(professorId: string): StoredHistoryRecord[] {
    const rows = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM generated_history WHERE professor_id = ? ORDER BY rowid DESC LIMIT 30',
      [professorId]
    );

    return rows.map((r) => ({
      id: String(r.id),
      professorId: String(r.professor_id),
      courseId: String(r.course_id || ''),
      subject: String(r.subject),
      poiName: String(r.poi_name),
      teacherNote: String(r.teacher_note || ''),
      wikidata: JSON.parse(String(r.wikidata_json)) as WikidataInfo,
      tasks: JSON.parse(String(r.tasks_json)) as TaskVariants,
      sources: JSON.parse(String(r.sources_json)) as RankedRagChunk[],
      engineUsed: String(r.engine_used || 'local-rag-fallback'),
      createdAt: String(r.created_at),
    }));
  }

  deleteHistory(professorId: string, historyId: string): boolean {
    const existing = this.queryOne<{ id: string }>(
      'SELECT id FROM generated_history WHERE id = ? AND professor_id = ?',
      [historyId, professorId]
    );
    if (!existing) return false;
    this.exec('DELETE FROM generated_history WHERE id = ? AND professor_id = ?', [historyId, professorId]);
    this.persist();
    return true;
  }

  // =========================================================================
  // ACTIVITIES LIFECYCLE CRUD (draft -> approved / rejected -> saved DB)
  // =========================================================================
  private mapActivityRow(r: Record<string, unknown>): ActivityRecord {
    return {
      id: String(r.id),
      professorId: String(r.professor_id),
      courseId: String(r.course_id || ''),
      documentIds: JSON.parse(String(r.document_ids_json || '[]')) as string[],
      subject: String(r.subject),
      poiName: String(r.poi_name),
      teacherNote: String(r.teacher_note || ''),
      title: String(r.title),
      body: String(r.body),
      variantType: String(r.variant_type || 'fieldwork'),
      variantIndex: Number(r.variant_index || 1),
      status: String(r.status || 'draft') as ActivityStatus,
      metadata: JSON.parse(String(r.metadata_json || '{}')) as PedagogicalParams & { source?: string },
      sourceChunks: JSON.parse(String(r.source_chunks_json || '[]')) as ActivityRecord['sourceChunks'],
      engineUsed: String(r.engine_used || 'local-rag-fallback'),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }

  createActivities(
    records: Array<Omit<ActivityRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ): ActivityRecord[] {
    const created: ActivityRecord[] = [];
    const nowIso = new Date().toISOString();

    for (const rec of records) {
      const id = `act-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      this.exec(
        `INSERT INTO activities (
          id, professor_id, course_id, document_ids_json, subject, poi_name,
          teacher_note, title, body, variant_type, variant_index, status,
          metadata_json, source_chunks_json, engine_used, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          rec.professorId,
          rec.courseId || '',
          JSON.stringify(rec.documentIds || []),
          rec.subject,
          rec.poiName,
          rec.teacherNote || '',
          rec.title,
          rec.body,
          rec.variantType || 'fieldwork',
          rec.variantIndex || 1,
          rec.status || 'draft',
          JSON.stringify(rec.metadata || {}),
          JSON.stringify(rec.sourceChunks || []),
          rec.engineUsed || 'local-rag-fallback',
          nowIso,
          nowIso,
        ]
      );
      created.push({
        ...rec,
        id,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    this.persist();
    return created;
  }

  listActivities(
    professorId: string,
    filters?: { courseId?: string; status?: ActivityStatus }
  ): ActivityRecord[] {
    let sqlStr = 'SELECT * FROM activities WHERE professor_id = ?';
    const params: unknown[] = [professorId];

    if (filters?.courseId && filters.courseId !== 'all') {
      sqlStr += ' AND course_id = ?';
      params.push(filters.courseId);
    }
    if (filters?.status) {
      sqlStr += ' AND status = ?';
      params.push(filters.status);
    }

    sqlStr += ' ORDER BY updated_at DESC, rowid DESC LIMIT 100';
    const rows = this.queryAll<Record<string, unknown>>(sqlStr, params);
    return rows.map((r) => this.mapActivityRow(r));
  }

  updateActivity(
    professorId: string,
    activityId: string,
    updates: {
      title?: string;
      body?: string;
      status?: ActivityStatus;
      courseId?: string;
      metadata?: PedagogicalParams & { source?: string };
    }
  ): ActivityRecord | null {
    const existing = this.queryOne<Record<string, unknown>>(
      'SELECT * FROM activities WHERE id = ? AND professor_id = ?',
      [activityId, professorId]
    );
    if (!existing) return null;

    const nextTitle = updates.title !== undefined ? updates.title.trim() : String(existing.title);
    const nextBody = updates.body !== undefined ? updates.body.trim() : String(existing.body);
    const nextStatus = updates.status ?? (String(existing.status) as ActivityStatus);
    const nextCourseId = updates.courseId !== undefined ? updates.courseId : String(existing.course_id || '');
    const nextMetadata =
      updates.metadata !== undefined ? JSON.stringify(updates.metadata) : String(existing.metadata_json || '{}');
    const updatedAt = new Date().toISOString();

    this.exec(
      `UPDATE activities SET
        title = ?, body = ?, status = ?, course_id = ?, metadata_json = ?, updated_at = ?
      WHERE id = ? AND professor_id = ?`,
      [nextTitle, nextBody, nextStatus, nextCourseId, nextMetadata, updatedAt, activityId, professorId]
    );
    this.persist();

    const refreshed = this.queryOne<Record<string, unknown>>(
      'SELECT * FROM activities WHERE id = ? AND professor_id = ?',
      [activityId, professorId]
    );
    return refreshed ? this.mapActivityRow(refreshed) : null;
  }

  deleteActivity(professorId: string, activityId: string): boolean {
    const existing = this.queryOne<{ id: string }>(
      'SELECT id FROM activities WHERE id = ? AND professor_id = ?',
      [activityId, professorId]
    );
    if (!existing) return false;
    this.exec('DELETE FROM activities WHERE id = ? AND professor_id = ?', [activityId, professorId]);
    this.persist();
    return true;
  }
}

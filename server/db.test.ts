import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { UvaSqliteDb } from './db.ts';
import { chunkText, extractTextFromUpload, generateTasksWithOllamaOrFallback } from './rag.ts';

describe('UvaSqliteDb & Local RAG Integration', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uva-db-test-'));
  const tmpDbPath = path.join(tmpDir, 'test.sqlite');

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('seeds manager and 3 professors and persists CRUD + RAG chunks across reopen', async () => {
    const db1 = await UvaSqliteDb.create(tmpDbPath);

    // Manager auth succeeds for both manager/manager and admin/admin
    const mgrAuth = db1.authenticate('manager', 'manager');
    assert.ok(mgrAuth);
    assert.equal(mgrAuth.role, 'manager');

    const adminAliasAuth = db1.authenticate('admin', 'admin');
    assert.ok(adminAliasAuth);
    assert.equal(adminAliasAuth.role, 'manager');

    // Professor 1 auth succeeds
    const prof1Auth = db1.authenticate('1111', '1111');
    assert.ok(prof1Auth);
    assert.equal(prof1Auth.role, 'professor');
    assert.ok(prof1Auth.professorProfile!.courses.length >= 3);

    // Account Manager creates a new teacher
    const createdTeacher = db1.createTeacher({
      login: '7777',
      password: 'secret',
      name: 'Dr. Olena Savchenko',
      title: 'Associate Professor',
      faculty: 'Philosophy and Letters',
      department: 'Digital Heritage',
      specialty: '3D Photogrammetry',
    });
    assert.equal(createdTeacher.login, '7777');

    // Reopen SQLite from disk to verify persistence
    const db2 = await UvaSqliteDb.create(tmpDbPath);
    const newProfAuth = db2.authenticate('7777', 'secret');
    assert.ok(newProfAuth);
    assert.equal(newProfAuth.role, 'professor');

    // Teacher creates a course & uploads a UTF-8 markdown lecture note
    const course = db2.createCourse(newProfAuth.accountId, {
      code: 'PHOTO-3D',
      title: 'Digital Heritage Photogrammetry',
      semester: '1 Semester',
      credits: 6,
      groups: ['DH-11'],
      enrolledStudents: 24,
      academicYear: '2026/2027',
      isCurrentYear: true,
    });

    const sampleMd = `# Laser Scanning & Photogrammetry\nStructure-from-Motion reconstructs the Plateresque facade of Palacio de Santa Cruz at millimeter accuracy using dense point clouds and ground control targets.`;
    const extracted = await extractTextFromUpload(
      new TextEncoder().encode(sampleMd),
      'text/markdown',
      'photogrammetry_notes.md'
    );
    assert.ok(extracted.includes('Structure-from-Motion'));

    const chunks = chunkText(extracted, 180, 30);
    const doc = db2.createDocumentWithChunks({
      professorId: newProfAuth.accountId,
      input: {
        name: 'Photogrammetry Lecture 1',
        courseId: course.id,
        folderCategory: 'lectures',
        type: 'lecture',
        group: 'DH-11',
        academicYear: '2026/2027',
        fileName: 'photogrammetry_notes.md',
        fileFormat: 'MD',
        size: '1 KB',
        description: 'SfM lecture guide',
      },
      fullText: extracted,
      chunks,
      embeddings: null,
      embedProvider: 'lexical-fallback',
    });
    assert.ok(doc.chunksCount && doc.chunksCount >= 1);

    // Run RAG task generation (with unreachable port to exercise clean local fallback)
    const courseChunks = db2.getRagChunksForCourse(newProfAuth.accountId, course.id, 'uk');
    const result = await generateTasksWithOllamaOrFallback({
      lang: 'uk',
      subject: 'Digital Heritage Photogrammetry',
      poiName: 'Palacio de Santa Cruz',
      teacherNote: 'Focus on Structure-from-Motion millimeter accuracy',
      chunks: courseChunks,
      selectedDocumentIds: [doc.id],
      useRepo: true,
      ollamaBaseUrl: 'http://127.0.0.1:59999',
      chatModel: 'qwen2.5:3b',
      embedModel: 'all-minilm',
    });

    assert.equal(result.engine, 'local-rag-fallback');
    assert.ok(result.retrievedChunks.length >= 1);
    assert.equal(result.retrievedChunks[0].documentId, doc.id);
    assert.ok(result.tasks.variant1.body.includes('Photogrammetry Lecture 1'));
  });

  it('isolates saved and deleted history strictly per professor account', async () => {
    const db = await UvaSqliteDb.create(tmpDbPath);
    const prof1 = db.authenticate('1111', '1111');
    const prof2 = db.authenticate('2222', '2222');
    assert.ok(prof1 && prof2);

    const sampleWiki = { buildYear: '1486', style: 'Plateresque', events: ['Charter'] };
    const sampleTasks = {
      variant1: { id: 1, tag: 'V1', tagClass: 'c1', title: 'T1', body: 'B1', source: 'S1' },
      variant2: { id: 2, tag: 'V2', tagClass: 'c2', title: 'T2', body: 'B2', source: 'S2' },
      variant3: { id: 3, tag: 'V3', tagClass: 'c3', title: 'T3', body: 'B3', source: 'S3' },
    };

    const rec1 = db.saveHistory({
      professorId: prof1.accountId,
      courseId: '',
      subject: 'Prof 1 Private Course',
      poiName: 'Santa Cruz',
      teacherNote: 'Prof 1 note',
      wikidata: sampleWiki,
      tasks: sampleTasks,
      sources: [],
      engineUsed: 'local-chat',
    });

    const rec2 = db.saveHistory({
      professorId: prof2.accountId,
      courseId: '',
      subject: 'Prof 2 Private Course',
      poiName: 'Cathedral',
      teacherNote: 'Prof 2 note',
      wikidata: sampleWiki,
      tasks: sampleTasks,
      sources: [],
      engineUsed: 'local-chat',
    });

    const hist1 = db.listHistory(prof1.accountId);
    const hist2 = db.listHistory(prof2.accountId);
    assert.equal(hist1.some((h) => h.id === rec1.id), true);
    assert.equal(hist1.some((h) => h.id === rec2.id), false);
    assert.equal(hist2.some((h) => h.id === rec2.id), true);
    assert.equal(hist2.some((h) => h.id === rec1.id), false);

    // Prof 2 cannot delete Prof 1's history record
    assert.equal(db.deleteHistory(prof2.accountId, rec1.id), false);
    assert.equal(db.listHistory(prof1.accountId).some((h) => h.id === rec1.id), true);
  });

  it('persists activities lifecycle (draft -> edit -> approve/reject -> reopen -> delete) with strict professor isolation and returns full document content', async () => {
    const db1 = await UvaSqliteDb.create(tmpDbPath);
    const prof1 = db1.authenticate('1111', '1111');
    const prof2 = db1.authenticate('2222', '2222');
    assert.ok(prof1 && prof2);

    const prof1Profile = prof1.professorProfile!;
    assert.ok(prof1Profile.driveItems.length >= 1);
    const firstDoc = prof1Profile.driveItems[0];

    // getDocumentContent returns fullText and ordered chunks for owning professor, null for other professor
    const docContent = db1.getDocumentContent(prof1.accountId, firstDoc.id);
    assert.ok(docContent);
    assert.equal(docContent.id, firstDoc.id);
    assert.ok(docContent.fullText.length > 0);
    assert.ok(docContent.chunks.length >= 1);
    assert.equal(db1.getDocumentContent(prof2.accountId, firstDoc.id), null);

    // Create draft activities
    const created = db1.createActivities([
      {
        professorId: prof1.accountId,
        courseId: firstDoc.courseId,
        documentIds: [firstDoc.id],
        subject: 'Architecture & Heritage',
        poiName: 'Palacio de Santa Cruz',
        teacherNote: 'Check facade reliefs',
        title: 'Draft Field Task',
        body: 'Initial draft body',
        variantType: 'fieldwork',
        variantIndex: 1,
        status: 'draft',
        metadata: {
          educationLevel: 'Bachelor (Year 3)',
          academicGroup: 'ARQ-31',
          taskType: 'Fieldwork',
          difficultyLevel: 'Intermediate',
          duration: '60 min',
          learningObjectives: 'Analyze Plateresque elements',
          geoCoordinates: '41.6523, -4.7245',
          geoRadius: '250m',
        },
        sourceChunks: [],
        engineUsed: 'local-rag-fallback',
      },
      {
        professorId: prof1.accountId,
        courseId: firstDoc.courseId,
        documentIds: [firstDoc.id],
        subject: 'Architecture & Heritage',
        poiName: 'Palacio de Santa Cruz',
        teacherNote: 'Check facade reliefs',
        title: 'Draft Quiz',
        body: 'Initial quiz body',
        variantType: 'quiz',
        variantIndex: 3,
        status: 'draft',
        metadata: {},
        sourceChunks: [],
        engineUsed: 'local-rag-fallback',
      },
    ]);

    assert.equal(created.length, 2);
    assert.equal(created[0].status, 'draft');

    // Edit and approve first, reject second
    const updated1 = db1.updateActivity(prof1.accountId, created[0].id, {
      title: 'Edited Approved Field Task',
      body: 'Updated body saved in SQLite',
      status: 'approved',
    });
    assert.ok(updated1);
    assert.equal(updated1.title, 'Edited Approved Field Task');
    assert.equal(updated1.body, 'Updated body saved in SQLite');
    assert.equal(updated1.status, 'approved');

    const updated2 = db1.updateActivity(prof1.accountId, created[1].id, {
      status: 'rejected',
    });
    assert.ok(updated2);
    assert.equal(updated2.status, 'rejected');

    // Strict isolation: Prof 2 cannot read, update, or delete Prof 1's activity
    assert.equal(db1.updateActivity(prof2.accountId, created[0].id, { title: 'Hacked' }), null);
    assert.equal(db1.deleteActivity(prof2.accountId, created[0].id), false);
    assert.equal(db1.listActivities(prof2.accountId).some((a) => a.id === created[0].id), false);

    // Reopen DB from disk and verify edits & status persisted
    const db2 = await UvaSqliteDb.create(tmpDbPath);
    const approvedList = db2.listActivities(prof1.accountId, {
      courseId: firstDoc.courseId,
      status: 'approved',
    });
    const persisted = approvedList.find((a) => a.id === created[0].id);
    assert.ok(persisted);
    assert.equal(persisted.title, 'Edited Approved Field Task');
    assert.equal(persisted.body, 'Updated body saved in SQLite');
    assert.equal(persisted.metadata.geoRadius, '250m');

    // Prof 1 deletes the approved activity
    assert.equal(db2.deleteActivity(prof1.accountId, created[0].id), true);
    assert.equal(db2.listActivities(prof1.accountId).some((a) => a.id === created[0].id), false);
  });
});

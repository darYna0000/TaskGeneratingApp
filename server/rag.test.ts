import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRagPrompt,
  chunkText,
  cosineSimilarity,
  generateTasksWithOllamaOrFallback,
  isEndpointAllowedForRole,
  parseOllamaTaskJson,
  rankRelevantChunks,
  type RagChunkRecord,
} from './rag.ts';
import { analyzePoiData, generateTaskVariants } from '../src/utils/taskGenerator.ts';

describe('RAG chunking & similarity utilities', () => {
  it('splits long text into overlapping chunks without losing tail content', () => {
    const sample = Array.from({ length: 24 }, (_, i) => `Sentence number ${i + 1} discusses heritage preservation and gothic vaults.`).join(' ');
    const chunks = chunkText(sample, 220, 40);

    assert.ok(chunks.length >= 4, `Expected multiple chunks, got ${chunks.length}`);
    for (const c of chunks) {
      assert.ok(c.length <= 240, `Chunk too long: ${c.length}`);
      assert.ok(c.length > 0);
    }
    assert.ok(chunks[chunks.length - 1].includes('Sentence number 24'));
  });

  it('computes cosine similarity accurately and handles invalid dimensions', () => {
    assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
    assert.equal(cosineSimilarity([1, 2], [1]), 0);
    assert.equal(cosineSimilarity(null, [1, 2]), 0);
  });

  it('ranks relevant chunks using embedding vectors when present and restricts by documentIds', () => {
    const chunks: RagChunkRecord[] = [
      {
        id: 'c1',
        documentId: 'doc-1',
        documentTitle: 'Plateresque Guide',
        courseId: 'crs-1',
        chunkIndex: 0,
        content: 'Palacio de Santa Cruz features an ornamental Plateresque facade built in 1486.',
        embedding: [0.95, 0.05, 0],
      },
      {
        id: 'c2',
        documentId: 'doc-2',
        documentTitle: 'Baroque Notes',
        courseId: 'crs-1',
        chunkIndex: 0,
        content: 'Baroque altars emphasize dynamic curved cornices and gilded retables.',
        embedding: [0.1, 0.9, 0],
      },
      {
        id: 'c3',
        documentId: 'doc-3',
        documentTitle: 'Restricted Doc',
        courseId: 'crs-1',
        chunkIndex: 0,
        content: 'Exact match candidate outside selected filter.',
        embedding: [1, 0, 0],
      },
    ];

    const ranked = rankRelevantChunks(
      'Santa Cruz Plateresque facade',
      chunks,
      [1, 0, 0],
      2,
      ['doc-1', 'doc-2']
    );

    assert.equal(ranked.length, 2);
    assert.equal(ranked[0].documentId, 'doc-1');
    assert.equal(ranked[0].method, 'embedding');
    assert.ok(ranked.every((r) => r.documentId !== 'doc-3'));
  });

  it('falls back cleanly to lexical matching when no embeddings exist', () => {
    const chunks: RagChunkRecord[] = [
      {
        id: 'a',
        documentId: 'doc-a',
        documentTitle: 'Lviv University Charter',
        courseId: 'crs-1',
        chunkIndex: 0,
        content: 'Founded by Royal Charter of John II Casimir in 1661 in Lviv.',
        embedding: null,
      },
      {
        id: 'b',
        documentId: 'doc-b',
        documentTitle: 'Thermal Engineering',
        courseId: 'crs-1',
        chunkIndex: 0,
        content: 'Carnot cycle efficiency depends on reservoir temperatures.',
        embedding: null,
      },
    ];

    const ranked = rankRelevantChunks('Royal Charter Lviv 1661', chunks, null, 2);
    assert.equal(ranked[0].documentId, 'doc-a');
    assert.equal(ranked[0].method, 'lexical');
    assert.ok(ranked[0].score > ranked[1].score);
  });

  it('parses Ollama JSON output wrapped in prose or markdown fences', () => {
    const wiki = analyzePoiData('Palacio de Santa Cruz', 'en');
    const fallback = generateTaskVariants('en', 'Architecture', 'Palacio de Santa Cruz', '', wiki);

    const parsed = parseOllamaTaskJson(
      '```json\n{"variant1":{"title":"Field Study","body":"Inspect facade"},"variant2":{"title":"Case","body":"Compare styles"},"variant3":{"title":"Quiz","body":"1. Year?"}}\n```',
      fallback,
      'qwen2.5:3b'
    );

    assert.ok(parsed);
    assert.equal(parsed.variant1.title, 'Field Study');
    assert.equal(parsed.variant2.body, 'Compare styles');
    assert.equal(parsed.variant3.source, 'Ollama (qwen2.5:3b) + RAG');
  });

  it('embeds all pedagogical and geographic parameters into buildRagPrompt and returns trace fields for useRepo true vs false', async () => {
    const wiki = analyzePoiData('Palacio de Santa Cruz', 'en');
    const prompt = buildRagPrompt({
      lang: 'en',
      subject: 'Heritage Studies',
      poiName: 'Palacio de Santa Cruz',
      teacherNote: 'Focus on facade stone masonry',
      wikidata: wiki,
      retrievedChunks: [],
      pedagogical: {
        educationLevel: 'Master',
        academicGroup: 'HER-52',
        taskType: 'Comparative Analysis',
        difficultyLevel: 'Advanced',
        duration: '90 min',
        learningObjectives: 'Identify Plateresque reliefs',
        geoCoordinates: '41.6523, -4.7245',
        geoRadius: '300m',
      },
    });

    assert.ok(prompt.includes('Education Level: Master'));
    assert.ok(prompt.includes('Academic Group: HER-52'));
    assert.ok(prompt.includes('Preferred Task Format / Work Mode: Comparative Analysis'));
    assert.ok(prompt.includes('Difficulty Level: Advanced'));
    assert.ok(prompt.includes('Estimated Duration: 90 min'));
    assert.ok(prompt.includes('Learning Objectives & Competencies: Identify Plateresque reliefs'));
    assert.ok(prompt.includes('Geographic Coordinates: 41.6523, -4.7245'));
    assert.ok(prompt.includes('Fieldwork Search Radius: 300m'));

    const sampleChunks: RagChunkRecord[] = [
      {
        id: 'c1',
        documentId: 'doc-1',
        documentTitle: 'Valladolid Renaissance',
        courseId: 'crs-1',
        chunkIndex: 0,
        content: 'Santa Cruz palace courtyard shows early Spanish Renaissance arches.',
        embedding: null,
      },
    ];

    const withRepo = await generateTasksWithOllamaOrFallback({
      lang: 'en',
      subject: 'Heritage Studies',
      poiName: 'Palacio de Santa Cruz',
      teacherNote: 'Renaissance arches',
      wikidata: wiki,
      pedagogical: { educationLevel: 'Master', geoRadius: '300m' },
      chunks: sampleChunks,
      useRepo: true,
      ollamaBaseUrl: 'http://127.0.0.1:59999',
      chatModel: 'qwen2.5:3b',
      embedModel: 'all-minilm',
    });
    assert.equal(withRepo.retrievedChunks.length, 1);
    assert.ok(withRepo.promptUsed.includes('Education Level: Master'));
    assert.ok(withRepo.rawLlmResponse.length > 0);

    const withoutRepo = await generateTasksWithOllamaOrFallback({
      lang: 'en',
      subject: 'Heritage Studies',
      poiName: 'Palacio de Santa Cruz',
      teacherNote: 'Renaissance arches',
      wikidata: wiki,
      pedagogical: { educationLevel: 'Master', geoRadius: '300m' },
      chunks: sampleChunks,
      useRepo: false,
      ollamaBaseUrl: 'http://127.0.0.1:59999',
      chatModel: 'qwen2.5:3b',
      embedModel: 'all-minilm',
    });
    assert.equal(withoutRepo.retrievedChunks.length, 0);
    assert.ok(withoutRepo.promptUsed.includes('No course documents were attached'));
  });
});

describe('Strict Account Manager RBAC isolation', () => {
  it('allows manager role ONLY on accounts endpoint and denies all professor/course/task/activities routes', () => {
    assert.equal(isEndpointAllowedForRole('manager', 'accounts'), true);
    assert.equal(isEndpointAllowedForRole('manager', 'courses'), false);
    assert.equal(isEndpointAllowedForRole('manager', 'documents'), false);
    assert.equal(isEndpointAllowedForRole('manager', 'tasks'), false);
    assert.equal(isEndpointAllowedForRole('manager', 'activities'), false);
    assert.equal(isEndpointAllowedForRole('manager', 'history'), false);
    assert.equal(isEndpointAllowedForRole('manager', 'workspace'), false);
  });

  it('allows professor role on workspace/courses/documents/tasks/activities/history and denies accounts admin route', () => {
    assert.equal(isEndpointAllowedForRole('professor', 'accounts'), false);
    assert.equal(isEndpointAllowedForRole('professor', 'courses'), true);
    assert.equal(isEndpointAllowedForRole('professor', 'documents'), true);
    assert.equal(isEndpointAllowedForRole('professor', 'tasks'), true);
    assert.equal(isEndpointAllowedForRole('professor', 'activities'), true);
    assert.equal(isEndpointAllowedForRole('professor', 'history'), true);
    assert.equal(isEndpointAllowedForRole('professor', 'workspace'), true);
  });
});

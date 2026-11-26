import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRagChatPayload,
  formatLocalRagError,
  parseRagChatResponse,
  resolveChatApiUrl,
  resolveUploadApiUrl,
} from './ragChatClient.ts';

test('resolveChatApiUrl defaults to http://localhost:8000/api/chat and honors env override', () => {
  assert.equal(resolveChatApiUrl(undefined), 'http://localhost:8000/api/chat');
  assert.equal(resolveChatApiUrl('  '), 'http://localhost:8000/api/chat');
  assert.equal(
    resolveChatApiUrl('http://127.0.0.1:8010/api/chat'),
    'http://127.0.0.1:8010/api/chat'
  );
  assert.equal(
    resolveUploadApiUrl('http://localhost:8000/api/chat'),
    'http://localhost:8000/api/upload'
  );
});

test('buildRagChatPayload formats { question, history } cleanly and filters empty turns', () => {
  const payload = buildRagChatPayload('  Коли засновано UVa?  ', [
    { role: 'user', content: 'Привіт' },
    { role: 'assistant', content: '   ' },
    { role: 'assistant', content: 'Вітаю! Чим допомогти?' },
  ]);

  assert.deepEqual(payload, {
    question: 'Коли засновано UVa?',
    history: [
      { role: 'user', content: 'Привіт' },
      { role: 'assistant', content: 'Вітаю! Чим допомогти?' },
    ],
  });
});

test('buildRagChatPayload forwards course_id, use_repo, and pedagogical fields when provided', () => {
  const payload = buildRagChatPayload(
    'Generate field tasks',
    [{ role: 'user', content: 'Hi' }],
    {
      course_id: 'crs-101',
      use_repo: true,
      education_level: 'Bachelor',
      academic_group: 'CS-21',
      task_type: 'Fieldwork',
      difficulty_level: 'Intermediate',
      duration: '45 min',
      learning_objectives: 'Inspect courtyard symmetry',
      geo_coordinates: '41.652, -4.724',
      geo_radius: '200m',
    }
  );

  assert.equal(payload.course_id, 'crs-101');
  assert.equal(payload.use_repo, true);
  assert.equal(payload.education_level, 'Bachelor');
  assert.equal(payload.geo_radius, '200m');
});

test('parseRagChatResponse parses { answer, sources, debug } cleanly', () => {
  const parsed = parseRagChatResponse({
    answer: 'Університет Вальядоліда засновано у 1241 році.',
    sources: ['[sample_info.txt, #1] Університет Вальядоліда засновано у 1241 році.', ''],
    debug: {
      use_repo: true,
      engine: 'ollama-hybrid-rag',
      model: 'qwen2.5:3b',
      retrieved_chunks: [
        { id: '1', source: 'sample_info.txt', chunk_index: 0, text: 'Founded 1241', vector_score: 0.91, bm25_score: 2.3, rerank_score: 0.88 },
      ],
      final_prompt: 'Prompt text',
      raw_llm_response: 'Raw answer',
    },
  });

  assert.equal(parsed.answer, 'Університет Вальядоліда засновано у 1241 році.');
  assert.deepEqual(parsed.sources, [
    '[sample_info.txt, #1] Університет Вальядоліда засновано у 1241 році.',
  ]);
  assert.equal(parsed.debug?.engine, 'ollama-hybrid-rag');
  assert.equal(parsed.debug?.retrieved_chunks?.[0]?.rerank_score, 0.88);
});

test('formatLocalRagError returns strictly localized error for uk, en, and es', () => {
  const err = new TypeError('Failed to fetch');
  assert.match(formatLocalRagError(err, 'http://localhost:8000/api/chat', 'uk'), /Не вдалося підключитися/);
  assert.match(formatLocalRagError(err, 'http://localhost:8000/api/chat', 'en'), /Could not connect to the local backend server/);
  assert.match(formatLocalRagError(err, 'http://localhost:8000/api/chat', 'es'), /No se pudo conectar con el servidor local/);
});

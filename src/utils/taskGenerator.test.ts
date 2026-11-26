import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePoiData, buildPromptTemplate, generateTaskVariants } from './taskGenerator.ts';

test('analyzePoiData recognizes Lviv university correctly across languages', () => {
  const resultUk = analyzePoiData('University of Lviv', 'uk');
  assert.equal(resultUk.buildYear, '1661 / 1848');
  assert.equal(resultUk.style, 'Неокласицизм / Неоренесанс');
  assert.ok(resultUk.events.length > 0);
  assert.equal(resultUk.entityId, 'Q1417534');

  const resultEn = analyzePoiData('University of Lviv', 'en');
  assert.equal(resultEn.style, 'Neoclassical / Neo-Renaissance');

  const resultEs = analyzePoiData('University of Lviv', 'es');
  assert.equal(resultEs.style, 'Neoclásico / Neorrenacentista');
});

test('analyzePoiData provides sensible fallback for arbitrary location', () => {
  const result = analyzePoiData('Random Historical Fortress', 'en');
  assert.equal(result.buildYear, 'Historical XV-XIX Century');
  assert.equal(result.style, 'Regional Architectural Style');
  assert.ok(result.events[0].includes('Random Historical Fortress'));
});

test('buildPromptTemplate includes required fields for Ollama / LLM', () => {
  const wiki = analyzePoiData('Palacio de Santa Cruz', 'en');
  const prompt = buildPromptTemplate(
    'Renaissance Studies',
    'Palacio de Santa Cruz',
    'Focus on portal carvings',
    '3 Course: Renaissance & Baroque Studies',
    wiki
  );

  assert.ok(prompt.includes('Renaissance Studies'));
  assert.ok(prompt.includes('Palacio de Santa Cruz'));
  assert.ok(prompt.includes('Focus on portal carvings'));
  assert.ok(prompt.includes('1486 (Palacio de Santa Cruz)'));
  assert.ok(prompt.includes('Variant 1 (Field Task)'));
});

test('generateTaskVariants returns all 3 distinct variants with translations', () => {
  const wikiUk = analyzePoiData('University of Lviv', 'uk');
  
  // Ukrainian
  const ukVariants = generateTaskVariants('uk', 'Історія архітектури', 'University of Lviv', 'Зверніть увагу на портал', wikiUk);
  assert.ok(ukVariants.variant1.title.includes('University of Lviv'));
  assert.ok(ukVariants.variant1.body.includes('Вказівка викладача: Зверніть увагу на портал'));
  assert.ok(ukVariants.variant2.tag.includes('Аналітичний'));
  assert.ok(ukVariants.variant3.tag.includes('Експрес-Тест'));

  // English
  const wikiEn = analyzePoiData('University of Lviv', 'en');
  const enVariants = generateTaskVariants('en', 'Architecture', 'University of Lviv', '', wikiEn);
  assert.ok(enVariants.variant1.tag.includes('Field Task'));
  assert.ok(enVariants.variant2.tag.includes('Analytical Case'));
  assert.ok(enVariants.variant3.tag.includes('Assessment Quiz'));

  // Spanish
  const wikiEs = analyzePoiData('Palacio de Santa Cruz', 'es');
  const esVariants = generateTaskVariants('es', 'Arquitectura', 'Palacio de Santa Cruz', '', wikiEs);
  assert.ok(esVariants.variant1.tag.includes('Tarea de Campo'));
  assert.ok(esVariants.variant2.tag.includes('Caso Analítico'));
  assert.ok(esVariants.variant3.tag.includes('Cuestionario'));
});

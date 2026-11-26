export interface WikidataInfo {
  buildYear: string;
  style: string;
  events: string[];
  entityId?: string;
}

export interface TaskItem {
  id: number;
  tag: string;
  tagClass: string;
  title: string;
  body: string;
  source: string;
}

export interface TaskVariants {
  variant1: TaskItem;
  variant2: TaskItem;
  variant3: TaskItem;
}

export interface HistoryItem {
  id: string;
  title: string;
  subject: string;
  poiName: string;
  selectedRepo: string;
  useRepo: boolean;
  teacherNote: string;
  wikidata: WikidataInfo;
  tasks: TaskVariants;
  createdAt: string;
}

export type SupportedLanguage = 'uk' | 'en' | 'es';

export type ActivityStatus = 'draft' | 'approved' | 'rejected';

export interface PedagogicalParams {
  educationLevel?: string;
  academicGroup?: string;
  taskType?: string;
  difficultyLevel?: string;
  duration?: string;
  learningObjectives?: string;
  geoCoordinates?: string;
  geoRadius?: string;
}

export interface ActivityRecord {
  id: string;
  professorId: string;
  courseId: string;
  documentIds: string[];
  subject: string;
  poiName: string;
  teacherNote: string;
  title: string;
  body: string;
  variantType: string;
  variantIndex: number;
  status: ActivityStatus;
  metadata: PedagogicalParams & { source?: string };
  sourceChunks: Array<{
    id: string;
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    content: string;
    score: number;
    method: string;
  }>;
  engineUsed: string;
  createdAt: string;
  updatedAt: string;
}

export interface RagDebugTrace {
  useRepo: boolean;
  engine: 'ollama' | 'local-rag-fallback';
  model: string;
  documentChunks: Array<{
    id: string;
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    content: string;
  }>;
  retrievedChunks: Array<{
    id: string;
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    content: string;
    score: number;
    method: string;
    vectorScore?: number | null;
    bm25Score?: number | null;
    rerankScore?: number | null;
  }>;
  finalPrompt: string;
  rawLlmResponse: string;
}

export function getInitialHistory(lang: SupportedLanguage = 'uk'): HistoryItem[] {
  const wikiSantaCruz = analyzePoiData('Palacio de Santa Cruz', lang);
  const wikiLviv = analyzePoiData('University of Lviv', lang);

  return [
    {
      id: "hist-1",
      title: "Python for MI",
      subject: "Machine Intelligence & Python Logic",
      poiName: "Universidad de Valladolid",
      selectedRepo: "repo1",
      useRepo: true,
      teacherNote: lang === 'en'
        ? "Practical work with logical variables"
        : lang === 'es'
        ? "Trabajo práctico con variables lógicas"
        : "Практична робота з логічними змінними",
      wikidata: wikiSantaCruz,
      tasks: generateTaskVariants(lang, "Machine Intelligence & Python Logic", "Universidad de Valladolid", "", wikiSantaCruz),
      createdAt: "10:45"
    },
    {
      id: "hist-2",
      title: "Python for MI",
      subject: "Advanced Python Algorithms",
      poiName: "Faculty of Science UVa",
      selectedRepo: "repo2",
      useRepo: true,
      teacherNote: "Фокус на оптимізації структур даних",
      wikidata: wikiSantaCruz,
      tasks: generateTaskVariants('uk', "Advanced Python Algorithms", "Faculty of Science UVa", "", wikiSantaCruz),
      createdAt: "09:30"
    },
    {
      id: "hist-3",
      title: "Fundamentals of Logic Variables ...",
      subject: "Discrete Mathematics & Logic",
      poiName: "UVa Historical Campus",
      selectedRepo: "repo1",
      useRepo: true,
      teacherNote: "Формальні логічні оператори та таблиці істинності",
      wikidata: wikiSantaCruz,
      tasks: generateTaskVariants('uk', "Discrete Mathematics & Logic", "UVa Historical Campus", "Логічні оператори", wikiSantaCruz),
      createdAt: "Вчора"
    },
    {
      id: "hist-4",
      title: "History of Architecture • University of Lviv",
      subject: "History of Architecture",
      poiName: "University of Lviv",
      selectedRepo: "repo1",
      useRepo: true,
      teacherNote: "Зверніть увагу на стиль та період заснування",
      wikidata: wikiLviv,
      tasks: generateTaskVariants('uk', "History of Architecture", "University of Lviv", "Зверніть увагу на стиль", wikiLviv),
      createdAt: "2 дні тому"
    }
  ];
}

export function analyzePoiData(poi: string, lang: SupportedLanguage = 'uk'): WikidataInfo {
  const query = (poi || '').toLowerCase().trim();

  if (query.includes('lviv') || query.includes('львів')) {
    if (lang === 'es') {
      return {
        buildYear: "1661 / 1848",
        style: "Neoclásico / Neorrenacentista",
        events: ["Carta Real de Juan II Casimiro", "Asamblea de la Dieta Gallega", "Transformación universitaria"],
        entityId: "Q1417534"
      };
    }
    if (lang === 'en') {
      return {
        buildYear: "1661 / 1848",
        style: "Neoclassical / Neo-Renaissance",
        events: ["Royal Charter of John II Casimir", "Galician Diet Assembly", "University Transformation"],
        entityId: "Q1417534"
      };
    }
    return {
      buildYear: "1661 / 1848",
      style: "Неокласицизм / Неоренесанс",
      events: ["Королівський привілей Яна II Казимира", "Засідання Галицького сейму", "Трансформація університетського простору"],
      entityId: "Q1417534"
    };
  } else if (query.includes('sagrada') || query.includes('gaudi') || query.includes('саграда')) {
    if (lang === 'es') {
      return {
        buildYear: "1882 - Presente",
        style: "Modernismo Catalán / Neogótico",
        events: ["Diseñado por Antoni Gaudí", "Consagración papal", "Patrimonio de la Humanidad UNESCO"],
        entityId: "Q8845"
      };
    }
    if (lang === 'en') {
      return {
        buildYear: "1882 - Present",
        style: "Catalan Modernism / Gothic Revival",
        events: ["Designed by Antoni Gaudí", "Consecration by Pope", "UNESCO Heritage Listing"],
        entityId: "Q8845"
      };
    }
    return {
      buildYear: "1882 — дотепер",
      style: "Каталонський модерн / Неоготика",
      events: ["Проєкт Антоні Гауді", "Освячення Папою Римським", "Список спадщини ЮНЕСКО"],
      entityId: "Q8845"
    };
  } else if (query.includes('valladolid') || query.includes('santa cruz') || query.includes('вальядолід')) {
    if (lang === 'es') {
      return {
        buildYear: "1486 (Palacio de Santa Cruz)",
        style: "Plateresco / Renacimiento español",
        events: ["Bula papal de Sixto IV", "Carta fundacional de los Reyes Católicos", "Rectorado histórico de la UVa"],
        entityId: "Q1242314"
      };
    }
    if (lang === 'en') {
      return {
        buildYear: "1486 (Palacio de Santa Cruz)",
        style: "Plateresque / Renaissance",
        events: ["Papal Bull of Sixtus IV", "Royal Charter by Catholic Monarchs", "UVa Historic Rectorate"],
        entityId: "Q1242314"
      };
    }
    return {
      buildYear: "1486 (Палац Санта-Крус)",
      style: "Платереско / Ранній Ренесанс",
      events: ["Булла Папи Сікста IV", "Королівська грамота Католицьких королів", "Історичний ректорат UVa"],
      entityId: "Q1242314"
    };
  } else if (query.includes('cathedral') || query.includes('собор')) {
    if (lang === 'es') {
      return {
        buildYear: "1385 - 1490",
        style: "Gótico / Barroco",
        events: ["Sínodo episcopal", "Restauración histórica", "Declaración de Bien Cultural"],
        entityId: "Q2977"
      };
    }
    if (lang === 'en') {
      return {
        buildYear: "1385 - 1490",
        style: "Gothic / Baroque",
        events: ["Bishops Synod", "Historical Restoration", "Cultural Landmark Charter"],
        entityId: "Q2977"
      };
    }
    return {
      buildYear: "1385 — 1490",
      style: "Готика / Бароко",
      events: ["Єпископський синод", "Історична реставрація", "Статус пам'ятки культури"],
      entityId: "Q2977"
    };
  } else if (query.includes('colosseum') || query.includes('колізей')) {
    if (lang === 'es') {
      return {
        buildYear: "70–80 d.C.",
        style: "Arquitectura romana clásica",
        events: ["Inauguración por el emperador Tito", "Monumento de la dinastía Flavia", "Nuevas 7 maravillas del mundo"],
        entityId: "Q10285"
      };
    }
    if (lang === 'en') {
      return {
        buildYear: "70–80 AD",
        style: "Classical Roman Architecture",
        events: ["Inauguration by Emperor Titus", "Flavian Dynasty Monument", "New 7 Wonders of the World"],
        entityId: "Q10285"
      };
    }
    return {
      buildYear: "70–80 рр. н.е.",
      style: "Класична римська архітектура",
      events: ["Інавгурація імператором Тітом", "Монумент династії Флавіїв", "Нові 7 чудес світу"],
      entityId: "Q10285"
    };
  } else {
    const formattedName = poi.trim() || (lang === 'uk' ? 'Історичний об\'єкт' : lang === 'es' ? 'Objeto histórico' : 'Historical Object');
    if (lang === 'es') {
      return {
        buildYear: "Siglos XV-XIX",
        style: "Estilo arquitectónico regional",
        events: [`Fundación histórica de ${formattedName}`, `Integración patrimonial de ${formattedName}`],
        entityId: "Q-CUSTOM"
      };
    }
    if (lang === 'en') {
      return {
        buildYear: "Historical XV-XIX Century",
        style: "Regional Architectural Style",
        events: [`Historical foundation of ${formattedName}`, `Cultural heritage integration of ${formattedName}`],
        entityId: "Q-CUSTOM"
      };
    }
    return {
      buildYear: "XV-XIX ст.",
      style: "Регіональний архітектурний стиль",
      events: [`Історичне заснування: ${formattedName}`, `Культурна інтеграція: ${formattedName}`],
      entityId: "Q-CUSTOM"
    };
  }
}

export function buildPromptTemplate(
  subject: string,
  poiName: string,
  teacherNote: string,
  repo: string,
  wiki: WikidataInfo
): string {
  const eventsStr = wiki.events.length > 0 ? wiki.events.join(', ') : 'Nothing';
  return `You are a methodologist. Generate exactly three different options for task

Input data:
Subject: ${subject || 'General subject'}
POI: ${poiName || 'Unknown object'}
Course Repository: ${repo || 'None'}
Additional notes from the teacher: ${teacherNote || 'Nothing'}

Facts from Linked open data (Wikidata):
Year of construction: ${wiki.buildYear}
Architectural style: ${wiki.style}
Related events: ${eventsStr}

Generate 3 options in JSON format:
Variant 1 (Field Task)
Variant 2 (Analytical Case)
Variant 3 (Quiz)
`;
}

export function generateTaskVariants(
  lang: SupportedLanguage,
  subject: string,
  poi: string,
  teacherNote: string,
  wiki: WikidataInfo
): TaskVariants {
  const safeSubject = subject.trim() || (lang === 'uk' ? 'Історія архітектури' : lang === 'es' ? 'Historia de la Arquitectura' : 'History of Architecture');
  const safePoi = poi.trim() || (lang === 'uk' ? 'Об\'єкт спадщини' : lang === 'es' ? 'Sitio Histórico' : 'Historical Site');
  const noteText = teacherNote.trim();

  if (lang === 'uk') {
    return {
      variant1: {
        id: 1,
        tag: "Варіант 1: Польове завдання",
        tagClass: "bg-red-50 text-red-700 border-red-200",
        title: `Польове завдання: Натурний аналіз пам'ятки ${safePoi}`,
        body: `Виконайте польове обстеження об'єкта ${safePoi} у межах дисципліни "${safeSubject}". Дослідіть збережені елементи стилю (${wiki.style}), враховуючи часовий проміжок (${wiki.buildYear}). Зафіксуйте ключові конструктивні вузли. ${noteText ? `Вказівка викладача: ${noteText}` : 'Дотримуйтесь стандартного протоколу польової фіксації.'}`,
        source: "Wikidata AI Extraction"
      },
      variant2: {
        id: 2,
        tag: "Варіант 2: Аналітичний кейс",
        tagClass: "bg-amber-50 text-amber-800 border-amber-200",
        title: `Аналітичний кейс: Історичний та культурний контекст ${safePoi}`,
        body: `Підготуйте критичний аналітичний звіт щодо ролі ${safePoi} в еволюції міського простору. Проаналізуйте історичний контекст з огляду на ключові події (${wiki.events.join(', ')}). Проведіть порівняльний аналіз із супутніми архітектурними аналогами регіону.`,
        source: "Академічний модуль завдань"
      },
      variant3: {
        id: 3,
        tag: "Варіант 3: Експрес-Тест",
        tagClass: "bg-blue-50 text-blue-800 border-blue-200",
        title: `Контрольний експрес-тест: "${safeSubject}"`,
        body: `1. До якого архітектурного напряму належить ${safePoi}? (${wiki.style})\n2. Які хронологічні межі зведення об'єкта (${wiki.buildYear}) та ключові історичні віхи (${wiki.events[0] || 'заснування'})?\n3. Які специфічні конструктивні риси вирізняють пам'ятку серед споруд тієї ж епохи?`,
        source: "Assessment Quiz Module"
      }
    };
  }

  if (lang === 'es') {
    return {
      variant1: {
        id: 1,
        tag: "Variante 1: Tarea de Campo",
        tagClass: "bg-red-50 text-red-700 border-red-200",
        title: `Tarea de Campo: Análisis in situ de ${safePoi}`,
        body: `Realice una inspección directa de ${safePoi} en el marco de la asignatura "${safeSubject}". Examine los elementos característicos del estilo (${wiki.style}) y su cronología (${wiki.buildYear}). ${noteText ? `Nota del docente: ${noteText}` : 'Aplique el protocolo estándar de documentación patrimonial.'}`,
        source: "Extracción Wikidata AI"
      },
      variant2: {
        id: 2,
        tag: "Variante 2: Caso Analítico",
        tagClass: "bg-amber-50 text-amber-800 border-amber-200",
        title: `Caso Analítico: Relevancia histórica de ${safePoi}`,
        body: `Elabore un informe comparativo que examine el impacto de ${safePoi} a partir de los acontecimientos clave documentados (${wiki.events.join(', ')}). Analice las fuentes documentales e históricas.`,
        source: "Motor de Prompts Académicos"
      },
      variant3: {
        id: 3,
        tag: "Variante 3: Cuestionario / Quiz",
        tagClass: "bg-blue-50 text-blue-800 border-blue-200",
        title: `Cuestionario de Evaluación: "${safeSubject}"`,
        body: `1. ¿Qué corriente estilística define a ${safePoi}? (${wiki.style})\n2. Identifique la época de construcción (${wiki.buildYear}) y los hitos asociados (${wiki.events[0] || 'fundación'}).\n3. Resuma las características estructurales primordiales.`,
        source: "Módulo de Cuestionarios"
      }
    };
  }

  return {
    variant1: {
      id: 1,
      tag: "Variant 1: Field Task",
      tagClass: "bg-red-50 text-red-700 border-red-200",
      title: `Field Task: Direct Architectural Survey of ${safePoi}`,
      body: `Conduct an on-site field survey of ${safePoi} for the subject "${safeSubject}". Document features characteristic of ${wiki.style} dating from ${wiki.buildYear}. ${noteText ? `Teacher note: ${noteText}` : 'Follow standard heritage field recording standards.'}`,
      source: "Wikidata AI Extraction"
    },
    variant2: {
      id: 2,
      tag: "Variant 2: Analytical Case",
      tagClass: "bg-amber-50 text-amber-800 border-amber-200",
      title: `Analytical Case: Historical and Spatial Significance of ${safePoi}`,
      body: `Prepare a critical comparative paper examining the developmental trajectory of ${safePoi} in light of historical events (${wiki.events.join(', ')}). Synthesize archival data with current preservation status.`,
      source: "Academic Prompt Engine"
    },
    variant3: {
      id: 3,
      tag: "Variant 3: Assessment Quiz",
      tagClass: "bg-blue-50 text-blue-800 border-blue-200",
      title: `Assessment Quiz for "${safeSubject}"`,
      body: `1. Which architectural style governs ${safePoi}? (${wiki.style})\n2. What is the recorded period of construction (${wiki.buildYear}) and notable related milestones (${wiki.events[0] || 'foundational charter'})?\n3. Highlight the primary structural and decorative traits of the site.`,
      source: "Assessment Quiz Module"
    }
  };
}

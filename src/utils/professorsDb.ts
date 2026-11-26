/**
 * Database & State Management for UVa Professors and Educational Workspaces
 * Supports Ukrainian (uk), English (en), and Spanish (es)
 */
import type { SupportedLanguage } from './taskGenerator.ts';

export interface LocalizedString {
  uk: string;
  en: string;
  es: string;
}

export interface ProfessorCourse {
  id: string;
  code: string;
  title: LocalizedString;
  semester: LocalizedString;
  credits: number;
  groups: string[];
  enrolledStudents: number;
  academicYear: string; // e.g. "2026/2027", "2025/2026", "2024/2025", "2023/2024"
  isCurrentYear: boolean;
  syllabusTopic?: LocalizedString;
  passedStudents?: number;
}

export interface ProfessorDriveItem {
  id: string;
  name: LocalizedString;
  type: 'folder' | 'lecture' | 'test' | 'practice' | 'generated_task' | 'syllabus';
  folderCategory: 'lectures' | 'practices' | 'tests' | 'rag_tasks' | 'archive';
  courseId: string;
  group?: string;
  academicYear: string;
  updatedAt: LocalizedString;
  size?: string;
  fileName?: string;
  fileFormat?: string;
  contentPreview?: string;
  description: LocalizedString;
  generatedTasksCount?: number;
  tags?: string[];
  chunksCount?: number;
  embedProvider?: string;
}

export interface ProfessorFolderMeta {
  id: 'lectures' | 'practices' | 'tests' | 'rag_tasks' | 'archive';
  name: LocalizedString;
  description: LocalizedString;
  icon: string;
  color: string;
  badgeBg: string;
  borderColor: string;
}

export interface ProfessorProfile {
  id: string;
  login: string;
  name: LocalizedString;
  title: LocalizedString;
  faculty: LocalizedString;
  department: LocalizedString;
  specialty: LocalizedString;
  avatarBg: string;
  courses: ProfessorCourse[];
  driveItems: ProfessorDriveItem[];
  historyIds: string[];
}

export interface ProfessorDatabaseRecord {
  id: string;
  login: string;
  passwordHash: string; // 1111, 2222, 3333
  profile: ProfessorProfile;
}

export const DRIVE_FOLDERS_META: ProfessorFolderMeta[] = [
  {
    id: 'lectures',
    name: {
      uk: 'Лекції та теоретичні презентації',
      en: 'Lectures & Theory Presentations',
      es: 'Lecciones y Presentaciones Teóricas'
    },
    description: {
      uk: 'Тематичні слайди, конспекти та наукові огляди',
      en: 'Course lecture slides, syllabi and academic overviews',
      es: 'Diapositivas de asignaturas, guías docentes y resúmenes'
    },
    icon: 'BookOpen',
    color: 'text-amber-700 bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-800',
    borderColor: 'border-amber-200'
  },
  {
    id: 'practices',
    name: {
      uk: 'Практичні заняття та семінари',
      en: 'Practicals & Field Seminars',
      es: 'Prácticas de Campo y Seminarios'
    },
    description: {
      uk: 'Методичні протоколи, завдання та натурні обстеження',
      en: 'Methodological protocols, field assignments and worksheets',
      es: 'Protocolos metodológicos, asignaciones de campo y fichas'
    },
    icon: 'Layers',
    color: 'text-emerald-700 bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    borderColor: 'border-emerald-200'
  },
  {
    id: 'tests',
    name: {
      uk: 'Контрольні тести та опитування',
      en: 'Quizzes & Assessment Tests',
      es: 'Cuestionarios y Evaluaciones'
    },
    description: {
      uk: 'Модульні контрольні та екзаменаційні білети',
      en: 'Module quizzes, assessment banks and evaluation keys',
      es: 'Exámenes de módulo, bancos de preguntas y rúbricas'
    },
    icon: 'CheckSquare',
    color: 'text-blue-700 bg-blue-50',
    badgeBg: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-200'
  },
  {
    id: 'rag_tasks',
    name: {
      uk: 'Згенеровані завдання',
      en: 'Generated Tasks',
      es: 'Tareas Generadas'
    },
    description: {
      uk: 'Збережені триваріантні завдання на основі Wikidata та LLM',
      en: 'Saved 3-variant tasks grounded in Wikidata and LLM prompts',
      es: 'Variantes metodológicas guardadas basadas en Wikidata y LLM'
    },
    icon: 'Sparkles',
    color: 'text-purple-700 bg-purple-50',
    badgeBg: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-200'
  },
  {
    id: 'archive',
    name: {
      uk: 'Архів минулих навчальних років',
      en: 'Past Academic Years Archive',
      es: 'Archivo de Cursos Anteriores'
    },
    description: {
      uk: 'Матеріали та журнали 2025/2026, 2024/2025, 2023/2024 років',
      en: 'Materials and course archives from 2025/2026, 2024/2025, 2023/2024',
      es: 'Materiales y registros históricos de 2025/2026, 2024/2025 y 2023/2024'
    },
    icon: 'Archive',
    color: 'text-slate-700 bg-slate-100',
    badgeBg: 'bg-slate-200 text-slate-800',
    borderColor: 'border-slate-300'
  }
];

// Initial Database of Professors with complete multilingual entries
export const INITIAL_PROFESSORS_DB: ProfessorDatabaseRecord[] = [
  // =========================================================================
  // PROFESSOR 1 (1111 / 1111)
  // =========================================================================
  {
    id: "prof-1",
    login: "1111",
    passwordHash: "1111",
    profile: {
      id: "prof-1",
      login: "1111",
      name: {
        uk: "Професор 1: Д-р Алехандро Мартін",
        en: "Professor 1: Dr. Alejandro Martín",
        es: "Profesor 1: Dr. Alejandro Martín"
      },
      title: {
        uk: "Професор історії мистецтва та архітектури",
        en: "Chair Professor of Art History & Architecture",
        es: "Catedrático de Historia del Arte y Arquitectura"
      },
      faculty: {
        uk: "Факультет філософії та красного письменства",
        en: "Faculty of Philosophy and Letters",
        es: "Facultad de Filosofía y Letras"
      },
      department: {
        uk: "Кафедра історії архітектури та реставрації пам'яток",
        en: "Department of History of Architecture & Heritage Restoration",
        es: "Departamento de Historia de la Arquitectura y Restauración"
      },
      specialty: {
        uk: "Історія архітектури, Ренесанс та спадщина Кастилії",
        en: "History of Architecture, Renaissance & Castilian Heritage",
        es: "Historia de la Arquitectura, Renacimiento y Patrimonio de Castilla"
      },
      avatarBg: "bg-amber-600",
      courses: [
        // --- Current Academic Year (2026/2027) ---
        {
          id: "crs-101",
          code: "HIST-ARQ-1",
          title: {
            uk: "Загальна історія архітектури (Італія та Іспанія)",
            en: "General History of Architecture (Italy & Spain)",
            es: "Historia General de la Arquitectura (Italia y España)"
          },
          semester: {
            uk: "1 Семестр (1 Курс)",
            en: "1st Semester (1st Year)",
            es: "1er Semestre (1er Curso)"
          },
          credits: 6,
          groups: ["ARCH-11", "ARCH-12"],
          enrolledStudents: 54,
          academicYear: "2026/2027",
          isCurrentYear: true,
          syllabusTopic: {
            uk: "Античність, романіка, платереско та іспанський ренесанс",
            en: "Antiquity, Romanesque, Plateresque and Spanish Renaissance",
            es: "Antigüedad, Románico, Plateresco y Renacimiento Español"
          }
        },
        {
          id: "crs-102",
          code: "REN-BAR-3",
          title: {
            uk: "Ренесанс та бароко в Європі: Натурні дослідження",
            en: "Renaissance & Baroque in Europe: Fieldwork Studies",
            es: "Renacimiento y Barroco en Europa: Estudios de Campo"
          },
          semester: {
            uk: "1 Семестр (3 Курс)",
            en: "1st Semester (3rd Year)",
            es: "1er Semestre (3er Curso)"
          },
          credits: 6,
          groups: ["ARCH-31"],
          enrolledStudents: 28,
          academicYear: "2026/2027",
          isCurrentYear: true,
          syllabusTopic: {
            uk: "Архітектура Вальядоліда, палац Санта-Крус та кастильське бароко",
            en: "Valladolid architecture, Santa Cruz Palace and Castilian Baroque",
            es: "Arquitectura de Valladolid, Palacio de Santa Cruz y Barroco Castellano"
          }
        },
        {
          id: "crs-103",
          code: "REST-HERIT-5",
          title: {
            uk: "Реставрація культурної спадщини та методологія RAG",
            en: "Cultural Heritage Restoration & RAG Methodology",
            es: "Restauración del Patrimonio Cultural y Metodología RAG"
          },
          semester: {
            uk: "Магістратура (5 Курс)",
            en: "Master's Degree (5th Year)",
            es: "Máster Universitario (5º Curso)"
          },
          credits: 9,
          groups: ["MAG-ARCH-01"],
          enrolledStudents: 16,
          academicYear: "2026/2027",
          isCurrentYear: true,
          syllabusTopic: {
            uk: "Цифрова документація пам'яток, 3D сканування та інтеграція Wikidata",
            en: "Digital heritage documentation, 3D laser survey and Wikidata integration",
            es: "Documentación digital del patrimonio, escaneo 3D e integración con Wikidata"
          }
        },

        // --- Past Academic Year: 2025/2026 ---
        {
          id: "crs-104-p25",
          code: "HIST-ARQ-1-25",
          title: {
            uk: "Загальна історія архітектури (Повний курс)",
            en: "General History of Architecture (Full Course)",
            es: "Historia General de la Arquitectura (Curso Completo)"
          },
          semester: {
            uk: "1-2 Семестр (1 Курс)",
            en: "1st-2nd Semester (1st Year)",
            es: "1er-2º Semestre (1er Curso)"
          },
          credits: 6,
          groups: ["ARCH-11-2025", "ARCH-12-2025"],
          enrolledStudents: 52,
          academicYear: "2025/2026",
          isCurrentYear: false,
          passedStudents: 50
        },
        {
          id: "crs-105-p25",
          code: "MED-MON-2-25",
          title: {
            uk: "Середньовічні монастирі та собори Кастилії",
            en: "Medieval Monasteries and Cathedrals of Castile",
            es: "Monasterios y Catedrales Medievales de Castilla"
          },
          semester: {
            uk: "2 Семестр (2 Курс)",
            en: "2nd Semester (2nd Year)",
            es: "2º Semestre (2º Curso)"
          },
          credits: 6,
          groups: ["ARCH-21-2025"],
          enrolledStudents: 26,
          academicYear: "2025/2026",
          isCurrentYear: false,
          passedStudents: 25
        },

        // --- Past Academic Year: 2024/2025 ---
        {
          id: "crs-106-p24",
          code: "SPN-REN-3-24",
          title: {
            uk: "Іспанський ренесанс: Філіп II та Ескоріал",
            en: "Spanish Renaissance: Philip II and El Escorial",
            es: "Renacimiento Español: Felipe II y El Escorial"
          },
          semester: {
            uk: "1 Семестр (3 Курс)",
            en: "1st Semester (3rd Year)",
            es: "1er Semestre (3er Curso)"
          },
          credits: 6,
          groups: ["ARCH-31-2024"],
          enrolledStudents: 31,
          academicYear: "2024/2025",
          isCurrentYear: false,
          passedStudents: 29
        },

        // --- Past Academic Year: 2023/2024 ---
        {
          id: "crs-107-p23",
          code: "HERIT-DOC-4-23",
          title: {
            uk: "Методи польової фіксації пам'яток архітектури",
            en: "Field Documentation Methods for Historic Architecture",
            es: "Métodos de Documentación de Campo del Patrimonio Arquitectónico"
          },
          semester: {
            uk: "2 Семестр (4 Курс)",
            en: "2nd Semester (4th Year)",
            es: "2º Semestre (4º Curso)"
          },
          credits: 6,
          groups: ["ARCH-41-2023"],
          enrolledStudents: 24,
          academicYear: "2023/2024",
          isCurrentYear: false,
          passedStudents: 24
        }
      ],
      driveItems: [
        // Category: lectures
        {
          id: "drv-101",
          name: {
            uk: "Лекції 1-8: Від античності до проторенесансу",
            en: "Lectures 1-8: From Antiquity to Proto-Renaissance",
            es: "Lecciones 1-8: De la Antigüedad al Proto-Renacimiento"
          },
          type: "lecture",
          folderCategory: "lectures",
          courseId: "crs-101",
          group: "ARCH-11",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "02.11.2026",
            en: "Nov 02, 2026",
            es: "02/11/2026"
          },
          size: "4.2 MB",
          description: {
            uk: "Презентації лекцій зі структурними планами та ордерним аналізом",
            en: "Lecture presentations with structural floor plans and order analysis",
            es: "Presentaciones con planos estructurales y análisis de órdenes"
          }
        },
        // Category: practices
        {
          id: "drv-102",
          name: {
            uk: "Польова практика: Палац Санта-Крус та деталі платереско",
            en: "Field Practice: Santa Cruz Palace and Plateresque Details",
            es: "Práctica de Campo: Palacio de Santa Cruz y Detalles Platerescos"
          },
          type: "practice",
          folderCategory: "practices",
          courseId: "crs-102",
          group: "ARCH-31",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "26.10.2026",
            en: "Oct 26, 2026",
            es: "26/10/2026"
          },
          size: "1.8 MB",
          description: {
            uk: "Протоколи натурного огляду фасаду історичного ректорату UVa",
            en: "On-site survey protocols of the historic UVa rectorate facade",
            es: "Protocolos de inspección visual de la fachada del rectorado UVa"
          }
        },
        // Category: tests
        {
          id: "drv-103",
          name: {
            uk: "Тест 1: Хронологія та стилі середньовічної Кастилії",
            en: "Test 1: Chronology and Styles of Medieval Castile",
            es: "Cuestionario 1: Cronología y Estilos de Castilla Medieval"
          },
          type: "test",
          folderCategory: "tests",
          courseId: "crs-101",
          group: "ARCH-12",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "28.10.2026",
            en: "Oct 28, 2026",
            es: "28/10/2026"
          },
          size: "520 KB",
          description: {
            uk: "25 тестових запитань на знання дат та конструктивних елементів",
            en: "25 test questions covering historical dates and structural traits",
            es: "25 preguntas sobre cronología y características estructurales"
          }
        },
        // Category: rag_tasks
        {
          id: "drv-104",
          name: {
            uk: "Згенеровані завдання: University of Lviv & Santa Cruz",
            en: "Generated Tasks: University of Lviv & Santa Cruz",
            es: "Tareas Generadas: University of Lviv y Santa Cruz"
          },
          type: "generated_task",
          folderCategory: "rag_tasks",
          courseId: "crs-102",
          group: "ARCH-31",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "Сьогодні, 10:15",
            en: "Today, 10:15",
            es: "Hoy, 10:15"
          },
          size: "140 KB",
          description: {
            uk: "3 методичні варіанти завдань, згенеровані через Wikidata та RAG",
            en: "3 methodological task variants powered by Wikidata and RAG",
            es: "3 variantes metodológicas basadas en Wikidata y RAG"
          },
          generatedTasksCount: 3
        },
        // Category: archive (past years)
        {
          id: "drv-105-arch",
          name: {
            uk: "Архівований курс: Історія архітектури (2025/2026)",
            en: "Archived Course: History of Architecture (2025/2026)",
            es: "Curso Archivado: Historia de la Arquitectura (2025/2026)"
          },
          type: "syllabus",
          folderCategory: "archive",
          courseId: "crs-104-p25",
          group: "ARCH-11-2025",
          academicYear: "2025/2026",
          updatedAt: {
            uk: "15.06.2026",
            en: "Jun 15, 2026",
            es: "15/06/2026"
          },
          size: "12.4 MB",
          description: {
            uk: "Повний пакет матеріалів минулого року: 16 лекцій, 4 екзамени та відомості",
            en: "Complete past year archive: 16 lectures, 4 exams and student grading roster",
            es: "Paquete completo del curso anterior: 16 lecciones, 4 exámenes y actas"
          }
        },
        {
          id: "drv-106-arch",
          name: {
            uk: "Архівований фонд завдань: Філіп II та Ескоріал (2024/2025)",
            en: "Archived Assignment Bank: Philip II & El Escorial (2024/2025)",
            es: "Banco de Asignaciones Archivado: Felipe II y El Escorial (2024/2025)"
          },
          type: "practice",
          folderCategory: "archive",
          courseId: "crs-106-p24",
          group: "ARCH-31-2024",
          academicYear: "2024/2025",
          updatedAt: {
            uk: "22.05.2025",
            en: "May 22, 2025",
            es: "22/05/2025"
          },
          size: "8.1 MB",
          description: {
            uk: "Семінарські доповіді та матеріали дослідницьких проєктів 2024/2025",
            en: "Seminar papers and research coursework portfolios from 2024/2025",
            es: "Ponencias de seminario y portafolios de investigación de 2024/2025"
          }
        }
      ],
      historyIds: ["hist-1", "hist-2", "hist-3"]
    }
  },

  // =========================================================================
  // PROFESSOR 2 (2222 / 2222)
  // =========================================================================
  {
    id: "prof-2",
    login: "2222",
    passwordHash: "2222",
    profile: {
      id: "prof-2",
      login: "2222",
      name: {
        uk: "Професор 2: Д-р Карлос Санчес",
        en: "Professor 2: Dr. Carlos Sánchez",
        es: "Profesor 2: Dr. Carlos Sánchez"
      },
      title: {
        uk: "Професор комп'ютерних наук та штучного інтелекту",
        en: "Professor of Computer Science & Artificial Intelligence",
        es: "Catedrático de Inteligencia Artificial y Computación"
      },
      faculty: {
        uk: "Вища технічна школа комп'ютерної інженерії",
        en: "Higher Technical School of Computer Engineering",
        es: "Escuela Técnica Superior de Ingeniería Informática"
      },
      department: {
        uk: "Кафедра комп'ютерних наук та систем штучного інтелекту",
        en: "Department of Computer Science & AI Systems",
        es: "Departamento de Informática y Sistemas de Inteligencia Artificial"
      },
      specialty: {
        uk: "Штучний інтелект, RAG-системи та графові бази знань",
        en: "Artificial Intelligence, RAG Pipelines & Knowledge Graphs",
        es: "Inteligencia Artificial, Sistemas RAG y Grafos de Conocimiento"
      },
      avatarBg: "bg-blue-600",
      courses: [
        // --- Current Academic Year (2026/2027) ---
        {
          id: "crs-201",
          code: "AI-LLM-4",
          title: {
            uk: "Методи інференсу LLM: Groq, Ollama та LOD",
            en: "LLM Inference Architectures: Groq, Ollama & LOD",
            es: "Arquitecturas de Inferencia LLM: Groq, Ollama y LOD"
          },
          semester: {
            uk: "1 Семестр (4 Курс)",
            en: "1st Semester (4th Year)",
            es: "1er Semestre (4º Curso)"
          },
          credits: 6,
          groups: ["КН-41", "КН-42"],
          enrolledStudents: 62,
          academicYear: "2026/2027",
          isCurrentYear: true,
          syllabusTopic: {
            uk: "Локальний інференс, квантизація GGUF, Ollama та швидкі LPU чіпи Groq",
            en: "Local inference, GGUF quantization, Ollama and Groq LPU hardware",
            es: "Inferencia local, cuantización GGUF, Ollama y aceleradores LPU de Groq"
          }
        },
        {
          id: "crs-202",
          code: "RAG-ENG-2",
          title: {
            uk: "Семантичний веб та Linked Open Data (Wikidata)",
            en: "Semantic Web & Linked Open Data (Wikidata)",
            es: "Web Semántica y Datos Abiertos Enlazados (Wikidata)"
          },
          semester: {
            uk: "2 Семестр (2 Курс)",
            en: "2nd Semester (2nd Year)",
            es: "2º Semestre (2º Curso)"
          },
          credits: 6,
          groups: ["КН-21"],
          enrolledStudents: 34,
          academicYear: "2026/2027",
          isCurrentYear: true,
          syllabusTopic: {
            uk: "SPARQL-запити, онтології, трійки RDF та автоматичне збагачення контексту",
            en: "SPARQL endpoints, ontologies, RDF triples and context augmentation",
            es: "Endpoints SPARQL, ontologías, tripletas RDF y enriquecimiento de contexto"
          }
        },

        // --- Past Academic Year: 2025/2026 ---
        {
          id: "crs-203-p25",
          code: "AI-FND-3-25",
          title: {
            uk: "Основи машинного навчання та нейромережі",
            en: "Foundations of Machine Learning & Neural Networks",
            es: "Fundamentos de Aprendizaje Automático y Redes Neuronales"
          },
          semester: {
            uk: "1 Семестр (3 Курс)",
            en: "1st Semester (3rd Year)",
            es: "1er Semestre (3er Curso)"
          },
          credits: 6,
          groups: ["КН-31-2025"],
          enrolledStudents: 45,
          academicYear: "2025/2026",
          isCurrentYear: false,
          passedStudents: 43
        },
        // --- Past Academic Year: 2024/2025 ---
        {
          id: "crs-204-p24",
          code: "NLP-SEM-4-24",
          title: {
            uk: "Обробка природної мови (NLP) та семантичний аналіз",
            en: "Natural Language Processing & Semantic Analysis",
            es: "Procesamiento del Lenguaje Natural y Análisis Semántico"
          },
          semester: {
            uk: "2 Семестр (4 Курс)",
            en: "2nd Semester (4th Year)",
            es: "2º Semestre (4º Curso)"
          },
          credits: 6,
          groups: ["КН-41-2024"],
          enrolledStudents: 38,
          academicYear: "2024/2025",
          isCurrentYear: false,
          passedStudents: 37
        }
      ],
      driveItems: [
        {
          id: "drv-201",
          name: {
            uk: "Конспект: RAG архітектура та семантичний пошук",
            en: "Lecture Guide: RAG Pipeline & Semantic Search",
            es: "Guía de Estudio: Arquitectura RAG y Búsqueda Semántica"
          },
          type: "lecture",
          folderCategory: "lectures",
          courseId: "crs-201",
          group: "КН-41",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "01.11.2026",
            en: "Nov 01, 2026",
            es: "01/11/2026"
          },
          size: "3.5 MB",
          description: {
            uk: "Векторизація тексту, ембеддінги та підбір чанків",
            en: "Text vectorization, embeddings and chunk retrieval",
            es: "Vectorización de texto, embeddings y recuperación de fragmentos"
          }
        },
        {
          id: "drv-202",
          name: {
            uk: "Лабораторна робота: Підключення SPARQL до Wikidata",
            en: "Lab Assignment: Connecting SPARQL with Wikidata",
            es: "Laboratorio: Conexión SPARQL con Wikidata"
          },
          type: "practice",
          folderCategory: "practices",
          courseId: "crs-202",
          group: "КН-21",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "27.10.2026",
            en: "Oct 27, 2026",
            es: "27/10/2026"
          },
          size: "890 KB",
          description: {
            uk: "Практикум із вилучення відкритих даних про архітектурні об'єкти",
            en: "Hands-on exercises extracting linked open data for heritage sites",
            es: "Ejercicios prácticos de extracción de datos abiertos enlazados"
          }
        },
        {
          id: "drv-203",
          name: {
            uk: "Згенеровані тести: Groq vs Ollama Performance",
            en: "Generated Quiz: Groq vs Ollama Performance",
            es: "Cuestionario Generado: Rendimiento de Groq vs Ollama"
          },
          type: "generated_task",
          folderCategory: "rag_tasks",
          courseId: "crs-201",
          group: "КН-42",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "30.10.2026",
            en: "Oct 30, 2026",
            es: "30/10/2026"
          },
          size: "210 KB",
          description: {
            uk: "Тестові сценарії для оцінки пропускної здатності та затримок",
            en: "Assessment scenarios measuring token throughput and latency",
            es: "Escenarios de evaluación de rendimiento y latencia de tokens"
          },
          generatedTasksCount: 3
        },
        {
          id: "drv-204-arch",
          name: {
            uk: "Архів: Курс нейронних мереж (2025/2026)",
            en: "Archive: Neural Networks Coursework (2025/2026)",
            es: "Archivo: Prácticas de Redes Neuronales (2025/2026)"
          },
          type: "syllabus",
          folderCategory: "archive",
          courseId: "crs-203-p25",
          group: "КН-31-2025",
          academicYear: "2025/2026",
          updatedAt: {
            uk: "10.06.2026",
            en: "Jun 10, 2026",
            es: "10/06/2026"
          },
          size: "15.8 MB",
          description: {
            uk: "Повний архів лабораторних робіт та коду Jupyter Notebooks 2025/2026",
            en: "Complete lab notebooks and project source code from 2025/2026",
            es: "Cuadernos de laboratorio y código fuente de proyectos de 2025/2026"
          }
        }
      ],
      historyIds: ["hist-1"]
    }
  },

  // =========================================================================
  // PROFESSOR 3 (3333 / 3333)
  // =========================================================================
  {
    id: "prof-3",
    login: "3333",
    passwordHash: "3333",
    profile: {
      id: "prof-3",
      login: "3333",
      name: {
        uk: "Професор 3: Д-р Беатріс Ернандес",
        en: "Professor 3: Dr. Beatriz Hernández",
        es: "Profesor 3: Dra. Beatriz Hernández"
      },
      title: {
        uk: "Професор музеології та управління спадщиною",
        en: "Professor of Museology & Cultural Heritage Management",
        es: "Catedrática de Museología y Gestión del Patrimonio"
      },
      faculty: {
        uk: "Факультет філософії та красного письменства",
        en: "Faculty of Philosophy and Letters",
        es: "Facultad de Filosofía y Letras"
      },
      department: {
        uk: "Кафедра музеології та збереження культурних цінностей",
        en: "Department of Museology & Cultural Assets Preservation",
        es: "Departamento de Museología y Conservación de Bienes Culturales"
      },
      specialty: {
        uk: "Культурна спадщина ЮНЕСКО, пам'яткознавство та музейна справа",
        en: "UNESCO Cultural Heritage, Monument Conservation & Museology",
        es: "Patrimonio Cultural UNESCO, Monumentos y Museología"
      },
      avatarBg: "bg-emerald-600",
      courses: [
        // --- Current Academic Year (2026/2027) ---
        {
          id: "crs-301",
          code: "PATR-EUR-2",
          title: {
            uk: "Культурна спадщина Європи та пам'ятки ЮНЕСКО",
            en: "European Cultural Heritage & UNESCO Monuments",
            es: "Patrimonio Cultural Europeo y Monumentos UNESCO"
          },
          semester: {
            uk: "1 Семестр (2 Курс)",
            en: "1st Semester (2nd Year)",
            es: "1er Semestre (2º Curso)"
          },
          credits: 6,
          groups: ["ІСТ-21", "КУЛЬТ-21"],
          enrolledStudents: 45,
          academicYear: "2026/2027",
          isCurrentYear: true,
          syllabusTopic: {
            uk: "Критерії відбору ЮНЕСКО, Саграда Фамілія, спадщина Вальядоліда та Сеговії",
            en: "UNESCO selection criteria, Sagrada Familia, Valladolid & Segovia heritage",
            es: "Criterios UNESCO, Sagrada Familia, patrimonio de Valladolid y Segovia"
          }
        },
        {
          id: "crs-302",
          code: "URB-HIST-4",
          title: {
            uk: "Містобудування та історичні зони міст",
            en: "Urbanism & Historic Urban Landscapes",
            es: "Urbanismo y Paisajes Urbanos Históricos"
          },
          semester: {
            uk: "2 Семестр (4 Курс)",
            en: "2nd Semester (4th Year)",
            es: "2º Semestre (4º Curso)"
          },
          credits: 6,
          groups: ["ІСТ-41"],
          enrolledStudents: 22,
          academicYear: "2026/2027",
          isCurrentYear: true,
          syllabusTopic: {
            uk: "Ревіталізація історичних центрів, музейні кластери та туристичні потоки",
            en: "Historic city center revitalization, museum clusters and visitor flow",
            es: "Revitalización de centros históricos, distritos museísticos y gestión turística"
          }
        },

        // --- Past Academic Year: 2025/2026 ---
        {
          id: "crs-303-p25",
          code: "MUS-EXPO-3-25",
          title: {
            uk: "Музейні експозиції та кураторські практики",
            en: "Museum Exhibitions & Curatorial Practices",
            es: "Exposiciones Museísticas y Prácticas Curatoriales"
          },
          semester: {
            uk: "1 Семестр (3 Курс)",
            en: "1st Semester (3rd Year)",
            es: "1er Semestre (3er Curso)"
          },
          credits: 6,
          groups: ["КУЛЬТ-31-2025"],
          enrolledStudents: 29,
          academicYear: "2025/2026",
          isCurrentYear: false,
          passedStudents: 28
        },
        // --- Past Academic Year: 2024/2025 ---
        {
          id: "crs-304-p24",
          code: "ARCHV-DOC-2-24",
          title: {
            uk: "Архівні колекції та каталогізація артефактів",
            en: "Archive Collections & Artifact Cataloging",
            es: "Colecciones de Archivo y Catalogación de Bienes"
          },
          semester: {
            uk: "2 Семестр (2 Курс)",
            en: "2nd Semester (2nd Year)",
            es: "2º Semestre (2º Curso)"
          },
          credits: 6,
          groups: ["ІСТ-22-2024"],
          enrolledStudents: 31,
          academicYear: "2024/2025",
          isCurrentYear: false,
          passedStudents: 30
        }
      ],
      driveItems: [
        {
          id: "drv-301",
          name: {
            uk: "Методичні вказівки: ЮНЕСКО та пам'яткоохоронні зони",
            en: "Methodological Guidelines: UNESCO & Heritage Buffer Zones",
            es: "Guía Metodológica: UNESCO y Zonas de Amortiguamiento"
          },
          type: "lecture",
          folderCategory: "lectures",
          courseId: "crs-301",
          group: "ІСТ-21",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "25.10.2026",
            en: "Oct 25, 2026",
            es: "25/10/2026"
          },
          size: "2.8 MB",
          description: {
            uk: "Міжнародні конвенції, пам'ятки світової спадщини та звіти ICOMOS",
            en: "International conventions, world heritage sites and ICOMOS reports",
            es: "Convenios internacionales, sitios de patrimonio y reportes ICOMOS"
          }
        },
        {
          id: "drv-302",
          name: {
            uk: "Експрес-контроль знань архітектурних стилів",
            en: "Express Quiz: Historic Architectural Styles",
            es: "Cuestionario Rápido: Estilos Arquitectónicos Históricos"
          },
          type: "test",
          folderCategory: "tests",
          courseId: "crs-302",
          group: "ІСТ-41",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "20.10.2026",
            en: "Oct 20, 2026",
            es: "20/10/2026"
          },
          size: "620 KB",
          description: {
            uk: "Експрес-контроль знань архітектурних стилів",
            en: "Express assessment of architectural style mastery",
            es: "Evaluación rápida del conocimiento de estilos arquitectónicos"
          }
        },
        {
          id: "drv-303",
          name: {
            uk: "Польове дослідження: Саграда Фамілія та Гауді",
            en: "Fieldwork Case: Sagrada Familia and Gaudí",
            es: "Caso de Campo: Sagrada Familia y Gaudí"
          },
          type: "practice",
          folderCategory: "practices",
          courseId: "crs-301",
          group: "КУЛЬТ-21",
          academicYear: "2026/2027",
          updatedAt: {
            uk: "18.10.2026",
            en: "Oct 18, 2026",
            es: "18/10/2026"
          },
          size: "1.9 MB",
          description: {
            uk: "Методологія аналізу конструктивних рішень каталонського модернізму",
            en: "Structural analysis methodology of Catalan modernism",
            es: "Metodología de análisis estructural del modernismo catalán"
          }
        },
        {
          id: "drv-304-arch",
          name: {
            uk: "Архів: Музейні експозиції (2025/2026)",
            en: "Archive: Museum Exhibition Plans (2025/2026)",
            es: "Archivo: Planes de Exposición Museística (2025/2026)"
          },
          type: "syllabus",
          folderCategory: "archive",
          courseId: "crs-303-p25",
          group: "КУЛЬТ-31-2025",
          academicYear: "2025/2026",
          updatedAt: {
            uk: "18.06.2026",
            en: "Jun 18, 2026",
            es: "18/06/2026"
          },
          size: "9.4 MB",
          description: {
            uk: "Каталог студентських кураторських проєктів та експозиційних схем 2025/2026",
            en: "Curatorial project catalogs and exhibition floor plans from 2025/2026",
            es: "Catálogo de proyectos curatoriales y planos expositivos de 2025/2026"
          }
        }
      ],
      historyIds: ["hist-2", "hist-1"]
    }
  }
];

const LOCAL_STORAGE_DB_KEY = 'uva_professors_db_v3';
const LOCAL_STORAGE_SESSION_KEY = 'uva_active_professor_v3';
const LOCAL_STORAGE_ADMIN_KEY = 'uva_active_admin_v3';

export interface AdminProfile {
  id: string;
  login: string;
  role?: 'manager' | 'admin';
  name: LocalizedString;
  roleTitle: LocalizedString;
  email: string;
}

export const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  id: 'mgr-1',
  login: 'manager',
  role: 'manager',
  name: {
    uk: 'Менеджер акаунтів UVa',
    en: 'UVa Account Manager',
    es: 'Gestor de Cuentas UVa'
  },
  roleTitle: {
    uk: 'Тільки керування обліковими записами викладачів',
    en: 'Teacher & Professor Account Management Only',
    es: 'Solo gestión de cuentas de profesores'
  },
  email: 'accounts.manager@uva.es'
};

export function authenticateAdmin(login: string, pass: string): AdminProfile | null {
  const trimmedLogin = login.trim().toLowerCase();
  const trimmedPass = pass.trim();
  if ((trimmedLogin === 'manager' && trimmedPass === 'manager') || (trimmedLogin === 'admin' && trimmedPass === 'admin')) {
    return {
      ...DEFAULT_ADMIN_PROFILE,
      login: trimmedLogin,
    };
  }
  return null;
}

export function getActiveAdminSession(): AdminProfile | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {
    // fallback
  }
  return null;
}

export function setActiveAdminSession(admin: AdminProfile | null): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (admin) {
        localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(admin));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ADMIN_KEY);
      }
    }
  } catch {
    // ignore
  }
}

export function getProfessorsDatabase(): ProfessorDatabaseRecord[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_PROFESSORS_DB;
}

export function saveProfessorsDatabase(db: ProfessorDatabaseRecord[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(db));
    }
  } catch {
    // ignore
  }
}

export function getActiveProfessorSession(): ProfessorProfile | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (raw) {
        const parsed: ProfessorProfile = JSON.parse(raw);
        // Always sync with latest DB state if available
        const db = getProfessorsDatabase();
        const latest = db.find((r) => r.id === parsed.id);
        return latest ? latest.profile : parsed;
      }
    }
  } catch {
    // fallback
  }
  return null;
}

export function setActiveProfessorSession(prof: ProfessorProfile | null): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (prof) {
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(prof));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }
    }
  } catch {
    // ignore
  }
}

export function authenticateProfessor(login: string, pass: string, customDb?: ProfessorDatabaseRecord[]): ProfessorProfile | null {
  const db = customDb || getProfessorsDatabase();
  const trimmedLogin = login.trim();
  const trimmedPass = pass.trim();

  const found = db.find(
    (record) => record.login === trimmedLogin && record.passwordHash === trimmedPass
  );

  return found ? found.profile : null;
}

// =========================================================================
// HELPER: Build trilingual string from plain input or object
// =========================================================================
export function makeLocStr(value: string | LocalizedString): LocalizedString {
  if (typeof value === 'string') {
    const clean = value.trim();
    return { uk: clean, en: clean, es: clean };
  }
  return value;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '128 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =========================================================================
// ADMINISTRATOR CRUD: TEACHERS
// =========================================================================
export interface TeacherInput {
  login: string;
  password: string;
  name: string | LocalizedString;
  title: string | LocalizedString;
  faculty: string | LocalizedString;
  department: string | LocalizedString;
  specialty: string | LocalizedString;
  avatarBg?: string;
}

export function createTeacherInDb(
  db: ProfessorDatabaseRecord[],
  input: TeacherInput
): { db: ProfessorDatabaseRecord[]; created: ProfessorDatabaseRecord } {
  const trimmedLogin = input.login.trim();
  if (!trimmedLogin) {
    throw new Error('Teacher login is required');
  }
  if (db.some((r) => r.login.toLowerCase() === trimmedLogin.toLowerCase())) {
    throw new Error(`Login "${trimmedLogin}" is already in use`);
  }

  const id = `prof-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const profile: ProfessorProfile = {
    id,
    login: trimmedLogin,
    name: makeLocStr(input.name),
    title: makeLocStr(input.title),
    faculty: makeLocStr(input.faculty),
    department: makeLocStr(input.department),
    specialty: makeLocStr(input.specialty),
    avatarBg: input.avatarBg || 'bg-[#7A1C30]',
    courses: [],
    driveItems: [],
    historyIds: []
  };

  const record: ProfessorDatabaseRecord = {
    id,
    login: trimmedLogin,
    passwordHash: input.password.trim() || trimmedLogin,
    profile
  };

  const nextDb = [...db, record];
  saveProfessorsDatabase(nextDb);
  return { db: nextDb, created: record };
}

export function updateTeacherInDb(
  db: ProfessorDatabaseRecord[],
  teacherId: string,
  updates: Partial<TeacherInput>
): ProfessorDatabaseRecord[] {
  const nextDb = db.map((record) => {
    if (record.id !== teacherId) return record;
    const nextLogin = updates.login !== undefined ? updates.login.trim() : record.login;
    const nextPass = updates.password !== undefined && updates.password.trim() !== ''
      ? updates.password.trim()
      : record.passwordHash;

    const updatedProfile: ProfessorProfile = {
      ...record.profile,
      login: nextLogin,
      name: updates.name !== undefined ? makeLocStr(updates.name) : record.profile.name,
      title: updates.title !== undefined ? makeLocStr(updates.title) : record.profile.title,
      faculty: updates.faculty !== undefined ? makeLocStr(updates.faculty) : record.profile.faculty,
      department: updates.department !== undefined ? makeLocStr(updates.department) : record.profile.department,
      specialty: updates.specialty !== undefined ? makeLocStr(updates.specialty) : record.profile.specialty,
      avatarBg: updates.avatarBg || record.profile.avatarBg
    };

    return {
      ...record,
      login: nextLogin,
      passwordHash: nextPass,
      profile: updatedProfile
    };
  });

  saveProfessorsDatabase(nextDb);
  return nextDb;
}

export function deleteTeacherFromDb(
  db: ProfessorDatabaseRecord[],
  teacherId: string
): ProfessorDatabaseRecord[] {
  const nextDb = db.filter((r) => r.id !== teacherId);
  saveProfessorsDatabase(nextDb);
  return nextDb;
}

// =========================================================================
// TEACHER CRUD: COURSES (Each course owns a repository of documents)
// =========================================================================
export interface CourseInput {
  code: string;
  title: string | LocalizedString;
  semester: string | LocalizedString;
  credits: number;
  groups: string[];
  enrolledStudents: number;
  academicYear: string;
  isCurrentYear: boolean;
  syllabusTopic?: string | LocalizedString;
}

export function addCourseToProfessorInDb(
  db: ProfessorDatabaseRecord[],
  professorId: string,
  input: CourseInput
): { db: ProfessorDatabaseRecord[]; createdCourse: ProfessorCourse; updatedProfessor: ProfessorProfile | null } {
  const createdCourse: ProfessorCourse = {
    id: `crs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    code: input.code.trim().toUpperCase(),
    title: makeLocStr(input.title),
    semester: makeLocStr(input.semester),
    credits: Number(input.credits) || 6,
    groups: input.groups.length > 0 ? input.groups : ['GRP-01'],
    enrolledStudents: Number(input.enrolledStudents) || 25,
    academicYear: input.academicYear || '2026/2027',
    isCurrentYear: input.isCurrentYear,
    syllabusTopic: input.syllabusTopic ? makeLocStr(input.syllabusTopic) : undefined
  };

  let updatedProfessor: ProfessorProfile | null = null;
  const nextDb = db.map((record) => {
    if (record.id !== professorId) return record;
    updatedProfessor = {
      ...record.profile,
      courses: [createdCourse, ...record.profile.courses]
    };
    return { ...record, profile: updatedProfessor };
  });

  saveProfessorsDatabase(nextDb);
  return { db: nextDb, createdCourse, updatedProfessor };
}

export function updateCourseInProfessorInDb(
  db: ProfessorDatabaseRecord[],
  professorId: string,
  courseId: string,
  updates: Partial<CourseInput>
): { db: ProfessorDatabaseRecord[]; updatedProfessor: ProfessorProfile | null } {
  let updatedProfessor: ProfessorProfile | null = null;

  const nextDb = db.map((record) => {
    if (record.id !== professorId) return record;
    const nextCourses = record.profile.courses.map((c) => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        code: updates.code !== undefined ? updates.code.trim().toUpperCase() : c.code,
        title: updates.title !== undefined ? makeLocStr(updates.title) : c.title,
        semester: updates.semester !== undefined ? makeLocStr(updates.semester) : c.semester,
        credits: updates.credits !== undefined ? Number(updates.credits) : c.credits,
        groups: updates.groups !== undefined ? updates.groups : c.groups,
        enrolledStudents: updates.enrolledStudents !== undefined ? Number(updates.enrolledStudents) : c.enrolledStudents,
        academicYear: updates.academicYear !== undefined ? updates.academicYear : c.academicYear,
        isCurrentYear: updates.isCurrentYear !== undefined ? updates.isCurrentYear : c.isCurrentYear,
        syllabusTopic: updates.syllabusTopic !== undefined ? makeLocStr(updates.syllabusTopic) : c.syllabusTopic
      };
    });
    updatedProfessor = {
      ...record.profile,
      courses: nextCourses
    };
    return { ...record, profile: updatedProfessor };
  });

  saveProfessorsDatabase(nextDb);
  return { db: nextDb, updatedProfessor };
}

export function deleteCourseFromProfessorInDb(
  db: ProfessorDatabaseRecord[],
  professorId: string,
  courseId: string
): { db: ProfessorDatabaseRecord[]; updatedProfessor: ProfessorProfile | null } {
  let updatedProfessor: ProfessorProfile | null = null;

  const nextDb = db.map((record) => {
    if (record.id !== professorId) return record;
    updatedProfessor = {
      ...record.profile,
      courses: record.profile.courses.filter((c) => c.id !== courseId),
      // Cascade deletion: clean up documents belonging to that course repository
      driveItems: record.profile.driveItems.filter((doc) => doc.courseId !== courseId)
    };
    return { ...record, profile: updatedProfessor };
  });

  saveProfessorsDatabase(nextDb);
  return { db: nextDb, updatedProfessor };
}

// =========================================================================
// TEACHER CRUD: DOCUMENTS IN EACH COURSE REPOSITORY
// =========================================================================
export interface DocumentInput {
  name: string | LocalizedString;
  type: ProfessorDriveItem['type'];
  folderCategory: ProfessorDriveItem['folderCategory'];
  courseId: string;
  group?: string;
  academicYear: string;
  size?: string;
  fileName?: string;
  fileFormat?: string;
  contentPreview?: string;
  description: string | LocalizedString;
}

export function getCourseDocuments(professor: ProfessorProfile, courseId: string): ProfessorDriveItem[] {
  return professor.driveItems.filter((doc) => doc.courseId === courseId);
}

export function addDocumentToCourseInDb(
  db: ProfessorDatabaseRecord[],
  professorId: string,
  input: DocumentInput
): { db: ProfessorDatabaseRecord[]; createdDocument: ProfessorDriveItem; updatedProfessor: ProfessorProfile | null } {
  const nowStr = new Date().toLocaleDateString('uk-UA');
  const nowEn = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const nowEs = new Date().toLocaleDateString('es-ES');

  const createdDocument: ProfessorDriveItem = {
    id: `drv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: makeLocStr(input.name),
    type: input.type || 'lecture',
    folderCategory: input.folderCategory || 'lectures',
    courseId: input.courseId,
    group: input.group || '',
    academicYear: input.academicYear || '2026/2027',
    updatedAt: { uk: nowStr, en: nowEn, es: nowEs },
    size: input.size || '1.2 MB',
    fileName: input.fileName || 'document.pdf',
    fileFormat: input.fileFormat || 'PDF',
    contentPreview: input.contentPreview,
    description: makeLocStr(input.description)
  };

  let updatedProfessor: ProfessorProfile | null = null;
  const nextDb = db.map((record) => {
    if (record.id !== professorId) return record;
    updatedProfessor = {
      ...record.profile,
      driveItems: [createdDocument, ...record.profile.driveItems]
    };
    return { ...record, profile: updatedProfessor };
  });

  saveProfessorsDatabase(nextDb);
  return { db: nextDb, createdDocument, updatedProfessor };
}

export function updateDocumentInCourseInDb(
  db: ProfessorDatabaseRecord[],
  professorId: string,
  documentId: string,
  updates: Partial<DocumentInput>
): { db: ProfessorDatabaseRecord[]; updatedProfessor: ProfessorProfile | null } {
  let updatedProfessor: ProfessorProfile | null = null;
  const nowStr = new Date().toLocaleDateString('uk-UA');
  const nowEn = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const nowEs = new Date().toLocaleDateString('es-ES');

  const nextDb = db.map((record) => {
    if (record.id !== professorId) return record;
    const nextItems = record.profile.driveItems.map((doc) => {
      if (doc.id !== documentId) return doc;
      return {
        ...doc,
        name: updates.name !== undefined ? makeLocStr(updates.name) : doc.name,
        type: updates.type !== undefined ? updates.type : doc.type,
        folderCategory: updates.folderCategory !== undefined ? updates.folderCategory : doc.folderCategory,
        courseId: updates.courseId !== undefined ? updates.courseId : doc.courseId,
        group: updates.group !== undefined ? updates.group : doc.group,
        academicYear: updates.academicYear !== undefined ? updates.academicYear : doc.academicYear,
        size: updates.size !== undefined ? updates.size : doc.size,
        fileName: updates.fileName !== undefined ? updates.fileName : doc.fileName,
        fileFormat: updates.fileFormat !== undefined ? updates.fileFormat : doc.fileFormat,
        contentPreview: updates.contentPreview !== undefined ? updates.contentPreview : doc.contentPreview,
        description: updates.description !== undefined ? makeLocStr(updates.description) : doc.description,
        updatedAt: { uk: nowStr, en: nowEn, es: nowEs }
      };
    });
    updatedProfessor = {
      ...record.profile,
      driveItems: nextItems
    };
    return { ...record, profile: updatedProfessor };
  });

  saveProfessorsDatabase(nextDb);
  return { db: nextDb, updatedProfessor };
}

export function deleteDocumentFromCourseInDb(
  db: ProfessorDatabaseRecord[],
  professorId: string,
  documentId: string
): { db: ProfessorDatabaseRecord[]; updatedProfessor: ProfessorProfile | null } {
  let updatedProfessor: ProfessorProfile | null = null;

  const nextDb = db.map((record) => {
    if (record.id !== professorId) return record;
    updatedProfessor = {
      ...record.profile,
      driveItems: record.profile.driveItems.filter((doc) => doc.id !== documentId)
    };
    return { ...record, profile: updatedProfessor };
  });

  saveProfessorsDatabase(nextDb);
  return { db: nextDb, updatedProfessor };
}

// Helper to safely get localized string with fallback
export function getLocStr(loc: LocalizedString | string | undefined, lang: SupportedLanguage): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  return loc[lang] || loc.en || loc.uk || loc.es || '';
}

// Helper: Filter courses by current academic year
export function getCurrentCourses(courses: ProfessorCourse[]): ProfessorCourse[] {
  return courses.filter((c) => c.isCurrentYear);
}

// Helper: Group past courses by academic year
export function getPastCoursesGroupedByYear(courses: ProfessorCourse[]): Record<string, ProfessorCourse[]> {
  const past = courses.filter((c) => !c.isCurrentYear);
  const grouped: Record<string, ProfessorCourse[]> = {};

  past.forEach((course) => {
    const year = course.academicYear || '2025/2026';
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(course);
  });

  return grouped;
}

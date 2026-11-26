/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Globe,
  Search,
  PenSquare,
  BookOpen,
  Landmark,
  FolderOpen,
  Sparkles,
  FileText,
  Edit,
  RotateCw,
  Cpu,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  UserCheck,
  LogOut,
  Shield,
  Send,
  AlertCircle,
  History,
  Upload,
  Terminal,
  ClipboardCheck
} from 'lucide-react';
import {
  analyzePoiData,
  generateTaskVariants,
  WikidataInfo,
  TaskVariants,
  TaskItem,
  SupportedLanguage,
  ActivityRecord,
  ActivityStatus,
  RagDebugTrace
} from './utils/taskGenerator.ts';
import {
  AdminProfile,
  ProfessorDatabaseRecord,
  ProfessorProfile,
  TeacherInput,
  CourseInput,
  DocumentInput,
  getProfessorsDatabase,
  getActiveProfessorSession,
  setActiveProfessorSession,
  getActiveAdminSession,
  setActiveAdminSession,
  getCourseDocuments,
  getLocStr
} from './utils/professorsDb.ts';
import {
  AppView,
  AppTheme,
  NavigationState,
  createNavigationState,
  pushView,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  getCurrentView,
  saveFormDraft,
  loadFormDraft,
  getStoredTheme,
  setStoredTheme
} from './utils/navigationState.ts';
import {
  apiCreateActivity,
  apiCreateCourse,
  apiCreateTeacher,
  apiDeleteActivity,
  apiDeleteCourse,
  apiDeleteDocument,
  apiDeleteHistory,
  apiDeleteTeacher,
  apiGenerateRagTasks,
  apiGetDocumentContent,
  apiGetMe,
  apiGetTeachers,
  apiSaveHistory,
  apiSendLocalRagChat,
  apiUpdateActivity,
  apiUpdateCourse,
  apiUpdateDocument,
  apiUpdateTeacher,
  apiUploadDocument,
  apiUploadFileToLocalRag,
  getStoredAuthToken,
  setStoredAuthToken,
  type ChatHistoryMessage,
  type RankedRagChunkClient,
  type ServerHistoryRecord
} from './utils/apiClient.ts';
import type { ChatUiMessage } from './utils/ragChatClient.ts';
import { EditTaskModal } from './components/EditTaskModal.tsx';
import { ExplainModal } from './components/ExplainModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { ProfessorDashboard } from './components/ProfessorDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { UniversityHomePage } from './components/UniversityHomePage.tsx';
import { Toast } from './components/Toast.tsx';

// Course repository definitions for Universidad de Valladolid
const COURSE_REPOSITORIES = {
  uk: [
    { id: "repo1", label: "1 Курс: Загальна Історія Архітектури" },
    { id: "repo2", label: "1 Курс: Основи Мистецтва та Дизайну" },
    { id: "repo3", label: "2 Курс: Культурна Спадщина Європи" },
    { id: "repo4", label: "2 Курс: Середньовічна Архітектура та Монастирі" },
    { id: "repo5", label: "3 Курс: Ренесанс та Бароко" },
    { id: "repo6", label: "3 Курс: Містобудування та Історичні Зони" },
    { id: "repo7", label: "4 Курс: Модерн та Сучасна Архітектура" },
    { id: "repo8", label: "4 Курс: Архівні Дослідження та Польова Робота" },
    { id: "repo9", label: "5 Курс (Магістратура): Реставрація Спадщини" },
    { id: "repo10", label: "6 Курс (Магістратура): Управління Культурними Об'єктами" },
  ],
  en: [
    { id: "repo1", label: "1 Course: General History of Architecture" },
    { id: "repo2", label: "1 Course: Fundamentals of Art & Design" },
    { id: "repo3", label: "2 Course: European Cultural Heritage" },
    { id: "repo4", label: "2 Course: Medieval Architecture & Monasticism" },
    { id: "repo5", label: "3 Course: Renaissance & Baroque Studies" },
    { id: "repo6", label: "3 Course: Urban Planning & Historical Sites" },
    { id: "repo7", label: "4 Course: Modern & Contemporary Architecture" },
    { id: "repo8", label: "4 Course: Archival Research & Fieldwork" },
    { id: "repo9", label: "5 Course (Master): Advanced Restoration & Heritage" },
    { id: "repo10", label: "6 Course (Master): Cultural Property Management" },
  ],
  es: [
    { id: "repo1", label: "1 Curso: Historia General de la Arquitectura" },
    { id: "repo2", label: "1 Curso: Fundamentos de Arte y Diseño" },
    { id: "repo3", label: "2 Curso: Patrimonio Cultural Europeo" },
    { id: "repo4", label: "2 Curso: Arquitectura Medieval y Monacato" },
    { id: "repo5", label: "3 Curso: Estudios del Renacimiento y Barroco" },
    { id: "repo6", label: "3 Curso: Urbanismo y Sitios Históricos" },
    { id: "repo7", label: "4 Curso: Arquitectura Moderna y Contemporánea" },
    { id: "repo8", label: "4 Curso: Investigación Archivística y Trabajo de Campo" },
    { id: "repo9", label: "5 Curso (Máster): Restauración Avanzada del Patrimonio" },
    { id: "repo10", label: "6 Curso (Máster): Gestión de Bienes Culturales" },
  ]
};

const UI_TEXT = {
  uk: {
    appTitle: "Університет Вальядоліда — Генератор завдань",
    appSub: "Факультет філософії та літератури • Навчальний комплекс",
    apiConnected: "Завдання успішно сформовано!",
    formHeading: "Створення завдань",
    formSub: "Введіть параметри предмета та об'єкта для генерації",
    lblSubject: "Предмет",
    subjectPlaceholder: "напр., Історія архітектури",
    lblPOI: "Об'єкт дослідження (POI)",
    poiPlaceholder: "напр., Львівський університет, Саграда Фамілія, Палац Санта-Крус",
    poiHint: "Система автоматично підбере академічні факти про обраний об'єкт",
    lblUseRepo: "Використовувати репозиторій курсу",
    lblRepoNote: "Матеріали обраного курсу та завантажені файли додаються в базу знань.",
    lblTeacherNotes: "Важливі примітки викладача",
    teacherPlaceholder: "Додайте специфічні акценти для студентів (наприклад, фокус на деталях фасаду або датування)...",
    lblWikiTitle: "Дані про об'єкт:",
    lblYear: "Рік:",
    lblStyle: "Стиль:",
    lblEvents: "Події:",
    lblEntity: "Ідентифікатор:",
    btnGenerate: "Сформувати завдання",
    lblModel: "Система:",
    modelName: "Академічний двигун UVa",
    facultyBadge: "Факультет філософії та літератури",
    resultsHeader: "Результати генерації",
    btnRegenerate: "Перегенерувати",
    emptyTitle: "Генерацію ще не запущено",
    emptyDesc: "Заповніть назву предмета, назву об'єкта та примітки у лівій формі або поставте запитання в чаті внизу.",
    emptyTip: "Порада: Спробуйте ввести «Львівський університет», «Саграда Фамілія» або «Палац Санта-Крус»",
    btnEdit: "Редагувати",
    btnApproveSave: "Прийняти та зберегти",
    btnReject: "Відхилити",
    statusDraft: "Чернетка (SQLite)",
    statusApproved: "Затверджено в БД",
    statusRejected: "Відхилено",
    toastActivityApproved: "Активність затверджено та збережено в базі даних",
    toastActivityRejected: "Чернетку позначено як відхилену",
    toastActivityDeleted: "Активність видалено з бази даних",
    btnExplain: "Детальніше про приклад",
    btnClearResults: "Очистити",
    lblPedagogicalSection: "Педагогічні та просторові параметри",
    lblEducationLevel: "Рівень освіти",
    lblAcademicGroup: "Академічна група",
    lblTaskType: "Формат завдання",
    lblDifficultyLevel: "Складність",
    lblDuration: "Тривалість",
    lblLearningObjectives: "Навчальні цілі / компетентності",
    lblGeoCoordinates: "Координати (lat, lng)",
    lblGeoRadius: "Радіус пошуку",
    placeholderGroup: "напр., АРХ-201",
    placeholderDuration: "напр., 60 хв",
    placeholderObjectives: "Які компетентності мають сформувати студенти...",
    placeholderCoords: "41.6523, -4.7245",
    placeholderRadius: "500 m",
    ragDebugToggle: "Деталі RAG та промпту",
    ragDebugDocChunks: "Чанки документів",
    ragDebugRetrieved: "Знайдені фрагменти та оцінки",
    ragDebugPrompt: "Фінальний промпт LLM",
    ragDebugRaw: "Сира відповідь моделі",
    ragModeRepoOn: "Репозиторій курсу: УВІМКНЕНО (RAG ON)",
    ragModeRepoOff: "Репозиторій курсу: ВИМКНЕНО (RAG OFF)",
    cardSourceLabel: "Джерело:",
    cardContextLabel: "Контекст:",
    cardTypeLabel: "Тип:",
    loadingTitle: "Формування навчальних завдань...",
    loadingSub: "Гібридний пошук → Переранжування → Формування відповіді",
    step1: "Крок 1/4: Пошук релевантних фрагментів у векторній базі...",
    step2: "Крок 2/4: Узгодження ключових слів та контексту курсу...",
    step3: "Крок 3/4: Складання методичної відповіді та завдань...",
    step4: "Крок 4/4: Перевірка та фінальне форматування...",
    navHome: "Про університет",
    navGenerator: "Генератор завдань",
    navCabinet: "Кабінет викладача",
    navNewChat: "Новий чат",
    navLibrary: "Історія",
    navStudents: "Студенти",
    navProfessor: "Викладач",
    navSettings: "Налаштувати",
    navHistory: "Історія",
    btnLogin: "Вхід як викладач",
    btnAdminLogin: "Менеджер акаунтів",
    navAdmin: "Менеджер акаунтів",
    btnProfessorCabinet: "Кабінет викладача",
    lblSelectCourseDocs: "Документи обраного курсу:",
    noCourseDocsHint: "У цьому курсі ще немає документів. Додайте їх через іконку папки або в кабінеті викладача.",
    ragSourcesTitle: "Використані фрагменти документів:",
    ragEngineOllama: "Джерело: локальна LLM (Ollama)",
    ragEngineFallback: "Джерело: резервний шаблон (Ollama недоступна)",
    deleteTooltip: "Видалити з історії",
    toggleCollapseTooltip: "Згорнути панель",
    toggleExpandTooltip: "Розгорнути панель",
    searchTooltip: "Пошук",
    btnBack: "Назад",
    btnForward: "Вперед",
    btnBackTooltip: "Повернутися назад (без втрати чернетки)",
    btnForwardTooltip: "Перейти вперед",
    draftSavedBadge: "Чернетку збережено",
    toggleThemeTooltip: "Змінити тему (чорна або біла)",
    sidebarFooterTitle: "Університет Вальядоліда",
    sidebarFooterSub: "Навчальний комплекс",
    footerUniversity: "Університет Вальядоліда",
    footerFaculty: "Факультет філософії та літератури",
    footerSuite: "© Освітній комплекс завдань",
    timeToday: "Сьогодні",
    timeYesterday: "Вчора",
    timeOct26: "26 Жовтня",
    timeJustNow: "Щойно",
    toastLangChanged: "Мову змінено на: ",
    toastLoaded: "Завантажено з історії: ",
    toastDeleted: "Запис видалено з історії",
    toastNewTask: "Створено новий запит. Заповніть параметри.",
    toastTaskSaved: "Завдання оновлено в базі даних",
    toastResultsCleared: "Результати генерації успішно очищено",
    toastQuickSearch: "Швидкий пошук у базі завдань",
    toastLibraryNav: "Відкрито розділ історії та бібліотеки",
    toastSettingsNav: "Параметри навчальної платформи",
    toastGroupAssigned: "Завдання призначено для: ",
    chatInputPlaceholder: "Поставте запитання до локальної бази знань...",
    btnSendChat: "Надіслати",
    chatUserLabel: "Викладач / Запит",
    chatAssistantLabel: "Локальний ШІ-асистент",
    chatSourcesLabel: "Використані джерела з бази знань",
    chatLoadingTitle: "Очікування відповіді від локального сервера...",
    chatErrorTitle: "Локальний бекенд тимчасово недоступний",
    closeErrorAria: "Закрити повідомлення про помилку",
    chatInputAria: "Запитання до локальної бази знань",
    uploadFolderAria: "Завантажити файл з комп'ютера у векторну базу",
    uploadingFileStatus: "Векторизація файлу у локальну базу...",
    uploadedFilesHeading: "Файли, додані у векторну базу:",
    vectorChunksUnit: "фрагм.",
    uploadSuccessPrefix: "Файл збережено у сховище викладача та векторизовано:",
    selectCourseAria: "Вибір курсу викладача",
    selectRepoAria: "Вибір репозиторію курсу",
    logoutTitle: "Вийти",
    logoutProfAria: "Вийти з кабінету викладача",
    logoutAdminAria: "Вийти з панелі менеджера акаунтів",
    adminBadge: "Менеджер",
    historyPageTitle: "Історія запитів та бібліотека матеріалів",
    historyPageSub: "Усі сформовані завдання та завантажені навчальні матеріали зберігаються тут",
    historyEmptyTitle: "Історія порожня",
    historyEmptyDesc: "Створіть завдання або поставте запитання в генераторі — запис з'явиться в цьому розділі.",
    historyBtnOpen: "Відкрити в генераторі",
    historyRepoSection: "Завантажені та векторизовані файли",
    historyNoFiles: "Поки не завантажено жодного файлу через генератор. Натисніть іконку папки у формі генерації.",
    historyBtnToGenerator: "Перейти до генератора"
  },
  en: {
    appTitle: "Universidad de Valladolid — Task Generator",
    appSub: "Faculty of Philosophy & Letters • Academic Suite",
    apiConnected: "Tasks generated successfully!",
    formHeading: "Task Generation",
    formSub: "Enter parameters for the subject and object of study",
    lblSubject: "Subject",
    subjectPlaceholder: "e.g., History of Architecture",
    lblPOI: "Point of Interest (POI)",
    poiPlaceholder: "e.g., University of Lviv, Sagrada Familia, Santa Cruz",
    poiHint: "The system automatically analyzes and retrieves academic facts for this location",
    lblUseRepo: "Use course repository",
    lblRepoNote: "Materials of the selected syllabus and uploaded files are added to the knowledge base.",
    lblTeacherNotes: "Important teacher notes",
    teacherPlaceholder: "Add specific instructions for students (e.g., focus on facade details or dating)...",
    lblWikiTitle: "Object Information:",
    lblYear: "Year:",
    lblStyle: "Style:",
    lblEvents: "Events:",
    lblEntity: "Identifier:",
    btnGenerate: "Generate Tasks",
    lblModel: "Engine:",
    modelName: "UVa Academic Engine",
    facultyBadge: "Faculty of Philosophy & Letters",
    resultsHeader: "Generation Results",
    btnRegenerate: "Regenerate",
    emptyTitle: "No Tasks Generated Yet",
    emptyDesc: "Fill in the subject title, Point of Interest (POI), and notes on the left, or ask a question in the chat below.",
    emptyTip: "Tip: Try entering 'University of Lviv', 'Sagrada Familia', or 'Palacio de Santa Cruz'",
    btnEdit: "Edit",
    btnApproveSave: "Approve & Save",
    btnReject: "Reject",
    statusDraft: "Draft (SQLite)",
    statusApproved: "Approved in DB",
    statusRejected: "Rejected",
    toastActivityApproved: "Activity approved and saved to SQLite database",
    toastActivityRejected: "Draft marked as rejected",
    toastActivityDeleted: "Activity deleted from database",
    btnExplain: "Explain more about Example",
    btnClearResults: "Clear",
    lblPedagogicalSection: "Pedagogical & Spatial Configuration",
    lblEducationLevel: "Education Level",
    lblAcademicGroup: "Academic Group",
    lblTaskType: "Task Format / Mode",
    lblDifficultyLevel: "Difficulty Level",
    lblDuration: "Duration",
    lblLearningObjectives: "Learning Objectives / Competencies",
    lblGeoCoordinates: "Geo Coordinates (lat, lng)",
    lblGeoRadius: "Search Radius",
    placeholderGroup: "e.g., ARCH-201",
    placeholderDuration: "e.g., 60 min",
    placeholderObjectives: "Expected learning outcomes and competencies...",
    placeholderCoords: "41.6523, -4.7245",
    placeholderRadius: "500 m",
    ragDebugToggle: "RAG & Prompt Details",
    ragDebugDocChunks: "Document Chunks",
    ragDebugRetrieved: "Retrieved Chunks & Scores",
    ragDebugPrompt: "Final LLM Prompt",
    ragDebugRaw: "Raw Model Response",
    ragModeRepoOn: "Course Repository: ON (RAG Enabled)",
    ragModeRepoOff: "Course Repository: OFF (No RAG)",
    cardSourceLabel: "Source:",
    cardContextLabel: "Context:",
    cardTypeLabel: "Type:",
    loadingTitle: "Generating academic tasks...",
    loadingSub: "Hybrid Search → Reranking → Answer Synthesis",
    step1: "Step 1/4: Searching vector index for relevant chunks...",
    step2: "Step 2/4: Matching keywords and course context...",
    step3: "Step 3/4: Compiling pedagogical answer and variants...",
    step4: "Step 4/4: Validating and formatting output...",
    navHome: "About University",
    navGenerator: "Task Generator",
    navCabinet: "Faculty Portal",
    navNewChat: "New chat",
    navLibrary: "History",
    navStudents: "Students",
    navProfessor: "Professor",
    navSettings: "Settings",
    navHistory: "History",
    btnLogin: "Teacher Sign In",
    btnAdminLogin: "Account Manager",
    navAdmin: "Account Manager",
    btnProfessorCabinet: "Professor Portal",
    lblSelectCourseDocs: "Course repository documents:",
    noCourseDocsHint: "No documents in this course yet. Upload via the folder icon or in the Professor Portal.",
    ragSourcesTitle: "Retrieved Document Chunks:",
    ragEngineOllama: "Engine: Local LLM (Ollama)",
    ragEngineFallback: "Engine: Fallback Template (Ollama offline)",
    deleteTooltip: "Delete from history",
    toggleCollapseTooltip: "Collapse sidebar",
    toggleExpandTooltip: "Expand sidebar",
    searchTooltip: "Search",
    btnBack: "Back",
    btnForward: "Forward",
    btnBackTooltip: "Go back (draft is preserved)",
    btnForwardTooltip: "Go forward",
    draftSavedBadge: "Draft saved",
    toggleThemeTooltip: "Toggle theme (dark or white)",
    sidebarFooterTitle: "Universidad de Valladolid",
    sidebarFooterSub: "Educational Suite",
    footerUniversity: "Universidad de Valladolid",
    footerFaculty: "Faculty of Philosophy & Letters",
    footerSuite: "© Educational Task Suite",
    timeToday: "Today",
    timeYesterday: "Yesterday",
    timeOct26: "Oct 26",
    timeJustNow: "Just now",
    toastLangChanged: "Language switched to: ",
    toastLoaded: "Loaded from history: ",
    toastDeleted: "Record deleted from history",
    toastNewTask: "New task session created. Fill in the parameters.",
    toastTaskSaved: "Task updated in database",
    toastResultsCleared: "Generation results cleared",
    toastQuickSearch: "Quick search in task library",
    toastLibraryNav: "Opened History & Library",
    toastSettingsNav: "Academic platform settings",
    toastGroupAssigned: "Task assigned to: ",
    chatInputPlaceholder: "Ask a question to the local knowledge base...",
    btnSendChat: "Send",
    chatUserLabel: "Teacher / Query",
    chatAssistantLabel: "Local AI Assistant",
    chatSourcesLabel: "Sources used from knowledge base",
    chatLoadingTitle: "Waiting for response from the local server...",
    chatErrorTitle: "Local backend is temporarily unavailable",
    closeErrorAria: "Close error notice",
    chatInputAria: "Question for the local knowledge base",
    uploadFolderAria: "Upload file from computer to vector database",
    uploadingFileStatus: "Vectorizing file into local database...",
    uploadedFilesHeading: "Files indexed in vector database:",
    vectorChunksUnit: "chunks",
    uploadSuccessPrefix: "File stored in teacher workspace and vectorized:",
    selectCourseAria: "Select professor course",
    selectRepoAria: "Select course repository",
    logoutTitle: "Sign Out",
    logoutProfAria: "Sign out of professor portal",
    logoutAdminAria: "Sign out of Account Manager",
    adminBadge: "Manager",
    historyPageTitle: "Query History & Material Library",
    historyPageSub: "All generated tasks and uploaded course files are stored here",
    historyEmptyTitle: "No history records yet",
    historyEmptyDesc: "Generate tasks or ask a question in the generator and it will appear here.",
    historyBtnOpen: "Open in Generator",
    historyRepoSection: "Uploaded & Vectorized Files",
    historyNoFiles: "No files uploaded from the generator yet. Click the folder icon beside Use course repository.",
    historyBtnToGenerator: "Go to Generator"
  },
  es: {
    appTitle: "Universidad de Valladolid — Generador de Tareas",
    appSub: "Facultad de Filosofía y Letras • Suite Académica",
    apiConnected: "¡Tareas generadas con éxito!",
    formHeading: "Generación de Tareas",
    formSub: "Ingrese los parámetros de la asignatura y objeto de estudio",
    lblSubject: "Asignatura",
    subjectPlaceholder: "ej., Historia de la Arquitectura",
    lblPOI: "Punto de Interés (POI)",
    poiPlaceholder: "ej., University of Lviv, Sagrada Familia, Santa Cruz",
    poiHint: "El sistema analiza y extrae automáticamente los hechos académicos de este lugar",
    lblUseRepo: "Usar repositorio de curso",
    lblRepoNote: "Los materiales seleccionados y archivos subidos se añaden a la base de conocimiento.",
    lblTeacherNotes: "Notas importantes del profesor",
    teacherPlaceholder: "Añada indicaciones clave para los estudiantes (ej., análisis de fachada o cronología)...",
    lblWikiTitle: "Información del objeto:",
    lblYear: "Año:",
    lblStyle: "Estilo:",
    lblEvents: "Eventos:",
    lblEntity: "Identificador:",
    btnGenerate: "Generar Tareas",
    lblModel: "Sistema:",
    modelName: "Motor Académico UVa",
    facultyBadge: "Facultad de Filosofía y Letras",
    resultsHeader: "Resultados de la Generación",
    btnRegenerate: "Re-generar",
    emptyTitle: "Aún no se han generado tareas",
    emptyDesc: "Rellene la asignatura, el punto de interés (POI) y las notas a la izquierda, o escriba una pregunta abajo.",
    emptyTip: "Consejo: Pruebe con 'University of Lviv', 'Sagrada Familia' o 'Palacio de Santa Cruz'",
    btnEdit: "Editar",
    btnApproveSave: "Aprobar y Guardar",
    btnReject: "Rechazar",
    statusDraft: "Borrador (SQLite)",
    statusApproved: "Aprobada en BD",
    statusRejected: "Rechazada",
    toastActivityApproved: "Actividad aprobada y guardada en SQLite",
    toastActivityRejected: "Borrador marcado como rechazado",
    toastActivityDeleted: "Actividad eliminada de la base de datos",
    btnExplain: "Explicar más sobre Ejemplo",
    btnClearResults: "Limpiar",
    lblPedagogicalSection: "Parámetros Pedagógicos y Espaciales",
    lblEducationLevel: "Nivel Educativo",
    lblAcademicGroup: "Grupo Académico",
    lblTaskType: "Formato de Tarea",
    lblDifficultyLevel: "Dificultad",
    lblDuration: "Duración",
    lblLearningObjectives: "Objetivos de Aprendizaje / Competencias",
    lblGeoCoordinates: "Coordenadas (lat, lng)",
    lblGeoRadius: "Radio de Búsqueda",
    placeholderGroup: "ej., ARCH-201",
    placeholderDuration: "ej., 60 min",
    placeholderObjectives: "Competencias esperadas para la actividad...",
    placeholderCoords: "41.6523, -4.7245",
    placeholderRadius: "500 m",
    ragDebugToggle: "Detalles de RAG y Prompt",
    ragDebugDocChunks: "Fragmentos del Documento",
    ragDebugRetrieved: "Fragmentos Recuperados y Puntuación",
    ragDebugPrompt: "Prompt Final del LLM",
    ragDebugRaw: "Respuesta Cruda del Modelo",
    ragModeRepoOn: "Repositorio del Curso: ACTIVO (RAG ON)",
    ragModeRepoOff: "Repositorio del Curso: DESACTIVADO (RAG OFF)",
    cardSourceLabel: "Fuente:",
    cardContextLabel: "Contexto:",
    cardTypeLabel: "Tipo:",
    loadingTitle: "Generando tareas académicas...",
    loadingSub: "Búsqueda híbrida → Reordenamiento → Síntesis de respuesta",
    step1: "Paso 1/4: Buscando fragmentos relevantes en la base vectorial...",
    step2: "Paso 2/4: Coincidencia léxica y contexto del curso...",
    step3: "Paso 3/4: Redactando variantes metodológicas...",
    step4: "Paso 4/4: Validando y formateando la entrega...",
    navHome: "Sobre la Universidad",
    navGenerator: "Generador de Tareas",
    navCabinet: "Portal Docente",
    navNewChat: "Nuevo chat",
    navLibrary: "Historial",
    navStudents: "Estudiantes",
    navProfessor: "Profesor",
    navSettings: "Ajustes",
    navHistory: "Historial",
    btnLogin: "Entrar como profesor",
    btnAdminLogin: "Gestor de Cuentas",
    navAdmin: "Gestor de Cuentas",
    btnProfessorCabinet: "Portal Docente",
    lblSelectCourseDocs: "Documentos de la asignatura:",
    noCourseDocsHint: "Sin documentos en esta asignatura. Añádalos con el icono de carpeta o en el Portal Docente.",
    ragSourcesTitle: "Fragmentos de Documentos Recuperados:",
    ragEngineOllama: "Motor: LLM Local (Ollama)",
    ragEngineFallback: "Motor: Plantilla de Respaldo (Ollama inactivo)",
    deleteTooltip: "Eliminar del historial",
    toggleCollapseTooltip: "Plegar barra lateral",
    toggleExpandTooltip: "Desplegar barra lateral",
    searchTooltip: "Buscar",
    btnBack: "Atrás",
    btnForward: "Adelante",
    btnBackTooltip: "Volver atrás (borrador preservado)",
    btnForwardTooltip: "Avanzar",
    draftSavedBadge: "Borrador guardado",
    toggleThemeTooltip: "Cambiar tema (oscuro o blanco)",
    sidebarFooterTitle: "Universidad de Valladolid",
    sidebarFooterSub: "Suite Académica",
    footerUniversity: "Universidad de Valladolid",
    footerFaculty: "Facultad de Filosofía y Letras",
    footerSuite: "© Educational Task Suite",
    timeToday: "Hoy",
    timeYesterday: "Ayer",
    timeOct26: "26 de Octubre",
    timeJustNow: "Ahora mismo",
    toastLangChanged: "Idioma cambiado a: ",
    toastLoaded: "Cargado del historial: ",
    toastDeleted: "Registro eliminado del historial",
    toastNewTask: "Nueva sesión creada. Rellene los parámetros.",
    toastTaskSaved: "Tarea actualizada en la base de datos",
    toastResultsCleared: "Resultados de generación borrados",
    toastQuickSearch: "Búsqueda rápida en biblioteca de tareas",
    toastLibraryNav: "Abierto Historial y Biblioteca",
    toastSettingsNav: "Configuración de la plataforma académica",
    toastGroupAssigned: "Tarea asignada a: ",
    chatInputPlaceholder: "Haga una pregunta a la base de conocimiento local...",
    btnSendChat: "Enviar",
    chatUserLabel: "Profesor / Consulta",
    chatAssistantLabel: "Asistente IA Local",
    chatSourcesLabel: "Fuentes utilizadas de la base de conocimiento",
    chatLoadingTitle: "Esperando respuesta del servidor local...",
    chatErrorTitle: "El servidor local no está disponible temporalmente",
    closeErrorAria: "Cerrar aviso de error",
    chatInputAria: "Pregunta para la base de conocimiento local",
    uploadFolderAria: "Subir archivo desde el equipo a la base vectorial",
    uploadingFileStatus: "Vectorizando archivo en la base local...",
    uploadedFilesHeading: "Archivos indexados en la base vectorial:",
    vectorChunksUnit: "fragm.",
    uploadSuccessPrefix: "Archivo guardado en el espacio docente y vectorizado:",
    selectCourseAria: "Seleccionar asignatura del profesor",
    selectRepoAria: "Seleccionar repositorio de curso",
    logoutTitle: "Cerrar sesión",
    logoutProfAria: "Cerrar sesión del portal docente",
    logoutAdminAria: "Cerrar sesión del gestor de cuentas",
    adminBadge: "Gestor",
    historyPageTitle: "Historial de Consultas y Biblioteca",
    historyPageSub: "Todas las tareas generadas y archivos cargados se guardan aquí",
    historyEmptyTitle: "El historial está vacío",
    historyEmptyDesc: "Genere tareas o haga una pregunta en el generador para ver el registro aquí.",
    historyBtnOpen: "Abrir en el Generador",
    historyRepoSection: "Archivos Cargados y Vectorizados",
    historyNoFiles: "Aún no hay archivos cargados desde el generador. Pulse el icono de carpeta junto a Usar repositorio.",
    historyBtnToGenerator: "Ir al Generador"
  }
};

interface HistoryRecord {
  id: string;
  subject: string;
  poiName: string;
  teacherNote?: string;
  timeKey: 'today' | 'yesterday' | 'oct26' | 'justNow';
  timeExtra?: string;
  tasks: TaskVariants;
  sources?: RankedRagChunkClient[];
  engineUsed?: string;
}

export default function App() {
  const [lang, setLang] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('uva_selected_lang');
      if (saved === 'uk' || saved === 'en' || saved === 'es') return saved;
    } catch {}
    return 'uk';
  });
  const initialDraft = loadFormDraft();
  const [subject, setSubject] = useState(initialDraft?.subject || 'History of Architecture');
  const [poiName, setPoiName] = useState(initialDraft?.poiName || 'University of Lviv');
  const [useRepo, setUseRepo] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState('repo1');
  const [teacherNote, setTeacherNote] = useState(initialDraft?.teacherNote || '');
  const [educationLevel, setEducationLevel] = useState(initialDraft?.educationLevel || 'Bachelor (Grado)');
  const [academicGroup, setAcademicGroup] = useState(initialDraft?.academicGroup || 'ARCH-201');
  const [taskType, setTaskType] = useState(initialDraft?.taskType || 'Fieldwork & Analysis');
  const [difficultyLevel, setDifficultyLevel] = useState(initialDraft?.difficultyLevel || 'Intermediate');
  const [duration, setDuration] = useState(initialDraft?.duration || '60 min');
  const [learningObjectives, setLearningObjectives] = useState(initialDraft?.learningObjectives || '');
  const [geoCoordinates, setGeoCoordinates] = useState(initialDraft?.geoCoordinates || '41.6523, -4.7245');
  const [geoRadius, setGeoRadius] = useState(initialDraft?.geoRadius || '500 m');

  // Navigation State with Back / Forward history stack
  const [navState, setNavState] = useState<NavigationState>(() => createNavigationState('home'));
  const currentView = getCurrentView(navState);

  const navigateTo = (view: AppView) => {
    setNavState((prev) => pushView(prev, view));
  };
  const setCurrentView = navigateTo;

  const handleGoBack = () => {
    setNavState((prev) => goBack(prev));
  };

  const handleGoForward = () => {
    setNavState((prev) => goForward(prev));
  };

  // Theme State (Dark vs Light)
  const [theme, setTheme] = useState<AppTheme>(() => getStoredTheme());

  useEffect(() => {
    setStoredTheme(theme);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.className = 'h-full w-full m-0 p-0 overflow-hidden font-sans bg-slate-950 text-slate-100 antialiased';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.className = 'h-full w-full m-0 p-0 overflow-hidden font-sans bg-slate-50 text-slate-800 antialiased';
      }
    }
  }, [theme]);

  // Draft autosave effect so entered text is never lost
  useEffect(() => {
    saveFormDraft({
      subject,
      poiName,
      teacherNote,
      educationLevel,
      academicGroup,
      taskType,
      difficultyLevel,
      duration,
      learningObjectives,
      geoCoordinates,
      geoRadius
    });
  }, [
    subject,
    poiName,
    teacherNote,
    educationLevel,
    academicGroup,
    taskType,
    difficultyLevel,
    duration,
    learningObjectives,
    geoCoordinates,
    geoRadius
  ]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    triggerToast(
      lang === 'es'
        ? (newTheme === 'dark' ? "Tema oscuro activado" : "Tema blanco activado")
        : lang === 'en'
        ? (newTheme === 'dark' ? "Dark theme activated" : "White theme activated")
        : (newTheme === 'dark' ? "Темну (чорну) тему активовано" : "Світлу (білу) тему активовано")
    );
  };

  // Expandable left sidebar (collapsed by default on narrow mobile viewports)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Wikidata dynamic auto-analysis state
  const [wikidata, setWikidata] = useState<WikidataInfo>(() => analyzePoiData(initialDraft?.poiName || 'University of Lviv', lang));

  // Generation status, Local Chat dialogue, Quick Folder Upload & variants state
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatSending, setIsChatSending] = useState(false);
  const [isUploadingRepoFile, setIsUploadingRepoFile] = useState(false);
  const [uploadedRepoFiles, setUploadedRepoFiles] = useState<Array<{ id: string; name: string; chunks: number; storagePath: string }>>([]);
  const repoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatUiMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatMessages.length > 0 || isChatSending) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, isChatSending]);
  const [progressStep, setProgressStep] = useState(1);
  const [lastRagSources, setLastRagSources] = useState<RankedRagChunkClient[]>([]);
  const [lastEngineUsed, setLastEngineUsed] = useState<'ollama' | 'local-rag-fallback' | null>(null);
  const [lastUseRepoMode, setLastUseRepoMode] = useState<boolean>(true);
  const [ragDebugTrace, setRagDebugTrace] = useState<RagDebugTrace | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [currentDraftIds, setCurrentDraftIds] = useState<Record<number, string>>({});
  const [cardStatuses, setCardStatuses] = useState<Record<number, ActivityStatus>>({
    1: 'draft',
    2: 'draft',
    3: 'draft',
  });
  const [tasks, setTasks] = useState<TaskVariants | null>(null);

  // Teachers Database, Professor Session & Account Manager Session State
  const [teachersDb, setTeachersDb] = useState<ProfessorDatabaseRecord[]>(() => getProfessorsDatabase());
  const [activeProfessor, setActiveProfessor] = useState<ProfessorProfile | null>(() => getActiveProfessorSession());
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile | null>(() => getActiveAdminSession());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInitialRole, setLoginInitialRole] = useState<'teacher' | 'admin'>('teacher');
  const isManagerLocked = activeAdmin !== null && activeProfessor === null;

  // Task Generator Course Repository & Document Selection (for RAG query mockup)
  const [selectedProfCourseId, setSelectedProfCourseId] = useState<string>(() => {
    const prof = getActiveProfessorSession();
    return prof?.courses[0]?.id || '';
  });
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(() => {
    const prof = getActiveProfessorSession();
    if (prof && prof.courses[0]) {
      return getCourseDocuments(prof, prof.courses[0].id).map((d) => d.id);
    }
    return [];
  });

  useEffect(() => {
    if (!activeProfessor) {
      setSelectedProfCourseId('');
      setSelectedDocIds([]);
      return;
    }
    const courseExists = activeProfessor.courses.some((c) => c.id === selectedProfCourseId);
    const targetCourseId = courseExists ? selectedProfCourseId : activeProfessor.courses[0]?.id || '';
    if (targetCourseId !== selectedProfCourseId) {
      setSelectedProfCourseId(targetCourseId);
    }
    if (targetCourseId) {
      const validIds = getCourseDocuments(activeProfessor, targetCourseId).map((d) => d.id);
      setSelectedDocIds((prev) => {
        const filtered = prev.filter((id) => validIds.includes(id));
        return filtered.length > 0 ? filtered : validIds;
      });
    } else {
      setSelectedDocIds([]);
    }
  }, [activeProfessor, selectedProfCourseId]);

  // UI inspection & Modals
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [explainVariant, setExplainVariant] = useState<number | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Update Wikidata analysis when POI or language changes
  useEffect(() => {
    if (poiName) {
      const data = analyzePoiData(poiName, lang);
      setWikidata(data);
    }
  }, [poiName, lang]);

  const t = UI_TEXT[lang];
  const repos = COURSE_REPOSITORIES[lang];

  // Per-professor isolated history state (loaded from SQLite upon professor sign-in)
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string>("");

  const formatHistoryTime = (item: HistoryRecord) => {
    switch (item.timeKey) {
      case 'today':
        return `${t.timeToday}, ${item.timeExtra || '10:15'}`;
      case 'yesterday':
        return `${t.timeYesterday}, ${item.timeExtra || '15:40'}`;
      case 'oct26':
        return t.timeOct26;
      case 'justNow':
      default:
        return t.timeJustNow;
    }
  };

  const mapServerHistory = (records: ServerHistoryRecord[]): HistoryRecord[] =>
    records.map((rec) => ({
      id: rec.id,
      subject: rec.subject,
      poiName: rec.poiName,
      teacherNote: rec.teacherNote,
      timeKey: 'today',
      timeExtra: rec.createdAt ? new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      tasks: rec.tasks,
      sources: rec.sources,
      engineUsed: rec.engineUsed
    }));

  // Restore real SQLite session from bearer token on startup
  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await apiGetMe();
        if (cancelled) return;
        if (me.role === 'manager') {
          setActiveProfessor(null);
          setActiveProfessorSession(null);
          setActiveAdmin(me.manager);
          setActiveAdminSession(me.manager);
          setNavState(createNavigationState('admin_portal'));
          const res = await apiGetTeachers();
          if (!cancelled) {
            setTeachersDb(res.teachers);
          }
        } else {
          setActiveAdmin(null);
          setActiveAdminSession(null);
          setActiveProfessor(me.professor);
          setActiveProfessorSession(me.professor);
          setHistory(mapServerHistory(me.history || []));
          setActivities(me.activities || []);
        }
      } catch {
        if (!cancelled) {
          setStoredAuthToken(null);
          setActiveProfessor(null);
          setActiveProfessorSession(null);
          setActiveAdmin(null);
          setActiveAdminSession(null);
          setActivities([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Strict 2-role UI guard: Account Manager locked to admin_portal; guests can view only home
  useEffect(() => {
    if (isManagerLocked && currentView !== 'admin_portal') {
      setNavState(createNavigationState('admin_portal'));
      return;
    }
    if (
      !activeProfessor &&
      (currentView === 'generator' || currentView === 'history' || currentView === 'professor_portal')
    ) {
      setNavState(createNavigationState('home'));
    }
  }, [isManagerLocked, activeProfessor, currentView]);

  // Language switch handler - updates all active tasks, wikidata facts, and prompts immediately
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    try {
      localStorage.setItem('uva_selected_lang', newLang);
    } catch {}
    const newT = UI_TEXT[newLang];
    triggerToast(`${newT.toastLangChanged}${newLang === 'uk' ? 'Українська' : newLang === 'es' ? 'Español' : 'English'}`, 'info');
    
    const nextDefaultSubject =
      newLang === 'uk' ? 'Історія архітектури' : newLang === 'es' ? 'Historia de la Arquitectura' : 'History of Architecture';
    const effectiveSubject =
      subject === 'History of Architecture' ||
      subject === 'Історія архітектури' ||
      subject === 'Historia de la Arquitectura'
        ? nextDefaultSubject
        : subject;
    if (effectiveSubject !== subject) {
      setSubject(effectiveSubject);
    }

    const newWiki = analyzePoiData(poiName, newLang);
    setWikidata(newWiki);

    if (hasGenerated && lastRagSources.length === 0) {
      const regenerated = generateTaskVariants(newLang, effectiveSubject, poiName, teacherNote, newWiki);
      setTasks(regenerated);
    }
  };

  // Send a dialogue message to Local Python FastAPI + Qdrant + Ollama (/api/chat)
  const submitRagChatQuestion = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || isChatSending) return;
    if (!activeProfessor || !getStoredAuthToken()) {
      openLoginModal('teacher');
      return;
    }

    const historyPayload: ChatHistoryMessage[] = chatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));

    const userMsg: ChatUiMessage = {
      id: `chat-user-${Date.now()}`,
      role: 'user',
      content: question
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatError(null);
    setIsChatSending(true);
    setIsLoading(true);
    setProgressStep(1);

    const ticker = setInterval(() => {
      setProgressStep((p) => (p < 3 ? p + 1 : 3));
    }, 280);

    try {
      const chatRes = await apiSendLocalRagChat({
        question,
        history: historyPayload,
        lang,
        course_id: useRepo ? selectedProfCourseId : '',
        use_repo: useRepo,
        subject,
        poi_name: poiName,
        education_level: educationLevel,
        academic_group: academicGroup,
        task_type: taskType,
        difficulty_level: difficultyLevel,
        duration,
        learning_objectives: learningObjectives,
        geo_coordinates: geoCoordinates,
        geo_radius: geoRadius,
      });
      clearInterval(ticker);
      setProgressStep(4);
      setIsChatSending(false);
      setIsLoading(false);

      const assistantMsg: ChatUiMessage = {
        id: `chat-assistant-${Date.now()}`,
        role: 'assistant',
        content: chatRes.answer,
        sources: chatRes.sources
      };
      setChatMessages((prev) => [...prev, assistantMsg]);

      if (chatRes.debug) {
        setLastUseRepoMode(chatRes.debug.use_repo ?? useRepo);
        setRagDebugTrace({
          useRepo: chatRes.debug.use_repo ?? useRepo,
          engine: chatRes.debug.engine === 'local-rag-fallback' ? 'local-rag-fallback' : 'ollama',
          model: chatRes.debug.model || 'qwen2.5:7b',
          documentChunks: (chatRes.debug.document_chunks || []).map((c, idx) => ({
            id: c.id || `doc-chk-${idx}`,
            documentId: '',
            documentTitle: c.source || 'document',
            chunkIndex: Number(c.chunk_index || 0),
            content: c.text || '',
          })),
          retrievedChunks: (chatRes.debug.retrieved_chunks || []).map((c, idx) => ({
            id: c.id || `ret-chk-${idx}`,
            documentId: '',
            documentTitle: c.source || 'document',
            chunkIndex: Number(c.chunk_index || 0),
            content: c.text || '',
            score: Number(c.rerank_score ?? c.vector_score ?? c.bm25_score ?? 0),
            method: 'rerank',
            vectorScore: c.vector_score ?? null,
            bm25Score: c.bm25_score ?? null,
            rerankScore: c.rerank_score ?? null,
          })),
          finalPrompt: chatRes.debug.final_prompt || '',
          rawLlmResponse: chatRes.debug.raw_llm_response || chatRes.answer,
        });
      }

      const generatedForHistory = generateTaskVariants(
        lang,
        subject || 'General',
        poiName || question.slice(0, 40),
        question,
        wikidata
      );

      if (activeProfessor && getStoredAuthToken()) {
        try {
          const saved = await apiSaveHistory({
            courseId: selectedProfCourseId || undefined,
            subject: subject || question.slice(0, 40),
            poiName: poiName || question.slice(0, 48),
            teacherNote: question,
            wikidata,
            tasks: generatedForHistory,
            engineUsed: 'local-chat'
          });
          setHistory(mapServerHistory(saved.history));
        } catch {
          // ignore
        }
      }
      triggerToast(t.apiConnected);
    } catch (err) {
      clearInterval(ticker);
      setIsChatSending(false);
      setIsLoading(false);
      const errText =
        err instanceof Error
          ? err.message
          : t.chatErrorTitle;
      setChatError(errText);
      triggerToast(errText, 'error');
    }
  };

  // Upload file directly from Finder/Explorer via the folder button beside "Use course repository"
  const handleQuickRepoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!activeProfessor || !getStoredAuthToken()) {
      openLoginModal('teacher');
      return;
    }

    setUseRepo(true);
    setIsUploadingRepoFile(true);
    setChatError(null);

    try {
      const uploaded = await apiUploadFileToLocalRag(file, lang, selectedProfCourseId);
      setUploadedRepoFiles((prev) => [
        {
          id: `qdrant-${Date.now()}`,
          name: uploaded.filename,
          chunks: uploaded.chunks_indexed,
          storagePath: uploaded.storage_path
        },
        ...prev.filter((item) => item.name !== uploaded.filename)
      ]);
      if (uploaded.chunks && uploaded.chunks.length > 0) {
        setRagDebugTrace((prev) => ({
          useRepo: true,
          engine: prev?.engine || 'ollama',
          model: prev?.model || 'qwen2.5',
          documentChunks: uploaded.chunks!.map((text, idx) => ({
            id: `upload-${Date.now()}-${idx}`,
            documentId: 'uploaded',
            documentTitle: uploaded.filename,
            chunkIndex: idx,
            content: text,
          })),
          retrievedChunks: prev?.retrievedChunks || [],
          finalPrompt: prev?.finalPrompt || '',
          rawLlmResponse: prev?.rawLlmResponse || '',
        }));
      }
      triggerToast(`${t.uploadSuccessPrefix} ${uploaded.filename} (${uploaded.chunks_indexed} ${t.vectorChunksUnit})`, 'success');

      // Also persist metadata into the SQLite course repository
      if (selectedProfCourseId) {
        try {
          await handleCreateDocument(
            {
              courseId: selectedProfCourseId,
              name: uploaded.filename,
              description: uploaded.storage_path,
              folderCategory: 'lectures',
              type: 'lecture',
              academicYear: '2026/2027',
              size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
              fileName: uploaded.filename,
              fileFormat: uploaded.filename.split('.').pop()?.toUpperCase() || 'TXT'
            },
            file
          );
        } catch {
          // Local Qdrant upload already succeeded
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.chatErrorTitle;
      setChatError(msg);
      triggerToast(msg, 'error');
    } finally {
      setIsUploadingRepoFile(false);
    }
  };

  const handleSendChatInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = chatInput.trim();
    if (!question) return;
    setChatInput('');
    await submitRagChatQuestion(question);
  };

  // Run real Local RAG + Ollama generation (Strictly for authenticated professors)
  const handleGenerate = async () => {
    if (!activeProfessor || !getStoredAuthToken()) {
      openLoginModal('teacher');
      return;
    }

    setChatError(null);
    setIsLoading(true);
    setProgressStep(1);

    const ticker = setInterval(() => {
      setProgressStep((p) => (p < 3 ? p + 1 : 3));
    }, 320);

    try {
      const res = await apiGenerateRagTasks({
        courseId: useRepo ? selectedProfCourseId : undefined,
        documentIds: useRepo ? selectedDocIds : [],
        subject,
        poiName,
        teacherNote,
        wikidata,
        lang,
        useRepo,
        educationLevel,
        academicGroup,
        taskType,
        difficultyLevel,
        duration,
        learningObjectives,
        geoCoordinates,
        geoRadius
      });
      clearInterval(ticker);
      setProgressStep(4);
      setIsLoading(false);
      setHasGenerated(true);
      setTasks(res.tasks);
      setLastRagSources(res.retrievedChunks || []);
      setLastEngineUsed(res.engine);
      setLastUseRepoMode(useRepo);
      if (res.debug) {
        setRagDebugTrace(res.debug);
      }
      if (res.draftActivities && res.draftActivities.length > 0) {
        const nextIds: Record<number, string> = {};
        const nextStatuses: Record<number, ActivityStatus> = {};
        res.draftActivities.forEach((act, idx) => {
          const vIdx = act.variantIndex || idx + 1;
          nextIds[vIdx] = act.id;
          nextStatuses[vIdx] = act.status;
        });
        setCurrentDraftIds(nextIds);
        setCardStatuses(nextStatuses);
      } else {
        setCurrentDraftIds({});
        setCardStatuses({ 1: 'draft', 2: 'draft', 3: 'draft' });
      }
      if (res.activities) {
        setActivities(res.activities);
      }
      if (res.history) {
        setHistory(mapServerHistory(res.history));
      }
      setActiveHistoryId(res.historyRecord.id);
      triggerToast(t.apiConnected);
    } catch (err) {
      clearInterval(ticker);
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Generation error';
      setChatError(msg);
      triggerToast(msg, 'error');
    }
  };

  const handleSelectHistory = (item: HistoryRecord) => {
    if (isManagerLocked) return;
    setCurrentView('generator');
    setActiveHistoryId(item.id);
    setSubject(item.subject);
    setPoiName(item.poiName);
    setTeacherNote(item.teacherNote || '');
    setLastRagSources(item.sources || []);
    setLastEngineUsed((item.engineUsed as 'ollama' | 'local-rag-fallback') || null);

    if (item.sources && item.sources.length > 0) {
      setTasks(item.tasks);
    } else {
      const wiki = analyzePoiData(item.poiName, lang);
      setTasks(generateTaskVariants(lang, item.subject, item.poiName, item.teacherNote || '', wiki));
    }
    setHasGenerated(true);
    triggerToast(`${t.toastLoaded}${item.poiName}`);
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeProfessor && getStoredAuthToken()) {
      try {
        const res = await apiDeleteHistory(id);
        setHistory(mapServerHistory(res.history));
        triggerToast(t.toastDeleted);
        return;
      } catch {
        // ignore and fall back to UI filter
      }
    }
    setHistory((prevHist) => prevHist.filter((h) => h.id !== id));
    triggerToast(t.toastDeleted);
  };

  // New Chat / New Task action
  const handleNewChat = () => {
    setCurrentView('generator');
    setSubject(lang === 'uk' ? 'Історія архітектури' : lang === 'es' ? 'Historia de la Arquitectura' : 'History of Architecture');
    setPoiName('');
    setTeacherNote('');
    setTasks(null);
    setHasGenerated(false);
    setChatMessages([]);
    setChatError(null);
    triggerToast(t.toastNewTask);
  };

  // Clear only generation results (keeping subject, POI, teacher notes, and history intact)
  const handleClearResults = () => {
    setTasks(null);
    setHasGenerated(false);
    setActiveHistoryId("");
    setCurrentDraftIds({});
    setRagDebugTrace(null);
    setChatMessages([]);
    setChatError(null);
    triggerToast(t.toastResultsCleared, 'info');
  };

  // Auth & Role Session Handlers
  const openLoginModal = (role: 'teacher' | 'admin' = 'teacher') => {
    setLoginInitialRole(role);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (
    prof: ProfessorProfile,
    serverHistory?: ServerHistoryRecord[],
    serverActivities?: ActivityRecord[]
  ) => {
    setActiveAdmin(null);
    setActiveAdminSession(null);
    setActiveProfessor(prof);
    setActiveProfessorSession(prof);
    setHistory(mapServerHistory(serverHistory || []));
    setActivities(serverActivities || []);
    setActiveHistoryId("");
    setCurrentDraftIds({});
    setRagDebugTrace(null);
    setChatMessages([]);
    setChatError(null);
    setUploadedRepoFiles([]);
    setLastRagSources([]);
    setLastEngineUsed(null);
    setCurrentView('professor_portal');
    const profName = getLocStr(prof.name, lang);
    const msg =
      lang === 'es'
        ? `¡Bienvenido/a, ${profName}! Acceso exitoso.`
        : lang === 'en'
        ? `Welcome, ${profName}! Signed in successfully.`
        : `Вітаємо, ${profName}! Вхід успішний.`;
    triggerToast(msg, 'success');
  };

  const handleLogout = () => {
    setStoredAuthToken(null);
    setActiveProfessor(null);
    setActiveProfessorSession(null);
    setHistory([]);
    setActivities([]);
    setActiveHistoryId("");
    setCurrentDraftIds({});
    setRagDebugTrace(null);
    setHasGenerated(false);
    setTasks(null);
    setChatMessages([]);
    setChatError(null);
    setUploadedRepoFiles([]);
    setLastRagSources([]);
    setLastEngineUsed(null);
    setNavState(createNavigationState('home'));
    const msg =
      lang === 'es'
        ? 'Sesión de profesor cerrada'
        : lang === 'en'
        ? 'Signed out of professor portal'
        : 'Вихід з кабінету викладача виконано';
    triggerToast(msg, 'info');
  };

  const handleAdminLoginSuccess = async (admin: AdminProfile) => {
    // Strictly isolate: clear any teacher session and lock view stack to admin_portal
    setActiveProfessor(null);
    setActiveProfessorSession(null);
    setActiveAdmin(admin);
    setActiveAdminSession(admin);
    setNavState(createNavigationState('admin_portal'));

    try {
      const res = await apiGetTeachers();
      setTeachersDb(res.teachers);
    } catch {
      // ignore
    }

    const adminName = getLocStr(admin.name, lang);
    const msg =
      lang === 'es'
        ? `Sesión iniciada: ${adminName}`
        : lang === 'en'
        ? `Signed in: ${adminName}`
        : `Успішний вхід: ${adminName}`;
    triggerToast(msg, 'success');
  };

  const handleAdminLogout = () => {
    setStoredAuthToken(null);
    setActiveAdmin(null);
    setActiveAdminSession(null);
    setNavState(createNavigationState('home'));
    const msg =
      lang === 'es'
        ? 'Sesión cerrada'
        : lang === 'en'
        ? 'Signed out of Account Manager'
        : 'Вихід з акаунта менеджера виконано';
    triggerToast(msg, 'info');
  };

  // Account Manager CRUD: Teachers (SQLite Backend)
  const handleCreateTeacher = async (input: TeacherInput) => {
    try {
      const { teachers, teacher } = await apiCreateTeacher(input);
      setTeachersDb(teachers);
      const tName = getLocStr(teacher.profile.name, lang);
      triggerToast(
        lang === 'es'
          ? `Cuenta docente "${tName}" creada en SQLite`
          : lang === 'en'
          ? `Teacher account "${tName}" saved to SQLite`
          : `Акаунт викладача "${tName}" збережено в БД`,
        'success'
      );
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleUpdateTeacher = async (teacherId: string, updates: Partial<TeacherInput>) => {
    try {
      const { teachers } = await apiUpdateTeacher(teacherId, updates);
      setTeachersDb(teachers);
      triggerToast(
        lang === 'es'
          ? 'Cuenta docente actualizada'
          : lang === 'en'
          ? 'Teacher account updated'
          : 'Акаунт викладача оновлено в БД',
        'success'
      );
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      const { teachers } = await apiDeleteTeacher(teacherId);
      setTeachersDb(teachers);
      triggerToast(
        lang === 'es'
          ? 'Cuenta eliminada de SQLite'
          : lang === 'en'
          ? 'Teacher account deleted from SQLite'
          : 'Акаунт видалено з бази даних',
        'info'
      );
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  // Teacher CRUD: Courses (SQLite Backend)
  const handleCreateCourse = async (input: CourseInput) => {
    if (!activeProfessor) return;
    try {
      const { professor, createdCourse } = await apiCreateCourse(input);
      setActiveProfessor(professor);
      setActiveProfessorSession(professor);
      setSelectedProfCourseId(createdCourse.id);
      triggerToast(
        lang === 'es'
          ? `Asignatura "${createdCourse.code}" guardada`
          : lang === 'en'
          ? `Course "${createdCourse.code}" saved to DB`
          : `Курс "${createdCourse.code}" збережено в БД`,
        'success'
      );
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleUpdateCourse = async (courseId: string, updates: Partial<CourseInput>) => {
    if (!activeProfessor) return;
    try {
      const { professor } = await apiUpdateCourse(courseId, updates);
      setActiveProfessor(professor);
      setActiveProfessorSession(professor);
      triggerToast(
        lang === 'es'
          ? 'Asignatura actualizada'
          : lang === 'en'
          ? 'Course updated'
          : 'Курс оновлено',
        'success'
      );
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!activeProfessor) return;
    try {
      const { professor } = await apiDeleteCourse(courseId);
      setActiveProfessor(professor);
      setActiveProfessorSession(professor);
      triggerToast(
        lang === 'es'
          ? 'Asignatura y su repositorio eliminados'
          : lang === 'en'
          ? 'Course and repository deleted'
          : 'Курс та його репозиторій видалено',
        'info'
      );
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  // Teacher CRUD: Real File Upload + RAG Chunking/Embedding inside each Course Repository
  const handleCreateDocument = async (input: DocumentInput, file?: File | null) => {
    if (!activeProfessor) return;
    try {
      const { professor, chunksIndexed, document: createdDoc } = await apiUploadDocument(input, file);
      setActiveProfessor(professor);
      setActiveProfessorSession(professor);
      if (createdDoc?.id) {
        setSelectedProfCourseId(createdDoc.courseId);
        setSelectedDocIds((prev) => Array.from(new Set([...prev, createdDoc.id])));
      }
      triggerToast(
        lang === 'es'
          ? `Documento indexado (${chunksIndexed} fragmentos)`
          : lang === 'en'
          ? `Document uploaded & indexed (${chunksIndexed} chunks)`
          : `Файл збережено та проіндексовано (${chunksIndexed} фрагментів)`,
        'success'
      );
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleUpdateDocument = async (documentId: string, updates: Partial<DocumentInput>) => {
    if (!activeProfessor) return;
    try {
      const { professor } = await apiUpdateDocument(documentId, updates);
      setActiveProfessor(professor);
      setActiveProfessorSession(professor);
      triggerToast(
        lang === 'es'
          ? 'Documento actualizado'
          : lang === 'en'
          ? 'Document updated'
          : 'Документ оновлено',
        'success'
      );
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!activeProfessor) return;
    try {
      const { professor } = await apiDeleteDocument(documentId);
      setActiveProfessor(professor);
      setActiveProfessorSession(professor);
      triggerToast(
        lang === 'es'
          ? 'Documento eliminado del repositorio'
          : lang === 'en'
          ? 'Document deleted from repository'
          : 'Документ видалено з репозиторію',
        'info'
      );
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleOpenTaskGenerator = (initialSubject?: string, initialPoi?: string, initialCourseId?: string) => {
    if (initialSubject) setSubject(initialSubject);
    if (initialPoi) setPoiName(initialPoi);
    if (initialCourseId && activeProfessor) {
      setSelectedProfCourseId(initialCourseId);
      setSelectedDocIds(getCourseDocuments(activeProfessor, initialCourseId).map((d) => d.id));
    }
    setCurrentView('generator');
    const msg =
      lang === 'es'
        ? 'Generador de tareas abierto'
        : lang === 'en'
        ? 'Task generator opened'
        : 'Відкрито генератор завдань';
    triggerToast(msg, 'info');
  };

  // Handle saving an edited task (persisted directly into SQLite activities table)
  const handleSaveEditedTask = async (taskId: number, newTitle: string, newBody: string) => {
    if (!tasks) return;
    const updated = { ...tasks };
    if (taskId === 1) updated.variant1 = { ...updated.variant1, title: newTitle, body: newBody };
    if (taskId === 2) updated.variant2 = { ...updated.variant2, title: newTitle, body: newBody };
    if (taskId === 3) updated.variant3 = { ...updated.variant3, title: newTitle, body: newBody };
    setTasks(updated);

    const draftId = currentDraftIds[taskId];
    if (draftId && activeProfessor && getStoredAuthToken()) {
      try {
        const res = await apiUpdateActivity(draftId, { title: newTitle, body: newBody });
        setActivities(res.activities);
      } catch (err) {
        triggerToast(err instanceof Error ? err.message : 'Error', 'error');
        return;
      }
    }
    triggerToast(`${t.toastTaskSaved} #${taskId}`);
  };

  // Approve & persist a task variant card in SQLite
  const handleApproveTaskVariant = async (variantIdx: 1 | 2 | 3) => {
    if (!tasks || !activeProfessor || !getStoredAuthToken()) return;
    const v = variantIdx === 1 ? tasks.variant1 : variantIdx === 2 ? tasks.variant2 : tasks.variant3;
    const existingDraftId = currentDraftIds[variantIdx];

    try {
      if (existingDraftId) {
        const res = await apiUpdateActivity(existingDraftId, {
          status: 'approved',
          title: v.title,
          body: v.body,
        });
        setActivities(res.activities);
      } else {
        const created = await apiCreateActivity({
          courseId: useRepo ? selectedProfCourseId : undefined,
          documentIds: useRepo ? selectedDocIds : [],
          subject,
          poiName,
          teacherNote,
          title: v.title,
          body: v.body,
          variantType: variantIdx === 1 ? 'fieldwork' : variantIdx === 2 ? 'analytical' : 'quiz',
          variantIndex: variantIdx,
          status: 'approved',
          metadata: {
            educationLevel,
            academicGroup,
            taskType,
            difficultyLevel,
            duration,
            learningObjectives,
            geoCoordinates,
            geoRadius,
            source: v.source,
          },
          sourceChunks: lastRagSources,
          engineUsed: lastEngineUsed || 'local-rag-fallback',
        });
        setCurrentDraftIds((prev) => ({ ...prev, [variantIdx]: created.activity.id }));
        setActivities(created.activities);
      }
      setCardStatuses((prev) => ({ ...prev, [variantIdx]: 'approved' }));
      triggerToast(t.toastActivityApproved, 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  // Reject a generated draft card in SQLite
  const handleRejectTaskVariant = async (variantIdx: 1 | 2 | 3) => {
    if (!tasks || !activeProfessor || !getStoredAuthToken()) return;
    const existingDraftId = currentDraftIds[variantIdx];
    try {
      if (existingDraftId) {
        const res = await apiUpdateActivity(existingDraftId, { status: 'rejected' });
        setActivities(res.activities);
      }
      setCardStatuses((prev) => ({ ...prev, [variantIdx]: 'rejected' }));
      triggerToast(t.toastActivityRejected, 'info');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  // Professor Dashboard Saved Activities CRUD handlers
  const handleDashboardUpdateActivity = async (
    activityId: string,
    updates: { title?: string; body?: string; status?: ActivityStatus }
  ) => {
    try {
      const res = await apiUpdateActivity(activityId, updates);
      setActivities(res.activities);
      if (updates.status === 'approved') {
        triggerToast(t.toastActivityApproved, 'success');
      } else {
        triggerToast(t.toastTaskSaved, 'success');
      }
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDashboardDeleteActivity = async (activityId: string) => {
    try {
      const res = await apiDeleteActivity(activityId);
      setActivities(res.activities);
      triggerToast(t.toastActivityDeleted, 'info');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleFetchDocumentContent = async (documentId: string) => {
    const res = await apiGetDocumentContent(documentId);
    return res.document;
  };

  return (
    <div className="w-full h-screen min-h-screen flex flex-col bg-slate-50 text-slate-800 overflow-hidden font-sans select-none antialiased">
      
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR (3 SITE BUTTONS, PROFESSOR LOGIN, LANGUAGE SELECTOR)   */}
      {/* ========================================================================= */}
      <header className="w-full bg-[#581221] text-white px-2 sm:px-6 py-2.5 flex items-center justify-between gap-1.5 border-b border-[#7A1C30] shadow-sm shrink-0 z-20">
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Top-Left Back / Forward Buttons (Hidden in isolated Account Manager mode) */}
          {!isManagerLocked && (
            <div className="flex items-center bg-[#420c18] p-0.5 rounded-lg border border-[#7A1C30]/80 shrink-0 shadow-2xs">
              <button
                id="btn-nav-back"
                onClick={handleGoBack}
                disabled={!canGoBack(navState)}
                className={`px-2 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                  canGoBack(navState)
                    ? 'text-white hover:bg-[#7A1C30] cursor-pointer'
                    : 'text-rose-300/30 cursor-not-allowed'
                }`}
                title={t.btnBackTooltip}
                aria-label={t.btnBackTooltip}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden md:inline">{t.btnBack}</span>
              </button>
              <button
                id="btn-nav-forward"
                onClick={handleGoForward}
                disabled={!canGoForward(navState)}
                className={`px-2 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                  canGoForward(navState)
                    ? 'text-white hover:bg-[#7A1C30] cursor-pointer'
                    : 'text-rose-300/30 cursor-not-allowed'
                }`}
                title={t.btnForwardTooltip}
                aria-label={t.btnForwardTooltip}
              >
                <span className="hidden md:inline">{t.btnForward}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sidebar Toggle in Header */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-8 h-8 rounded-lg bg-[#7A1C30] hover:bg-[#9E2A43] flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/40 transition cursor-pointer"
            title={isSidebarOpen ? t.toggleCollapseTooltip : t.toggleExpandTooltip}
            aria-label={isSidebarOpen ? t.toggleCollapseTooltip : t.toggleExpandTooltip}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          <div
            onClick={() => {
              if (!isManagerLocked) setCurrentView('home');
            }}
            className={`flex items-center space-x-2 sm:space-x-2.5 group ${isManagerLocked ? 'cursor-default' : 'cursor-pointer'}`}
            title="Universidad de Valladolid"
          >
            <div className="w-8 h-8 rounded-lg bg-[#7A1C30] flex items-center justify-center text-[#D4AF37] shadow-inner border border-[#D4AF37]/30 group-hover:bg-[#9E2A43] transition shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="font-bold text-xs sm:text-sm tracking-wide text-white group-hover:text-amber-200 transition whitespace-nowrap truncate max-w-[220px] xl:max-w-none">
                {t.appTitle}
              </span>
              <span className="text-[10px] sm:text-[11px] text-rose-200/80 hidden lg:inline-block whitespace-nowrap truncate max-w-[220px] xl:max-w-none">
                {t.appSub}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Controls: Quick Theme Switch, Active Sessions & Language Selector */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {/* Quick Theme Toggle (White / Black) */}
          <button
            id="btn-quick-theme"
            onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg bg-[#7A1C30] hover:bg-[#9E2A43] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center transition cursor-pointer shadow-xs shrink-0"
            title={t.toggleThemeTooltip}
            aria-label={t.toggleThemeTooltip}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#D4AF37]" />}
          </button>

          {activeProfessor ? (
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => setCurrentView('professor_portal')}
                className="hidden sm:flex bg-[#7A1C30] hover:bg-[#9E2A43] text-white border border-[#D4AF37]/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                title={getLocStr(activeProfessor.name, lang)}
              >
                <UserCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span className="hidden xl:inline">{getLocStr(activeProfessor.name, lang).split(':')[0]}</span>
              </button>
              <button
                id="btn-header-logout"
                onClick={handleLogout}
                className="bg-[#581221] hover:bg-[#7A1C30] text-rose-200 hover:text-white px-2 py-1.5 rounded-lg text-xs font-semibold border border-[#7A1C30] transition cursor-pointer shrink-0"
                title={t.logoutTitle}
                aria-label={t.logoutProfAria}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {activeAdmin && !activeProfessor ? (
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => setCurrentView('admin_portal')}
                className="hidden sm:flex bg-[#7A1C30] hover:bg-[#9E2A43] text-white border border-[#D4AF37]/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                title={getLocStr(activeAdmin.name, lang)}
              >
                <Shield className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span className="hidden xl:inline">{t.adminBadge}</span>
              </button>
              <button
                id="btn-header-admin-logout"
                onClick={handleAdminLogout}
                className="bg-[#581221] hover:bg-[#7A1C30] text-rose-200 hover:text-white px-2 py-1.5 rounded-lg text-xs font-semibold border border-[#7A1C30] transition cursor-pointer shrink-0"
                title={t.logoutTitle}
                aria-label={t.logoutAdminAria}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          <div className="flex items-center bg-[#7A1C30] rounded-lg border border-[#D4AF37]/40 px-2 sm:px-2.5 py-1 text-xs shrink-0">
            <Globe className="w-3.5 h-3.5 text-[#D4AF37] mr-1 sm:mr-1.5 shrink-0" />
            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              aria-label="Вибір мови інтерфейсу / Language selector / Selector de idioma"
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-0.5 max-w-[78px] sm:max-w-none"
            >
              <option value="uk" className="bg-[#581221] text-white">UA (Українська)</option>
              <option value="en" className="bg-[#581221] text-white">EN (English)</option>
              <option value="es" className="bg-[#581221] text-white">ES (Español)</option>
            </select>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN INNER WORKSPACE (EXPANDABLE SIDEBAR WITH HISTORY + WORKSPACE)     */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* EXPANDABLE SIDEBAR */}
        <aside
          aria-label="Sidebar navigation"
          className={`${
            isSidebarOpen
              ? 'fixed md:static inset-y-0 left-0 z-30 w-64 flex'
              : 'hidden md:flex md:w-16'
          } ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
          } flex-col justify-between border-r transition-all duration-200 shrink-0 select-none shadow-xs`}
        >
          <div>
            {/* Top Bar inside Sidebar (UVa Branding + Search + Toggle) */}
            <div className={`p-3.5 border-b flex items-center justify-between ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
            }`}>
              {isSidebarOpen ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#7A1C30] flex items-center justify-center text-[#D4AF37] shadow-xs">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className={`font-bold text-sm tracking-wide ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>UVa</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => triggerToast(t.toastQuickSearch)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                      title={t.searchTooltip}
                      aria-label={t.searchTooltip}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className={`w-7 h-7 rounded-full border flex items-center justify-center transition cursor-pointer ${
                        theme === 'dark' ? 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900'
                      }`}
                      title={t.toggleCollapseTooltip}
                      aria-label={t.toggleCollapseTooltip}
                    >
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition cursor-pointer ${
                      theme === 'dark' ? 'border-slate-700 text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]' : 'border-slate-300 hover:border-[#7A1C30] text-slate-600 hover:text-[#7A1C30]'
                    }`}
                    title={t.toggleExpandTooltip}
                    aria-label={t.toggleExpandTooltip}
                  >
                    <PanelLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Menu List (Account Manager sees ONLY Account Management + Logout) */}
            <div className="py-3 px-2 space-y-1.5">
              {!isManagerLocked && (
                <>
                  {activeProfessor && (
                    <>
                      {/* 2. Новий чат / New chat (Visible only inside Professor account) */}
                      <button
                        id="btn-sidebar-newchat"
                        onClick={handleNewChat}
                        className={`w-full flex items-center ${
                          isSidebarOpen ? 'px-3 py-2.5 space-x-3' : 'justify-center p-2.5'
                        } rounded-xl ${
                          theme === 'dark'
                            ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-[#7A1C30]'
                        } text-xs font-semibold transition cursor-pointer`}
                        title={t.navNewChat}
                        aria-label={t.navNewChat}
                      >
                        <PenSquare className="w-4 h-4 shrink-0" />
                        {isSidebarOpen && <span>{t.navNewChat}</span>}
                      </button>

                      {/* 3. Історія / History / Historial (Visible only inside Professor account) */}
                      <button
                        id="btn-sidebar-history"
                        onClick={() => {
                          setCurrentView('history');
                          triggerToast(t.toastLibraryNav, 'info');
                        }}
                        className={`w-full flex items-center ${
                          isSidebarOpen ? 'px-3 py-2.5 space-x-3' : 'justify-center p-2.5'
                        } rounded-xl ${
                          currentView === 'history'
                            ? 'bg-[#7A1C30] text-white font-bold'
                            : theme === 'dark'
                            ? 'text-slate-300 hover:bg-slate-800 hover:text-white font-semibold'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-[#7A1C30] font-semibold'
                        } text-xs transition cursor-pointer`}
                        title={t.navHistory}
                        aria-label={t.navHistory}
                      >
                        <History className={`w-4 h-4 shrink-0 ${currentView === 'history' ? 'text-[#D4AF37]' : ''}`} />
                        {isSidebarOpen && (
                          <div className="flex items-center justify-between w-full">
                            <span>{t.navHistory}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              currentView === 'history'
                                ? 'bg-white/20 text-white'
                                : theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {history.length}
                            </span>
                          </div>
                        )}
                      </button>
                    </>
                  )}

                  {/* 4. Викладач / Professor */}
                  <button
                    id="btn-sidebar-professor"
                    onClick={() => {
                      if (activeProfessor) {
                        setCurrentView(currentView === 'professor_portal' ? 'generator' : 'professor_portal');
                      } else {
                        openLoginModal('teacher');
                      }
                    }}
                    className={`w-full flex items-center ${
                      isSidebarOpen ? 'px-3 py-2.5 space-x-3' : 'justify-center p-2.5'
                    } rounded-xl ${
                      currentView === 'professor_portal'
                        ? 'bg-[#7A1C30] text-white font-bold'
                        : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-[#7A1C30] font-semibold'
                    } text-xs transition cursor-pointer`}
                    title={t.navProfessor}
                    aria-label={t.navProfessor}
                  >
                    <UserCheck className={`w-4 h-4 shrink-0 ${currentView === 'professor_portal' ? 'text-[#D4AF37]' : theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`} />
                    {isSidebarOpen && (
                      <div className="flex items-center justify-between w-full">
                        <span>{t.navProfessor}</span>
                        {activeProfessor && (
                          <span className="text-[10px] bg-amber-400 text-slate-900 font-bold px-1.5 py-0.2 rounded">
                            {activeProfessor.login}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </>
              )}

              {/* 4b. Менеджер акаунтів / Account Manager */}
              <button
                id="btn-sidebar-admin"
                onClick={() => {
                  if (activeAdmin) {
                    setCurrentView('admin_portal');
                  } else {
                    openLoginModal('admin');
                  }
                }}
                className={`w-full flex items-center ${
                  isSidebarOpen ? 'px-3 py-2.5 space-x-3' : 'justify-center p-2.5'
                } rounded-xl ${
                  currentView === 'admin_portal'
                    ? 'bg-[#7A1C30] text-white font-bold'
                    : theme === 'dark'
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-[#7A1C30] font-semibold'
                } text-xs transition cursor-pointer`}
                title={t.navAdmin}
                aria-label={t.navAdmin}
              >
                <Shield className={`w-4 h-4 shrink-0 ${currentView === 'admin_portal' ? 'text-[#D4AF37]' : theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`} />
                {isSidebarOpen && (
                  <div className="flex items-center justify-between w-full">
                    <span>{t.navAdmin}</span>
                    {activeAdmin && (
                      <span className="text-[10px] bg-emerald-400 text-slate-900 font-bold px-1.5 py-0.2 rounded">
                        {activeAdmin.login}
                      </span>
                    )}
                  </div>
                )}
              </button>

              {isManagerLocked && (
                <button
                  id="btn-sidebar-manager-logout"
                  onClick={handleAdminLogout}
                  className={`w-full flex items-center ${
                    isSidebarOpen ? 'px-3 py-2.5 space-x-3' : 'justify-center p-2.5'
                  } rounded-xl ${
                    theme === 'dark'
                      ? 'text-rose-300 hover:bg-rose-950/50'
                      : 'text-rose-700 hover:bg-rose-50'
                  } text-xs font-semibold transition cursor-pointer`}
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  {isSidebarOpen && <span>{lang === 'es' ? 'Cerrar sesión' : lang === 'en' ? 'Sign Out' : 'Вийти з акаунта'}</span>}
                </button>
              )}

            </div>
          </div>

          {/* Bottom Sidebar Footer */}
          {isSidebarOpen ? (
            <div className={`p-3.5 border-t text-[11px] mt-auto ${
              theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'
            }`}>
              <span className={`font-semibold block ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{t.sidebarFooterTitle}</span>
              <span>{t.sidebarFooterSub}</span>
            </div>
          ) : (
            <div className={`p-3 border-t flex justify-center mt-auto ${
              theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'
            }`}>
              <span className="text-[10px] font-bold text-[#7A1C30] dark:text-[#D4AF37]">UVa</span>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        {isManagerLocked && activeAdmin ? (
          <AdminDashboard
            admin={activeAdmin}
            teachersDb={teachersDb}
            onCreateTeacher={handleCreateTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onLogout={handleAdminLogout}
            lang={lang}
            theme={theme}
          />
        ) : currentView === 'home' ? (
          <UniversityHomePage
            lang={lang}
            theme={theme}
            onNavigateToGenerator={() => setCurrentView('generator')}
            onNavigateToProfessor={() => {
              if (activeProfessor) {
                setCurrentView('professor_portal');
              } else {
                openLoginModal('teacher');
              }
            }}
            isLoggedIn={activeProfessor !== null}
            professorName={activeProfessor ? getLocStr(activeProfessor.name, lang).split(':')[0] : undefined}
          />
        ) : currentView === 'history' && activeProfessor ? (
          <section
            data-testid="history-library-view"
            className={`flex-1 overflow-y-auto p-5 sm:p-8 ${
              theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
            }`}
          >
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div>
                  <h1 className="text-xl font-bold text-[#7A1C30] dark:text-rose-400 flex items-center gap-2">
                    <History className="w-5 h-5 text-[#D4AF37]" />
                    <span>{t.historyPageTitle}</span>
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t.historyPageSub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('generator')}
                  className="px-4 py-2 text-xs font-bold bg-[#7A1C30] hover:bg-[#9E2A43] text-white rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{t.historyBtnToGenerator}</span>
                </button>
              </div>

              {/* History Cards Grid */}
              {history.length === 0 ? (
                <div className={`p-8 rounded-xl border border-dashed text-center ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                }`}>
                  <History className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <h3 className="text-sm font-bold">{t.historyEmptyTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1">{t.historyEmptyDesc}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between gap-3 ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-[#7A1C30] dark:text-rose-300">
                            {item.poiName || item.subject}
                          </h3>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {formatHistoryTime(item)}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {item.subject}
                        </div>
                        {item.teacherNote && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {item.teacherNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleSelectHistory(item)}
                          className="text-xs font-semibold text-[#7A1C30] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{t.historyBtnOpen}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="text-xs text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                          title={t.deleteTooltip}
                          aria-label={t.deleteTooltip}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vectorized Files Library */}
              <div className={`p-5 rounded-xl border space-y-3 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t.historyRepoSection}</span>
                </h2>
                {uploadedRepoFiles.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.historyNoFiles}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {uploadedRepoFiles.map((f) => (
                      <div
                        key={f.id}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{f.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">{f.storagePath}</div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {f.chunks} {t.vectorChunksUnit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : currentView === 'professor_portal' && activeProfessor ? (
          <ProfessorDashboard
            professor={activeProfessor}
            activities={activities}
            onLogout={handleLogout}
            onOpenTaskGenerator={handleOpenTaskGenerator}
            onCreateCourse={handleCreateCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onCreateDocument={handleCreateDocument}
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={handleDeleteDocument}
            onFetchDocumentContent={handleFetchDocumentContent}
            onUpdateActivity={handleDashboardUpdateActivity}
            onDeleteActivity={handleDashboardDeleteActivity}
            lang={lang}
            theme={theme}
          />
        ) : currentView === 'admin_portal' && activeAdmin ? (
          <AdminDashboard
            admin={activeAdmin}
            teachersDb={teachersDb}
            onCreateTeacher={handleCreateTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onLogout={handleAdminLogout}
            lang={lang}
            theme={theme}
          />
        ) : (
          <main className={`flex-1 flex flex-col lg:flex-row overflow-hidden w-full ${
            theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
          }`}>
          
          {/* ========================================================================= */}
          {/* LEFT PANEL: Form Inputs & Live Wikidata Auto-Analysis                    */}
          {/* ========================================================================= */}
          <div className={`w-full lg:w-5/12 xl:w-4/12 p-4 sm:p-5 border-r overflow-y-auto flex flex-col justify-between shrink-0 shadow-xs ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div>
              {/* Form Heading */}
              <div className={`border-b pb-3 mb-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-[#7A1C30] dark:text-rose-400 tracking-tight">
                    {t.formHeading}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.draftSavedBadge}
                    </span>
                    {activeProfessor && (
                      <span className="text-[10px] bg-amber-100 text-[#7A1C30] border border-amber-200 px-2 py-0.5 rounded font-bold">
                        {getLocStr(activeProfessor.name, lang).split(':')[0]}
                      </span>
                    )}
                  </div>
                </div>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t.formSub}
                </p>
              </div>

              {/* Form Controls */}
              <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-4">
                
                {/* 1. POI Input (Point of Interest) */}
                <div>
                  <label htmlFor="poiInput" className={`block text-xs font-bold uppercase tracking-wide mb-1 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {t.lblPOI} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Landmark className="w-4 h-4" />
                    </span>
                    <input
                      id="poiInput"
                      type="text"
                      value={poiName}
                      onChange={(e) => setPoiName(e.target.value)}
                      required
                      placeholder={t.poiPlaceholder}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#7A1C30] outline-none transition ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800 focus:border-[#D4AF37]'
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#7A1C30]'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {t.poiHint}
                  </span>
                </div>

                {/* 2. Subject Input */}
                <div>
                  <label htmlFor="subjectInput" className={`block text-xs font-bold uppercase tracking-wide mb-1 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {t.lblSubject} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <input
                      id="subjectInput"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      placeholder={t.subjectPlaceholder}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#7A1C30] outline-none transition ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800 focus:border-[#D4AF37]'
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#7A1C30]'
                      }`}
                    />
                  </div>
                </div>

                {/* 3. Course Repository & Active Local Vector File Upload */}
                <div className={`p-3.5 rounded-lg border ${
                  theme === 'dark' ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useRepo}
                        onChange={(e) => setUseRepo(e.target.checked)}
                        className="w-4 h-4 text-[#7A1C30] focus:ring-[#7A1C30] border-slate-300 rounded cursor-pointer accent-[#7A1C30]"
                      />
                      <span className={`ml-2 text-xs font-bold ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        {t.lblUseRepo}
                      </span>
                    </label>

                    <input
                      ref={repoFileInputRef}
                      id="repo-file-upload-input"
                      type="file"
                      accept=".txt,.md,.pdf,.docx"
                      onChange={handleQuickRepoFileUpload}
                      className="hidden"
                    />
                    <button
                      id="btn-repo-upload-folder"
                      type="button"
                      disabled={isUploadingRepoFile}
                      onClick={() => repoFileInputRef.current?.click()}
                      title={t.uploadFolderAria}
                      aria-label={t.uploadFolderAria}
                      className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[#D4AF37] ${
                        theme === 'dark'
                          ? 'bg-slate-900 border-slate-600 hover:border-[#D4AF37] hover:bg-slate-700'
                          : 'bg-white border-amber-300 hover:border-[#7A1C30] hover:bg-amber-50'
                      } disabled:opacity-50`}
                    >
                      {isUploadingRepoFile ? (
                        <RotateCw className="w-4 h-4 animate-spin text-[#7A1C30] dark:text-[#D4AF37]" />
                      ) : (
                        <FolderOpen className="w-4 h-4 text-[#D4AF37]" />
                      )}
                    </button>
                  </div>

                  {isUploadingRepoFile && (
                    <div className="text-[11px] font-medium text-[#7A1C30] dark:text-[#D4AF37] mb-2 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 animate-bounce" />
                      <span>{t.uploadingFileStatus}</span>
                    </div>
                  )}

                  {uploadedRepoFiles.length > 0 && (
                    <div data-testid="uploaded-vector-files" className="mb-2.5 space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {t.uploadedFilesHeading}
                      </span>
                      {uploadedRepoFiles.map((f) => (
                        <div
                          key={f.id}
                          className={`flex items-center justify-between px-2 py-1 rounded border text-[11px] ${
                            theme === 'dark'
                              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          }`}
                        >
                          <span className="truncate font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{f.name}</span>
                          </span>
                          <span className="font-mono text-[10px] shrink-0 ml-2">
                            {f.chunks} {t.vectorChunksUnit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`mt-2 transition-opacity duration-200 space-y-2.5 ${useRepo ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    {activeProfessor && activeProfessor.courses.length > 0 ? (
                      <>
                        <div className="relative">
                          <select
                            value={selectedProfCourseId}
                            onChange={(e) => {
                              const nextCid = e.target.value;
                              setSelectedProfCourseId(nextCid);
                              const docs = getCourseDocuments(activeProfessor, nextCid);
                              setSelectedDocIds(docs.map((d) => d.id));
                              const matchedCourse = activeProfessor.courses.find((c) => c.id === nextCid);
                              if (matchedCourse) {
                                setSubject(getLocStr(matchedCourse.title, lang));
                              }
                            }}
                            disabled={!useRepo}
                            aria-label={t.selectCourseAria}
                            className={`w-full p-2 text-xs border rounded outline-none pr-8 appearance-none cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-slate-700 border-slate-600 text-white'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            {activeProfessor.courses.map((crs) => (
                              <option key={crs.id} value={crs.id}>
                                {crs.code} — {getLocStr(crs.title, lang)} ({crs.academicYear})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Checkable repository documents for this course */}
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {t.lblSelectCourseDocs}
                          </span>
                          {(() => {
                            const courseDocs = getCourseDocuments(activeProfessor, selectedProfCourseId);
                            if (courseDocs.length === 0) {
                              return (
                                <p className="text-[11px] text-slate-400 italic">
                                  {t.noCourseDocsHint}
                                </p>
                              );
                            }
                            return (
                              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                                {courseDocs.map((doc) => {
                                  const isChecked = selectedDocIds.includes(doc.id);
                                  return (
                                    <label
                                      key={doc.id}
                                      className={`flex items-center gap-2 p-1.5 rounded border text-[11px] cursor-pointer transition ${
                                        isChecked
                                          ? 'bg-rose-50/70 dark:bg-[#7A1C30]/20 border-[#7A1C30]/40 text-slate-800 dark:text-slate-100'
                                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          setSelectedDocIds((prev) =>
                                            prev.includes(doc.id)
                                              ? prev.filter((id) => id !== doc.id)
                                              : [...prev, doc.id]
                                          );
                                        }}
                                        className="w-3.5 h-3.5 accent-[#7A1C30] rounded cursor-pointer shrink-0"
                                      />
                                      <span className="truncate flex-1 font-medium">
                                        {getLocStr(doc.name, lang)}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                        {doc.fileFormat || 'PDF'}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <select
                            value={selectedRepo}
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            disabled={!useRepo}
                            aria-label={t.selectRepoAria}
                            className={`w-full p-2 text-xs border rounded outline-none pr-8 appearance-none cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-slate-700 border-slate-600 text-white'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            {repos.map((repo) => (
                              <option key={repo.id} value={repo.id}>
                                {repo.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {t.lblRepoNote}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. Pedagogical & Spatial Parameters */}
                <div className={`p-3.5 rounded-lg border space-y-2.5 ${
                  theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#7A1C30] dark:text-[#D4AF37]">
                    {t.lblPedagogicalSection}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="educationLevelSelect" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t.lblEducationLevel}
                      </label>
                      <select
                        id="educationLevelSelect"
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className={`w-full p-1.5 text-xs border rounded outline-none cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="Bachelor (Grado)">Bachelor (Grado)</option>
                        <option value="Master (Máster)">Master (Máster)</option>
                        <option value="Doctoral (Doctorado)">Doctoral (Doctorado)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="academicGroupInput" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t.lblAcademicGroup}
                      </label>
                      <input
                        id="academicGroupInput"
                        type="text"
                        value={academicGroup}
                        onChange={(e) => setAcademicGroup(e.target.value)}
                        placeholder={t.placeholderGroup}
                        className={`w-full p-1.5 text-xs border rounded outline-none ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="taskTypeSelect" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t.lblTaskType}
                      </label>
                      <select
                        id="taskTypeSelect"
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className={`w-full p-1.5 text-xs border rounded outline-none cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="Fieldwork & Analysis">Fieldwork & Analysis</option>
                        <option value="Group Debate / Seminar">Group Debate / Seminar</option>
                        <option value="Individual Research">Individual Research</option>
                        <option value="Assessment Quiz">Assessment Quiz</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="difficultySelect" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t.lblDifficultyLevel}
                      </label>
                      <select
                        id="difficultySelect"
                        value={difficultyLevel}
                        onChange={(e) => setDifficultyLevel(e.target.value)}
                        className={`w-full p-1.5 text-xs border rounded outline-none cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="Introductory">Introductory</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="durationInput" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t.lblDuration}
                      </label>
                      <input
                        id="durationInput"
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder={t.placeholderDuration}
                        className={`w-full p-1.5 text-xs border rounded outline-none ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="geoRadiusInput" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t.lblGeoRadius}
                      </label>
                      <input
                        id="geoRadiusInput"
                        type="text"
                        value={geoRadius}
                        onChange={(e) => setGeoRadius(e.target.value)}
                        placeholder={t.placeholderRadius}
                        className={`w-full p-1.5 text-xs border rounded outline-none font-mono ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="geoCoordinatesInput" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {t.lblGeoCoordinates}
                    </label>
                    <input
                      id="geoCoordinatesInput"
                      type="text"
                      value={geoCoordinates}
                      onChange={(e) => setGeoCoordinates(e.target.value)}
                      placeholder={t.placeholderCoords}
                      className={`w-full p-1.5 text-xs border rounded outline-none font-mono ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor="learningObjectivesInput" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {t.lblLearningObjectives}
                    </label>
                    <textarea
                      id="learningObjectivesInput"
                      rows={2}
                      value={learningObjectives}
                      onChange={(e) => setLearningObjectives(e.target.value)}
                      placeholder={t.placeholderObjectives}
                      className={`w-full p-2 text-xs border rounded outline-none resize-none ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* 5. Teacher Notes */}
                <div>
                  <label htmlFor="teacherNotes" className={`block text-xs font-bold uppercase tracking-wide mb-1 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {t.lblTeacherNotes}
                  </label>
                  <textarea
                    id="teacherNotes"
                    rows={2}
                    value={teacherNote}
                    onChange={(e) => setTeacherNote(e.target.value)}
                    placeholder={t.teacherPlaceholder}
                    className={`w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-[#7A1C30] outline-none transition resize-none ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>

                {/* 5. Dynamic Wikidata Auto-Analysis Card */}
                <div className={`rounded-lg p-3 text-xs flex items-start space-x-2.5 shadow-xs border ${
                  theme === 'dark'
                    ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="mt-0.5 text-[#C59B27] shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#7A1C30] dark:text-rose-400">
                        {t.lblWikiTitle}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        theme === 'dark' ? 'bg-slate-700 text-slate-200 border-slate-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {t.facultyBadge}
                      </span>
                    </div>
                    <div className={`mt-1.5 font-mono text-[11px] space-y-1 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <div><b className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{t.lblYear}</b> <span>{wikidata.buildYear}</span></div>
                      <div><b className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{t.lblStyle}</b> <span>{wikidata.style}</span></div>
                      <div><b className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{t.lblEvents}</b> <span>{wikidata.events.join(', ')}</span></div>
                      {wikidata.entityId && (
                        <div className="text-[10px] text-slate-400 pt-0.5">
                          <b>{t.lblEntity}</b> <span className="text-[#7A1C30] dark:text-amber-300 font-semibold">{wikidata.entityId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Submit Action Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#7A1C30] hover:bg-[#9E2A43] text-white font-semibold py-2.5 px-4 rounded-lg shadow hover:shadow-md transition-all flex items-center justify-center space-x-2 border border-[#581221] cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>{t.btnGenerate}</span>
                  </button>
                </div>

              </form>
            </div>

            {/* Panel Bottom Metadata */}
            <div className={`mt-4 pt-3 border-t text-[11px] flex justify-between items-center ${
              theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span>
                {t.lblModel} <b className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>{t.modelName}</b>
              </span>
              <span className={`text-[10px] flex items-center gap-1 font-medium px-2 py-0.5 rounded border ${
                theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <span>{t.facultyBadge}</span>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT PANEL: Results Area (100% of remaining width)                      */}
          {/* ========================================================================= */}
          <div className={`w-full lg:w-7/12 xl:w-8/12 flex flex-col h-full overflow-hidden relative ${
            theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
          }`}>
            
            {/* Header for Results */}
            <div className={`p-4 sm:px-6 pb-3 pt-4 border-b flex justify-between items-center shrink-0 ${
              theme === 'dark' ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white/80 border-slate-200 text-slate-800'
            } backdrop-blur-xs`}>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#D4AF37]"></div>
                <h2 className="text-base sm:text-lg font-bold">
                  {t.resultsHeader}
                </h2>
              </div>

              {hasGenerated && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGenerate}
                    className="text-xs bg-white border border-slate-300 hover:border-[#7A1C30] text-slate-700 px-3 py-1.5 rounded-md transition flex items-center space-x-1.5 shadow-xs cursor-pointer font-medium"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#7A1C30]" />
                    <span>{t.btnRegenerate}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Chat, Cards & Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

              {/* Local Backend Error Alert */}
              {chatError && (
                <div
                  data-testid="rag-chat-error"
                  role="alert"
                  className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                    theme === 'dark'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="font-bold">{t.chatErrorTitle}</div>
                    <p className="leading-relaxed">{chatError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatError(null)}
                    aria-label={t.closeErrorAria}
                    className="text-xs font-semibold px-2 py-1 rounded hover:bg-rose-200/50 dark:hover:bg-rose-900/50 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Local Chat Conversation Messages */}
              {chatMessages.length > 0 && (
                <div data-testid="rag-chat-messages" className="space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs border ${
                          msg.role === 'user'
                            ? 'bg-[#7A1C30] text-white border-[#581221]'
                            : theme === 'dark'
                            ? 'bg-slate-900 text-slate-100 border-slate-800'
                            : 'bg-white text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-1">
                          {msg.role === 'user' ? t.chatUserLabel : t.chatAssistantLabel}
                        </div>
                        <div className="whitespace-pre-line">{msg.content}</div>

                        {/* Sources list rendered neatly under assistant message if non-empty */}
                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                          <div
                            data-testid="rag-chat-sources"
                            className={`mt-3 pt-2.5 border-t space-y-1.5 ${
                              theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                            }`}
                          >
                            <div className="text-[11px] font-bold text-[#7A1C30] dark:text-[#D4AF37] flex items-center gap-1.5">
                              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                              <span>{t.chatSourcesLabel} ({msg.sources.length}):</span>
                            </div>
                            <ul className="space-y-1.5">
                              {msg.sources.map((src, sIdx) => (
                                <li
                                  key={`${msg.id}-src-${sIdx}`}
                                  className={`p-2 rounded-lg border text-[11px] leading-snug ${
                                    theme === 'dark'
                                      ? 'bg-slate-800/70 border-slate-700 text-slate-300'
                                      : 'bg-amber-50/60 border-amber-200/80 text-slate-700'
                                  }`}
                                >
                                  {src}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* 1. INITIAL EMPTY STATE (WHEN NOT YET GENERATED & NO CHAT) */}
              {!hasGenerated && !isLoading && chatMessages.length === 0 && !chatError && (
                <div className={`my-12 flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed rounded-2xl shadow-xs ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}>
                  <div className="w-16 h-16 bg-[#7A1C30]/10 text-[#7A1C30] rounded-full flex items-center justify-center text-2xl mb-4">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <h3 className={`text-base font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    {t.emptyTitle}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                    {t.emptyDesc}
                  </p>
                  <div className={`inline-flex items-center text-xs px-3.5 py-2 rounded-lg border ${
                    theme === 'dark' ? 'bg-amber-950/40 text-amber-300 border-amber-800/60' : 'text-[#7A1C30] bg-amber-50/90 border-amber-200'
                  }`}>
                    <Lightbulb className="w-4 h-4 mr-2 text-[#D4AF37] shrink-0" />
                    <span>{t.emptyTip}</span>
                  </div>
                </div>
              )}

              {/* 2. LOADING STATE */}
              {(isLoading || isChatSending) && (
                <div
                  data-testid="rag-chat-loading"
                  className={`my-6 p-6 rounded-xl border shadow-sm text-center ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="inline-block animate-spin text-[#7A1C30] text-3xl mb-3">
                    <RotateCw className="w-7 h-7" />
                  </div>
                  <h3 className={`font-bold text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    {t.chatLoadingTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.loadingSub}
                  </p>
                  
                  <div className={`w-full h-2 rounded-full mt-4 overflow-hidden max-w-md mx-auto ${
                    theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                  }`}>
                    <div
                      className="bg-[#7A1C30] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressStep * 25}%` }}
                    ></div>
                  </div>
                  <div className={`text-xs font-mono mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {progressStep === 1 && t.step1}
                    {progressStep === 2 && t.step2}
                    {progressStep === 3 && t.step3}
                    {progressStep === 4 && t.step4}
                  </div>
                </div>
              )}

              {/* 3. GENERATED TASK CARDS + RAG TRACE PANEL */}
              {hasGenerated && tasks && !isLoading && (
                <div className="space-y-4">
                  {/* Engine + RAG Mode Strip (Always visible even when useRepo=false for side-by-side comparison) */}
                  <div
                    data-testid="rag-sources-panel"
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-slate-200'
                        : 'bg-amber-50/60 border-amber-200 text-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#7A1C30] dark:text-[#D4AF37] flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>{lastUseRepoMode ? t.ragModeRepoOn : t.ragModeRepoOff}</span>
                      </span>
                      {lastEngineUsed && (
                        <span
                          data-testid="generation-engine-indicator"
                          className="text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                        >
                          {lastEngineUsed === 'ollama' ? t.ragEngineOllama : t.ragEngineFallback}
                          {ragDebugTrace?.model ? ` (${ragDebugTrace.model})` : ''}
                        </span>
                      )}
                    </div>

                    {lastRagSources.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          {t.ragSourcesTitle} ({lastRagSources.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {lastRagSources.map((src) => (
                            <div
                              key={src.id}
                              className={`p-2 rounded-lg border text-[11px] ${
                                theme === 'dark'
                                  ? 'bg-slate-800/70 border-slate-700'
                                  : 'bg-white border-amber-200/70'
                              }`}
                            >
                              <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {src.documentTitle} · #{src.chunkIndex + 1} (score: {src.score})
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                {src.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Demo Panel: Деталі RAG та промпту */}
                  {ragDebugTrace && (
                    <div
                      data-testid="rag-debug-panel"
                      className={`rounded-xl border overflow-hidden ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        data-testid="btn-toggle-rag-debug"
                        onClick={() => setIsDebugOpen((prev) => !prev)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#7A1C30] dark:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Terminal className="w-4 h-4" />
                          <span>{t.ragDebugToggle}</span>
                          <span className="font-mono font-normal text-slate-500 dark:text-slate-400">
                            ({ragDebugTrace.documentChunks.length} / {ragDebugTrace.retrievedChunks.length})
                          </span>
                        </span>
                        {isDebugOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isDebugOpen && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">
                              1. {t.ragDebugDocChunks} ({ragDebugTrace.documentChunks.length})
                            </div>
                            {ragDebugTrace.documentChunks.length === 0 ? (
                              <p className="text-slate-500 italic">—</p>
                            ) : (
                              <div className="max-h-36 overflow-y-auto space-y-1">
                                {ragDebugTrace.documentChunks.map((ch) => (
                                  <div
                                    key={ch.id}
                                    className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                                  >
                                    <strong>{ch.documentTitle} #{ch.chunkIndex + 1}:</strong> {ch.content}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">
                              2. {t.ragDebugRetrieved} ({ragDebugTrace.retrievedChunks.length})
                            </div>
                            {ragDebugTrace.retrievedChunks.length === 0 ? (
                              <p className="text-slate-500 italic">—</p>
                            ) : (
                              <div className="max-h-36 overflow-y-auto space-y-1">
                                {ragDebugTrace.retrievedChunks.map((ch) => (
                                  <div
                                    key={ch.id}
                                    className="p-2 rounded bg-amber-50/70 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 font-mono text-[11px]"
                                  >
                                    <strong>
                                      {ch.documentTitle} #{ch.chunkIndex + 1} · score={ch.score}
                                      {ch.vectorScore != null ? ` · vec=${ch.vectorScore}` : ''}
                                      {ch.bm25Score != null ? ` · bm25=${ch.bm25Score}` : ''}
                                      {ch.rerankScore != null ? ` · rerank=${ch.rerankScore}` : ''}
                                    </strong>
                                    <div className="mt-0.5 text-slate-600 dark:text-slate-300">{ch.content}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">
                              3. {t.ragDebugPrompt}
                            </div>
                            <pre
                              data-testid="rag-debug-final-prompt"
                              className="p-2.5 rounded bg-slate-900 text-slate-100 text-[11px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto"
                            >
                              {ragDebugTrace.finalPrompt}
                            </pre>
                          </div>

                          <div>
                            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">
                              4. {t.ragDebugRaw}
                            </div>
                            <pre
                              data-testid="rag-debug-raw-response"
                              className="p-2.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-[11px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto"
                            >
                              {ragDebugTrace.rawLlmResponse}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {([
                    { idx: 1 as const, item: tasks.variant1, icon: Landmark, metaLabel: t.cardSourceLabel },
                    { idx: 2 as const, item: tasks.variant2, icon: BookOpen, metaLabel: t.cardContextLabel },
                    { idx: 3 as const, item: tasks.variant3, icon: ClipboardCheck, metaLabel: t.cardTypeLabel },
                  ]).map(({ idx, item, icon: Icon, metaLabel }) => {
                    const cardStatus = cardStatuses[idx] || 'draft';
                    return (
                      <div
                        key={item.id}
                        data-testid={`task-variant-card-${idx}`}
                        className={`p-4.5 rounded-xl border shadow-xs hover:shadow-md transition ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-2.5">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="inline-flex items-center font-bold text-[#7A1C30] dark:text-[#D4AF37]">
                              <Icon className="w-3.5 h-3.5 mr-1.5" />
                              <span>{item.tag}</span>
                            </span>
                            <span
                              data-testid={`task-status-${idx}`}
                              className={`inline-flex items-center gap-1 font-semibold ${
                                cardStatus === 'approved'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : cardStatus === 'rejected'
                                  ? 'text-rose-700 dark:text-rose-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {cardStatus === 'approved' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : cardStatus === 'rejected' ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {cardStatus === 'approved'
                                  ? t.statusApproved
                                  : cardStatus === 'rejected'
                                  ? t.statusRejected
                                  : t.statusDraft}
                              </span>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              data-testid={`btn-edit-variant-${idx}`}
                              onClick={() => setEditingTask(item)}
                              className={`text-xs px-2.5 py-1 rounded border transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                theme === 'dark'
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                            >
                              <Edit className="w-3 h-3" />
                              <span>{t.btnEdit}</span>
                            </button>

                            <button
                              type="button"
                              data-testid={`btn-approve-variant-${idx}`}
                              disabled={cardStatus === 'approved'}
                              onClick={() => handleApproveTaskVariant(idx)}
                              className="text-xs bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-3 py-1 rounded transition flex items-center gap-1 font-medium shadow-xs cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.btnApproveSave}</span>
                            </button>

                            <button
                              type="button"
                              data-testid={`btn-reject-variant-${idx}`}
                              disabled={cardStatus === 'rejected'}
                              onClick={() => handleRejectTaskVariant(idx)}
                              className={`text-xs px-2.5 py-1 rounded border transition flex items-center gap-1 cursor-pointer whitespace-nowrap disabled:opacity-50 ${
                                theme === 'dark'
                                  ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-800'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{t.btnReject}</span>
                            </button>
                          </div>
                        </div>

                        <h3 className={`font-bold text-sm mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-xs leading-relaxed whitespace-pre-line ${
                          idx === 3
                            ? `font-mono p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50/80 border-slate-100 text-slate-600'}`
                            : theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {item.body}
                        </p>

                        <div className={`mt-3 pt-2.5 border-t flex justify-between items-center text-[11px] ${
                          theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                        }`}>
                          <span>
                            {metaLabel}{' '}
                            <span className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              {item.source}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setExplainVariant(idx)}
                            className="text-[#7A1C30] dark:text-rose-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <span>{t.btnExplain} {idx}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Chat Input & Results Action Bar */}
            <div className={`p-3.5 sm:px-6 border-t space-y-2.5 shrink-0 z-10 shadow-xs ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <form onSubmit={handleSendChatInput} className="flex items-center gap-2">
                <label htmlFor="rag-chat-input" className="sr-only">
                  {t.chatInputAria}
                </label>
                <input
                  id="rag-chat-input"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatSending}
                  placeholder={t.chatInputPlaceholder}
                  className={`flex-1 px-3.5 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[#7A1C30] transition ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white'
                  }`}
                />
                <button
                  id="rag-chat-send"
                  type="submit"
                  disabled={isChatSending || !chatInput.trim()}
                  className="bg-[#7A1C30] hover:bg-[#9E2A43] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.btnSendChat}</span>
                </button>
              </form>

              {(hasGenerated || chatMessages.length > 0) && (
                <div className="flex items-center justify-end gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleClearResults}
                    aria-label={t.btnClearResults}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border-slate-700'
                        : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-300 hover:border-rose-300'
                    }`}
                    title={t.btnClearResults}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500 transition-colors" />
                    <span>{t.btnClearResults}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </main>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM FOOTER BAR (100% WIDTH, FULL VIEWPORT)                          */}
      {/* ========================================================================= */}
      <footer className="w-full bg-[#581221] text-rose-200/80 px-4 sm:px-6 py-2 text-[11px] flex flex-col sm:flex-row justify-between items-center border-t border-[#7A1C30] shrink-0 z-10 gap-1">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-white">{t.footerUniversity}</span>
          <span className="hidden sm:inline-block text-rose-300/50">•</span>
          <span className="hidden sm:inline-block text-rose-200/90">{t.footerFaculty}</span>
        </div>
        <div>
          <span>{t.footerSuite}</span>
        </div>
      </footer>

      {/* Modals & Dialogs with Active Language Passed */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        onAdminSuccess={handleAdminLoginSuccess}
        teachersDb={teachersDb}
        initialRole={loginInitialRole}
        lang={lang}
      />

      <EditTaskModal
        task={editingTask}
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEditedTask}
        lang={lang}
      />

      <ExplainModal
        variantNum={explainVariant}
        poiName={poiName}
        isOpen={explainVariant !== null}
        onClose={() => setExplainVariant(null)}
        lang={lang}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} type={toastType} />

    </div>
  );
}


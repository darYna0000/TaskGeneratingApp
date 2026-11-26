import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  FolderOpen,
  Users,
  Sparkles,
  Plus,
  HardDrive,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Search,
  Calendar,
  Archive,
  Edit3,
  Trash2,
  Eye,
  FileText,
  X,
  ClipboardCheck,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import {
  ProfessorProfile,
  ProfessorDriveItem,
  ProfessorCourse,
  CourseInput,
  DocumentInput,
  DRIVE_FOLDERS_META,
  getLocStr,
  getCurrentCourses,
  getPastCoursesGroupedByYear,
  getCourseDocuments
} from '../utils/professorsDb.ts';
import {
  ActivityRecord,
  ActivityStatus,
  SupportedLanguage,
  TaskItem
} from '../utils/taskGenerator.ts';
import { CourseModal } from './CourseModal.tsx';
import { DocumentModal } from './DocumentModal.tsx';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { EditTaskModal } from './EditTaskModal.tsx';

interface ProfessorDashboardProps {
  professor: ProfessorProfile;
  activities?: ActivityRecord[];
  onLogout: () => void;
  onOpenTaskGenerator: (initialSubject?: string, initialPoi?: string, initialCourseId?: string) => void;
  onCreateCourse: (input: CourseInput) => void;
  onUpdateCourse: (courseId: string, updates: Partial<CourseInput>) => void;
  onDeleteCourse: (courseId: string) => void;
  onCreateDocument: (input: DocumentInput, file?: File | null) => Promise<void> | void;
  onUpdateDocument: (documentId: string, updates: Partial<DocumentInput>) => Promise<void> | void;
  onDeleteDocument: (documentId: string) => Promise<void> | void;
  onFetchDocumentContent?: (
    documentId: string
  ) => Promise<{
    fullText: string;
    chunks: Array<{ id: string; chunkIndex: number; content: string }>;
  } | null>;
  onUpdateActivity?: (
    activityId: string,
    updates: { title?: string; body?: string; status?: ActivityStatus }
  ) => Promise<void> | void;
  onDeleteActivity?: (activityId: string) => Promise<void> | void;
  lang?: SupportedLanguage;
  theme?: 'light' | 'dark';
}

const DASHBOARD_TEXT = {
  uk: {
    facultyBadgeCode: 'Код',
    specialtyLabel: 'Спеціальність:',
    btnCreateTask: 'Створити завдання',
    btnLogout: 'Вихід',
    tabCourses: 'Курси',
    tabDrive: 'Репозиторії документів',
    tabGroups: 'Академічні групи',
    currentClassesSubTab: 'Поточний рік (2026/2027)',
    pastClassesSubTab: 'Архів минулих років',
    allClassesSubTab: 'Усі курси',
    statActiveCourses: 'Активних курсів',
    statStudents: 'Студентів у групах',
    statDriveMaterials: 'Документів у репозиторіях',
    statRagTasks: 'Генератор завдань',
    statRagValue: 'Локальний ШІ-асистент',
    currentCoursesHeading: 'Керування курсами та їх репозиторіями',
    universityYear: 'Університет Вальядоліда · 2026/2027',
    studentsSuffix: 'студентів',
    docsSuffix: 'док.',
    btnCreateCourse: 'Створити курс',
    btnEditCourse: 'Змінити',
    btnDeleteCourse: 'Видалити',
    btnOpenRepo: 'Репозиторій',
    btnGenerate: 'Створити завдання',
    btnOpenYearMaterials: 'Відкрити репозиторій',
    pastYearsHeading: 'Минулорічні курси за академічними роками',
    pastYearsSub: 'Архів викладання, програм та репозиторіїв минулих років',
    completedStudentsSuffix: 'успішно завершили курс',
    archivedBadge: 'Архівний курс',
    foldersHeader: 'Категорії документів у репозиторії',
    foldersSub: 'Оберіть папку для фільтрації документів курсу',
    allFoldersLabel: 'Усі папки',
    allYearsFilter: 'Усі роки',
    driveTitle: 'Репозиторій документів курсу',
    driveSub: 'Створення, перегляд, редагування та видалення файлів курсу',
    btnAddDocument: 'Додати документ',
    btnNewTaskShort: 'Створити завдання з документами',
    searchPlaceholder: 'Пошук документа за назвою, описом або групою...',
    allCoursesFilter: 'Усі курси викладача',
    groupLabel: 'Група:',
    generalGroup: 'Загальна',
    updatedLabel: 'Оновлено:',
    courseLabel: 'Курс:',
    groupsHeading: 'Академічні групи за курсами',
    groupsSub: 'Закріплені групи та швидкий перехід до генерації завдань',
    activeGroupBadge: 'Активна група',
    coursePrefix: 'Курс:',
    studentsInListPrefix: 'Студентів у списку: ~',
    btnAssignNewTask: 'Створити завдання →',
    typeLecture: 'Лекція',
    typeTest: 'Тест',
    typePractice: 'Практикум',
    typeGenerated: 'Згенероване завдання',
    typeSyllabus: 'Силабус / Архів',
    typeMaterial: 'Документ',
    showingItemsIn: 'Активна папка:',
    btnResetFilter: 'Скинути фільтри',
    noCoursesFound: 'У вас ще немає курсів. Створіть перший курс, щоб отримати репозиторій документів.',
    noItemsFound: 'У цьому репозиторії поки немає документів.',
    noCoursesAlert: 'Спочатку створіть хоча б один курс, щоб додавати документи в його репозиторій.',
    folderSelected: 'Обрано',
    folderOpenAction: 'Відкрити',
    currentYearTag: 'Поточний',
    btnViewDoc: 'Перегляд',
    btnEditDoc: 'Змінити',
    btnDeleteDoc: 'Видалити',
    confirmDeleteCourseTitle: 'Видалити курс і його репозиторій?',
    confirmDeleteCourseMsg: 'Ви впевнені, що хочете видалити курс',
    confirmDeleteCourseEnd: '? Усі документи у репозиторії цього курсу також будуть видалені.',
    confirmDeleteDocTitle: 'Видалити документ?',
    confirmDeleteDocMsg: 'Ви впевнені, що хочете видалити документ',
    confirmDeleteDocEnd: 'з репозиторію курсу?',
    previewTitle: 'Перегляд документа репозиторію',
    previewFileLabel: 'Файл:',
    previewContentLabel: 'Повний текст документа та фрагменти для індексації:',
    previewNoContent: 'Метадані документа збережено в репозиторії курсу. Текстовий фрагмент не додано.',
    previewClose: 'Закрити',
    tabActivities: 'Збережені активності',
    activitiesHeading: 'Збережені навчальні активності',
    activitiesSub: 'Переглядайте, редагуйте та керуйте затвердженими завданнями по курсах у базі SQLite',
    filterApproved: 'Затверджені',
    filterDraft: 'Чернетки',
    filterRejected: 'Відхилені',
    filterAll: 'Усі',
    activitySearchPlaceholder: 'Пошук активності за назвою, темою або об’єктом...',
    noActivitiesFound: 'У цій категорії ще немає збережених активностей.',
    btnApproveActivity: 'Затвердити',
    confirmDeleteActivityTitle: 'Видалити активність?',
    confirmDeleteActivityMsg: 'Ви впевнені, що хочете назавжди видалити активність',
    statusApproved: 'Затверджено',
    statusDraft: 'Чернетка',
    statusRejected: 'Відхилено',
    variantFieldwork: 'Польове завдання',
    variantAnalytical: 'Аналітичний кейс',
    variantQuiz: 'Експрес-тест',
    activityModalTitle: 'Деталі збереженої активності',
    activityChunksLabel: 'Використані фрагменти джерел:',
    previewChunksCount: 'Проіндексовано фрагментів:'
  },
  en: {
    facultyBadgeCode: 'Code',
    specialtyLabel: 'Specialty:',
    btnCreateTask: 'Create Tasks',
    btnLogout: 'Sign Out',
    tabCourses: 'Courses',
    tabDrive: 'Document Repositories',
    tabGroups: 'Academic Groups',
    currentClassesSubTab: 'Current Year (2026/2027)',
    pastClassesSubTab: 'Past Academic Years',
    allClassesSubTab: 'All Courses',
    statActiveCourses: 'Active Courses',
    statStudents: 'Enrolled Students',
    statDriveMaterials: 'Repository Documents',
    statRagTasks: 'Task Generator',
    statRagValue: 'Local AI Engine',
    currentCoursesHeading: 'Manage Courses & Document Repositories',
    universityYear: 'Universidad de Valladolid · 2026/2027',
    studentsSuffix: 'students',
    docsSuffix: 'docs',
    btnCreateCourse: 'Create Course',
    btnEditCourse: 'Edit',
    btnDeleteCourse: 'Delete',
    btnOpenRepo: 'Repository',
    btnGenerate: 'Create Tasks',
    btnOpenYearMaterials: 'Open Repository',
    pastYearsHeading: 'Past Academic Years Courses',
    pastYearsSub: 'Archive of historical coursework and document repositories',
    completedStudentsSuffix: 'completed',
    archivedBadge: 'Archived',
    foldersHeader: 'Repository Folders',
    foldersSub: 'Select a category folder to filter course documents',
    allFoldersLabel: 'All Folders',
    allYearsFilter: 'All Years',
    driveTitle: 'Course Document Repository',
    driveSub: 'Create, view, edit, and delete files inside each course repository',
    btnAddDocument: 'Add Document',
    btnNewTaskShort: 'Create Tasks with Docs',
    searchPlaceholder: 'Search documents by title, description, or group...',
    allCoursesFilter: 'All Professor Courses',
    groupLabel: 'Group:',
    generalGroup: 'General',
    updatedLabel: 'Updated:',
    courseLabel: 'Course:',
    groupsHeading: 'Assigned Academic Groups',
    groupsSub: 'Student cohorts linked to your courses',
    activeGroupBadge: 'Active Group',
    coursePrefix: 'Course:',
    studentsInListPrefix: 'Enrolled students: ~',
    btnAssignNewTask: 'Create tasks →',
    typeLecture: 'Lecture',
    typeTest: 'Quiz',
    typePractice: 'Practice',
    typeGenerated: 'Generated Task',
    typeSyllabus: 'Syllabus / Archive',
    typeMaterial: 'Document',
    showingItemsIn: 'Active folder:',
    btnResetFilter: 'Reset filters',
    noCoursesFound: 'No courses yet. Create your first course to initialize its document repository.',
    noItemsFound: 'No documents in this repository yet.',
    noCoursesAlert: 'Create at least one course first before adding documents to a repository.',
    folderSelected: 'Selected',
    folderOpenAction: 'Open',
    currentYearTag: 'Current',
    btnViewDoc: 'View',
    btnEditDoc: 'Edit',
    btnDeleteDoc: 'Delete',
    confirmDeleteCourseTitle: 'Delete Course & Repository?',
    confirmDeleteCourseMsg: 'Are you sure you want to delete course',
    confirmDeleteCourseEnd: '? All documents inside its repository will also be deleted.',
    confirmDeleteDocTitle: 'Delete Document?',
    confirmDeleteDocMsg: 'Are you sure you want to delete',
    confirmDeleteDocEnd: 'from this course repository?',
    previewTitle: 'Repository Document Details',
    previewFileLabel: 'File:',
    previewContentLabel: 'Full Document Text & Indexed Chunks:',
    previewNoContent: 'Document metadata is stored in this course repository. No text excerpt attached.',
    previewClose: 'Close',
    tabActivities: 'Saved Activities',
    activitiesHeading: 'Saved Course Activities',
    activitiesSub: 'View, edit, approve, and manage tasks persisted in SQLite across your courses',
    filterApproved: 'Approved',
    filterDraft: 'Drafts',
    filterRejected: 'Rejected',
    filterAll: 'All',
    activitySearchPlaceholder: 'Search activities by title, subject, or POI...',
    noActivitiesFound: 'No saved activities match the active filter.',
    btnApproveActivity: 'Approve',
    confirmDeleteActivityTitle: 'Delete Activity?',
    confirmDeleteActivityMsg: 'Are you sure you want to permanently delete activity',
    statusApproved: 'Approved',
    statusDraft: 'Draft',
    statusRejected: 'Rejected',
    variantFieldwork: 'Field Task',
    variantAnalytical: 'Analytical Case',
    variantQuiz: 'Assessment Quiz',
    activityModalTitle: 'Saved Activity Details',
    activityChunksLabel: 'Retrieved Source Chunks:',
    previewChunksCount: 'Indexed chunks:'
  },
  es: {
    facultyBadgeCode: 'Código',
    specialtyLabel: 'Especialidad:',
    btnCreateTask: 'Crear Tareas',
    btnLogout: 'Cerrar sesión',
    tabCourses: 'Asignaturas',
    tabDrive: 'Repositorios de Documentos',
    tabGroups: 'Grupos Académicos',
    currentClassesSubTab: 'Año Actual (2026/2027)',
    pastClassesSubTab: 'Años Anteriores',
    allClassesSubTab: 'Todas las Asignaturas',
    statActiveCourses: 'Cursos activos',
    statStudents: 'Estudiantes',
    statDriveMaterials: 'Documentos en repositorios',
    statRagTasks: 'Generador de tareas',
    statRagValue: 'Motor IA Local',
    currentCoursesHeading: 'Gestión de Asignaturas y Repositorios',
    universityYear: 'Universidad de Valladolid · 2026/2027',
    studentsSuffix: 'estudiantes',
    docsSuffix: 'docs',
    btnCreateCourse: 'Crear Asignatura',
    btnEditCourse: 'Editar',
    btnDeleteCourse: 'Eliminar',
    btnOpenRepo: 'Repositorio',
    btnGenerate: 'Crear Tareas',
    btnOpenYearMaterials: 'Abrir Repositorio',
    pastYearsHeading: 'Asignaturas de cursos anteriores',
    pastYearsSub: 'Archivo histórico de docencia y repositorios documentales',
    completedStudentsSuffix: 'aprobados',
    archivedBadge: 'Archivado',
    foldersHeader: 'Carpetas del Repositorio',
    foldersSub: 'Seleccione una carpeta para filtrar los documentos del curso',
    allFoldersLabel: 'Todas las carpetas',
    allYearsFilter: 'Todos los años',
    driveTitle: 'Repositorio de Documentos',
    driveSub: 'Crear, ver, editar y eliminar archivos dentro de cada asignatura',
    btnAddDocument: 'Añadir Documento',
    btnNewTaskShort: 'Crear Tareas con Docs',
    searchPlaceholder: 'Buscar documento por título, descripción o grupo...',
    allCoursesFilter: 'Todas las asignaturas',
    groupLabel: 'Grupo:',
    generalGroup: 'General',
    updatedLabel: 'Actualizado:',
    courseLabel: 'Curso:',
    groupsHeading: 'Grupos académicos asignados',
    groupsSub: 'Grupos vinculados a las asignaturas del profesor',
    activeGroupBadge: 'Grupo activo',
    coursePrefix: 'Asignatura:',
    studentsInListPrefix: 'Estudiantes: ~',
    btnAssignNewTask: 'Crear tareas →',
    typeLecture: 'Lección',
    typeTest: 'Examen',
    typePractice: 'Práctica',
    typeGenerated: 'Tarea Generada',
    typeSyllabus: 'Guía / Archivo',
    typeMaterial: 'Documento',
    showingItemsIn: 'Carpeta activa:',
    btnResetFilter: 'Restablecer filtros',
    noCoursesFound: 'Aún no hay asignaturas. Cree su primera asignatura para iniciar su repositorio.',
    noItemsFound: 'No hay documentos en este repositorio todavía.',
    noCoursesAlert: 'Cree al menos una asignatura antes de añadir documentos a un repositorio.',
    folderSelected: 'Seleccionada',
    folderOpenAction: 'Abrir',
    currentYearTag: 'Actual',
    btnViewDoc: 'Ver',
    btnEditDoc: 'Editar',
    btnDeleteDoc: 'Eliminar',
    confirmDeleteCourseTitle: '¿Eliminar asignatura y repositorio?',
    confirmDeleteCourseMsg: '¿Está seguro de eliminar la asignatura',
    confirmDeleteCourseEnd: '? Todos los documentos de su repositorio también se eliminarán.',
    confirmDeleteDocTitle: '¿Eliminar documento?',
    confirmDeleteDocMsg: '¿Está seguro de eliminar',
    confirmDeleteDocEnd: 'del repositorio de esta asignatura?',
    previewTitle: 'Detalle del Documento',
    previewFileLabel: 'Archivo:',
    previewContentLabel: 'Texto Completo y Fragmentos Indexados:',
    previewNoContent: 'Metadatos almacenados en el repositorio de la asignatura.',
    previewClose: 'Cerrar',
    tabActivities: 'Actividades Guardadas',
    activitiesHeading: 'Actividades Académicas Guardadas',
    activitiesSub: 'Consulte, edite, apruebe y administre las tareas guardadas en SQLite por asignatura',
    filterApproved: 'Aprobadas',
    filterDraft: 'Borradores',
    filterRejected: 'Rechazadas',
    filterAll: 'Todas',
    activitySearchPlaceholder: 'Buscar actividad por título, asignatura o POI...',
    noActivitiesFound: 'No hay actividades guardadas para este filtro.',
    btnApproveActivity: 'Aprobar',
    confirmDeleteActivityTitle: '¿Eliminar actividad?',
    confirmDeleteActivityMsg: '¿Está seguro de eliminar permanentemente la actividad',
    statusApproved: 'Aprobada',
    statusDraft: 'Borrador',
    statusRejected: 'Rechazada',
    variantFieldwork: 'Tarea de Campo',
    variantAnalytical: 'Caso Analítico',
    variantQuiz: 'Cuestionario',
    activityModalTitle: 'Detalles de la Actividad Guardada',
    activityChunksLabel: 'Fragmentos de Fuente Utilizados:',
    previewChunksCount: 'Fragmentos indexados:'
  }
};

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({
  professor,
  activities = [],
  onLogout,
  onOpenTaskGenerator,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onCreateDocument,
  onUpdateDocument,
  onDeleteDocument,
  onFetchDocumentContent,
  onUpdateActivity,
  onDeleteActivity,
  lang = 'uk',
  theme = 'light'
}) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'drive' | 'activities' | 'groups'>('courses');
  const formatGroupCode = (code: string) =>
    lang === 'uk'
      ? code
      : code.replace(/^МАГ-АРХ-/i, 'MAG-ARCH-').replace(/^АРХ-/i, 'ARCH-');
  const [courseSubTab, setCourseSubTab] = useState<'current' | 'past' | 'all'>('current');
  const [selectedPastYear, setSelectedPastYear] = useState<string>('2025/2026');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Saved Activities filter & modal state
  const [activityStatusFilter, setActivityStatusFilter] = useState<'approved' | 'draft' | 'rejected' | 'all'>('approved');
  const [activityCourseFilter, setActivityCourseFilter] = useState('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [viewingActivity, setViewingActivity] = useState<ActivityRecord | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<ActivityRecord | null>(null);

  // CRUD modals state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ProfessorCourse | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<ProfessorCourse | null>(null);

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ProfessorDriveItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<ProfessorDriveItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ProfessorDriveItem | null>(null);
  const [previewFullContent, setPreviewFullContent] = useState<{
    fullText: string;
    chunks: Array<{ id: string; chunkIndex: number; content: string }>;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleOpenPreviewDoc = async (doc: ProfessorDriveItem) => {
    setPreviewDoc(doc);
    setPreviewFullContent(null);
    if (!onFetchDocumentContent) return;
    setIsLoadingPreview(true);
    try {
      const full = await onFetchDocumentContent(doc.id);
      setPreviewFullContent(full);
    } catch {
      setPreviewFullContent(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const t = DASHBOARD_TEXT[lang] || DASHBOARD_TEXT.uk;

  const currentCourses = getCurrentCourses(professor.courses);
  const pastCoursesByYear = getPastCoursesGroupedByYear(professor.courses);
  const pastYearsAvailable = Object.keys(pastCoursesByYear);

  const visibleCourses =
    courseSubTab === 'current'
      ? currentCourses
      : courseSubTab === 'past'
      ? pastCoursesByYear[selectedPastYear] || []
      : professor.courses;

  const filteredDriveItems = professor.driveItems.filter((item) => {
    if (selectedFolder && item.folderCategory !== selectedFolder) return false;
    if (selectedYearFilter !== 'all' && item.academicYear !== selectedYearFilter) return false;
    if (selectedCourseFilter !== 'all' && item.courseId !== selectedCourseFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameStr = getLocStr(item.name, lang).toLowerCase();
      const descStr = getLocStr(item.description, lang).toLowerCase();
      const groupStr = (item.group || '').toLowerCase();
      const fileStr = (item.fileName || '').toLowerCase();
      return nameStr.includes(q) || descStr.includes(q) || groupStr.includes(q) || fileStr.includes(q);
    }
    return true;
  });

  const getFolderItemCount = (folderCategory: string) => {
    return professor.driveItems.filter((item) => {
      if (selectedCourseFilter !== 'all' && item.courseId !== selectedCourseFilter) return false;
      return item.folderCategory === folderCategory;
    }).length;
  };

  const getTypeLabel = (type: ProfessorDriveItem['type']) => {
    switch (type) {
      case 'lecture':
        return t.typeLecture;
      case 'test':
        return t.typeTest;
      case 'practice':
        return t.typePractice;
      case 'generated_task':
        return t.typeGenerated;
      case 'syllabus':
        return t.typeSyllabus;
      default:
        return t.typeMaterial;
    }
  };

  const handleOpenCourseRepository = (courseId: string) => {
    setSelectedCourseFilter(courseId);
    setSelectedFolder(null);
    setSelectedYearFilter('all');
    setActiveTab('drive');
  };

  const activeCourseObj =
    selectedCourseFilter !== 'all'
      ? professor.courses.find((c) => c.id === selectedCourseFilter) || null
      : null;

  return (
    <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* 1. PROFESSOR PROFILE BANNER */}
      <div className="rounded-2xl p-5 sm:p-6 border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-start sm:items-center space-x-4">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${professor.avatarBg} text-white flex items-center justify-center font-bold text-2xl shrink-0`}>
            {getLocStr(professor.name, lang).charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {getLocStr(professor.name, lang)}
              </h1>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                · {t.facultyBadgeCode} {professor.login}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              {getLocStr(professor.title, lang)} · {getLocStr(professor.department, lang)}
            </p>
            <p className="text-xs text-[#7A1C30] dark:text-rose-400 font-medium mt-0.5">
              <span className="text-slate-500 dark:text-slate-400">{t.specialtyLabel}</span>{' '}
              {getLocStr(professor.specialty, lang)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="btn-dashboard-create-tasks"
            onClick={() =>
              onOpenTaskGenerator(
                activeCourseObj ? getLocStr(activeCourseObj.title, lang) : undefined,
                undefined,
                activeCourseObj?.id
              )
            }
            className="bg-[#7A1C30] hover:bg-[#9E2A43] text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-2 text-xs sm:text-sm cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>{t.btnCreateTask}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 px-3.5 py-2.5 rounded-xl transition text-xs font-semibold flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap"
            title={t.btnLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t.btnLogout}</span>
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-6 text-sm font-semibold">
        <button
          type="button"
          id="tab-prof-courses"
          onClick={() => setActiveTab('courses')}
          className={`pb-3 flex items-center space-x-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'courses'
              ? 'border-[#7A1C30] text-[#7A1C30] dark:border-[#D4AF37] dark:text-[#D4AF37]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t.tabCourses}</span>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            ({professor.courses.length})
          </span>
        </button>

        <button
          type="button"
          id="tab-prof-drive"
          onClick={() => setActiveTab('drive')}
          className={`pb-3 flex items-center space-x-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'drive'
              ? 'border-[#7A1C30] text-[#7A1C30] dark:border-[#D4AF37] dark:text-[#D4AF37]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>{t.tabDrive}</span>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            ({professor.driveItems.length})
          </span>
        </button>

        <button
          type="button"
          id="tab-prof-activities"
          onClick={() => setActiveTab('activities')}
          className={`pb-3 flex items-center space-x-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'activities'
              ? 'border-[#7A1C30] text-[#7A1C30] dark:border-[#D4AF37] dark:text-[#D4AF37]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>{t.tabActivities}</span>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            ({activities.filter((a) => a.status === 'approved').length})
          </span>
        </button>

        <button
          type="button"
          id="tab-prof-groups"
          onClick={() => setActiveTab('groups')}
          className={`pb-3 flex items-center space-x-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'groups'
              ? 'border-[#7A1C30] text-[#7A1C30] dark:border-[#D4AF37] dark:text-[#D4AF37]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.tabGroups}</span>
        </button>
      </div>

      {/* 3. TAB 1: COURSES CRUD (EACH WITH ITS DOCUMENT REPOSITORY) */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.statActiveCourses}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums" data-testid="prof-courses-count">
                  {professor.courses.length}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.statStudents}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {professor.courses.reduce((acc, c) => acc + c.enrolledStudents, 0)}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.statDriveMaterials}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums" data-testid="prof-docs-count">
                  {professor.driveItems.length}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-[#7A1C30] dark:text-rose-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.statRagTasks}</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{t.statRagValue}</div>
              </div>
            </div>
          </div>

          {/* Courses Toolbar: Filter tabs + Primary Create Course button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCourseSubTab('current')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  courseSubTab === 'current'
                    ? 'bg-white dark:bg-slate-700 text-[#7A1C30] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.currentClassesSubTab} ({currentCourses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCourseSubTab('past')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  courseSubTab === 'past'
                    ? 'bg-white dark:bg-slate-700 text-[#7A1C30] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{t.pastClassesSubTab} ({professor.courses.length - currentCourses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCourseSubTab('all')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  courseSubTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-[#7A1C30] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{t.allClassesSubTab} ({professor.courses.length})</span>
              </button>
            </div>

            <button
              type="button"
              id="btn-create-course"
              onClick={() => {
                setEditingCourse(null);
                setIsCourseModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#7A1C30] hover:bg-[#9E2A43] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.btnCreateCourse}</span>
            </button>
          </div>

          {courseSubTab === 'past' && pastYearsAvailable.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.pastYearsHeading}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.pastYearsSub}</p>
              </div>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                {pastYearsAvailable.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedPastYear(yr)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      selectedPastYear === yr
                        ? 'bg-[#7A1C30] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Courses Grid */}
          {visibleCourses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {t.noCoursesFound}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingCourse(null);
                  setIsCourseModalOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-[#7A1C30] hover:bg-[#9E2A43] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.btnCreateCourse}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCourses.map((course) => {
                const courseTitle = getLocStr(course.title, lang);
                const repoDocsCount = getCourseDocuments(professor, course.id).length;

                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-[#7A1C30]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                          {course.code} · {course.academicYear}
                        </span>
                        <span className="font-semibold text-[#7A1C30] dark:text-[#D4AF37] tabular-nums">
                          {course.credits} ECTS
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {courseTitle}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {getLocStr(course.semester, lang)} · {course.groups.map(formatGroupCode).join(', ')}
                      </p>

                      {course.syllabusTopic && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2">
                          {getLocStr(course.syllabusTopic, lang)}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 tabular-nums">
                          <Users className="w-3.5 h-3.5" />
                          <span>{course.enrolledStudents} {t.studentsSuffix}</span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          <FolderOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{repoDocsCount} {t.docsSuffix}</span>
                        </span>
                      </div>

                      {/* CRUD & Repository Action Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCourseRepository(course.id)}
                            aria-label={`${t.btnOpenRepo} ${courseTitle}`}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-[#7A1C30] dark:text-[#D4AF37]" />
                            <span>{t.btnOpenRepo} ({repoDocsCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenTaskGenerator(courseTitle, undefined, course.id)}
                            aria-label={`${t.btnGenerate} ${courseTitle}`}
                            className="px-2.5 py-1.5 rounded-lg bg-[#7A1C30] hover:bg-[#9E2A43] text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                          >
                            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                            <span>{t.btnGenerate}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourse(course);
                              setIsCourseModalOpen(true);
                            }}
                            aria-label={`${t.btnEditCourse} ${courseTitle}`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#7A1C30] dark:hover:text-[#D4AF37] hover:border-[#7A1C30] transition cursor-pointer"
                            title={t.btnEditCourse}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCourse(course)}
                            aria-label={`${t.btnDeleteCourse} ${courseTitle}`}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                            title={t.btnDeleteCourse}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: DOCUMENT REPOSITORY CRUD (SCOPED BY COURSE) */}
      {activeTab === 'drive' && (
        <div className="space-y-6">
          {/* Folder Cards Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[#7A1C30] dark:text-[#D4AF37]" />
                  <span>{t.foldersHeader}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.foldersSub}</p>
              </div>
              {selectedFolder && (
                <button
                  type="button"
                  onClick={() => setSelectedFolder(null)}
                  className="text-xs text-[#7A1C30] dark:text-[#D4AF37] hover:underline font-bold cursor-pointer"
                >
                  {t.allFoldersLabel}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {DRIVE_FOLDERS_META.map((fld) => {
                const count = getFolderItemCount(fld.id);
                const isSelected = selectedFolder === fld.id;

                return (
                  <button
                    key={fld.id}
                    type="button"
                    onClick={() => setSelectedFolder(isSelected ? null : fld.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#7A1C30] dark:border-[#D4AF37] bg-rose-50/50 dark:bg-slate-800 ring-1 ring-[#7A1C30]/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#7A1C30]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <FolderOpen className="w-4 h-4 text-[#7A1C30] dark:text-[#D4AF37]" />
                        <span className="text-xs font-mono font-bold tabular-nums text-slate-600 dark:text-slate-300">
                          {count}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {getLocStr(fld.name, lang)}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {getLocStr(fld.description, lang)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Repository Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-[#D4AF37]" />
                    <span>
                      {activeCourseObj
                        ? `${activeCourseObj.code} — ${getLocStr(activeCourseObj.title, lang)}`
                        : t.driveTitle}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.driveSub}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="btn-add-document"
                  disabled={professor.courses.length === 0}
                  onClick={() => {
                    setEditingDoc(null);
                    setIsDocModalOpen(true);
                  }}
                  className="bg-[#7A1C30] hover:bg-[#9E2A43] disabled:opacity-40 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t.btnAddDocument}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onOpenTaskGenerator(
                      activeCourseObj ? getLocStr(activeCourseObj.title, lang) : undefined,
                      undefined,
                      activeCourseObj?.id
                    )
                  }
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{t.btnNewTaskShort}</span>
                </button>
              </div>
            </div>

            {professor.courses.length === 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
                {t.noCoursesAlert}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-2.5">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
                />
              </div>

              <div className="w-full md:w-64">
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  aria-label={t.allCoursesFilter}
                  className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none cursor-pointer"
                >
                  <option value="all">{t.allCoursesFilter}</option>
                  {professor.courses.map((crs) => (
                    <option key={crs.id} value={crs.id}>
                      {crs.code} - {getLocStr(crs.title, lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-44">
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  aria-label={t.allYearsFilter}
                  className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none cursor-pointer"
                >
                  <option value="all">{t.allYearsFilter}</option>
                  <option value="2026/2027">2026/2027 ({t.currentYearTag})</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2023/2024">2023/2024</option>
                </select>
              </div>
            </div>

            {(selectedFolder || selectedCourseFilter !== 'all' || selectedYearFilter !== 'all' || searchQuery) && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
                  {selectedFolder && (
                    <span>
                      {t.showingItemsIn}{' '}
                      <strong className="text-[#7A1C30] dark:text-[#D4AF37]">
                        {getLocStr(DRIVE_FOLDERS_META.find((f) => f.id === selectedFolder)?.name, lang)}
                      </strong>
                    </span>
                  )}
                  {activeCourseObj && (
                    <span>
                      {t.courseLabel} <strong>{activeCourseObj.code}</strong>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFolder(null);
                    setSelectedCourseFilter('all');
                    setSelectedYearFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#7A1C30] dark:text-[#D4AF37] hover:underline font-bold cursor-pointer whitespace-nowrap"
                >
                  {t.btnResetFilter}
                </button>
              </div>
            )}

            {/* Documents Grid */}
            {filteredDriveItems.length === 0 ? (
              <div className="p-10 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{t.noItemsFound}</p>
                {professor.courses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDoc(null);
                      setIsDocModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#7A1C30] hover:bg-[#9E2A43] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.btnAddDocument}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {filteredDriveItems.map((item) => {
                  const docTitle = getLocStr(item.name, lang);
                  const owningCourse = professor.courses.find((c) => c.id === item.courseId);

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition bg-slate-50/40 dark:bg-slate-950/40 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                          <span>
                            {getTypeLabel(item.type)} · {item.fileFormat || 'PDF'} · {item.academicYear}
                          </span>
                          <span className="font-mono tabular-nums">
                            {item.size || '1.0 MB'}
                            {item.chunksCount ? ` · ${item.chunksCount} chunks` : ''}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {docTitle}
                        </h4>

                        {owningCourse && (
                          <div className="text-[11px] font-medium text-[#7A1C30] dark:text-[#D4AF37] mt-1">
                            {owningCourse.code} — {getLocStr(owningCourse.title, lang)}
                          </div>
                        )}

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {getLocStr(item.description, lang)}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          {t.groupLabel} {item.group ? formatGroupCode(item.group) : t.generalGroup} · {getLocStr(item.updatedAt, lang)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPreviewDoc(item)}
                            aria-label={`${t.btnViewDoc} ${docTitle}`}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#7A1C30] text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{t.btnViewDoc}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingDoc(item);
                              setIsDocModalOpen(true);
                            }}
                            aria-label={`${t.btnEditDoc} ${docTitle}`}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#7A1C30] text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{t.btnEditDoc}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingDoc(item)}
                            aria-label={`${t.btnDeleteDoc} ${docTitle}`}
                            className="px-2 py-1 rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t.btnDeleteDoc}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 3: SAVED ACTIVITIES (SQLite Draft / Approved / Rejected) */}
      {activeTab === 'activities' && (
        <div
          data-testid="saved-activities-panel"
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#7A1C30] dark:text-[#D4AF37]" />
                <span>{t.activitiesHeading}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.activitiesSub}</p>
            </div>

            <button
              type="button"
              onClick={() => onOpenTaskGenerator(undefined, undefined, activityCourseFilter !== 'all' ? activityCourseFilter : undefined)}
              className="bg-[#7A1C30] hover:bg-[#9E2A43] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.btnCreateTask}</span>
            </button>
          </div>

          {/* Status Segmented Bar + Course & Search Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex flex-wrap items-center gap-1">
              {(
                [
                  { id: 'approved', label: t.filterApproved, count: activities.filter((a) => a.status === 'approved').length },
                  { id: 'draft', label: t.filterDraft, count: activities.filter((a) => a.status === 'draft').length },
                  { id: 'rejected', label: t.filterRejected, count: activities.filter((a) => a.status === 'rejected').length },
                  { id: 'all', label: t.filterAll, count: activities.length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`activity-filter-${tab.id}`}
                  onClick={() => setActivityStatusFilter(tab.id)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    activityStatusFilter === tab.id
                      ? 'bg-white dark:bg-slate-700 text-[#7A1C30] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 flex-1 lg:max-w-xl">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder={t.activitySearchPlaceholder}
                  aria-label={t.activitySearchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
                />
              </div>

              <select
                value={activityCourseFilter}
                onChange={(e) => setActivityCourseFilter(e.target.value)}
                aria-label={t.allCoursesFilter}
                className="sm:w-56 py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none cursor-pointer"
              >
                <option value="all">{t.allCoursesFilter}</option>
                {professor.courses.map((crs) => (
                  <option key={crs.id} value={crs.id}>
                    {crs.code} — {getLocStr(crs.title, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const filteredActivities = activities.filter((act) => {
              if (activityStatusFilter !== 'all' && act.status !== activityStatusFilter) return false;
              if (activityCourseFilter !== 'all' && act.courseId !== activityCourseFilter) return false;
              if (activitySearch.trim()) {
                const q = activitySearch.toLowerCase();
                return (
                  act.title.toLowerCase().includes(q) ||
                  act.body.toLowerCase().includes(q) ||
                  act.subject.toLowerCase().includes(q) ||
                  act.poiName.toLowerCase().includes(q)
                );
              }
              return true;
            });

            if (filteredActivities.length === 0) {
              return (
                <div className="p-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{t.noActivitiesFound}</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {filteredActivities.map((act) => {
                  const owningCourse = professor.courses.find((c) => c.id === act.courseId);
                  const variantLabel =
                    act.variantType === 'analytical'
                      ? t.variantAnalytical
                      : act.variantType === 'quiz'
                      ? t.variantQuiz
                      : t.variantFieldwork;
                  const meta = act.metadata || {};
                  const metaLine = [
                    meta.educationLevel,
                    meta.academicGroup,
                    meta.difficultyLevel,
                    meta.duration,
                    meta.geoCoordinates,
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <div
                      key={act.id}
                      data-testid={`saved-activity-card-${act.id}`}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#7A1C30] dark:text-[#D4AF37]">
                            {variantLabel} · {owningCourse ? owningCourse.code : act.subject}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              act.status === 'approved'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : act.status === 'rejected'
                                ? 'text-rose-700 dark:text-rose-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {act.status === 'approved' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : act.status === 'rejected' ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {act.status === 'approved'
                                ? t.statusApproved
                                : act.status === 'rejected'
                                ? t.statusRejected
                                : t.statusDraft}
                            </span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {act.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-line leading-relaxed">
                          {act.body}
                        </p>

                        {metaLine && (
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {metaLine}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="tabular-nums">
                          {act.poiName} · {new Date(act.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingActivity(act)}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#7A1C30] text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{t.btnViewDoc}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingActivity(act)}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#7A1C30] text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{t.btnEditDoc}</span>
                          </button>
                          {act.status !== 'approved' && onUpdateActivity && (
                            <button
                              type="button"
                              onClick={() => onUpdateActivity(act.id, { status: 'approved' })}
                              className="px-2 py-1 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t.btnApproveActivity}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeletingActivity(act)}
                            className="px-2 py-1 rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t.btnDeleteDoc}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. TAB 4: ACADEMIC GROUPS */}
      {activeTab === 'groups' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#7A1C30] dark:text-[#D4AF37]" />
              <span>{t.groupsHeading}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.groupsSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {professor.courses
              .flatMap((c) =>
                c.groups.map((grp) => ({
                  group: grp,
                  course: c,
                  academicYear: c.academicYear,
                  isCurrent: c.isCurrentYear
                }))
              )
              .map((item, idx) => (
                <div
                  key={`${item.group}-${idx}`}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {formatGroupCode(item.group)}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {item.isCurrent ? t.activeGroupBadge : item.academicYear}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                      <strong>{t.coursePrefix}</strong> {getLocStr(item.course.title, lang)}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {t.studentsInListPrefix}
                      {Math.round(item.course.enrolledStudents / Math.max(1, item.course.groups.length))}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTaskGenerator(getLocStr(item.course.title, lang), undefined, item.course.id)
                      }
                      className="text-[#7A1C30] dark:text-[#D4AF37] hover:underline font-bold cursor-pointer"
                    >
                      {t.btnAssignNewTask}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Course Create/Edit Modal */}
      <CourseModal
        isOpen={isCourseModalOpen}
        editingCourse={editingCourse}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSave={(input) => {
          if (editingCourse) {
            onUpdateCourse(editingCourse.id, input);
          } else {
            onCreateCourse(input);
          }
        }}
        lang={lang}
      />

      {/* Document Create/Edit Modal */}
      <DocumentModal
        isOpen={isDocModalOpen}
        editingDoc={editingDoc}
        courses={professor.courses}
        defaultCourseId={selectedCourseFilter}
        onClose={() => {
          setIsDocModalOpen(false);
          setEditingDoc(null);
        }}
        onSave={async (input, file) => {
          if (editingDoc) {
            await onUpdateDocument(editingDoc.id, input);
          } else {
            await onCreateDocument(input, file);
          }
        }}
        lang={lang}
      />

      {/* Document Preview Modal (Full Content + Indexed Chunks) */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-doc-title"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="bg-[#581221] text-white px-5 py-4 flex items-center justify-between border-b border-[#7A1C30]">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <h3 id="preview-doc-title" className="text-sm sm:text-base font-bold truncate">
                  {t.previewTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewFullContent(null);
                }}
                aria-label="Close"
                className="text-rose-200 hover:text-white p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {getLocStr(previewDoc.name, lang)}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {getLocStr(previewDoc.description, lang)}
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {t.previewFileLabel} {previewDoc.fileName || 'document.pdf'} ({previewDoc.fileFormat || 'PDF'},{' '}
                {previewDoc.size || '1.0 MB'})
                {previewFullContent ? ` · ${t.previewChunksCount} ${previewFullContent.chunks.length}` : ''}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs max-h-[45vh] overflow-y-auto space-y-2">
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  {t.previewContentLabel}
                </div>
                {isLoadingPreview ? (
                  <div className="flex items-center gap-2 text-slate-500 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <p className="font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {previewFullContent?.fullText || previewDoc.contentPreview || t.previewNoContent}
                  </p>
                )}
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewFullContent(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#7A1C30] text-white hover:bg-[#9E2A43] cursor-pointer"
              >
                {t.previewClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Detail Modal */}
      {viewingActivity && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="bg-[#581221] text-white px-5 py-4 flex items-center justify-between border-b border-[#7A1C30]">
              <div className="flex items-center gap-2.5 min-w-0">
                <ClipboardCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold truncate">{t.activityModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingActivity(null)}
                aria-label="Close"
                className="text-rose-200 hover:text-white p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
              <div className="font-mono text-slate-500 dark:text-slate-400">
                {viewingActivity.subject} · {viewingActivity.poiName}
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {viewingActivity.title}
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {viewingActivity.body}
              </p>
              {viewingActivity.sourceChunks && viewingActivity.sourceChunks.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-[#7A1C30] dark:text-[#D4AF37]">
                    {t.activityChunksLabel} ({viewingActivity.sourceChunks.length})
                  </div>
                  {viewingActivity.sourceChunks.map((ch) => (
                    <div
                      key={ch.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {ch.documentTitle} · #{ch.chunkIndex + 1} (score: {ch.score})
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{ch.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingActivity(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#7A1C30] text-white hover:bg-[#9E2A43] cursor-pointer"
              >
                {t.previewClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Edit Modal (saves directly to SQLite) */}
      <EditTaskModal
        task={
          editingActivity
            ? ({
                id: editingActivity.variantIndex || 1,
                tag: editingActivity.variantType,
                tagClass: '',
                title: editingActivity.title,
                body: editingActivity.body,
                source: editingActivity.metadata?.source || 'SQLite',
              } satisfies TaskItem)
            : null
        }
        isOpen={editingActivity !== null}
        onClose={() => setEditingActivity(null)}
        onSave={async (_taskId, newTitle, newBody) => {
          if (editingActivity && onUpdateActivity) {
            await onUpdateActivity(editingActivity.id, { title: newTitle, body: newBody });
          }
          setEditingActivity(null);
        }}
        lang={lang}
      />

      {/* Delete Activity Confirmation */}
      <ConfirmDialog
        isOpen={deletingActivity !== null}
        title={t.confirmDeleteActivityTitle}
        message={`${t.confirmDeleteActivityMsg} "${deletingActivity?.title || ''}"?`}
        confirmLabel={t.btnDeleteDoc}
        onCancel={() => setDeletingActivity(null)}
        onConfirm={async () => {
          if (deletingActivity && onDeleteActivity) {
            await onDeleteActivity(deletingActivity.id);
          }
          setDeletingActivity(null);
        }}
        lang={lang}
      />

      {/* Delete Course Confirmation */}
      <ConfirmDialog
        isOpen={deletingCourse !== null}
        title={t.confirmDeleteCourseTitle}
        message={`${t.confirmDeleteCourseMsg} "${deletingCourse ? getLocStr(deletingCourse.title, lang) : ''}"${t.confirmDeleteCourseEnd}`}
        confirmLabel={t.btnDeleteCourse}
        onCancel={() => setDeletingCourse(null)}
        onConfirm={() => {
          if (deletingCourse) {
            onDeleteCourse(deletingCourse.id);
            if (selectedCourseFilter === deletingCourse.id) {
              setSelectedCourseFilter('all');
            }
            setDeletingCourse(null);
          }
        }}
        lang={lang}
      />

      {/* Delete Document Confirmation */}
      <ConfirmDialog
        isOpen={deletingDoc !== null}
        title={t.confirmDeleteDocTitle}
        message={`${t.confirmDeleteDocMsg} "${deletingDoc ? getLocStr(deletingDoc.name, lang) : ''}" ${t.confirmDeleteDocEnd}`}
        confirmLabel={t.btnDeleteDoc}
        onCancel={() => setDeletingDoc(null)}
        onConfirm={() => {
          if (deletingDoc) {
            onDeleteDocument(deletingDoc.id);
            setDeletingDoc(null);
          }
        }}
        lang={lang}
      />
    </div>
  );
};

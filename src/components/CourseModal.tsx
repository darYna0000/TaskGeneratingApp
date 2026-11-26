import React, { useState, useEffect } from 'react';
import { X, BookOpen, Save } from 'lucide-react';
import { ProfessorCourse, CourseInput, getLocStr } from '../utils/professorsDb.ts';
import { SupportedLanguage } from '../utils/taskGenerator.ts';

interface CourseModalProps {
  isOpen: boolean;
  editingCourse: ProfessorCourse | null;
  onClose: () => void;
  onSave: (input: CourseInput) => void;
  lang?: SupportedLanguage;
}

const MODAL_TEXT = {
  uk: {
    createTitle: 'Створити новий курс',
    editTitle: 'Редагувати курс',
    subtitle: 'Кожен курс автоматично створює власний репозиторій документів',
    lblCode: 'Код курсу *',
    lblYear: 'Навчальний рік *',
    lblCourseTitle: 'Назва курсу *',
    lblSemester: 'Семестр / Рівень *',
    lblCredits: 'Кредити (ECTS)',
    lblStudents: 'Кількість студентів',
    lblGroups: 'Академічні групи (через кому)',
    lblTopic: 'Тематика та опис курсу',
    lblCurrentYear: 'Активний курс поточного навчального року',
    placeholderCode: 'напр., ARQ-305',
    placeholderTitle: 'напр., Архітектура Іспанського Ренесансу',
    placeholderSemester: 'напр., 1 Семестр (3 Курс)',
    placeholderGroups: 'АРХ-31, АРХ-32',
    placeholderTopic: 'Ключові теми лекцій та практичних занять для репозиторію...',
    btnCancel: 'Скасувати',
    btnSaveCreate: 'Створити курс',
    btnSaveEdit: 'Зберегти зміни'
  },
  en: {
    createTitle: 'Create New Course',
    editTitle: 'Edit Course',
    subtitle: 'Each course automatically maintains its own document repository',
    lblCode: 'Course Code *',
    lblYear: 'Academic Year *',
    lblCourseTitle: 'Course Title *',
    lblSemester: 'Semester / Level *',
    lblCredits: 'Credits (ECTS)',
    lblStudents: 'Enrolled Students',
    lblGroups: 'Academic Groups (comma-separated)',
    lblTopic: 'Syllabus Topic & Description',
    lblCurrentYear: 'Active course in current academic year',
    placeholderCode: 'e.g., ARQ-305',
    placeholderTitle: 'e.g., Spanish Renaissance Architecture',
    placeholderSemester: 'e.g., 1st Semester (3rd Year)',
    placeholderGroups: 'ARCH-31, ARCH-32',
    placeholderTopic: 'Core syllabus themes and fieldwork goals...',
    btnCancel: 'Cancel',
    btnSaveCreate: 'Create Course',
    btnSaveEdit: 'Save Changes'
  },
  es: {
    createTitle: 'Crear Nueva Asignatura',
    editTitle: 'Editar Asignatura',
    subtitle: 'Cada asignatura gestiona su propio repositorio de documentos',
    lblCode: 'Código de Asignatura *',
    lblYear: 'Curso Académico *',
    lblCourseTitle: 'Nombre de la Asignatura *',
    lblSemester: 'Semestre / Curso *',
    lblCredits: 'Créditos (ECTS)',
    lblStudents: 'Estudiantes Matriculados',
    lblGroups: 'Grupos Académicos (separados por coma)',
    lblTopic: 'Temática y Guía Docente',
    lblCurrentYear: 'Asignatura activa del año académico actual',
    placeholderCode: 'ej., ARQ-305',
    placeholderTitle: 'ej., Arquitectura del Renacimiento Español',
    placeholderSemester: 'ej., 1er Semestre (3er Curso)',
    placeholderGroups: 'ARQ-31, ARQ-32',
    placeholderTopic: 'Temas clave de las lecciones y prácticas...',
    btnCancel: 'Cancelar',
    btnSaveCreate: 'Crear Asignatura',
    btnSaveEdit: 'Guardar Cambios'
  }
};

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  editingCourse,
  onClose,
  onSave,
  lang = 'uk'
}) => {
  const t = MODAL_TEXT[lang] || MODAL_TEXT.uk;

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState('');
  const [credits, setCredits] = useState('6');
  const [enrolledStudents, setEnrolledStudents] = useState('28');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [groupsText, setGroupsText] = useState('');
  const [syllabusTopic, setSyllabusTopic] = useState('');
  const [isCurrentYear, setIsCurrentYear] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (editingCourse) {
        setCode(editingCourse.code);
        setTitle(getLocStr(editingCourse.title, lang));
        setSemester(getLocStr(editingCourse.semester, lang));
        setCredits(String(editingCourse.credits));
        setEnrolledStudents(String(editingCourse.enrolledStudents));
        setAcademicYear(editingCourse.academicYear || '2026/2027');
        setGroupsText(editingCourse.groups.join(', '));
        setSyllabusTopic(getLocStr(editingCourse.syllabusTopic, lang));
        setIsCurrentYear(editingCourse.isCurrentYear);
      } else {
        setCode('');
        setTitle('');
        setSemester(lang === 'es' ? '1er Semestre' : lang === 'en' ? '1st Semester' : '1 Семестр');
        setCredits('6');
        setEnrolledStudents('25');
        setAcademicYear('2026/2027');
        setGroupsText('GR-01');
        setSyllabusTopic('');
        setIsCurrentYear(true);
      }
    }
  }, [isOpen, editingCourse, lang]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return;

    const groups = groupsText
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    onSave({
      code: code.trim(),
      title: title.trim(),
      semester: semester.trim() || '1 Semester',
      credits: Number(credits) || 6,
      enrolledStudents: Number(enrolledStudents) || 25,
      academicYear: academicYear.trim() || '2026/2027',
      groups: groups.length > 0 ? groups : ['GR-01'],
      isCurrentYear,
      syllabusTopic: syllabusTopic.trim() || undefined
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="bg-[#581221] text-white px-5 py-4 flex items-center justify-between border-b border-[#7A1C30]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#7A1C30] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 id="course-modal-title" className="text-base font-bold text-white">
                {editingCourse ? t.editTitle : t.createTitle}
              </h3>
              <p className="text-xs text-rose-200/80">{t.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-rose-200 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="course-code-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.lblCode}
              </label>
              <input
                id="course-code-input"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.placeholderCode}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-[#7A1C30] outline-none"
              />
            </div>

            <div>
              <label htmlFor="course-year-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.lblYear}
              </label>
              <select
                id="course-year-select"
                value={academicYear}
                onChange={(e) => {
                  setAcademicYear(e.target.value);
                  setIsCurrentYear(e.target.value === '2026/2027');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none cursor-pointer"
              >
                <option value="2026/2027">2026/2027</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2023/2024">2023/2024</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="course-title-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.lblCourseTitle}
            </label>
            <input
              id="course-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.placeholderTitle}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-1">
              <label htmlFor="course-credits-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.lblCredits}
              </label>
              <input
                id="course-credits-input"
                type="number"
                min={1}
                max={30}
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums focus:ring-2 focus:ring-[#7A1C30] outline-none"
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="course-students-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.lblStudents}
              </label>
              <input
                id="course-students-input"
                type="number"
                min={1}
                max={500}
                value={enrolledStudents}
                onChange={(e) => setEnrolledStudents(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums focus:ring-2 focus:ring-[#7A1C30] outline-none"
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="course-semester-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.lblSemester}
              </label>
              <input
                id="course-semester-input"
                type="text"
                required
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder={t.placeholderSemester}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="course-groups-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.lblGroups}
            </label>
            <input
              id="course-groups-input"
              type="text"
              value={groupsText}
              onChange={(e) => setGroupsText(e.target.value)}
              placeholder={t.placeholderGroups}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
            />
          </div>

          <div>
            <label htmlFor="course-topic-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.lblTopic}
            </label>
            <textarea
              id="course-topic-input"
              rows={2}
              value={syllabusTopic}
              onChange={(e) => setSyllabusTopic(e.target.value)}
              placeholder={t.placeholderTopic}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={isCurrentYear}
              onChange={(e) => setIsCurrentYear(e.target.checked)}
              className="w-4 h-4 accent-[#7A1C30] rounded cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.lblCurrentYear}
            </span>
          </label>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              {t.btnCancel}
            </button>
            <button
              id="course-modal-submit"
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#7A1C30] hover:bg-[#9E2A43] text-white transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{editingCourse ? t.btnSaveEdit : t.btnSaveCreate}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

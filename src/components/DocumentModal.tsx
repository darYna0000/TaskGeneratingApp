import React, { useState, useEffect } from 'react';
import { X, FileUp, Save, FileText } from 'lucide-react';
import {
  ProfessorCourse,
  ProfessorDriveItem,
  DocumentInput,
  DRIVE_FOLDERS_META,
  getLocStr,
  formatFileSize
} from '../utils/professorsDb.ts';
import { SupportedLanguage } from '../utils/taskGenerator.ts';

interface DocumentModalProps {
  isOpen: boolean;
  editingDoc: ProfessorDriveItem | null;
  courses: ProfessorCourse[];
  defaultCourseId?: string;
  onClose: () => void;
  onSave: (input: DocumentInput, file?: File | null) => Promise<void> | void;
  lang?: SupportedLanguage;
}

const DOC_TEXT = {
  uk: {
    createTitle: 'Додати документ у репозиторій',
    editTitle: 'Редагувати документ',
    subtitle: 'Матеріали прив’язані до конкретного курсу та доступні для пошуку',
    lblCourse: 'Курс (Репозиторій) *',
    lblTitle: 'Назва документа *',
    lblFolder: 'Папка (Категорія) *',
    lblType: 'Тип матеріалу',
    lblGroup: 'Академічна група',
    lblFileUpload: 'Завантажити файл (PDF, DOCX, TXT, MD)',
    lblFileName: 'Ім’я файлу / Формат',
    lblDesc: 'Опис / Анотація документа *',
    lblPreview: 'Фрагмент тексту або зміст для індексації (опційно)',
    placeholderTitle: 'напр., Лекція 4: Фасади іспанського платереско',
    placeholderGroup: 'напр., АРХ-31 або Загальна',
    placeholderDesc: 'Короткий зміст документа для студентів та семантичного пошуку...',
    placeholderPreview: 'Вставте або завантажте фрагмент тексту документа для індексації...',
    chooseFileBtn: 'Обрати файл з комп’ютера',
    fileHint: 'Автоматично зчитає назву, розмір та текстовий фрагмент (.txt/.md)',
    btnCancel: 'Скасувати',
    btnCreate: 'Зберегти документ',
    btnUpdate: 'Оновити документ',
    typeLecture: 'Лекція',
    typePractice: 'Практикум',
    typeTest: 'Контрольний тест',
    typeSyllabus: 'Силабус / Програма',
    typeGenerated: 'Згенероване завдання'
  },
  en: {
    createTitle: 'Add Document to Repository',
    editTitle: 'Edit Document',
    subtitle: 'Materials are scoped to the course repository and ready for search',
    lblCourse: 'Course (Repository) *',
    lblTitle: 'Document Title *',
    lblFolder: 'Folder (Category) *',
    lblType: 'Document Type',
    lblGroup: 'Academic Group',
    lblFileUpload: 'Upload File (PDF, DOCX, TXT, MD)',
    lblFileName: 'File Name / Format',
    lblDesc: 'Description / Summary *',
    lblPreview: 'Extracted Text Excerpt for indexing (optional)',
    placeholderTitle: 'e.g., Lecture 4: Spanish Plateresque Facades',
    placeholderGroup: 'e.g., ARCH-31 or General',
    placeholderDesc: 'Concise summary of document contents for students and retrieval...',
    placeholderPreview: 'Paste or upload text excerpt for semantic indexing...',
    chooseFileBtn: 'Choose file from device',
    fileHint: 'Automatically fills file name, size, and excerpt (.txt/.md)',
    btnCancel: 'Cancel',
    btnCreate: 'Save Document',
    btnUpdate: 'Update Document',
    typeLecture: 'Lecture',
    typePractice: 'Practical',
    typeTest: 'Quiz / Test',
    typeSyllabus: 'Syllabus / Archive',
    typeGenerated: 'Generated Task'
  },
  es: {
    createTitle: 'Añadir Documento al Repositorio',
    editTitle: 'Editar Documento',
    subtitle: 'Materiales vinculados a la asignatura y listos para búsqueda',
    lblCourse: 'Asignatura (Repositorio) *',
    lblTitle: 'Título del Documento *',
    lblFolder: 'Carpeta (Categoría) *',
    lblType: 'Tipo de Material',
    lblGroup: 'Grupo Académico',
    lblFileUpload: 'Subir Archivo (PDF, DOCX, TXT, MD)',
    lblFileName: 'Nombre de Archivo / Formato',
    lblDesc: 'Descripción / Resumen *',
    lblPreview: 'Fragmento de Texto para indexación (opcional)',
    placeholderTitle: 'ej., Lección 4: Fachadas del Plateresco Español',
    placeholderGroup: 'ej., ARQ-31 o General',
    placeholderDesc: 'Resumen breve del contenido para estudiantes y búsqueda semántica...',
    placeholderPreview: 'Pegue o cargue un extracto de texto para indexación...',
    chooseFileBtn: 'Seleccionar archivo',
    fileHint: 'Detecta nombre, tamaño y texto automáticamente (.txt/.md)',
    btnCancel: 'Cancelar',
    btnCreate: 'Guardar Documento',
    btnUpdate: 'Actualizar Documento',
    typeLecture: 'Lección',
    typePractice: 'Práctica',
    typeTest: 'Cuestionario',
    typeSyllabus: 'Guía / Archivo',
    typeGenerated: 'Tarea Generada'
  }
};

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  editingDoc,
  courses,
  defaultCourseId,
  onClose,
  onSave,
  lang = 'uk'
}) => {
  const t = DOC_TEXT[lang] || DOC_TEXT.uk;

  const [courseId, setCourseId] = useState('');
  const [name, setName] = useState('');
  const [folderCategory, setFolderCategory] = useState<ProfessorDriveItem['folderCategory']>('lectures');
  const [type, setType] = useState<ProfessorDriveItem['type']>('lecture');
  const [group, setGroup] = useState('');
  const [fileName, setFileName] = useState('lecture_material.pdf');
  const [fileFormat, setFileFormat] = useState('PDF');
  const [size, setSize] = useState('1.4 MB');
  const [description, setDescription] = useState('');
  const [contentPreview, setContentPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setIsSaving(false);
      if (editingDoc) {
        setCourseId(editingDoc.courseId);
        setName(getLocStr(editingDoc.name, lang));
        setFolderCategory(editingDoc.folderCategory);
        setType(editingDoc.type);
        setGroup(editingDoc.group || '');
        setFileName(editingDoc.fileName || 'document.pdf');
        setFileFormat(editingDoc.fileFormat || 'PDF');
        setSize(editingDoc.size || '1.2 MB');
        setDescription(getLocStr(editingDoc.description, lang));
        setContentPreview(editingDoc.contentPreview || '');
      } else {
        const fallbackCourse =
          (defaultCourseId && defaultCourseId !== 'all' ? defaultCourseId : undefined) ||
          courses[0]?.id ||
          '';
        setCourseId(fallbackCourse);
        setName('');
        setFolderCategory('lectures');
        setType('lecture');
        const matched = courses.find((c) => c.id === fallbackCourse);
        setGroup(matched?.groups[0] || '');
        setFileName('material.pdf');
        setFileFormat('PDF');
        setSize('1.2 MB');
        setDescription('');
        setContentPreview('');
      }
    }
  }, [isOpen, editingDoc, courses, defaultCourseId, lang]);

  if (!isOpen) return null;

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'DOC';
    setFileFormat(ext);
    setSize(formatFileSize(file.size));

    if (!name.trim()) {
      const baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setName(baseTitle);
    }

    if (file.type.startsWith('text/') || /\.(txt|md|json|csv)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : '';
        setContentPreview(text.slice(0, 1400));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !courseId || !description.trim()) return;

    const selectedCourse = courses.find((c) => c.id === courseId);
    setIsSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          courseId,
          folderCategory,
          type,
          group: group.trim(),
          academicYear: selectedCourse?.academicYear || '2026/2027',
          size: size.trim() || '1.0 MB',
          fileName: fileName.trim() || 'document.pdf',
          fileFormat: fileFormat.trim().toUpperCase() || 'PDF',
          contentPreview: contentPreview.trim() || undefined,
          description: description.trim()
        },
        selectedFile
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="bg-[#581221] text-white px-5 py-4 flex items-center justify-between border-b border-[#7A1C30]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#7A1C30] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="document-modal-title" className="text-base font-bold text-white">
                {editingDoc ? t.editTitle : t.createTitle}
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
          <div>
            <label htmlFor="doc-course-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.lblCourse}
            </label>
            <select
              id="doc-course-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {getLocStr(c.title, lang)} ({c.academicYear})
                </option>
              ))}
            </select>
          </div>

          {/* File upload picker */}
          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  {t.lblFileUpload}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {fileName} · {size} · {fileFormat}
                </span>
              </div>
              <label className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#7A1C30] transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <FileUp className="w-3.5 h-3.5 text-[#7A1C30] dark:text-[#D4AF37]" />
                <span>{t.chooseFileBtn}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                  onChange={handleFilePick}
                  className="hidden"
                />
              </label>
            </div>
            <span className="block text-[10px] text-slate-400 mt-1.5">{t.fileHint}</span>
          </div>

          <div>
            <label htmlFor="doc-title-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.lblTitle}
            </label>
            <input
              id="doc-title-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.placeholderTitle}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="doc-folder-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.lblFolder}
              </label>
              <select
                id="doc-folder-select"
                value={folderCategory}
                onChange={(e) => setFolderCategory(e.target.value as ProfessorDriveItem['folderCategory'])}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {DRIVE_FOLDERS_META.map((f) => (
                  <option key={f.id} value={f.id}>
                    {getLocStr(f.name, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="doc-type-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.lblType}
              </label>
              <select
                id="doc-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as ProfessorDriveItem['type'])}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="lecture">{t.typeLecture}</option>
                <option value="practice">{t.typePractice}</option>
                <option value="test">{t.typeTest}</option>
                <option value="syllabus">{t.typeSyllabus}</option>
                <option value="generated_task">{t.typeGenerated}</option>
              </select>
            </div>

            <div>
              <label htmlFor="doc-group-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.lblGroup}
              </label>
              <input
                id="doc-group-input"
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder={t.placeholderGroup}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="doc-desc-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.lblDesc}
            </label>
            <textarea
              id="doc-desc-input"
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.placeholderDesc}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none resize-none"
            />
          </div>

          <div>
            <label htmlFor="doc-preview-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.lblPreview}
            </label>
            <textarea
              id="doc-preview-input"
              rows={2}
              value={contentPreview}
              onChange={(e) => setContentPreview(e.target.value)}
              placeholder={t.placeholderPreview}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              {t.btnCancel}
            </button>
            <button
              id="document-modal-submit"
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#7A1C30] hover:bg-[#9E2A43] disabled:opacity-60 text-white transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{editingDoc ? t.btnUpdate : t.btnCreate}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

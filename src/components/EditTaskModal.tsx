import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { TaskItem, SupportedLanguage } from '../utils/taskGenerator.ts';

interface EditTaskModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: number, newTitle: string, newBody: string) => void;
  lang?: SupportedLanguage;
}

const MODAL_TEXT = {
  uk: {
    titlePrefix: "Редагувати завдання",
    lblTitle: "Назва завдання",
    lblBody: "Опис та зміст інструкції",
    btnCancel: "Скасувати",
    btnSave: "Зберегти зміни",
    closeAria: "Закрити"
  },
  en: {
    titlePrefix: "Edit Task",
    lblTitle: "Task Title",
    lblBody: "Description & Instructions",
    btnCancel: "Cancel",
    btnSave: "Save Changes",
    closeAria: "Close"
  },
  es: {
    titlePrefix: "Editar Tarea",
    lblTitle: "Título de la tarea",
    lblBody: "Descripción e instrucciones de la tarea",
    btnCancel: "Cancelar",
    btnSave: "Guardar Cambios",
    closeAria: "Cerrar"
  }
};

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  lang = 'uk'
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const t = MODAL_TEXT[lang] || MODAL_TEXT.uk;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setBody(task.body);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task.id, title, body);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="bg-[#581221] text-white px-5 py-3.5 flex justify-between items-center border-b border-[#7A1C30]">
          <div id="edit-task-modal-title" className="flex items-center space-x-2 text-[#D4AF37] font-semibold text-sm">
            <Edit3 className="w-4 h-4" />
            <span>{t.titlePrefix} ({task.tag})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded transition cursor-pointer"
            aria-label={t.closeAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="edit-task-title-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1"
            >
              {t.lblTitle}
            </label>
            <input
              id="edit-task-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#7A1C30] focus:border-[#7A1C30] outline-none transition"
              required
            />
          </div>

          <div>
            <label
              htmlFor="edit-task-body-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1"
            >
              {t.lblBody}
            </label>
            <textarea
              id="edit-task-body-input"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#7A1C30] focus:border-[#7A1C30] outline-none transition font-sans"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
            >
              {t.btnCancel}
            </button>
            <button
              id="btn-edit-task-save"
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#7A1C30] hover:bg-[#9E2A43] rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.btnSave}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

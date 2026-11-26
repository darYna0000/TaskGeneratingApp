import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Search,
  Edit3,
  Trash2,
  LogOut,
  Users,
  Building2,
  Briefcase,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import {
  AdminProfile,
  ProfessorDatabaseRecord,
  TeacherInput,
  getLocStr
} from '../utils/professorsDb.ts';
import { SupportedLanguage } from '../utils/taskGenerator.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';

interface AdminDashboardProps {
  admin: AdminProfile;
  teachersDb: ProfessorDatabaseRecord[];
  onCreateTeacher: (input: TeacherInput) => void;
  onUpdateTeacher: (teacherId: string, updates: Partial<TeacherInput>) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onLogout: () => void;
  lang?: SupportedLanguage;
  theme?: 'light' | 'dark';
}

const ADMIN_TEXT = {
  uk: {
    heading: 'Менеджер акаунтів: Керування викладачами',
    sub: 'Ізольований обліковий запис — доступ лише до створення та редагування акаунтів у БД SQLite',
    btnAddTeacher: 'Створити акаунт викладача',
    btnLogout: 'Вийти',
    statTeachers: 'Акаунтів викладачів у БД',
    statFaculties: 'Факультетів у реєстрі',
    statDepartments: 'Кафедр у реєстрі',
    searchPlaceholder: 'Пошук акаунта за ПІБ, логіном, кафедрою або спеціальністю...',
    colTeacher: 'Власник акаунта',
    colCredentials: 'Логін / Пароль',
    colDepartment: 'Факультет і кафедра',
    colSpecialty: 'Спеціальність',
    colActions: 'Дії',
    btnEdit: 'Змінити',
    btnDelete: 'Видалити',
    emptyTitle: 'Акаунтів не знайдено',
    emptyDesc: 'Змініть пошуковий запит або створіть новий акаунт викладача в базі даних SQLite.',
    modalCreateTitle: 'Створити акаунт викладача',
    modalEditTitle: 'Редагувати акаунт викладача',
    modalSub: 'Викладач одразу зможе увійти зі своїм логіном і паролем',
    lblName: 'ПІБ викладача *',
    lblLogin: 'Логін / Код входу *',
    lblPassword: 'Пароль *',
    lblTitle: 'Науковий ступінь / Посада *',
    lblFaculty: 'Факультет *',
    lblDepartment: 'Кафедра *',
    lblSpecialty: 'Спеціальність *',
    lblColor: 'Колір профілю',
    placeholderName: 'напр., Д-р Марія Коваль',
    placeholderLogin: 'напр., 4444',
    placeholderPass: 'напр., 4444',
    placeholderTitle: 'Доцент кафедри історії',
    placeholderFaculty: 'Факультет філософії та красного письменства',
    placeholderDept: 'Кафедра цифрової гуманітаристики',
    placeholderSpec: 'Історія архітектури та спадщини',
    btnCancel: 'Скасувати',
    btnSaveCreate: 'Створити акаунт',
    btnSaveEdit: 'Зберегти зміни',
    errDuplicateLogin: 'Цей логін вже використовується іншим акаунтом.',
    confirmDeleteTitle: 'Видалити акаунт викладача?',
    confirmDeleteMsg: 'Ви впевнені, що хочете видалити обліковий запис',
    confirmDeleteMsgEnd: '? Усі його дані також будуть видалені з бази SQLite.',
    coursesUnit: 'курсів',
    docsUnit: 'док.'
  },
  en: {
    heading: 'Account Manager: Faculty Accounts',
    sub: 'Isolated role — manage professor credentials and profiles in SQLite database only',
    btnAddTeacher: 'Create Teacher Account',
    btnLogout: 'Sign Out',
    statTeachers: 'Teacher Accounts (SQLite)',
    statFaculties: 'Faculties Registered',
    statDepartments: 'Departments Registered',
    searchPlaceholder: 'Search accounts by name, login, department, or specialty...',
    colTeacher: 'Account Holder',
    colCredentials: 'Login / Password',
    colDepartment: 'Faculty & Department',
    colSpecialty: 'Specialty',
    colActions: 'Actions',
    btnEdit: 'Edit',
    btnDelete: 'Delete',
    emptyTitle: 'No accounts found',
    emptyDesc: 'Adjust your search query or create a new professor account in SQLite.',
    modalCreateTitle: 'Create Teacher Account',
    modalEditTitle: 'Edit Teacher Account',
    modalSub: 'The teacher can immediately sign in with these SQLite credentials',
    lblName: 'Full Name *',
    lblLogin: 'Login / Access Code *',
    lblPassword: 'Password *',
    lblTitle: 'Academic Title / Role *',
    lblFaculty: 'Faculty *',
    lblDepartment: 'Department *',
    lblSpecialty: 'Specialty *',
    lblColor: 'Avatar Accent',
    placeholderName: 'e.g., Dr. Maria Koval',
    placeholderLogin: 'e.g., 4444',
    placeholderPass: 'e.g., 4444',
    placeholderTitle: 'Associate Professor',
    placeholderFaculty: 'Faculty of Philosophy and Letters',
    placeholderDept: 'Department of Digital Humanities',
    placeholderSpec: 'Architectural Heritage & Informatics',
    btnCancel: 'Cancel',
    btnSaveCreate: 'Create Account',
    btnSaveEdit: 'Save Changes',
    errDuplicateLogin: 'This login code is already assigned to another account.',
    confirmDeleteTitle: 'Delete Teacher Account?',
    confirmDeleteMsg: 'Are you sure you want to remove account',
    confirmDeleteMsgEnd: 'from the SQLite database?',
    coursesUnit: 'courses',
    docsUnit: 'docs'
  },
  es: {
    heading: 'Gestor de Cuentas: Registro Docente',
    sub: 'Cuenta aislada — acceso exclusivo para crear y gestionar cuentas de profesores en SQLite',
    btnAddTeacher: 'Crear Cuenta de Profesor',
    btnLogout: 'Cerrar sesión',
    statTeachers: 'Cuentas Docentes (SQLite)',
    statFaculties: 'Facultades en Registro',
    statDepartments: 'Departamentos en Registro',
    searchPlaceholder: 'Buscar cuenta por nombre, usuario, departamento o especialidad...',
    colTeacher: 'Titular de la Cuenta',
    colCredentials: 'Usuario / Clave',
    colDepartment: 'Facultad y Departamento',
    colSpecialty: 'Especialidad',
    colActions: 'Acciones',
    btnEdit: 'Editar',
    btnDelete: 'Eliminar',
    emptyTitle: 'No se encontraron cuentas',
    emptyDesc: 'Ajuste la búsqueda o cree una nueva cuenta de profesor en SQLite.',
    modalCreateTitle: 'Crear Cuenta de Profesor',
    modalEditTitle: 'Editar Cuenta de Profesor',
    modalSub: 'El profesor podrá iniciar sesión de inmediato con estas credenciales',
    lblName: 'Nombre Completo *',
    lblLogin: 'Usuario / Código *',
    lblPassword: 'Contraseña *',
    lblTitle: 'Categoría Académica *',
    lblFaculty: 'Facultad *',
    lblDepartment: 'Departamento *',
    lblSpecialty: 'Especialidad *',
    lblColor: 'Color de Perfil',
    placeholderName: 'ej., Dra. María Koval',
    placeholderLogin: 'ej., 4444',
    placeholderPass: 'ej., 4444',
    placeholderTitle: 'Profesora Titular',
    placeholderFaculty: 'Facultad de Filosofía y Letras',
    placeholderDept: 'Departamento de Humanidades Digitales',
    placeholderSpec: 'Patrimonio Arquitectónico e Informática',
    btnCancel: 'Cancelar',
    btnSaveCreate: 'Crear Cuenta',
    btnSaveEdit: 'Guardar Cambios',
    errDuplicateLogin: 'Este código de usuario ya está en uso.',
    confirmDeleteTitle: '¿Eliminar cuenta de profesor?',
    confirmDeleteMsg: '¿Está seguro de eliminar la cuenta',
    confirmDeleteMsgEnd: 'de la base de datos SQLite?',
    coursesUnit: 'cursos',
    docsUnit: 'docs'
  }
};

const AVATAR_COLORS = [
  'bg-amber-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-[#7A1C30]',
  'bg-indigo-600',
  'bg-teal-600'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  teachersDb,
  onCreateTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onLogout,
  lang = 'uk',
  theme = 'light'
}) => {
  const t = ADMIN_TEXT[lang] || ADMIN_TEXT.uk;

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<ProfessorDatabaseRecord | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<ProfessorDatabaseRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [avatarBg, setAvatarBg] = useState(AVATAR_COLORS[3]);

  const totalFaculties = new Set(teachersDb.map((r) => getLocStr(r.profile.faculty, lang)).filter(Boolean)).size;
  const totalDepartments = new Set(teachersDb.map((r) => getLocStr(r.profile.department, lang)).filter(Boolean)).size;

  const filteredTeachers = teachersDb.filter((record) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      getLocStr(record.profile.name, lang).toLowerCase().includes(q) ||
      record.login.toLowerCase().includes(q) ||
      getLocStr(record.profile.department, lang).toLowerCase().includes(q) ||
      getLocStr(record.profile.specialty, lang).toLowerCase().includes(q)
    );
  });

  const openCreateModal = () => {
    setEditingTeacher(null);
    setFormError(null);
    setName('');
    setLogin('');
    setPassword('');
    setTitle(lang === 'es' ? 'Profesor/a Titular' : lang === 'en' ? 'Associate Professor' : 'Доцент кафедри');
    setFaculty(
      lang === 'es'
        ? 'Facultad de Filosofía y Letras'
        : lang === 'en'
        ? 'Faculty of Philosophy and Letters'
        : 'Факультет філософії та красного письменства'
    );
    setDepartment('');
    setSpecialty('');
    setAvatarBg(AVATAR_COLORS[3]);
    setIsModalOpen(true);
  };

  const openEditModal = (record: ProfessorDatabaseRecord) => {
    setEditingTeacher(record);
    setFormError(null);
    setName(getLocStr(record.profile.name, lang));
    setLogin(record.login);
    setPassword(record.passwordHash);
    setTitle(getLocStr(record.profile.title, lang));
    setFaculty(getLocStr(record.profile.faculty, lang));
    setDepartment(getLocStr(record.profile.department, lang));
    setSpecialty(getLocStr(record.profile.specialty, lang));
    setAvatarBg(record.profile.avatarBg || AVATAR_COLORS[3]);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmedLogin = login.trim();

    const conflict = teachersDb.find(
      (r) => r.login.toLowerCase() === trimmedLogin.toLowerCase() && r.id !== editingTeacher?.id
    );
    if (conflict) {
      setFormError(t.errDuplicateLogin);
      return;
    }

    const payload: TeacherInput = {
      login: trimmedLogin,
      password: password.trim() || trimmedLogin,
      name: name.trim(),
      title: title.trim(),
      faculty: faculty.trim(),
      department: department.trim(),
      specialty: specialty.trim(),
      avatarBg
    };

    if (editingTeacher) {
      onUpdateTeacher(editingTeacher.id, payload);
    } else {
      onCreateTeacher(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#581221] text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.heading}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {getLocStr(admin.name, lang)} · {admin.email} · {t.sub}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="btn-admin-add-teacher"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#7A1C30] hover:bg-[#9E2A43] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>{t.btnAddTeacher}</span>
          </button>
          <button
            type="button"
            id="btn-admin-logout"
            onClick={onLogout}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.btnLogout}</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.statTeachers}</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums" data-testid="admin-teachers-count">
              {teachersDb.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.statFaculties}</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalFaculties}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.statDepartments}</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalDepartments}
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Data Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
            />
          </div>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t.emptyTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{t.emptyDesc}</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg bg-[#7A1C30] hover:bg-[#9E2A43] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.btnAddTeacher}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">{t.colTeacher}</th>
                  <th className="py-3 px-4">{t.colCredentials}</th>
                  <th className="py-3 px-4">{t.colDepartment}</th>
                  <th className="py-3 px-4">{t.colSpecialty}</th>
                  <th className="py-3 px-4 text-right">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredTeachers.map((record) => {
                  const profName = getLocStr(record.profile.name, lang);
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg ${record.profile.avatarBg} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                            {profName.charAt(0) || 'P'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{profName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {getLocStr(record.profile.title, lang)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {record.login} / {record.passwordHash}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {getLocStr(record.profile.department, lang)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {getLocStr(record.profile.faculty, lang)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                        {getLocStr(record.profile.specialty, lang)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(record)}
                            aria-label={`${t.btnEdit} ${profName}`}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#7A1C30] text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{t.btnEdit}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTeacher(record)}
                            aria-label={`${t.btnDelete} ${profName}`}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t.btnDelete}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Teacher Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="teacher-crud-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-[#581221] text-white px-5 py-4 flex items-center justify-between border-b border-[#7A1C30]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#7A1C30] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="teacher-crud-modal-title" className="text-base font-bold text-white">
                    {editingTeacher ? t.modalEditTitle : t.modalCreateTitle}
                  </h3>
                  <p className="text-xs text-rose-200/80">{t.modalSub}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                className="text-rose-200 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label htmlFor="teacher-name-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.lblName}
                </label>
                <input
                  id="teacher-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.placeholderName}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="teacher-login-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.lblLogin}
                  </label>
                  <input
                    id="teacher-login-input"
                    type="text"
                    required
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder={t.placeholderLogin}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-[#7A1C30] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="teacher-password-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.lblPassword}
                  </label>
                  <input
                    id="teacher-password-input"
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.placeholderPass}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-[#7A1C30] outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="teacher-title-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.lblTitle}
                </label>
                <input
                  id="teacher-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.placeholderTitle}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="teacher-faculty-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.lblFaculty}
                  </label>
                  <input
                    id="teacher-faculty-input"
                    type="text"
                    required
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder={t.placeholderFaculty}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="teacher-dept-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.lblDepartment}
                  </label>
                  <input
                    id="teacher-dept-input"
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={t.placeholderDept}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="teacher-spec-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.lblSpecialty}
                </label>
                <input
                  id="teacher-spec-input"
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder={t.placeholderSpec}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7A1C30] outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.lblColor}
                </span>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setAvatarBg(cls)}
                      aria-label={`Select color ${cls}`}
                      className={`w-7 h-7 rounded-lg ${cls} cursor-pointer transition ${
                        avatarBg === cls ? 'ring-2 ring-offset-2 ring-[#7A1C30] dark:ring-offset-slate-900 scale-105' : 'opacity-75 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
                >
                  {t.btnCancel}
                </button>
                <button
                  id="teacher-modal-submit"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[#7A1C30] hover:bg-[#9E2A43] text-white transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{editingTeacher ? t.btnSaveEdit : t.btnSaveCreate}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Teacher Confirmation */}
      <ConfirmDialog
        isOpen={deletingTeacher !== null}
        title={t.confirmDeleteTitle}
        message={`${t.confirmDeleteMsg} "${deletingTeacher ? getLocStr(deletingTeacher.profile.name, lang) : ''}" ${t.confirmDeleteMsgEnd}`}
        confirmLabel={t.btnDelete}
        onCancel={() => setDeletingTeacher(null)}
        onConfirm={() => {
          if (deletingTeacher) {
            onDeleteTeacher(deletingTeacher.id);
            setDeletingTeacher(null);
          }
        }}
        lang={lang}
      />
    </main>
  );
};

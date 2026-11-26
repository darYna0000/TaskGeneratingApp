import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  User,
  KeyRound,
  GraduationCap,
  ShieldCheck,
  Shield,
  ArrowRight,
  Info,
  Loader2
} from 'lucide-react';
import {
  AdminProfile,
  ProfessorDatabaseRecord,
  ProfessorProfile,
  getLocStr,
  getProfessorsDatabase
} from '../utils/professorsDb.ts';
import { ActivityRecord, SupportedLanguage } from '../utils/taskGenerator.ts';
import { apiLogin, setStoredAuthToken, type ServerHistoryRecord } from '../utils/apiClient.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    prof: ProfessorProfile,
    history?: ServerHistoryRecord[],
    activities?: ActivityRecord[]
  ) => void;
  onAdminSuccess?: (admin: AdminProfile) => void;
  teachersDb?: ProfessorDatabaseRecord[];
  initialRole?: 'teacher' | 'admin';
  lang?: SupportedLanguage;
}

const MODAL_TEXT = {
  uk: {
    title: 'Вхід у систему UVa',
    sub: 'Universidad de Valladolid • Викладачі та Менеджер акаунтів',
    roleTeacher: 'Викладач',
    roleAdmin: 'Менеджер акаунтів',
    lblLogin: 'Логін / Код доступу',
    lblPass: 'Пароль',
    placeholderLogin: 'наприклад, 1111 або manager',
    btnSubmitTeacher: 'Увійти як викладач',
    btnSubmitAdmin: 'Увійти як менеджер акаунтів',
    quickHeading: 'Швидке заповнення тестового доступу:',
    quickAdminTitle: 'Менеджер акаунтів (тільки акаунти)',
    quickAdminDesc: 'manager / manager (або admin / admin)',
    errInvalid: 'Невірний логін або пароль. Перевірте облікові дані у базі SQLite.',
    footerSecure: 'Перевірка доступу через серверну базу даних SQLite (UVa)'
  },
  en: {
    title: 'UVa Portal Sign In',
    sub: 'Universidad de Valladolid • Teachers & Account Manager',
    roleTeacher: 'Teacher',
    roleAdmin: 'Account Manager',
    lblLogin: 'Login / Access Code',
    lblPass: 'Password',
    placeholderLogin: 'e.g., 1111 or manager',
    btnSubmitTeacher: 'Sign In as Teacher',
    btnSubmitAdmin: 'Sign In as Account Manager',
    quickHeading: 'Quick Demo Accounts:',
    quickAdminTitle: 'Account Manager (Accounts Only)',
    quickAdminDesc: 'manager / manager (or admin / admin)',
    errInvalid: 'Invalid login or password. Verify credentials in SQLite registry.',
    footerSecure: 'Authenticated against the SQLite server database'
  },
  es: {
    title: 'Acceso al Portal UVa',
    sub: 'Universidad de Valladolid • Docentes y Gestor de Cuentas',
    roleTeacher: 'Profesor',
    roleAdmin: 'Gestor de Cuentas',
    lblLogin: 'Usuario / Código',
    lblPass: 'Contraseña',
    placeholderLogin: 'ej., 1111 o manager',
    btnSubmitTeacher: 'Entrar como Profesor',
    btnSubmitAdmin: 'Entrar como Gestor de Cuentas',
    quickHeading: 'Cuentas rápidas de acceso:',
    quickAdminTitle: 'Gestor de Cuentas (Solo Cuentas)',
    quickAdminDesc: 'manager / manager (o admin / admin)',
    errInvalid: 'Credenciales incorrectas. Verifique usuario y clave en SQLite.',
    footerSecure: 'Autenticación mediante base de datos SQLite del servidor'
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onAdminSuccess,
  teachersDb,
  initialRole = 'teacher',
  lang = 'uk'
}) => {
  const [roleMode, setRoleMode] = useState<'teacher' | 'admin'>(initialRole);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRoleMode(initialRole);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const t = MODAL_TEXT[lang] || MODAL_TEXT.uk;
  const currentTeachers = teachersDb || getProfessorsDatabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await apiLogin(login, password);
      setStoredAuthToken(result.token);
      if (result.role === 'manager') {
        if (onAdminSuccess) {
          onAdminSuccess(result.manager);
        }
        onClose();
        return;
      }
      onSuccess(result.professor, result.history, result.activities);
      onClose();
    } catch {
      setError(t.errInvalid);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTeacher = (code: string, pass: string) => {
    setRoleMode('teacher');
    setLogin(code);
    setPassword(pass);
    setError(null);
  };

  const handleQuickAdmin = () => {
    setRoleMode('admin');
    setLogin('manager');
    setPassword('manager');
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="bg-[#581221] text-white px-6 py-5 flex justify-between items-center border-b border-[#7A1C30]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#7A1C30] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30 shadow-inner">
              {roleMode === 'admin' ? <Shield className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
            </div>
            <div>
              <h2 id="login-modal-title" className="text-base font-bold text-white tracking-wide">
                {t.title}
              </h2>
              <p className="text-xs text-rose-200/80">
                {t.sub}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-rose-200 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Role Segmented Switch */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              id="login-tab-teacher"
              onClick={() => {
                setRoleMode('teacher');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                roleMode === 'teacher'
                  ? 'bg-white dark:bg-slate-700 text-[#7A1C30] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{t.roleTeacher}</span>
            </button>
            <button
              type="button"
              id="login-tab-admin"
              onClick={() => {
                setRoleMode('admin');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                roleMode === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-[#7A1C30] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t.roleAdmin}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-code-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.lblLogin}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="login-code-input"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder={t.placeholderLogin}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#7A1C30] outline-none transition bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.lblPass}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  id="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#7A1C30] outline-none transition bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              id="modal-login-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#7A1C30] hover:bg-[#9E2A43] disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl shadow hover:shadow-md transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span>{roleMode === 'admin' ? t.btnSubmitAdmin : t.btnSubmitTeacher}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              {t.quickHeading}
            </span>
            {roleMode === 'admin' ? (
              <button
                type="button"
                id="quick-login-admin"
                onClick={handleQuickAdmin}
                className="w-full p-2.5 text-left bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer flex items-center justify-between gap-2"
              >
                <span className="font-semibold text-xs text-slate-800 dark:text-white">{t.quickAdminTitle}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-300 font-mono">{t.quickAdminDesc}</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-28 overflow-y-auto pr-0.5">
                {currentTeachers.slice(0, 6).map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    id={`quick-login-${rec.login}`}
                    onClick={() => handleQuickTeacher(rec.login, rec.passwordHash)}
                    className="p-2 text-left bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer text-xs"
                  >
                    <b className="block text-slate-800 dark:text-slate-100 text-[11px] truncate">
                      {getLocStr(rec.profile.name, lang).split(':')[0]}
                    </b>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {rec.login} / {rec.passwordHash}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-slate-950/60 px-6 py-3 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{t.footerSecure}</span>
        </div>
      </div>
    </div>
  );
};

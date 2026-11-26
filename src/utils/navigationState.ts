export type AppView = 'home' | 'generator' | 'history' | 'professor_portal' | 'admin_portal';
export type AppTheme = 'light' | 'dark';

export interface FormDraft {
  subject: string;
  poiName: string;
  teacherNote: string;
  educationLevel?: string;
  academicGroup?: string;
  taskType?: string;
  difficultyLevel?: string;
  duration?: string;
  learningObjectives?: string;
  geoCoordinates?: string;
  geoRadius?: string;
  lastUpdated: number;
}

export interface NavigationState {
  stack: AppView[];
  currentIndex: number;
}

/**
 * Initializes navigation state starting with the specified initial view
 */
export function createNavigationState(initialView: AppView = 'home'): NavigationState {
  return {
    stack: [initialView],
    currentIndex: 0
  };
}

/**
 * Pushes a new view onto the history stack.
 * If current index is in the past, discards forward history like standard browsers.
 */
export function pushView(state: NavigationState, newView: AppView): NavigationState {
  if (state.stack[state.currentIndex] === newView) {
    return state;
  }
  const nextStack = state.stack.slice(0, state.currentIndex + 1);
  nextStack.push(newView);
  return {
    stack: nextStack,
    currentIndex: nextStack.length - 1
  };
}

/**
 * Steps back one step in history if possible
 */
export function goBack(state: NavigationState): NavigationState {
  if (state.currentIndex <= 0) {
    return state;
  }
  return {
    stack: state.stack,
    currentIndex: state.currentIndex - 1
  };
}

/**
 * Steps forward one step in history if possible
 */
export function goForward(state: NavigationState): NavigationState {
  if (state.currentIndex >= state.stack.length - 1) {
    return state;
  }
  return {
    stack: state.stack,
    currentIndex: state.currentIndex + 1
  };
}

export function canGoBack(state: NavigationState): boolean {
  return state.currentIndex > 0;
}

export function canGoForward(state: NavigationState): boolean {
  return state.currentIndex < state.stack.length - 1;
}

export function getCurrentView(state: NavigationState): AppView {
  return state.stack[state.currentIndex] || 'home';
}

const DRAFT_STORAGE_KEY = 'uva_form_draft_v1';
const THEME_STORAGE_KEY = 'uva_theme_mode';

/**
 * Safely saves draft input fields to localStorage
 */
export function saveFormDraft(draft: Omit<FormDraft, 'lastUpdated'>): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const payload: FormDraft = {
        ...draft,
        lastUpdated: Date.now()
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {}
}

/**
 * Safely loads draft input fields from localStorage
 */
export function loadFormDraft(): FormDraft | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.subject === 'string' && typeof parsed.poiName === 'string') {
          return parsed as FormDraft;
        }
      }
    }
  } catch {}
  return null;
}

/**
 * Gets currently saved theme, defaulting to light
 */
export function getStoredTheme(): AppTheme {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    }
  } catch {}
  return 'light';
}

/**
 * Persists theme preference to localStorage
 */
export function setStoredTheme(theme: AppTheme): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {}
}

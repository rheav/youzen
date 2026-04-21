import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'appTheme';

function getSystemTheme() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getSystemTheme());
  const [hasExplicitPreference, setHasExplicitPreference] = useState(false);

  // 1. Load saved preference on mount
  useEffect(() => {
    try {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) return;
        if (result[STORAGE_KEY]) {
          setThemeState(result[STORAGE_KEY]);
          setHasExplicitPreference(true);
          applyTheme(result[STORAGE_KEY]);
        } else {
          applyTheme(getSystemTheme());
        }
      });
    } catch {
      // Extension context invalidated — use system preference
      applyTheme(getSystemTheme());
    }
  }, []);

  // 2. Follow system preference when no explicit choice
  useEffect(() => {
    if (hasExplicitPreference) return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setThemeState(newTheme);
      applyTheme(newTheme);
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [hasExplicitPreference]);

  // 3. Listen for storage changes from other contexts
  useEffect(() => {
    const handler = (changes, area) => {
      if (area !== 'local' || !changes[STORAGE_KEY]) return;
      const newTheme = changes[STORAGE_KEY].newValue;
      if (newTheme) {
        setThemeState(newTheme);
        setHasExplicitPreference(true);
        applyTheme(newTheme);
      }
    };

    try {
      chrome.storage.onChanged.addListener(handler);
      return () => {
        try {
          chrome.storage.onChanged.removeListener(handler);
        } catch {}
      };
    } catch {
      return undefined;
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    setHasExplicitPreference(true);
    applyTheme(newTheme);
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: newTheme });
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

const THEME_KEY = 'theme';

export const getStoredTheme = () => {
  return localStorage.getItem(THEME_KEY);
};

export const applyTheme = (theme) => {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  return next;
};

export const initTheme = () => {
  const saved = getStoredTheme();
  if (saved) {
    return applyTheme(saved);
  }

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return applyTheme(prefersDark ? 'dark' : 'light');
};

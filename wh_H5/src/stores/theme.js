import { defineStore } from 'pinia';
import { applyTheme, initTheme } from '../utils/theme';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    current: 'light'
  }),
  getters: {
    isDark: (state) => state.current === 'dark'
  },
  actions: {
    init() {
      this.current = initTheme();
    },
    setTheme(theme) {
      this.current = applyTheme(theme);
    },
    toggle() {
      this.setTheme(this.current === 'dark' ? 'light' : 'dark');
    }
  }
});

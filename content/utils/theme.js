import { Settings } from './storage.js';

export const Theme = {
  THEMES: {
    default: {
      name: 'Classic Siege',
      vars: {
        '--ms-castle-brown': '#402b20',
        '--ms-parchment': '#F5E7B7',
        '--ms-purple-primary': '#8B5CF6',
        '--ms-purple-light': '#A78BFA',
        '--ms-purple-dark': '#7C3AED',
        '--ms-gold': '#F59E0B',
        '--ms-bg-primary': '#FFFFFF',
        '--ms-bg-secondary': '#F9FAFB',
        '--ms-text-primary': '#402b20',
        '--ms-text-secondary': '#6B7280',
        '--ms-border': '#E5E7EB',
        '--ms-shadow': 'rgba(64, 43, 32, 0.1)',
        '--ms-shadow-heavy': 'rgba(64, 43, 32, 0.25)'
      }
    },
    dark: {
      name: 'Dark Castle',
      vars: {
        '--ms-castle-brown': '#F5E7B7',
        '--ms-parchment': '#2D1B14',
        '--ms-purple-primary': '#A78BFA',
        '--ms-purple-light': '#C4B5FD',
        '--ms-purple-dark': '#8B5CF6',
        '--ms-gold': '#FCD34D',
        '--ms-bg-primary': '#1F2937',
        '--ms-bg-secondary': '#111827',
        '--ms-text-primary': '#F9FAFB',
        '--ms-text-secondary': '#D1D5DB',
        '--ms-border': '#374151',
        '--ms-shadow': 'rgba(0, 0, 0, 0.3)',
        '--ms-shadow-heavy': 'rgba(0, 0, 0, 0.5)'
      }
    },
    midnight: {
      name: 'Midnight Siege',
      vars: {
        '--ms-castle-brown': '#E5D4A0',
        '--ms-parchment': '#1A1A2E',
        '--ms-purple-primary': '#9D4EDD',
        '--ms-purple-light': '#C77DFF',
        '--ms-purple-dark': '#7B2CBF',
        '--ms-gold': '#FFB800',
        '--ms-bg-primary': '#16213E',
        '--ms-bg-secondary': '#0F172A',
        '--ms-text-primary': '#E2E8F0',
        '--ms-text-secondary': '#94A3B8',
        '--ms-border': '#334155',
        '--ms-shadow': 'rgba(0, 0, 0, 0.4)',
        '--ms-shadow-heavy': 'rgba(0, 0, 0, 0.6)'
      }
    }
  },

  async getCurrentTheme() {
    const themeName = await Settings.get('theme');
    return themeName || 'default';
  },

  async setTheme(themeName) {
    if (!this.THEMES[themeName]) {
      console.error(`Theme ${themeName} not found`);
      return false;
    }

    const theme = this.THEMES[themeName];
    
    Object.entries(theme.vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    await Settings.set('theme', themeName);
    
    document.body.setAttribute('data-ms-theme', themeName);
    
    return true;
  },

  async applyStoredTheme() {
    const themeName = await this.getCurrentTheme();
    await this.setTheme(themeName);
  },

  async toggleDarkMode() {
    const current = await this.getCurrentTheme();
    const newTheme = current === 'default' ? 'dark' : 'default';
    await this.setTheme(newTheme);
    return newTheme;
  },

  getThemeList() {
    return Object.entries(this.THEMES).map(([key, theme]) => ({
      id: key,
      name: theme.name
    }));
  },

  isDarkTheme(themeName) {
    return themeName !== 'default';
  }
};

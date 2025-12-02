export const SIEGE_COLORS = {
  parchment: '#f5f5f4',
  textPrimary: '#3b2a1a',
  textSecondary: '#2d1f13',
  borderPrimary: 'rgba(64, 43, 32, 0.75)',
  borderSecondary: 'rgba(64, 43, 32, 0.55)',
  borderDotted: 'rgba(64, 43, 32, 0.55)',
  
  accent: {
    blue: '#3b82f6',
    blueLight: 'rgba(59, 130, 246, 0.15)',
    blueBorder: 'rgba(59, 130, 246, 0.3)',
    
    gold: '#f59e0b',
    goldLight: 'rgba(245, 158, 11, 0.15)',
    goldBorder: 'rgba(245, 158, 11, 0.3)',
    
    purple: '#8b5cf6',
    purpleLight: 'rgba(139, 92, 246, 0.15)',
    purpleBorder: 'rgba(139, 92, 246, 0.3)',
    
    green: '#22c55e',
    greenLight: 'rgba(34, 197, 94, 0.15)',
    greenBorder: 'rgba(34, 197, 94, 0.3)',
    
    red: '#ef4444',
    redLight: 'rgba(239, 68, 68, 0.15)',
    redBorder: 'rgba(239, 68, 68, 0.3)'
  },
  
  rarity: {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b'
  }
};

export const SIEGE_FONTS = {
  primary: '"IM Fell English", serif',
  heading: '"Jaini", "IM Fell English", serif',
  mono: '"Monaco", "Menlo", "Consolas", monospace'
};

export const SIEGE_BORDERS = {
  primary: `3px solid ${SIEGE_COLORS.borderPrimary}`,
  secondary: `3px solid ${SIEGE_COLORS.borderSecondary}`,
  dotted: `3px dotted ${SIEGE_COLORS.borderDotted}`,
  thin: `2px solid ${SIEGE_COLORS.borderPrimary}`
};

export const SIEGE_SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '2rem'
};

export const SIEGE_SHADOWS = {
  sm: '0 1px 2px rgba(59, 42, 26, 0.1)',
  md: '0 4px 6px rgba(59, 42, 26, 0.1)',
  lg: '0 10px 15px rgba(59, 42, 26, 0.1)',
  xl: '0 20px 25px rgba(59, 42, 26, 0.1)'
};

export const SIEGE_TRANSITIONS = {
  fast: '0.15s ease-in-out',
  normal: '0.2s ease-in-out',
  slow: '0.3s ease-in-out'
};

export const SIEGE_BREAKPOINTS = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
};

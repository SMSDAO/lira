// Pixels-style design tokens
export const theme = {
  colors: {
    bgPrimary: '#0B0F1A',
    bgSecondary: '#121826',
    accentGradient: 'linear-gradient(135deg, #7C3AED, #2563EB)',
    glowPurple: 'rgba(124, 58, 237, 0.6)',
    glowBlue: 'rgba(37, 99, 235, 0.6)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
  },
  shadows: {
    soft: '0 10px 30px rgba(0, 0, 0, 0.4)',
    glowPurple: '0 0 20px rgba(124, 58, 237, 0.5)',
    glowBlue: '0 0 20px rgba(37, 99, 235, 0.5)',
    depth: '0 20px 60px rgba(0, 0, 0, 0.6)',
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
} as const;

export type Theme = typeof theme;

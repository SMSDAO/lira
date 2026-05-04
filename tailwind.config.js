module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy Aura FX tokens (kept for backward compatibility)
        'neo-dark': '#0a0e1a',
        'neo-darker': '#050810',
        'neo-blue': '#00d4ff',
        'neo-purple': '#9d4edd',
        'neo-pink': '#ff006e',
        'neo-green': '#06ffa5',
        'aura-glow': '#00f0ff',
        // Pixels-style design tokens
        'px-bg-primary': '#0B0F1A',
        'px-bg-secondary': '#121826',
        'px-purple': '#7C3AED',
        'px-blue': '#2563EB',
      },
      backgroundImage: {
        'px-gradient': 'linear-gradient(135deg, #7C3AED, #2563EB)',
      },
      boxShadow: {
        // Legacy
        'aura': '0 0 20px rgba(0, 212, 255, 0.5)',
        'aura-lg': '0 0 40px rgba(0, 212, 255, 0.7)',
        'neo-glow': '0 0 15px rgba(157, 78, 221, 0.6)',
        // Pixels-style
        'px-soft': '0 10px 30px rgba(0,0,0,0.4)',
        'px-glow-purple': '0 0 20px rgba(124,58,237,0.5)',
        'px-glow-blue': '0 0 20px rgba(37,99,235,0.5)',
        'px-depth': '0 20px 60px rgba(0,0,0,0.6)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'px-pulse': 'px-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 1)' },
        },
        'px-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(124,58,237,0.8)' },
        },
      },
    },
  },
  plugins: [],
};

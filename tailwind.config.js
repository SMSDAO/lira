module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neo-dark': '#0a0e1a',
        'neo-darker': '#050810',
        'neo-blue': '#00d4ff',
        'neo-purple': '#9d4edd',
        'neo-pink': '#ff006e',
        'neo-green': '#06ffa5',
        'aura-glow': '#00f0ff',
      },
      boxShadow: {
        'aura': '0 0 20px rgba(0, 212, 255, 0.5)',
        'aura-lg': '0 0 40px rgba(0, 212, 255, 0.7)',
        'neo-glow': '0 0 15px rgba(157, 78, 221, 0.6)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 1)' },
        },
      },
    },
  },
  plugins: [],
};

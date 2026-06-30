/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#080c14',
          'bg-2': '#0d1420',
          'bg-3': '#111a2e',
          cyan: '#00f5ff',
          'cyan-dim': '#0099aa',
          'text-dim': '#4a6580',
          'text-mid': '#7a9ab5',
          red: '#ff2d55',
          amber: '#ff9f0a',
          green: '#30d158',
          'red-glow': 'rgba(255,45,85,0.3)',
          'amber-glow': 'rgba(255,159,10,0.3)',
          'green-glow': 'rgba(48,209,88,0.3)',
          'cyan-glow': 'rgba(0,245,255,0.2)',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      animation: {
        'pulse-critical': 'pulseCritical 1.2s ease-in-out infinite',
        'pulse-elevated': 'pulseElevated 2s ease-in-out infinite',
        'pulse-safe': 'pulseSafe 2.4s ease-in-out infinite',
        scanline: 'scanline 600ms linear forwards',
        'type-cursor': 'typeCursor 1s step-end infinite',
      },
      keyframes: {
        pulseCritical: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.08)' },
        },
        pulseElevated: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.05)' },
        },
        pulseSafe: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.03)' },
        },
        scanline: {
          '0%': { top: '0%', opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        typeCursor: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

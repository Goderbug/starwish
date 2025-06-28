/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.6' }],
        'sm': ['0.875rem', { lineHeight: '1.6' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
        'star-glow': 'starGlow 3s ease-in-out infinite',
        'constellation-pulse': 'constellationPulse 4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'status-change': 'statusChange 0.6s ease-out',
        'card-glow': 'cardGlow 4s ease-in-out infinite',
      },
      backdropBlur: {
        'xs': '2px',
      },
      colors: {
        'star': {
          'yellow': '#fbbf24',
          'purple': '#a855f7',
          'pink': '#ec4899',
          'blue': '#3b82f6',
        }
      },
      letterSpacing: {
        'wider': '0.05em',
        'widest': '0.1em',
      }
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm Dark Palette
        void: {
          DEFAULT: '#0a0a0a',
          deep: '#070707',
        },
        surface: {
          DEFAULT: '#111111',
          elevated: '#161616',
          higher: '#1c1c1c',
        },
        // Accent from favicon
        cream: {
          DEFAULT: '#e8d5c4',
          light: '#f5e6d3',
          dark: '#c9b296',
          muted: '#a89482',
        },
        // Functional
        'text-primary': '#f5f2ed',
        'text-secondary': '#8a8279',
        'text-muted': '#5c554d',
        // States
        success: {
          DEFAULT: '#7fb069',
          dim: 'rgba(127, 176, 105, 0.12)',
        },
        warning: {
          DEFAULT: '#d4a373',
          dim: 'rgba(212, 163, 115, 0.12)',
        },
        error: {
          DEFAULT: '#c76b6b',
          dim: 'rgba(199, 107, 107, 0.12)',
        },
        info: {
          DEFAULT: '#6b8cae',
          dim: 'rgba(107, 140, 174, 0.12)',
        },
        // Borders
        border: {
          subtle: 'rgba(232, 213, 196, 0.06)',
          DEFAULT: 'rgba(232, 213, 196, 0.1)',
          strong: 'rgba(232, 213, 196, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        '2xs': '10px',
      },
      letterSpacing: {
        'widest': '0.15em',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(232, 213, 196, 0.15)',
        'glow-strong': '0 0 60px rgba(232, 213, 196, 0.25)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glyph-pattern': 'radial-gradient(circle, rgba(232, 213, 196, 0.15) 1px, transparent 1px)',
      },
      backgroundSize: {
        'glyph': '24px 24px',
        'glyph-dense': '12px 12px',
      },
    },
  },
  plugins: [],
}

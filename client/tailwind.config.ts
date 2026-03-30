/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ACC8A2',
          50: 'rgba(172, 200, 162, 0.05)',
          100: 'rgba(172, 200, 162, 0.1)',
          200: 'rgba(172, 200, 162, 0.2)',
          300: 'rgba(172, 200, 162, 0.3)',
          400: 'rgba(172, 200, 162, 0.4)',
          500: 'rgba(172, 200, 162, 0.5)',
          600: 'rgba(172, 200, 162, 0.6)',
          700: 'rgba(172, 200, 162, 0.7)',
          800: 'rgba(172, 200, 162, 0.8)',
          900: 'rgba(172, 200, 162, 0.9)',
        },
        bg: {
          DEFAULT: '#1A2517',
          50: 'rgba(26, 37, 23, 0.05)',
          100: 'rgba(26, 37, 23, 0.1)',
          200: 'rgba(26, 37, 23, 0.2)',
          300: 'rgba(26, 37, 23, 0.3)',
          400: 'rgba(26, 37, 23, 0.4)',
          500: 'rgba(26, 37, 23, 0.5)',
          600: 'rgba(26, 37, 23, 0.6)',
          700: 'rgba(26, 37, 23, 0.7)',
          800: 'rgba(26, 37, 23, 0.8)',
          900: 'rgba(26, 37, 23, 0.9)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'tilt': 'tilt 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(172, 200, 162, 0.3)' },
          '50%': { boxShadow: '0 0 60px rgba(172, 200, 162, 0.6)' },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        tilt: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

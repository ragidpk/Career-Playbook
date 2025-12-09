/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E3F2FD',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          500: '#9E9E9E',
          700: '#616161',
          900: '#212121',
        },
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

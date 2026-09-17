/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14213D',
          50: '#EEF1F6',
          100: '#D6DCE8',
          300: '#8D9BB8',
          500: '#4C5A7A',
          700: '#232F4B',
          800: '#182545',
          900: '#0F1830',
        },
        paper: '#F6F7FA',
        surface: '#FFFFFF',
        line: '#E3E6EC',
        accent: {
          DEFAULT: '#0E6E5B',
          50: '#E7F3F0',
          100: '#CDE7DF',
          400: '#1C8A72',
          600: '#0B5D4C',
          700: '#094A3D',
        },
        amber: {
          DEFAULT: '#B9812C',
          50: '#FBF3E6',
          100: '#F3E0BC',
          600: '#95681F',
        },
        rust: {
          DEFAULT: '#B23A2E',
          50: '#FAEBE9',
          100: '#F1C7C2',
          600: '#8F2C22',
        },
        slate: {
          DEFAULT: '#5B6472',
          400: '#7C8595',
          600: '#454D59',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
      boxShadow: {
        none: 'none',
        subtle: '0 1px 2px rgba(15, 24, 48, 0.06)',
      },
    },
  },
  plugins: [],
};

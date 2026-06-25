import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Màu nhận diện DAU/KTD — đỏ #C8102E (theo uiux.ktd.edu.vn).
        brand: {
          50: '#fff1f2',
          100: '#ffe1e3',
          200: '#ffc8cd',
          300: '#ff9aa4',
          400: '#f96174',
          500: '#e4243f',
          600: '#C8102E', // DEFAULT
          700: '#a50f26',
          800: '#880f23',
          900: '#741022',
          DEFAULT: '#C8102E',
          dark: '#9b0c23',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 25px -5px rgba(200,16,46,0.12), 0 8px 10px -6px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #C8102E 0%, #9b0c23 100%)',
      },
    },
  },
  plugins: [],
};

export default config;

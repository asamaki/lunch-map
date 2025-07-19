import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF4F0',
          100: '#FFE8DE',
          200: '#FFD1C2',
          300: '#FFB495',
          400: '#FF8C65',
          500: '#FF6B35', // メインカラー
          600: '#FF4500',
          700: '#E63E00',
          800: '#CC3700',
          900: '#B33000',
        },
        secondary: {
          50: '#FAFAFA',
          100: '#F4F4F4',
          200: '#E4E4E4',
          300: '#D1D1D1',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        accent: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        }
      },
      fontFamily: {
        sans: [
          '"Hiragino Kaku Gothic ProN"',
          '"Hiragino Sans"',
          '"Yu Gothic"',
          '"Meiryo"',
          "sans-serif",
        ],
        heading: [
          '"Hiragino Kaku Gothic ProN"',
          '"Hiragino Sans"',
          '"Yu Gothic"',
          "sans-serif",
        ],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'modal': '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

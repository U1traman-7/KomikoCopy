/** @type {import('tailwindcss').Config} */
import { nextui } from '@nextui-org/theme';
import typography from '@tailwindcss/typography';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        custom: [
          'var(--font-nunito)',
          'Arial',
          'Anime Ace',
          'Wildwords',
          'CCMeanwhile',
          'Digital Strip',
          'Tight Spot',
        ],
      },
      screens: {
        xs: '10px', // super small screen
      },
      maxHeight: {
        999: 'calc(100vh - 0.1rem)',
        998: 'calc(100vh - 4rem)',
      },
      gridTemplateRows: {
        masonry: 'masonry',
      },
      colors: {
        /* ===== 基础语义色：桥接自定义 CSS 变量 ===== */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        /* ===== 品牌主色：调色板指向 NextUI CSS 变量 ===== */
        primary: {
          50: 'hsl(var(--nextui-primary-50))',
          100: 'hsl(var(--nextui-primary-100))',
          200: 'hsl(var(--nextui-primary-200))',
          300: 'hsl(var(--nextui-primary-300))',
          400: 'hsl(var(--nextui-primary-400))',
          500: 'hsl(var(--nextui-primary-500))',
          600: 'hsl(var(--nextui-primary-600))',
          700: 'hsl(var(--nextui-primary-700))',
          800: 'hsl(var(--nextui-primary-800))',
          900: 'hsl(var(--nextui-primary-900))',
          DEFAULT: 'hsl(var(--nextui-primary))',
          foreground: 'hsl(var(--nextui-primary-foreground))',
        },

        /* ===== 品牌辅助色：调色板指向 NextUI CSS 变量 ===== */
        secondary: {
          50: 'hsl(var(--nextui-secondary-50))',
          100: 'hsl(var(--nextui-secondary-100))',
          200: 'hsl(var(--nextui-secondary-200))',
          300: 'hsl(var(--nextui-secondary-300))',
          400: 'hsl(var(--nextui-secondary-400))',
          500: 'hsl(var(--nextui-secondary-500))',
          600: 'hsl(var(--nextui-secondary-600))',
          700: 'hsl(var(--nextui-secondary-700))',
          800: 'hsl(var(--nextui-secondary-800))',
          900: 'hsl(var(--nextui-secondary-900))',
          DEFAULT: 'hsl(var(--nextui-secondary))',
          foreground: 'hsl(var(--nextui-secondary-foreground))',
        },

        /* ===== 状态色 ===== */
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--nextui-success))',
          foreground: 'hsl(var(--nextui-success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--nextui-warning))',
          foreground: 'hsl(var(--nextui-warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },

        /* ===== 次要/弱化 ===== */
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        /* ===== 高亮/选中 ===== */
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        /* ===== 弹出层 ===== */
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        /* ===== 卡片 ===== */
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        /* ===== 标题 (品牌色) ===== */
        heading: {
          DEFAULT: 'hsl(var(--heading))',
          muted: 'hsl(var(--heading-muted))',
        },

        /* ===== 链接 ===== */
        link: {
          DEFAULT: 'hsl(var(--link))',
          hover: 'hsl(var(--link-hover))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        spin: {
          '0%': {
            rotate: '0deg',
          },
          '15%, 35%': {
            rotate: '90deg',
          },
          '65%, 85%': {
            rotate: '270deg',
          },
          '100%': {
            rotate: '360deg',
          },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-50% - var(--gap)/2))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap)))' },
        },
        slide: {
          to: {
            transform: 'translate(calc(100cqw - 100%), 0)',
          },
        },
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '1' },
          '70%': { opacity: '1' },
          '100%': {
            transform: 'rotate(215deg) translateX(-500px)',
            opacity: '0',
          },
        },
        scroll: {
          to: {
            transform: 'translate(calc(-50% - 0.5rem))',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        spinLinear: 'spin calc(var(--speed) * 2) infinite linear',
        slide: 'slide var(--speed) ease-in-out infinite alternate',
        marquee: 'marquee var(--duration) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
        'meteor-effect': 'meteor 5s linear infinite',
        scroll:
          'scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite',
      },
    },
  },
  darkMode: 'class',
  plugins: [
    typography,
    nextui({
      themes: {
        caffelabs: {
          extend: 'light', // <- inherit default values from light theme
          colors: {
            foreground: '#0D001A',
            background: '#ffffff',
            primary: {
              50: '#f4f1fe',
              100: '#DFD7FE',
              200: '#BFB0FE',
              300: '#9D88FD',
              400: '#826AFB',
              500: '#563AFA',
              600: '#402AD7',
              700: '#2E1DB3',
              800: '#1F1290',
              900: '#140B77',
              DEFAULT: '#563AFA',
            },
            secondary: {
              50: '#e4f1f5',
              100: '#CCF5FF',
              200: '#99E5FF',
              300: '#66D0FF',
              400: '#3FB9FF',
              500: '#0094FF',
              600: '#0072DB',
              700: '#0055B7',
              800: '#003C93',
              900: '#002B7A',
              DEFAULT: '#1195f2',
            },
            focus: '#402AD7',
          },
        },
        // Dark mode 变体：避免纯黑，使用深灰蓝色调
        'caffelabs-dark': {
          extend: 'dark',
          colors: {
            foreground: '#ECEDEE',
            background: '#111827',
            primary: {
              50: '#140B77',
              100: '#1F1290',
              200: '#2E1DB3',
              300: '#402AD7',
              400: '#826AFB',
              500: '#563AFA',
              600: '#9D88FD',
              700: '#BFB0FE',
              800: '#DFD7FE',
              900: '#f4f1fe',
              DEFAULT: '#826AFB',
            },
            secondary: {
              50: '#002B7A',
              100: '#003C93',
              200: '#0055B7',
              300: '#0072DB',
              400: '#0094FF',
              500: '#1195f2',
              600: '#3FB9FF',
              700: '#66D0FF',
              800: '#99E5FF',
              900: '#CCF5FF',
              DEFAULT: '#3FB9FF',
            },
            focus: '#826AFB',
            content1: '#1f2937',
            content2: '#374151',
            content3: '#4b5563',
            content4: '#6b7280',
          },
        },
      },
    }),
  ],
};

// tailwind.config.ts
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme'; // Make sure this is imported if used for font fallbacks

const designTokens = {
  colors: {
    indigo: {
      50: '#EEECF9',
      700: '#5F3A94',
      800: '#452A7D',
    },
    gray: {
      50: '#F9FAFB',
      700: '#4A4A4A',
      900: '#1A1A1A',
    },
    'card-background': '#F0EFFF',
    'primary-button': '#4D47C3',
  },
  fontSizes: {
    title: '50px',
    titleMobile: '26px',
    subtitle: '35px',
    subtitleMobile: '21px',
    body: '16px',
    bodyMobile: '14px',
    button: '16px',
    buttonMobile: '16px',
    balance: '36px',
    balanceMobile: '36px',
    balanceTitle: '30px',
  },
  lineHeights: {
    'tight': '1',
  },
  spacing: {
    'image-height': '556px',
    'image-width': '313px',
    'card-max-width': '369px',
    'card-max-height': '196px',
    'button-height': '59px',
    'body-left-padding': '80px',
    'body-top-padding': '80px',
    'w-button': '369px',
    'h-button': '60px',
  },
};

const config: Config = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
  ],
  theme: {
    extend: {
      colors: {
        ...designTokens.colors,
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        ...designTokens.fontSizes,
      },
      lineHeight: {
        ...designTokens.lineHeights,
      },
      spacing: {
        ...designTokens.spacing,
      },
      fontWeight: {
        '400': '400',
        '500': '500',
        '600': '600',
      }
    },
  },
  plugins: [],
};

export default config;
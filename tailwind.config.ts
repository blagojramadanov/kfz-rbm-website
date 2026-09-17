import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        kfz: {
          blue: '#1a3a6b',
          'blue-dark': '#0f2847',
          'blue-light': '#2a5aa0',
          accent: '#3498db',
          'accent-light': '#5dade2',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

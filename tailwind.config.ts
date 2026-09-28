import type { Config } from "tailwindcss"

/** A color backed by a CSS variable from app/globals.css; supports opacity modifiers (bg-primary/90). */
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`

/** Solid + subtle variants of a semantic tone (success, warning, ...). */
const tone = (name: string) => ({
  DEFAULT: token(name),
  foreground: token(`${name}-foreground`),
  hover: token(`${name}-hover`),
  subtle: token(`${name}-subtle`),
  "subtle-foreground": token(`${name}-subtle-foreground`),
  border: token(`${name}-border`),
})

const config = {
  darkMode: ["class"],
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
          hover: token("primary-hover"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        inverse: {
          DEFAULT: token("inverse"),
          foreground: token("inverse-foreground"),
        },
        destructive: tone("destructive"),
        success: tone("success"),
        warning: tone("warning"),
        info: tone("info"),
        highlight: tone("highlight"),
        featured: token("featured"),
        // Brand palette (gradients, accent CTAs); backed by the same tokens.
        kfz: {
          blue: token("primary"),
          'blue-dark': token("primary-hover"),
          'blue-light': token("brand-light"),
          accent: token("brand-accent"),
          'accent-hover': token("brand-accent-hover"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      screens: {
        // Devices with a real hover (mouse); use for hover-only UI with a touch fallback.
        "can-hover": { raw: "(hover: hover)" },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

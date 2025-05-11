import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
    },
      boxShadow: {
        'text-shadow': '2px 2px 4px rgba(255, 255, 255, 0.5)',
      },
      colors: {
        background: "rgba(var(--background))",
        foreground: "rgba(var(--foreground))",
        "background-secondary": "rgba(var(--background-secondary))",
        "foreground-secondary": "rgba(var(--foreground-secondary))",
        warning: "rgba(var(--warning))",
        success: "rgba(var(--success))",
        danger: "rgba(var(--danger))",
        info: "rgba(var(--info))",
        text: "rgba(var(--text))",
        border: "rgba(var(--border))",
        contrast: "rgba(var(--contrast))",
        "icon-border": "rgba(var(--icon-border))",
        soil: "rgba(var(--soil))",
        "slate-800" : "rgba(var(--slate-800))",
        indigo: "rgba(var(--indigo))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;

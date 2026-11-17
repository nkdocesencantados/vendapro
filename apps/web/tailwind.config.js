/** @type {import("tailwindcss").Config} */
// Fonte de verdade: variáveis CSS em src/app/globals.css. Aqui só as expomos ao Tailwind.
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          50:  "#E7F7EC",
          100: "#B6F5CF",
          300: "#7EE8A8",
          400: "#2DBE60",
          500: "#2DBE60",
          600: "#1F8A47",
          900: "#0B3A1F",
          neon: "var(--brand-neon)",
          deep: "var(--brand-deep)",
        },
        bg: "var(--bg)",
        surface: { DEFAULT: "var(--surface)", 2: "var(--surface-2)", 3: "var(--surface-3)" },
        line: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },
        ink: { DEFAULT: "var(--text)", muted: "var(--text-muted)", subtle: "var(--text-subtle)" },
      },
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      borderRadius: { card: "16px" },
    },
  },
  plugins: [],
};

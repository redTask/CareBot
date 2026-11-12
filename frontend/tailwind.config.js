/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#2F6BFF",
        "brand-hover": "#1F55D6",
        "brand-tint": "#EAF0FF",
        ink: "#0F172A",
        body: "#475569",
        muted: "#94A3B8",
        base: "#F1F4F9",
        line: "#E6EBF2",
        // Status colours: always colour + tint + text, never colour alone.
        normal: { light: "#E8F7EE", dark: "#16A34A" },
        watch: { light: "#FEF3C7", dark: "#D97706" },
        critical: { light: "#FDE8E8", dark: "#DC2626" },
        danger: "#B91C1C",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
        malayalam: ["Noto Sans Malayalam", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        pulse: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.55" } },
        ring: {
          "0%": { boxShadow: "0 0 0 0 rgba(220, 38, 38, 0.45)" },
          "70%": { boxShadow: "0 0 0 10px rgba(220, 38, 38, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(220, 38, 38, 0)" },
        },
        fade: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulse: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ring: "ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        fade: "fade 300ms ease-out",
      },
    },
  },
  plugins: [],
}

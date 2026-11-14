/** @type {import('tailwindcss').Config} */

// CareBot palette. Four colours plus white — nothing else.
//   navy #254262  teal #149DA5  mint #51E4BA  lime #8CF1A3  white #FFFFFF
// The single allowed exception is `alert` (#D93025), reserved for the critical
// alert banner, the E-STOP button and critical vitals out of range.
const navy = "#254262"
const teal = "#149DA5"
const mint = "#51E4BA"
const lime = "#8CF1A3"

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy,
        teal,
        mint,
        lime,
        alert: "#D93025",

        // Semantic aliases so the four colours are never duplicated.
        brand: teal,
        "brand-hover": navy,
        "brand-tint": "rgba(81, 228, 186, 0.18)", // mint tint
        ink: navy,
        body: "rgba(37, 66, 98, 0.75)",
        muted: "rgba(37, 66, 98, 0.6)",
        base: "#FFFFFF",
        line: "rgba(20, 157, 165, 0.25)",

        // Status tokens always resolve to a tint + readable navy text.
        // Filled spec badges (teal / navy) are applied explicitly in the
        // status components, where the 16px-bold white-text rule applies.
        normal: { light: lime, dark: navy },
        watch: { light: "rgba(20, 157, 165, 0.12)", dark: navy },
        critical: { light: "rgba(37, 66, 98, 0.08)", dark: navy },
        danger: navy,
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
        malayalam: ["Noto Sans Malayalam", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(37, 66, 98, 0.06), 0 10px 26px -12px rgba(37, 66, 98, 0.28)",
        "card-hover":
          "0 2px 4px rgba(37, 66, 98, 0.08), 0 18px 36px -14px rgba(37, 66, 98, 0.34)",
      },
      keyframes: {
        pulse: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.55" } },
        ring: {
          "0%": { boxShadow: "0 0 0 0 rgba(217, 48, 37, 0.45)" },
          "70%": { boxShadow: "0 0 0 10px rgba(217, 48, 37, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(217, 48, 37, 0)" },
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

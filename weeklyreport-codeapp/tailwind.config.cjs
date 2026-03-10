/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "var(--audico-accent)",
          hover: "var(--audico-accent-hover)",
          active: "var(--audico-accent-active)",
          subtle: "var(--audico-accent-subtle)",
        },
        audico: {
          black: "#282828",
          "dark-grey": "#3d3d3d",
          "light-grey": "#f2f2f2",
          "mid-grey-1": "#797979",
          "mid-grey-2": "#a1a1a1",
          "mid-grey-3": "#dbdbdb",
        },
        status: {
          success: "#188c5b",
          warning: "#d4820c",
          error: "#c4314b",
          info: "#1d5eaa",
        },
      },
      fontFamily: {
        sans: ["Arial", "sans-serif"],
        mono: ["Cascadia Code", "Consolas", "monospace"],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["12px", { lineHeight: "16px" }],
        base: ["14px", { lineHeight: "20px" }],
        md: ["16px", { lineHeight: "22px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["28px", { lineHeight: "36px" }],
      },
      spacing: {
        0.5: "2px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "4px",
        md: "8px",
        lg: "12px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(40,40,40,0.06)",
        md: "0 2px 8px rgba(40,40,40,0.08)",
        lg: "0 4px 16px rgba(40,40,40,0.12)",
        focus: "0 0 0 2px var(--audico-accent)",
      },
      maxWidth: {
        content: "1100px",
        form: "640px",
      },
      transitionDuration: {
        fast: "100ms",
        normal: "200ms",
      },
    },
  },
  plugins: [],
};

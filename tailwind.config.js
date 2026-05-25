const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Segoe UI'", "'SegoeUI'", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["'Segoe UI Semibold'", "'Segoe UI'", "system-ui", "sans-serif"],
      },
      colors: {
        fluent: {
          primary: "#0F6CBD",
          primaryHover: "#115EA3",
          primaryPressed: "#0F548C",
          surface: "#FAFAFA",
          card: "#FFFFFF",
          border: "#E1E1E1",
          text: "#242424",
          textSecondary: "#616161",
        },
      },
      boxShadow: {
        fluent: "0 2px 4px rgba(0,0,0,0.04), 0 0 2px rgba(0,0,0,0.06)",
        fluentMd: "0 4px 8px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.08)",
        fluentLg: "0 8px 16px rgba(0,0,0,0.08), 0 0 2px rgba(0,0,0,0.10)",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#0F6CBD",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#0099BC",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#107C10",
            },
            warning: {
              DEFAULT: "#F7630C",
            },
            danger: {
              DEFAULT: "#C50F1F",
            },
          },
        },
      },
    }),
  ],
};

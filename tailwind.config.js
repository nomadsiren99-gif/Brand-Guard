/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        adobe: {
          bg: "#262626",
          panel: "#323232",
          border: "#444444",
          text: "#E0E0E0",
          muted: "#9E9E9E",
          accent: "#1473E6",
          accentHover: "#0D66D0",
          error: "#D31225",
          warning: "#E68619",
          success: "#12805C",
        }
      }
    },
  },
  plugins: [],
}

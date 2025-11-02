/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        epilogue: ["Epilogue", "sans-serif"],
      },
      colors: {
        primary: {
          light: "#fff5f5", // fourth-color - light pinkish white
          dark: "#000000", // first-color - pure black
        },
        secondary: {
          light: "#f0f5e6", // lighter variant of third-color
          dark: "#0a3942", // darker variant of second-color
        },
        text: {
          light: "#1a1a1a",
          dark: "#ffffff",
        },
        accent: {
          primary: "#1a8b9d", // second-color - teal
          secondary: "#b2d430", // third-color - lime green
          hover: {
            primary: "#157a8a", // darker teal for hover
            secondary: "#9fb82a", // darker lime for hover
          },
        },
        teal: "#1a8b9d", // second-color
        lime: "#b2d430", // third-color
        lightBg: "#fff5f5", // fourth-color
        darkBg: "#000000", // first-color
      },
      boxShadow: {
        secondary: "10px 10px 20px rgba(2, 2, 2, 0.25)",
        "secondary-dark": "10px 10px 20px rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
};

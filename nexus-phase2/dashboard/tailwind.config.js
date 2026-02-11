/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom Nexus colors
        nexus: {
          dark: '#0f172a',
          darker: '#020617',
          card: '#1e293b',
          border: '#334155',
        }
      },
      screens: {
        'xs': '320px',
      },
    },
  },
  plugins: [],
}

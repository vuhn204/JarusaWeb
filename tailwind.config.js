/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        jar: Object.fromEntries([50,100,200,300,400,500,600,700,800,900].map((n) => [n, `rgb(var(--jar-${n}) / <alpha-value>)`])),
        paper: '#EFEDEE',
        side: '#F2F0F1',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        logo: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: { card: '0 2px 14px rgba(120,20,70,.08)', pop: '0 18px 50px rgba(120,20,70,.25)' },
      backgroundImage: { brand: 'linear-gradient(90deg,rgb(var(--b1)) 0%,rgb(var(--b2)) 100%)' },
    },
  },
  plugins: [],
}

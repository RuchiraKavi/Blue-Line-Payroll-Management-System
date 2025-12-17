/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeInSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInSlideLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-slide-up': 'fadeInSlideUp 0.8s ease-out forwards',
        'fade-in-slide-left': 'fadeInSlideLeft 0.8s ease-out forwards',
        'fade-in-slide-left-1': 'fadeInSlideLeft 0.8s ease-out 0.2s forwards',
        'fade-in-slide-left-2': 'fadeInSlideLeft 0.8s ease-out 0.4s forwards',
        'fade-in-slide-left-3': 'fadeInSlideLeft 0.8s ease-out 0.6s forwards',
        'fade-in-slide-left-4': 'fadeInSlideLeft 0.8s ease-out 0.8s forwards',
      },
    },
  },
  plugins: [],
};

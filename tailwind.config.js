/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*{html,js}', './static/*html'],
  theme: {
    extend: {
      colors: {
        'the-blue': '#1A80B9',
        'the-gray': '#313131',
      },
    },
  },
  // ...
};

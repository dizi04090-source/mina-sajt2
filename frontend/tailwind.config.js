module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { mina: { DEFAULT: '#42326E', 2: '#6E5B9A' }, lav: { DEFAULT: '#E0D4FC', 2: '#D7C8ED' }, paper: '#FAF8FF' },
    fontFamily: { serif: ['Playfair Display', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] },
    boxShadow: { soft: '0 8px 26px rgba(66,50,110,.12)' } } },
};

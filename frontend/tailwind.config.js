module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { mina: { DEFAULT: '#5E3B76', 2: '#6B4E91' }, lav: { DEFAULT: '#F3EFFF', 2: '#EAE5F3' }, paper: '#FAF8FC' },
    fontFamily: { serif: ['Cormorant Garamond', 'serif'], sans: ['Nunito Sans', 'system-ui', 'sans-serif'] },
    boxShadow: { soft: '0 4px 20px rgba(94,59,118,.08)' } } },
};

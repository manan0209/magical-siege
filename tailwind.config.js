export default {
  content: ['./popup/**/*.html', './content/**/*.js'],
  theme: {
    extend: {
      colors: {
        'castle-brown': '#402b20',
        'parchment': '#F5E7B7',
        'purple-primary': '#8B5CF6',
        'purple-dark': '#7C3AED',
      },
      fontFamily: {
        'medieval-header': ['"Jaini"', '"IM Fell English"', 'serif'],
        'medieval-body': ['"IM Fell English"', 'serif'],
      },
    },
  },
  plugins: [],
}

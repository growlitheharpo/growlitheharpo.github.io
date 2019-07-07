module.exports = {
  prefix: '',
  important: false,
  separator: ':',
  theme: {
    screens: {
      sm: '550px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        orange: {
          100: '#fffaf0',
          200: '#feebc8',
          300: '#fbd38d',
          400: '#fd7f34',
          500: '#ed8936',
          600: '#df7046',
          700: '#f15d2a',
          800: '#9c4221',
          900: '#7b341e',
        },
      },
      listStyleType: {
        circle: 'circle',
      },
    },
    fontFamily: {
      sans: [ '"Roboto Condensed"', '"Trebuchet MS"', 'Arial', 'Helvetica', 'sans-serif'],
      serif: [
        '"Crimson Text"',
        'Georgia',
        'Cambria',
        '"Times New Roman"',
        'Times',
        'serif',
      ],
      mono: [
        'Menlo',
        'Monaco',
        'Consolas',
        '"Liberation Mono"',
        '"Courier New"',
        'monospace',
      ],
      head: [ '"Roboto Condensed"', '"Trebuchet MS"', 'Arial', 'Helvetica', 'sans-serif'],
      headlite: [ '"Roboto"', '"Trebuchet MS"', 'Arial', 'Helvetica', 'sans-serif' ],
      body: [ '"Crimson Text"']
    },
    height: theme => ({
      auto: 'auto',
      ...theme('spacing'),
      full: '100%',
      screen: '100vh',
      sm: '10rem',
      md: '12rem',
      lg: '14rem',
      xl: '16rem',
      '2xl': '20rem',
      '3xl': '24rem',
      '4xl': '28rem',
      '5xl': '32rem',
      '6xl': '40rem',
      '7xl': '60rem',
      '8xl': '72rem',
    }),
    maxHeight: theme => ({
      full: '100%',
      screen: '100vh',
      ...theme('height'),
    }),
    maxWidth: {
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
      '6xl': '72rem',
      full: '100%',
      1: '1rem',
      2: '2rem',
      3: '3rem',
      4: '4rem',
    },
  },
  corePlugins: {},
  plugins: [],
}

export const Typography = {
  // Font family (system fonts - Expo safe)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 2,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },

  h1: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 24, fontWeight: '700' },
  h4: { fontSize: 20, fontWeight: '600' },
  h5: { fontSize: 18, fontWeight: '600' },
  h6: { fontSize: 16, fontWeight: '600' },
  body1: { fontSize: 16, fontWeight: '400' },
  body2: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  overline: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  button: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  buttonSm: { fontSize: 14, fontWeight: '600' },
};

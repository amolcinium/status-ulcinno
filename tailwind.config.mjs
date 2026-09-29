/** @type {import('tailwindcss').Config} */
// Boje dolaze iz UI standarda v1 (public/ui-v1.css). Tailwind palete su samo imena za tokene,
// pa ista oznaka radi u svijetloj i tamnoj temi. Opacity modifikator (bg-x/20) ide kroz color-mix.
const tok = (v) => ({ opacityValue }) =>
  opacityValue === undefined || opacityValue === '1'
    ? `var(${v})`
    : `color-mix(in srgb, var(${v}) calc(${opacityValue} * 100%), transparent)`;
const mix = (v, pct, base = 'transparent') => () => `color-mix(in srgb, var(${v}) ${pct}%, ${base})`;
// status boja: 300–500 puna, 600–800 za ivice, 900–950 meka pozadina
const status = (v) => ({
  300: tok(v), 400: tok(v), 500: tok(v), 600: tok(v),
  700: mix(v, 45), 800: mix(v, 35),
  900: mix(v, 22), 950: tok(`${v}-soft`),
});

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: { base: tok('--bg'), card: tok('--surface'), border: tok('--border') },
        accent: { green: tok('--ok'), yellow: tok('--warn'), red: tok('--err'), blue: tok('--info') },
        gray: {
          100: tok('--text'), 200: tok('--text'), 300: tok('--text'),
          400: tok('--text-muted'), 500: tok('--text-muted'),
          600: mix('--text-muted', 80, 'var(--bg)'), 700: mix('--text-muted', 55, 'var(--bg)'),
          800: tok('--border'), 900: tok('--surface-2'), 950: tok('--surface'),
        },
        white: tok('--text'),
        red: status('--err'), green: status('--ok'), yellow: status('--warn'), blue: status('--info'),
      },
      borderColor: { DEFAULT: 'var(--border)' },
      ringColor: { DEFAULT: 'var(--accent)' },
      ringOffsetColor: { DEFAULT: 'var(--bg)' },
      fontFamily: { sans: ['var(--font)'], mono: ['var(--mono)'] },
    },
  },
  future: { respectDefaultRingColorOpacity: true },
  plugins: [],
};

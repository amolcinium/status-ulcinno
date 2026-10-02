// Tailwind 3 kroz PostCSS: @astrojs/tailwind ne podržava Astro 6+ (peer astro ≤5).
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

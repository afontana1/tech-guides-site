import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://afontana1.github.io',
  base: '/tech-guides-site',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { format: 'directory' },
});

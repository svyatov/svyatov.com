import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://svyatov.com',
  trailingSlash: 'always',
  compressHTML: true,
  vite: { plugins: [tailwindcss()] },
  integrations: [sitemap()],
  prefetch: { prefetchAll: true },
  markdown: { shikiConfig: { theme: 'vitesse-dark' } },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex',
      weights: [400, 500, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'cyrillic'],
      fallbacks: ['ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
    },
  ],
  env: {
    schema: {
      GITHUB_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});

import { readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://svyatov.com',
  trailingSlash: 'always',
  compressHTML: true,
  image: { layout: 'constrained' },
  vite: { plugins: [tailwindcss()] },
  integrations: [
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname;
        if (!/^\/blog\/[^/]+\/$/.test(path)) return item;
        const html = readFileSync(new URL(`./dist${path}index.html`, import.meta.url), 'utf8');
        const date =
          html.match(/property="article:modified_time" content="([^"]+)"/)?.[1] ??
          html.match(/property="article:published_time" content="([^"]+)"/)?.[1];
        return date ? { ...item, lastmod: date } : item;
      },
    }),
  ],
  prefetch: { prefetchAll: true },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      transformers: [
        {
          tokens(lines) {
            for (const line of lines) {
              for (const token of line) {
                // GitHub's muted comments are only 3.77:1 on the terminal surface.
                if (token.color?.toLowerCase() === '#6a737d') token.color = '#8f8d84';
              }
            }
          },
        },
      ],
    },
  },
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

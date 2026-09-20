import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function htmlRoutes(directory = 'dist'): string[] {
  return readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.html'))
    .filter(
      (file) => !/name="robots"[^>]*noindex/.test(readFileSync(join(directory, file), 'utf8')),
    )
    .map((file) => `/${file.replace(/index\.html$/, '')}`)
    .sort();
}

// One route per page type. A route matching no pattern is a new page type: add a pattern.
const pageTypes = [
  /^\/$/,
  /^\/projects\/$/,
  /^\/cv\/$/,
  /^\/blog\/$/,
  /^\/blog\/\d+\/$/,
  /^\/blog\/tag\/[^/]+\/$/,
  /^\/blog\/year\/\d+\/$/,
  /^\/blog\/(?!\d+\/)[^/]+\/$/,
];

export function sampleRoutes(directory = 'dist'): string[] {
  const routes = htmlRoutes(directory);
  const unknown = routes.filter((route) => !pageTypes.some((type) => type.test(route)));
  if (unknown.length) throw new Error(`Routes without a page type: ${unknown.join(', ')}`);
  return pageTypes.flatMap((type) => routes.find((route) => type.test(route)) ?? []);
}

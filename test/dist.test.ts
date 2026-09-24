import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { isLegacy } from '../src/lib/posts';

const dist = join(import.meta.dirname, '../dist');
const read = (file: string) => readFileSync(join(dist, file), 'utf8');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

let pages: { path: string; html: string }[] = [];
let posts: string[] = [];

beforeAll(() => {
  if (!existsSync(dist)) throw new Error('dist/ is missing: run astro build first');
  pages = walk(dist)
    .filter((f) => f.endsWith('.html'))
    .map((f) => ({ path: relative(dist, f), html: readFileSync(f, 'utf8') }));
  posts = readdirSync(join(dist, 'blog')).filter(
    (name) => !['index.html', 'tag', 'year'].includes(name) && !/^\d+$|\.md$/.test(name),
  );
});

const jsonLd = (html: string) =>
  JSON.parse(
    html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? 'null',
  );

const resolves = (href: string) => {
  const path = href.replace(/[#?].*$/, '');
  return path.endsWith('/')
    ? existsSync(join(dist, path, 'index.html'))
    : existsSync(join(dist, path));
};

describe('pages', () => {
  test('every internal href ends with a slash or an extension and resolves', () => {
    const broken: string[] = [];
    for (const { path, html } of pages) {
      for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
        if (!href) continue;
        const ok =
          (href.endsWith('/') || /\.[a-z0-9]+$/.test(href.replace(/[#?].*$/, ''))) &&
          resolves(href);
        if (!ok) broken.push(`${path}: ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test('exactly one canonical and one h1 per page', () => {
    for (const { path, html } of pages) {
      expect(html.match(/rel="canonical"/g) ?? [], path).toHaveLength(path === '404.html' ? 0 : 1);
      expect(html.match(/<h1[\s>]/g), path).toHaveLength(1);
    }
  });

  test('json-ld: WebSite on home, BlogPosting on posts', () => {
    expect(
      jsonLd(read('index.html'))['@graph'].some(
        (node: { '@type': string }) => node['@type'] === 'WebSite',
      ),
    ).toBe(true);
    for (const id of posts) {
      const html = read(`blog/${id}/index.html`);
      const data = jsonLd(html);
      expect(data['@type'], id).toBe('BlogPosting');
      expect(data.url, id).toBe(`https://svyatov.com/blog/${id}/`);
      expect(data.mainEntityOfPage).toBe(data.url);
      expect(data.author.name).toBe('Leonid Svyatov');
      expect(data.author['@id']).toBe('https://svyatov.com/#person');
      expect(html).toContain(`datetime="${data.datePublished}"`);
      expect(new Date(data.dateModified).getTime()).toBeGreaterThanOrEqual(
        new Date(data.datePublished).getTime(),
      );
      expect(data.headline).toBeTruthy();
      expect(data.description).not.toMatch(/(?:\.\.\.|:)$/);
    }
  });

  test('canonical URLs agree with the sitemap and error metadata is excluded', () => {
    const sitemap = read('sitemap-0.xml');
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const canonicals = pages
      .filter(({ path }) => path !== '404.html')
      .map(({ path, html }) => {
        const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
        expect(canonical, path).toBe(`https://svyatov.com/${path.replace(/index\.html$/, '')}`);
        expect(html).toContain(`property="og:url" content="${canonical}"`);
        expect(html).toMatch(/property="og:image:alt" content="[^"]+"/);
        expect(html).toMatch(/name="twitter:image:alt" content="[^"]+"/);
        expect(html.match(/rel="preload"[^>]*as="font"/g), path).toHaveLength(1);
        return canonical;
      });
    expect(locations.sort()).toEqual(canonicals.sort());
    expect(read('404.html')).toContain('name="robots" content="noindex,follow"');
    for (const id of posts) {
      const { dateModified } = jsonLd(read(`blog/${id}/index.html`));
      const entry = sitemap.match(
        new RegExp(`<url><loc>https://svyatov.com/blog/${id}/</loc>([\\s\\S]*?)</url>`),
      )?.[1];
      expect(entry, id).toContain(`<lastmod>${dateModified}</lastmod>`);
    }
  });
});

describe('feeds and text endpoints', () => {
  // A post id that collides with a sub-route (tag, year, a page number) drops out of `posts`
  // but stays in the feeds, so the counts disagree.
  test('rss, atom and json carry every post', () => {
    const n = posts.length;
    expect(n).toBeGreaterThan(0);
    expect(read('rss.xml').match(/<item>/g)).toHaveLength(n);
    expect(read('atom.xml').match(/<entry>/g)).toHaveLength(n);
    expect(JSON.parse(read('feed.json')).items).toHaveLength(n);
    expect(
      read('llms.txt').match(/^- \[.*\]\(https:\/\/svyatov\.com\/blog\/[^)/]+\/\)/gm),
    ).toHaveLength(n);
  });

  test('sitemap, robots, llms and CNAME exist', () => {
    for (const f of [
      'sitemap-index.xml',
      'sitemap-0.xml',
      'robots.txt',
      'llms.txt',
      'llms-full.txt',
      'CNAME',
    ]) {
      expect(existsSync(join(dist, f)), f).toBe(true);
    }
    expect(read('sitemap-0.xml')).toContain('https://svyatov.com/blog/');
  });

  test('every post and the home page have a linked Markdown copy', () => {
    expect(read('robots.txt')).toContain('Content-Signal: search=yes, ai-input=yes, ai-train=yes');
    for (const [page, markdown] of [
      ['index.html', '/index.md'],
      ...posts.map((id) => [`blog/${id}/index.html`, `/blog/${id}.md`]),
    ]) {
      const html = read(page);
      expect(html, page).toContain(`rel="alternate" type="text/markdown" href="${markdown}"`);
      expect(html, page).toContain(`available at https://svyatov.com${markdown}`);
      expect(read(markdown), markdown).toMatch(/^# /);
    }
  });

  test('og images exist for the default card and every post', () => {
    expect(existsSync(join(dist, 'og/default.png'))).toBe(true);
    for (const id of posts) expect(existsSync(join(dist, `og/${id}.png`)), id).toBe(true);
  });

  test('feed bodies are complete and all exported local images resolve', () => {
    const feed = JSON.parse(read('feed.json'));
    const markdown = read('llms-full.txt');
    expect(markdown.match(/^- URL: https:\/\/svyatov.com\/blog\//gm)).toHaveLength(posts.length);
    for (const file of ['feed.json', 'rss.xml', 'atom.xml'])
      expect(read(file)).not.toContain('__ASTRO_IMAGE_');
    for (const item of feed.items) {
      expect(item.id).toBe(item.url);
      expect(item.content_html.length).toBeGreaterThan(100);
      expect(item.content_html).not.toContain('data-image-component');
      for (const [, source] of item.content_html.matchAll(
        /<(?:img|a)\b[^>]*(?:src|href)="([^"]+)"/g,
      )) {
        expect(source).toMatch(/^[a-z][a-z0-9+.-]*:/i);
        const url = new URL(source);
        if (url.origin === 'https://svyatov.com') expect(resolves(url.pathname), source).toBe(true);
      }
    }
    const images = [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)];
    expect(images.length).toBeGreaterThan(0);
    for (const [, source] of images) {
      const url = new URL(source);
      expect(url.origin).toBe('https://svyatov.com');
      expect(resolves(url.pathname), source).toBe(true);
    }
  });
});

describe('hire path', () => {
  test('the work page offers consulting first, then roles, each with a tagged mailto', () => {
    const subjects = [
      ...read('work/index.html').matchAll(/href="mailto:[^"?]+\?subject=([^"]+)"/g),
    ].map((m) => decodeURIComponent(m[1]));
    expect(subjects).toEqual(['[consulting]', '[role]']);
  });

  test('posts older than three years point readers at current work, newer ones do not', () => {
    for (const id of posts) {
      const html = read(`blog/${id}/index.html`);
      const note = html.match(/<p data-legacy-note[^>]*>([\s\S]*?)<\/p>/)?.[1];
      if (isLegacy(new Date(jsonLd(html).datePublished)))
        expect(note, id).toContain('href="/work/"');
      else expect(note, id).toBeUndefined();
    }
  });
});

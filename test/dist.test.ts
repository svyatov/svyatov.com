import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';

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
    (name) => !['index.html', 'tag', 'year'].includes(name) && !/^\d+$/.test(name),
  );
});

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
      expect(html.match(/rel="canonical"/g), path).toHaveLength(1);
      expect(html.match(/<h1[\s>]/g), path).toHaveLength(1);
    }
  });

  test('no post id collides with the blog sub-routes', () => {
    expect(posts.length).toBeGreaterThan(0);
    for (const id of posts) expect(id).not.toMatch(/^\d+$|^tag$|^year$/);
  });

  test('json-ld: WebSite on home, BlogPosting on posts', () => {
    expect(read('index.html')).toContain('"@type":"WebSite"');
    for (const id of posts)
      expect(read(`blog/${id}/index.html`), id).toContain('"@type":"BlogPosting"');
  });
});

describe('feeds and text endpoints', () => {
  test('rss, atom and json carry every post', () => {
    const n = posts.length;
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

  test('og images exist for the default card and every post', () => {
    expect(existsSync(join(dist, 'og/default.png'))).toBe(true);
    for (const id of posts) expect(existsSync(join(dist, `og/${id}.png`)), id).toBe(true);
  });
});

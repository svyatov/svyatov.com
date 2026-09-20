import { describe, expect, test } from 'vitest';
import { absoluteHtml, escapeXml, feedItems, feedUpdated } from './feeds';
import type { Post } from './posts';

const post = (id: string, date: string, extra: Partial<Post['data']> = {}) =>
  ({
    id,
    body: 'body',
    rendered: { html: `<p>${id}</p>` },
    data: { title: id, description: `about ${id}`, date: new Date(date), tags: ['t'], ...extra },
  }) as unknown as Post;

describe('escapeXml', () => {
  test('escapes the five XML specials', () => {
    expect(escapeXml(`<a href="x">it's & done</a>`)).toBe(
      '&#60;a href=&#34;x&#34;&#62;it&#39;s &#38; done&#60;/a&#62;',
    );
  });
});

describe('feedItems', async () => {
  const items = await feedItems(
    [post('old', '2019-01-01'), post('new', '2026-01-01', { updated: new Date('2026-02-01') })],
    async (post) => post.rendered?.html ?? '',
  );

  test('sorts newest first with absolute urls and rendered html', () => {
    expect(items.map((i) => i.id)).toEqual(['new', 'old']);
    expect(items[0]?.url).toBe('https://svyatov.com/blog/new/');
    expect(items[0]?.html).toBe('<p>new</p>');
  });

  test('falls back to the publish date when there is no update', () => {
    expect(items[0]?.updated.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(items[1]?.updated.toISOString()).toBe('2019-01-01T00:00:00.000Z');
  });

  test('feedUpdated is the latest update', () => {
    expect(feedUpdated(items).toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });
});

test('feed URLs resolve against the article without changing code examples', () => {
  expect(
    absoluteHtml(
      '<a href="../">up</a><img src="/_astro/a.webp" srcset="/_astro/a.webp 400w, /_astro/b.webp 800w"><code>&lt;img src="./x"&gt;</code>',
      'https://svyatov.com/blog/post/',
    ),
  ).toBe(
    '<a href="https://svyatov.com/blog/">up</a><img src="https://svyatov.com/_astro/a.webp" srcset="https://svyatov.com/_astro/a.webp 400w, https://svyatov.com/_astro/b.webp 800w"><code>&lt;img src="./x"&gt;</code>',
  );
});

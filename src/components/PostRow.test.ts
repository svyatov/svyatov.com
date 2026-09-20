import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import type { Post } from '../lib/posts';
import PostRow from './PostRow.astro';

const post = {
  id: 'hello-world',
  body: Array(450).fill('w').join(' '),
  data: {
    title: 'Hello world',
    description: 'A summary.',
    date: new Date('2026-03-04T12:00:00Z'),
    tags: ['rails', 'ruby'],
  },
} as unknown as Post;

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('PostRow', () => {
  test('compact row shows date, title, summary and the read arrow', async () => {
    const html = await container.renderToString(PostRow, { props: { post, compact: true } });
    expect(html).toContain('href="/blog/hello-world/"');
    expect(html).toContain('data-item');
    expect(html).toContain('2026-03-04');
    expect(html).toContain('Hello world');
    expect(html).toContain('A summary.');
    expect(html).toContain('read →');
    expect(html).not.toContain('min read');
  });

  test('full row shows reading time and tags', async () => {
    const html = await container.renderToString(PostRow, { props: { post } });
    expect(html).toContain('data-item');
    expect(html).toContain('2 min read');
    expect(html).toContain('# rails · ruby');
    expect(html).not.toContain('read →');
  });
});

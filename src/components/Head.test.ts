import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import Head from './Head.astro';

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create({
    astroConfig: { site: 'https://svyatov.com', trailingSlash: 'always' },
  });
});

describe('Head', () => {
  test('emits one canonical with a trailing slash, the three feeds and article meta', async () => {
    const html = await container.renderToString(Head, {
      request: new Request('https://svyatov.com/blog/hello/'),
      props: {
        title: 'Hello',
        description: 'Desc',
        image: '/og/hello.png',
        article: { published: new Date('2026-01-02T00:00:00Z'), tags: ['ruby'] },
        jsonLd: { '@type': 'BlogPosting' },
      },
    });
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://svyatov.com/blog/hello/">');
    expect(html).toContain('<title>Hello · Leonid Svyatov</title>');
    for (const href of ['/rss.xml', '/atom.xml', '/feed.json']) {
      expect(html).toContain(`href="https://svyatov.com${href}"`);
    }
    expect(html).toContain('property="og:type" content="article"');
    expect(html).toContain('property="article:published_time" content="2026-01-02T00:00:00.000Z"');
    expect(html).toContain('property="article:tag" content="ruby"');
    expect(html).toContain('content="https://svyatov.com/og/hello.png"');
    expect(html).toContain('"@type":"BlogPosting"');
  });

  test('defaults to the site title and the website type', async () => {
    const html = await container.renderToString(Head, {
      request: new Request('https://svyatov.com/'),
    });
    expect(html).toContain('<title>Leonid Svyatov · Software engineer</title>');
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('/og/default.png');
  });

  test('loads the analytics tag only on the production host', async () => {
    const html = await container.renderToString(Head, {
      request: new Request('https://svyatov.com/'),
    });
    expect(html).toContain('location.hostname === host');
    expect(html).toContain('"G-CC82JVJ8N1"');
    expect(html).toContain('"svyatov.com"');
  });
});

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import { site } from '../site';
import Header from './Header.astro';

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('Header', () => {
  test('marks the current nav item and keeps the others plain', async () => {
    const html = await container.renderToString(Header, { props: { path: '/blog/some-post/' } });
    expect(html).toMatch(/<a href="\/blog\/" aria-current="page" class="[^"]*text-accent[^"]*">/);
    expect(html).not.toMatch(/<a href="\/projects\/" aria-current="page"/);
  });

  test('the status badge links to the work page', async () => {
    const html = await container.renderToString(Header, { props: { path: '/' } });
    expect(html).toMatch(
      // The status must sit inside the /work/ anchor itself, not after the nav's [w]ork link.
      new RegExp(`<a href="/work/"[^>]*>(?:(?!</a>)[\\s\\S])*${site.status}`),
    );
  });

  test('home is only active on the root path', async () => {
    const html = await container.renderToString(Header, { props: { path: '/cv/' } });
    expect(html).not.toMatch(/<a href="\/" aria-current="page"/);
  });
});

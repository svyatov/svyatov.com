import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
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
    expect(html).toContain('OPEN TO SENIOR / LEAD ROLES');
  });

  test('home is only active on the root path', async () => {
    const html = await container.renderToString(Header, { props: { path: '/cv/' } });
    expect(html).not.toMatch(/<a href="\/" aria-current="page"/);
  });

  test('hides the badge when not open to work', async () => {
    const html = await container.renderToString(Header, {
      props: { path: '/', openToWork: false },
    });
    expect(html).not.toContain('OPEN TO SENIOR');
  });
});

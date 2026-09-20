import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import { banners } from '../data/banners';
import Banner from './Banner.astro';

describe('Banner', () => {
  test('shows the first font and ships every font for the click swap', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Banner, { props: { fonts: ['AAA', 'BBB'] } });
    expect(html).toContain('aria-label="Change banner font"');
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).toMatch(/<text[^>]*>AAA<\/text>/);
    const [, json] = html.match(/data-fonts="([^"]*)"/) ?? [];
    expect(JSON.parse(json.replaceAll('&quot;', '"'))).toEqual(['AAA', 'BBB']);
  });

  test('every banner is exactly six rows so the swap never reflows', () => {
    for (const fonts of Object.values(banners)) {
      expect(fonts.length).toBeGreaterThan(1);
      for (const art of fonts) {
        expect(art.split('\n')).toHaveLength(6);
        expect(art).not.toMatch(/\n$/); // a trailing blank line would collapse in the pre
      }
    }
  });
});

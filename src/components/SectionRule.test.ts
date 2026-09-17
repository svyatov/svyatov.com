import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import SectionRule from './SectionRule.astro';

describe('SectionRule', () => {
  test('renders the title, the rule glyphs and the right slot', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionRule, {
      props: { title: 'STACK', short: 'S' },
      slots: { default: 'uptime: 15+ yrs' },
    });
    expect(html).toContain('──┤');
    expect(html).toContain('STACK');
    expect(html).toContain('>S<');
    expect(html).toContain('uptime: 15+ yrs');
    expect(html).toContain('md:px-20');
    const bare = await container.renderToString(SectionRule, {
      props: { title: 'X', padded: false },
    });
    expect(bare).not.toContain('md:px-20');
  });
});

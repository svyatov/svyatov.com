import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

// Read from the source tree: the endpoint bundle lives in dist/.prerender at build time.
const font = (file: string) => readFile(join(process.cwd(), 'src/assets/fonts', file));
const fonts = Promise.all([font('IBMPlexMono-Regular.ttf'), font('IBMPlexMono-SemiBold.ttf')]);

const colors = { bg: '#0f0f12', line: '#33333c', fg: '#d9d6cc', dim: '#8f8d84', accent: '#f0a63a' };

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style, children },
});

/** 1200x630 PNG card in the site style. */
export async function renderOg({ title, subtitle }: { title: string; subtitle: string }) {
  const [regular, semibold] = await fonts;
  const svg = await satori(
    el(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '64px 72px',
        backgroundColor: colors.bg,
        color: colors.fg,
        fontFamily: 'IBM Plex Mono',
      },
      [
        el('div', { display: 'flex', alignItems: 'center', gap: 14, fontSize: 28 }, [
          el('span', { color: colors.accent, fontWeight: 600 }, '> ls'),
          el('span', { width: 16, height: 30, backgroundColor: colors.accent }),
          el('span', { color: colors.dim, fontSize: 24, marginLeft: 8 }, 'svyatov.com'),
        ]),
        el('div', { display: 'flex', flexDirection: 'column', gap: 28 }, [
          el(
            'div',
            {
              color: colors.accent,
              fontSize: title.length > 60 ? 48 : 60,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            },
            title,
          ),
          el('div', { color: colors.dim, fontSize: 26, lineHeight: 1.5 }, subtitle),
        ]),
        el(
          'div',
          {
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 28,
            borderTop: `2px solid ${colors.line}`,
            color: colors.dim,
            fontSize: 22,
          },
          [el('span', {}, 'Leonid Svyatov'), el('span', {}, 'NO CARRIER')],
        ),
      ],
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'IBM Plex Mono', data: regular, weight: 400, style: 'normal' },
        { name: 'IBM Plex Mono', data: semibold, weight: 600, style: 'normal' },
      ],
    },
  );
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}

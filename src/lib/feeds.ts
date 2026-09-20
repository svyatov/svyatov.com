import { site } from '../site';
import { byDateDesc, type Post, postUrl } from './posts';

export const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

export interface FeedItem {
  id: string;
  url: string;
  title: string;
  summary: string;
  html: string;
  published: Date;
  updated: Date;
  tags: string[];
}

export function absoluteHtml(html: string, base: string): string {
  return html.replace(/<(?:a|img|source)\b[^>]*>/gi, (tag) =>
    tag.replace(/\b(href|src|srcset)="([^"]*)"/gi, (_attribute, name: string, value: string) => {
      const absolute = (url: string) =>
        new URL(url.replaceAll('&amp;', '&'), base).href.replaceAll('&', '&amp;');
      const resolved =
        name.toLowerCase() === 'srcset'
          ? value
              .split(',')
              .map((candidate) => {
                const [url, ...descriptor] = candidate.trim().split(/\s+/);
                return [absolute(url), ...descriptor].join(' ');
              })
              .join(', ')
          : absolute(value);
      return `${name}="${resolved}"`;
    }),
  );
}

async function renderHtml(post: Post): Promise<string> {
  const { render } = await import('astro:content');
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { Content } = await render(post);
  const container = await AstroContainer.create();
  return container.renderToString(Content);
}

export async function feedItems(posts: Post[], renderPost = renderHtml): Promise<FeedItem[]> {
  return Promise.all(
    [...posts].sort(byDateDesc).map(async (post) => ({
      id: post.id,
      url: new URL(postUrl(post), site.url).href,
      title: post.data.title,
      summary: post.data.description,
      html: absoluteHtml(await renderPost(post), new URL(postUrl(post), site.url).href),
      published: post.data.date,
      updated: post.data.updated ?? post.data.date,
      tags: post.data.tags,
    })),
  );
}

export const feedUpdated = (items: FeedItem[]) =>
  new Date(Math.max(...items.map((i) => i.updated.getTime())));

export const feeds = [
  { label: 'rss', href: '/rss.xml', type: 'application/rss+xml' },
  { label: 'atom', href: '/atom.xml', type: 'application/atom+xml' },
  { label: 'json', href: '/feed.json', type: 'application/feed+json' },
];

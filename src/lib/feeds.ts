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

export function feedItems(posts: Post[]): FeedItem[] {
  return [...posts].sort(byDateDesc).map((post) => ({
    id: post.id,
    url: new URL(postUrl(post), site.url).href,
    title: post.data.title,
    summary: post.data.description,
    html: post.rendered?.html ?? '',
    published: post.data.date,
    updated: post.data.updated ?? post.data.date,
    tags: post.data.tags,
  }));
}

export const feedUpdated = (items: FeedItem[]) =>
  new Date(Math.max(...items.map((i) => i.updated.getTime())));

export const feeds = [
  { label: 'rss', href: '/rss.xml', type: 'application/rss+xml' },
  { label: 'atom', href: '/atom.xml', type: 'application/atom+xml' },
  { label: 'json', href: '/feed.json', type: 'application/feed+json' },
];

import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const byDateDesc = (a: Post, b: Post) => b.data.date.getTime() - a.data.date.getTime();

export const postUrl = (post: Pick<Post, 'id'>) => `/blog/${post.id}/`;

export const tagUrl = (tag: string) => `/blog/tag/${encodeURIComponent(tag)}/`;

/** ISO date, YYYY-MM-DD. */
export const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const yearOf = (date: Date) => date.getUTCFullYear();

/** Minutes at 200 wpm, minimum 1. */
export function readingTime(body: string | undefined): number {
  const words = (body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function countBy<T>(items: T[], key: (item: T) => Iterable<string | number>) {
  const counts = new Map<string | number, number>();
  for (const item of items) for (const k of key(item)) counts.set(k, (counts.get(k) ?? 0) + 1);
  return counts;
}

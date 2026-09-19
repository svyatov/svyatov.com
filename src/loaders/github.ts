import { GITHUB_TOKEN } from 'astro:env/server';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { projects } from '../data/projects';

const repo = z.object({
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  created_at: z.string(),
  html_url: z.string(),
});

export const schema = z.object({
  name: z.string(),
  description: z.string(),
  language: z.string(),
  stars: z.number(),
  createdAt: z.coerce.date(),
  url: z.url(),
  order: z.number(),
});

export function githubLoader(user: string): Loader {
  return {
    name: 'github',
    schema,
    async load({ store, logger, parseData }) {
      const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100`, {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
        },
      });
      if (!res.ok) {
        if (store.keys().length > 0) {
          logger.warn(`GitHub ${res.status}, keeping ${store.keys().length} cached repos`);
          return;
        }
        throw new Error(`GitHub API ${res.status} ${res.statusText}`);
      }
      const byName = new Map(
        z
          .array(repo)
          .parse(await res.json())
          .map((r) => [r.name, r]),
      );
      store.clear();
      for (const [order, p] of projects.entries()) {
        const r = byName.get(p.name);
        if (!r) throw new Error(`GitHub repo ${user}/${p.name} not found`);
        const id = p.name;
        const data = await parseData({
          id,
          data: {
            name: r.name,
            description: p.description ?? r.description ?? '',
            language: p.language ?? r.language ?? 'Other',
            stars: r.stargazers_count,
            createdAt: r.created_at,
            url: p.url ?? r.html_url,
            order,
          },
        });
        store.set({ id, data });
      }
    },
  };
}

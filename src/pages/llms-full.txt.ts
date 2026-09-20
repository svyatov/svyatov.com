import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { llmsFull } from '../lib/llms';
import { site } from '../site';

const images = import.meta.glob<string>('../content/blog/**/*.{png,jpg,jpeg,webp,gif,svg}', {
  query: '?url',
  import: 'default',
  eager: true,
});

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog');
  const assets = Object.fromEntries(
    posts.map((post) => {
      const directory = post.filePath?.replace(/^src\//, '../').replace(/[^/]+$/, '') ?? '';
      return [
        post.id,
        Object.fromEntries(
          Object.entries(images)
            .filter(([path]) => path.startsWith(directory))
            .flatMap(([path, url]) => {
              const name = path.slice(directory.length);
              const absolute = new URL(url, site.url).href;
              return [
                [`./${name}`, absolute],
                [name, absolute],
              ];
            }),
        ),
      ];
    }),
  );
  return new Response(llmsFull(posts, assets), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

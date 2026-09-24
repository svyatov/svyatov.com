import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOg } from '../../lib/og';
import { formatDate, readingTime } from '../../lib/posts';
import { site } from '../../site';

export const getStaticPaths = (async () => {
  const posts = await getCollection('blog');
  return [
    { params: { slug: 'default' }, props: { title: site.title, subtitle: site.description } },
    ...posts.map((post) => ({
      params: { slug: post.id },
      props: {
        title: post.data.title,
        subtitle: [
          formatDate(post.data.date),
          `${readingTime(post.body)} min read`,
          post.data.tags.join(' · '),
        ]
          .filter(Boolean)
          .join('  ·  '),
      },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ title: string; subtitle: string }> = async ({ props }) => {
  const png = await renderOg(props);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};

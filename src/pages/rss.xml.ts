import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { feedItems } from '../lib/feeds';
import { site } from '../site';

export const GET: APIRoute = async (context) => {
  const items = feedItems(await getCollection('blog'));
  return rss({
    title: site.title,
    description: site.blogTagline,
    site: context.site ?? site.url,
    trailingSlash: true,
    items: items.map((i) => ({
      title: i.title,
      description: i.summary,
      pubDate: i.published,
      link: i.url,
      content: i.html,
      categories: i.tags,
      author: site.email,
    })),
    customData: '<language>en</language>',
  });
};

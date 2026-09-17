import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { feedItems } from '../lib/feeds';
import { site } from '../site';

export const GET: APIRoute = async () => {
  const items = feedItems(await getCollection('blog'));
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: site.title,
    description: site.blogTagline,
    home_page_url: `${site.url}/blog/`,
    feed_url: `${site.url}/feed.json`,
    language: 'en',
    authors: [{ name: site.name, url: `${site.url}/` }],
    items: items.map((i) => ({
      id: i.url,
      url: i.url,
      title: i.title,
      summary: i.summary,
      content_html: i.html,
      date_published: i.published.toISOString(),
      date_modified: i.updated.toISOString(),
      tags: i.tags,
      image: `${site.url}/og/${i.id}.png`,
    })),
  };
  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
};

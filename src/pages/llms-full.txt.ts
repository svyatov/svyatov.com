import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { postAssets } from '../lib/assets';
import { llmsFull } from '../lib/llms';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog');
  const assets = Object.fromEntries(posts.map((post) => [post.id, postAssets(post)]));
  return new Response(llmsFull(posts, assets), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

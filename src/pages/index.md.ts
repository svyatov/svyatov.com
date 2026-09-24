import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { llmsIndex } from '../lib/llms';

export const GET: APIRoute = async () =>
  new Response(llmsIndex(await getCollection('blog')), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });

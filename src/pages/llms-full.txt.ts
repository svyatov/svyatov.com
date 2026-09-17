import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { llmsFull } from '../lib/llms';

export const GET: APIRoute = async () =>
  new Response(llmsFull(await getCollection('blog')), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

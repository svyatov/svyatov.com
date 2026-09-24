import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { postAssets } from '../../lib/assets';
import { postMarkdown } from '../../lib/llms';
import type { Post } from '../../lib/posts';

export const getStaticPaths = (async () =>
  (await getCollection('blog')).map((post) => ({
    params: { slug: post.id },
    props: { post },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = ({ props: { post } }) =>
  new Response(postMarkdown(post, postAssets(post)), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });

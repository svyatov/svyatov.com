import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { DevToClient } from 'devto-client';
import { devtoBody, devtoTags } from '../src/lib/crosspost';
import { site } from '../src/site';

// Usage: bun scripts/crosspost.ts devto <slug> [--dry-run]
//        bun scripts/crosspost.ts bluesky <slug> < text
const secrets = {
  devto: 'op://Private/dev.to/API key',
  blueskyHandle: 'op://Private/Bluesky/username',
  blueskyPassword: 'op://Private/Bluesky/app password',
};

const [target, slug] = process.argv.slice(2);
if (!slug || !['devto', 'bluesky'].includes(target)) {
  throw new Error('Usage: bun scripts/crosspost.ts devto|bluesky <slug> [--dry-run]');
}
const url = `${site.url}/blog/${slug}/`;

function secret(ref: string) {
  const { status, stdout, stderr } = spawnSync('op', ['read', '--account', 'my', ref], {
    encoding: 'utf8',
  });
  if (status !== 0) throw new Error(`op read ${ref} failed: ${stderr}`);
  return stdout.trim();
}

async function fetchText(from: string) {
  const response = await fetch(from);
  if (!response.ok) throw new Error(`${from} returned ${response.status}. Is the post live?`);
  return response.text();
}

// The live page is the source of truth: it proves the post is published and carries its metadata.
const html = await fetchText(url);
const ld = JSON.parse(
  html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1] ?? '',
);
const post = {
  title: ld.headline as string,
  description: ld.description as string,
  image: ld.image as string,
  tags: (ld.keywords as string).split(', '),
};

if (target === 'devto') {
  const file = [`src/content/blog/${slug}.md`, `src/content/blog/${slug}/index.md`].find(
    existsSync,
  );
  if (!file) throw new Error(`No source file for ${slug}`);
  if (/^devto:/m.test(readFileSync(file, 'utf8'))) throw new Error(`${file} already has devto`);
  const article = {
    title: post.title,
    body_markdown: devtoBody(await fetchText(`${site.url}/llms-full.txt`), url),
    published: true,
    canonical_url: url,
    description: post.description,
    tags: devtoTags(post.tags),
    main_image: post.image,
  };
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(article, null, 2));
  } else {
    const devto = new DevToClient({ apiKey: secret(secrets.devto) });
    console.log((await devto.articles.create(article)).url);
  }
} else {
  const text = readFileSync(0, 'utf8').trim();
  const length = [...new Intl.Segmenter().segment(text)].length;
  if (!length || length > 300) throw new Error(`Post text is ${length} graphemes, limit is 300`);

  const xrpc = async (method: string, body: BodyInit, headers: Record<string, string>) => {
    const response = await fetch(`https://bsky.social/xrpc/${method}`, {
      method: 'POST',
      body,
      headers,
    });
    if (!response.ok)
      throw new Error(`${method} returned ${response.status}: ${await response.text()}`);
    return response.json();
  };
  const json = { 'Content-Type': 'application/json' };
  const session = await xrpc(
    'com.atproto.server.createSession',
    JSON.stringify({
      identifier: secret(secrets.blueskyHandle),
      password: secret(secrets.blueskyPassword),
    }),
    json,
  );
  const auth = { Authorization: `Bearer ${session.accessJwt}` };
  const image = await fetch(post.image);
  const { blob } = await xrpc('com.atproto.repo.uploadBlob', await image.arrayBuffer(), {
    ...auth,
    'Content-Type': 'image/png',
  });
  const record = await xrpc(
    'com.atproto.repo.createRecord',
    JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text,
        langs: ['en'],
        createdAt: new Date().toISOString(),
        embed: {
          $type: 'app.bsky.embed.external',
          external: { uri: url, title: post.title, description: post.description, thumb: blob },
        },
      },
    }),
    { ...auth, ...json },
  );
  console.log(`https://bsky.app/profile/${session.handle}/post/${record.uri.split('/').pop()}`);
}

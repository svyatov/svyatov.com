import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { escapeXml, feedItems, feedUpdated } from '../lib/feeds';
import { site } from '../site';

export const GET: APIRoute = async () => {
  const items = await feedItems(await getCollection('blog'));
  const entries = items
    .map(
      (i) => `  <entry>
    <id>${i.url}</id>
    <title>${escapeXml(i.title)}</title>
    <link rel="alternate" type="text/html" href="${i.url}"/>
    <published>${i.published.toISOString()}</published>
    <updated>${i.updated.toISOString()}</updated>
    <summary>${escapeXml(i.summary)}</summary>
    <content type="html">${escapeXml(i.html)}</content>
${i.tags.map((t) => `    <category term="${escapeXml(t)}"/>`).join('\n')}
  </entry>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${site.url}/</id>
  <title>${escapeXml(site.title)}</title>
  <subtitle>${escapeXml(site.blogTagline)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${site.url}/atom.xml"/>
  <link rel="alternate" type="text/html" href="${site.url}/blog/"/>
  <updated>${feedUpdated(items).toISOString()}</updated>
  <author><name>${escapeXml(site.name)}</name><uri>${site.url}/</uri></author>
${entries}
</feed>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
};

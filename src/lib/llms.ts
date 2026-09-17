import { site } from '../site';
import { byDateDesc, formatDate, type Post, postUrl } from './posts';

export function llmsIndex(posts: Post[]) {
  const list = [...posts]
    .sort(byDateDesc)
    .map(
      (p) =>
        `- [${p.data.title}](${site.url}${postUrl(p)}): ${p.data.description} (${formatDate(p.data.date)})`,
    )
    .join('\n');
  return `# ${site.name}

> ${site.description}

Personal site of ${site.name}, ${site.jobTitle}. Built with Astro, hosted on GitHub Pages. Full post bodies: ${site.url}/llms-full.txt

## Pages

- [Home](${site.url}/): who I am, stack, latest posts, selected projects
- [Projects](${site.url}/projects/): open-source libraries and tools I maintain
- [Blog](${site.url}/blog/): ${site.blogTagline}
- [CV](${site.url}/cv/): work experience, skills, education

## Blog posts

${list}

## Feeds

- [RSS](${site.url}/rss.xml)
- [Atom](${site.url}/atom.xml)
- [JSON Feed](${site.url}/feed.json)
`;
}

export function llmsFull(posts: Post[]) {
  const bodies = [...posts]
    .sort(byDateDesc)
    .map(
      (p) => `## ${p.data.title}

- URL: ${site.url}${postUrl(p)}
- Date: ${formatDate(p.data.date)}
- Tags: ${p.data.tags.join(', ')}

${p.body?.trim() ?? ''}
`,
    )
    .join('\n---\n\n');
  return `# ${site.name}: all posts\n\n> ${site.description}\n\n${bodies}`;
}

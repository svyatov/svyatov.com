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

// Keep code examples byte-for-byte intact when resolving Markdown destinations.
export function absoluteMarkdown(body: string, base: string, assets: Record<string, string> = {}) {
  const rewrite = (text: string) =>
    text.replace(
      /(!?\[[^\]\n]*\]\()([^\s)]+)([^)]*\))|(^ {0,3}\[[^\]\n]+\]:\s*)(\S+)/gm,
      (_match, open, destination, close, reference, referenceDestination) => {
        const value = destination ?? referenceDestination;
        const resolved = assets[value] ?? new URL(value, base).href;
        return open ? `${open}${resolved}${close}` : `${reference}${resolved}`;
      },
    );
  const prose = (text: string) => {
    const ticks = [...text.matchAll(/`+/g)];
    let result = '';
    let start = 0;
    for (let i = 0; i < ticks.length; i++) {
      const opening = ticks[i];
      const end = ticks.findIndex((tick, j) => j > i && tick[0] === opening[0]);
      if (end < 0) continue;
      const closing = ticks[end];
      result += rewrite(text.slice(start, opening.index));
      start = closing.index + closing[0].length;
      result += text.slice(opening.index, start);
      i = end;
    }
    return result + rewrite(text.slice(start));
  };
  let fence = '';
  let pending = '';
  let output = '';
  for (const line of body.split(/(?<=\n)/)) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})([^\n]*)/);
    if (fence || marker || /^( {4}|\t)/.test(line)) {
      output += prose(pending) + line;
      pending = '';
      if (fence) {
        if (
          marker &&
          marker[1][0] === fence[0] &&
          marker[1].length >= fence.length &&
          !marker[2].trim()
        )
          fence = '';
      } else if (marker) fence = marker[1];
    } else pending += line;
  }
  return output + prose(pending);
}

export function llmsFull(posts: Post[], assets: Record<string, Record<string, string>> = {}) {
  const bodies = [...posts]
    .sort(byDateDesc)
    .map(
      (p) => `## ${p.data.title}

- URL: ${site.url}${postUrl(p)}
- Date: ${formatDate(p.data.date)}
- Tags: ${p.data.tags.join(', ')}

${absoluteMarkdown(p.body?.trim() ?? '', `${site.url}${postUrl(p)}`, assets[p.id])}
`,
    )
    .join('\n---\n\n');
  return `# ${site.name}: all posts\n\n> ${site.description}\n\n${bodies}`;
}

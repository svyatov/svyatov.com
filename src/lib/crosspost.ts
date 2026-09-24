/** The post body from llms-full.txt, where links and images are already absolute. */
export function devtoBody(llmsFull: string, url: string) {
  const header = new RegExp(`^- URL: ${RegExp.escape(url)}\\n- Date: .*\\n- Tags: .*\\n\\n`, 'm');
  const start = llmsFull.match(header);
  if (start?.index === undefined) throw new Error(`${url} is not in llms-full.txt`);
  const rest = llmsFull.slice(start.index + start[0].length);
  const next = rest.search(/\n---\n\n## .*\n\n- URL: /);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

export const devtoTags = (tags: string[]) =>
  tags
    .slice(0, 4)
    .map((tag) => tag.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .join(', ');

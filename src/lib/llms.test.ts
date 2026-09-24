import { expect, test } from 'vitest';
import { absoluteMarkdown, llmsFull, llmsIndex, postBody, postMarkdown } from './llms';
import type { Post } from './posts';

test('exports resolve images and links but preserve fenced and inline examples', () => {
  const code =
    '\n```markdown\n![example](./image.png)\n```\n`[example](./image.png)`\n~~~text\n![example](./image.png)\n~~~\n';
  const input = `![image](./image.png) [up](../)\n[image]: ./image.png${code}`;
  expect(
    absoluteMarkdown(input, 'https://svyatov.com/blog/post/', {
      './image.png': 'https://svyatov.com/_astro/image.png',
    }),
  ).toBe(
    '![image](https://svyatov.com/_astro/image.png) [up](https://svyatov.com/blog/)\n[image]: https://svyatov.com/_astro/image.png' +
      code,
  );
});

test('nested, unclosed, indented, and multiline code remains unchanged', () => {
  for (const body of [
    '````markdown\n```text\n[example](./image.png)\n```\n[example](./image.png)\n````\n',
    '~~~markdown\n[example](./image.png)\n',
    '    [example](./image.png)\n\t[example](./image.png)\n',
    '``code with ` backtick\n[example](./image.png)``',
  ]) {
    expect(absoluteMarkdown(body, 'https://svyatov.com/')).toBe(body);
  }
});

test('the index lists the work page for agents screening candidates', () => {
  expect(llmsIndex([])).toMatch(/^- \[Work\]\(https:\/\/svyatov\.com\/work\/\): .+$/m);
});

test('a post exports as a standalone document and nests one level down in the full export', () => {
  const post = {
    id: 'hello',
    body: 'Body [up](../)',
    data: { title: 'Hello', description: 'Desc', date: new Date('2026-01-02'), tags: ['ruby'] },
  } as unknown as Post;
  const markdown = postMarkdown(post);
  expect(markdown).toMatch(/^# Hello\n\n- URL: https:\/\/svyatov\.com\/blog\/hello\/\n/);
  expect(markdown).toContain('Body [up](https://svyatov.com/blog/)');
  expect(llmsFull([post])).toContain(`\n\n#${markdown}`);
});

test('postBody reads back what postMarkdown wrote, rules and headings included', () => {
  const post = {
    id: 'hello',
    body: 'One [up](../)\n\n---\n\n## Two\n\n- URL: not a header',
    data: { title: 'Hello', date: new Date('2026-01-02'), tags: [] },
  } as unknown as Post;
  expect(postBody(postMarkdown(post))).toBe(
    'One [up](https://svyatov.com/blog/)\n\n---\n\n## Two\n\n- URL: not a header',
  );
});

test('postBody rejects text that is not a post copy', () => {
  expect(() => postBody('<!doctype html>')).toThrow(/Not a post/);
});

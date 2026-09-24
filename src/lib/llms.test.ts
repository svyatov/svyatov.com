import { expect, test } from 'vitest';
import { absoluteMarkdown, llmsIndex } from './llms';

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

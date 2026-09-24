import { expect, test } from 'vitest';
import { devtoBody, devtoTags } from './crosspost';

const full = `# Leonid Svyatov: all posts

> About.

## First

- URL: https://svyatov.com/blog/first/
- Date: May 2, 2026
- Tags: ruby

Body one.

---

## Title

More, with a rule and a heading.

---

## Second

- URL: https://svyatov.com/blog/second/
- Date: May 1, 2026
- Tags: rails

Body two.
`;

test('takes one post body out of llms-full.txt, keeping rules inside it', () => {
  expect(devtoBody(full, 'https://svyatov.com/blog/first/')).toBe(
    'Body one.\n\n---\n\n## Title\n\nMore, with a rule and a heading.',
  );
  expect(devtoBody(full, 'https://svyatov.com/blog/second/')).toBe('Body two.');
});

test('throws when the post is not live yet', () => {
  expect(() => devtoBody(full, 'https://svyatov.com/blog/missing/')).toThrow(/not in llms-full/);
});

test('dev.to tags are at most four, lowercase alphanumeric', () => {
  expect(devtoTags(['Ruby on Rails', 'open-source', 'ai', 'devops', 'extra'])).toBe(
    'rubyonrails, opensource, ai, devops',
  );
});

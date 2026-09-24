import { expect, test } from 'vitest';
import { devtoTags } from './crosspost';

test('dev.to tags are at most four, lowercase alphanumeric', () => {
  expect(devtoTags(['Ruby on Rails', 'open-source', 'ai', 'devops', 'extra'])).toBe(
    'rubyonrails, opensource, ai, devops',
  );
});

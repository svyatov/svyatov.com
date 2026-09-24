import { describe, expect, test } from 'vitest';
import {
  byCountDesc,
  countBy,
  formatDate,
  isLegacy,
  ogUrl,
  postUrl,
  readingTime,
  tagUrl,
  yearOf,
  yearUrl,
} from './posts';

describe('readingTime', () => {
  test('rounds words at 200 wpm with a floor of one minute', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime(undefined)).toBe(1);
    expect(readingTime(Array(600).fill('word').join(' '))).toBe(3);
    expect(readingTime(Array(250).fill('word').join('\n'))).toBe(1);
  });
});

describe('dates', () => {
  const date = new Date('2026-08-07T23:30:00Z');
  test('formatDate prints the UTC ISO day', () => expect(formatDate(date)).toBe('2026-08-07'));
  test('yearOf uses the UTC year', () =>
    expect(yearOf(new Date('2019-12-31T23:59:59Z'))).toBe(2019));
});

describe('urls', () => {
  test('always end with a slash', () => {
    expect(postUrl({ id: 'hello-world' })).toBe('/blog/hello-world/');
    expect(tagUrl('rails')).toBe('/blog/tag/rails/');
    expect(yearUrl(2026)).toBe('/blog/year/2026/');
  });
  test('og image lives under /og/', () =>
    expect(ogUrl({ id: 'hello-world' })).toBe('/og/hello-world.png'));
  test('tag urls are encoded', () => expect(tagUrl('agentic ai')).toBe('/blog/tag/agentic%20ai/'));
});

describe('countBy', () => {
  test('counts every key an item yields', () => {
    const counts = countBy([{ t: ['a', 'b'] }, { t: ['a'] }], (i) => i.t);
    expect([...counts]).toEqual([
      ['a', 2],
      ['b', 1],
    ]);
  });
  test('byCountDesc orders by count, then by key', () => {
    const counts = countBy([{ t: ['b', 'c'] }, { t: ['c', 'a'] }], (i) => i.t);
    expect([...counts].sort(byCountDesc)).toEqual([
      ['c', 2],
      ['a', 1],
      ['b', 1],
    ]);
  });
});

describe('isLegacy', () => {
  const now = new Date('2026-09-24T00:00:00Z');
  test('posts older than three years are legacy', () => {
    expect(isLegacy(new Date('2019-02-24'), now)).toBe(true);
    expect(isLegacy(new Date('2023-09-23'), now)).toBe(true);
  });
  test('posts from the last three years are not', () => {
    expect(isLegacy(new Date('2024-03-03'), now)).toBe(false);
    expect(isLegacy(new Date('2023-09-25'), now)).toBe(false);
  });
});

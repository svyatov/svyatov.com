import { describe, expect, test } from 'vitest';
import { duration } from './cv';

describe('duration', () => {
  test('counts both end months and pluralises like LinkedIn', () => {
    expect(duration('Aug 2024 – Jul 2025')).toBe('1 yr');
    expect(duration('Mar 2021 – Jan 2024')).toBe('2 yrs 11 mos');
    expect(duration('Feb 2024 – Aug 2024')).toBe('7 mos');
    expect(duration('Jun 2010 – Jun 2011')).toBe('1 yr 1 mo');
  });
  test('Present ends at the given date', () =>
    expect(duration('Jan 2026 – Present', new Date('2026-09-17T00:00:00Z'))).toBe('9 mos'));
});

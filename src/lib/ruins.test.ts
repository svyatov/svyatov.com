import { describe, expect, test } from 'vitest';
import { banners } from '../data/banners';
import { ruins } from './ruins';

let seed = 1;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const column = (rows: string[], c: number) => rows.filter((row) => (row[c] ?? ' ') !== ' ').length;

describe('ruins', () => {
  test('collapses every banner into a low pile of its own rubble', () => {
    for (const art of Object.values(banners).flat()) {
      const source = art.split('\n');
      const rows = ruins(art, random).split('\n');
      const width = Math.max(...source.map((row) => row.length));
      expect(rows).toHaveLength(6);
      expect(rows[0].trim() + rows[1].trim()).toBe('');
      for (let c = 0; c < width; c++)
        expect(column(rows, c)).toBeLessThanOrEqual(column(source, c));
      expect(rows.every((row) => row.length <= width)).toBe(true);
      expect(rows.some((row) => row.trim())).toBe(true);
    }
  });
});

// Tuning knobs: how much of each column survives as rubble, how high the pile may reach, what it is made of.
const SHARE = 0.4;
const MAX_HEIGHT = 4;
const SHADES = ['▓', '▒', '░'];
const DEBRIS = [...".,'_:"];

// The banner after the blast: each column's glyphs fall into a pile on the bottom rows, bits of the foundation still standing.
export const ruins = (art: string, random = Math.random): string => {
  const rows = art.split('\n');
  const width = Math.max(...rows.map((row) => row.length));
  const bottom = rows[rows.length - 1];
  const grid = rows.map(() => Array<string>(width).fill(' '));
  for (let c = 0; c < width; c++) {
    const count = rows.filter((row) => (row[c] ?? ' ') !== ' ').length;
    const height = Math.min(
      count,
      MAX_HEIGHT,
      Math.max(0, Math.round(count * SHARE + random() * 2 - 1)),
    );
    for (let k = 0; k < height; k++) {
      const standing = (bottom[c] ?? ' ') !== ' ' && random() < 0.5;
      grid[rows.length - 1 - k][c] =
        k === 0
          ? standing
            ? bottom[c]
            : SHADES[0]
          : k === height - 1
            ? DEBRIS[Math.floor(random() * DEBRIS.length)]
            : SHADES[k];
    }
  }
  return grid.map((row) => row.join('')).join('\n');
};

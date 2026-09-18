const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthIndex = (s: string, now: Date) => {
  if (s === 'Present') return now.getUTCFullYear() * 12 + now.getUTCMonth();
  const [month, year] = s.split(' ');
  return Number(year) * 12 + MONTHS.indexOf(month);
};

/** LinkedIn-style length of a "Mon YYYY – Mon YYYY" period, inclusive of both months. */
export function duration(period: string, now = new Date()): string {
  const [from, to] = period.split(' – ').map((s) => monthIndex(s, now));
  const months = to - from + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [
    years && `${years} ${years === 1 ? 'yr' : 'yrs'}`,
    rest && `${rest} ${rest === 1 ? 'mo' : 'mos'}`,
  ]
    .filter(Boolean)
    .join(' ');
}

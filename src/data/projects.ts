/** GitHub repos shown on the site, in display order. Overrides pin copy where the live text reads worse than the design. */
export const projects: { name: string; description?: string; language?: string }[] = [
  {
    name: 'sec_id',
    description:
      'Ruby toolkit for securities identifiers: ISIN, CUSIP, SEDOL, FIGI, LEI and 10 more schemes.',
  },
  {
    name: 'hacker_news_sorted',
    description:
      'Chrome extension that sorts Hacker News by points, time, comments, velocity or heat.',
    language: 'TypeScript',
  },
  { name: 'oss-kit', language: 'Skills' },
  {
    name: 'clsx-rails',
    description:
      'The fastest conditional CSS class builder for Rails. 2-4x faster than class_names.',
  },
  { name: 'oz', description: 'Config-driven CLI wizard framework.' },
  { name: 'briefly' },
  { name: 'handrail' },
  {
    name: 'agent-toolkit',
    description: 'Reusable skills and plugins for Claude Code, Cursor, Codex and Gemini CLI.',
    language: 'Skills',
  },
  { name: 'agentskills-lint' },
  { name: 'botchart' },
  { name: 'devto-client' },
  { name: 'tailwind-merge-typography' },
  { name: 'clsx-ruby' },
  { name: 'create-rails-app' },
  {
    name: 'create-ruby-gem',
    description: 'Interactive CLI wizard for creating Ruby gems that remembers your choices.',
  },
  { name: 'http_wrapper' },
  { name: 'smsru-ruby' },
  { name: 'candor' },
  { name: 'database-transactions' },
];

export const languageColors: Record<string, string> = {
  Ruby: 'bg-lang-ruby',
  JavaScript: 'bg-lang-javascript',
  TypeScript: 'bg-lang-typescript',
  Go: 'bg-lang-go',
  HTML: 'bg-lang-html',
  Skills: 'bg-lang-skills',
};

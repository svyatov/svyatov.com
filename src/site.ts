export const site = {
  name: 'Leonid Svyatov',
  title: 'Leonid Svyatov',
  jobTitle: 'Lead Software Engineer',
  description:
    'Leonid Svyatov. Software engineer. I design, build and ship end-to-end features, backend, frontend and infra, with agentic AI in the loop.',
  bio: 'Software engineer. Ships end-to-end features with agentic AI in the loop. Open to senior / lead roles.',
  url: 'https://svyatov.com',
  email: 'leonid@svyatov.com',
  repo: 'https://github.com/svyatov/svyatov.com',
  openToWork: true,
  scanlines: true,
  socials: [
    { label: 'github', href: 'https://github.com/svyatov' },
    { label: 'linkedin', href: 'https://www.linkedin.com/in/leonid-svyatov' },
    { label: 'bluesky', href: 'https://bsky.app/profile/svyatov.bsky.social' },
  ],
  nav: [
    { key: 'h', rest: 'ome', href: '/' },
    { key: 'p', rest: 'rojects', href: '/projects/' },
    { key: 'b', rest: 'log', href: '/blog/' },
    { key: 'c', rest: 'v', href: '/cv/' },
  ],
  stack: [
    {
      name: 'ruby / rails',
      long: '10+ years. Tech lead and lead engineer roles. Gem author.',
      short: '10+ years, lead roles',
    },
    {
      name: 'typescript',
      long: 'Full-stack: Node, browser extensions, static sites.',
      short: 'full-stack',
    },
    {
      name: 'python',
      long: 'Backend services and LLM tooling.',
      short: 'services, LLM tooling',
    },
    { name: 'go', long: 'CLI tooling. See oz.', short: 'CLI tooling' },
    {
      name: 'agentic ai',
      long: 'Agent skills, workflows and tooling for real delivery, not demos.',
      short: 'skills, workflows',
    },
  ],
  employers: [
    'Independent',
    'Halo',
    'Ourea Systems',
    'TodayTix Group',
    'InputHealth',
    'Show-Score',
  ],
  blogTagline: 'Notes on shipping software with Rails, TypeScript and agents in the loop.',
} as const;

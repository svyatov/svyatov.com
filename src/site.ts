export const site = {
  name: 'Leonid Svyatov',
  title: 'Leonid Svyatov',
  jobTitle: 'Lead Software Engineer',
  description:
    "I'm Leonid, a software engineer. For 15+ years, I've worked with founders to figure out what they need, build it, and keep it running. I like asking questions before writing code and helping other developers grow. These days, I build with coding agents and share much of my work as open source.",
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
      long: 'Data pipelines, LLMs and trading systems.',
      short: 'data, LLMs, trading',
    },
    { name: 'go', long: 'CLI tools and interactive developer workflows.', short: 'CLI tooling' },
    {
      name: 'agentic ai',
      long: 'Skills, harnesses, pipelines and tooling for real delivery.',
      short: 'skills, harnesses, pipelines',
    },
  ],
  blogTagline: 'Notes on shipping software with Rails, TypeScript and agents in the loop.',
} as const;

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { htmlRoutes, sampleRoutes } from './routes';

// Default: one cold run of one route per page type. --full: three runs of every route.
const baseline = process.argv.includes('--baseline');
const full = process.argv.includes('--full');
const runs = full ? 3 : 1;
const stamp = new Date().toISOString().replaceAll(':', '-');
const output = resolve('audit-results', `${baseline ? 'baseline' : 'audit'}-${stamp}`);
mkdirSync(output, { recursive: true });
const directory = `${output}/site`;
cpSync('dist', directory, { recursive: true });
const routes = full || baseline ? htmlRoutes(directory) : sampleRoutes(directory);
if (!routes.length) throw new Error('No indexable HTML routes found. Build the site first.');
writeFileSync(`${output}/routes.json`, JSON.stringify(routes, null, 2));
const rows: string[] = [];
let failed = false;
for (const profile of ['mobile', 'desktop']) {
  const folder = `${output}/${profile}`;
  mkdirSync(folder);
  const config = {
    ci: {
      collect: {
        staticDistDir: resolve(directory),
        url: routes,
        chromePath: chromium.executablePath(),
        numberOfRuns: runs,
        settings: profile === 'desktop' ? { preset: 'desktop' } : {},
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 1, aggregationMethod: 'median' }],
          'categories:accessibility': ['error', { minScore: 1, aggregationMethod: 'pessimistic' }],
          'categories:best-practices': ['error', { minScore: 1, aggregationMethod: 'pessimistic' }],
          'categories:seo': ['error', { minScore: 1, aggregationMethod: 'pessimistic' }],
        },
      },
    },
  };
  const configPath = `${folder}/config.json`;
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  const run = (command: string) =>
    spawnSync(
      process.execPath,
      [resolve('node_modules/@lhci/cli/src/cli.js'), command, `--config=${configPath}`],
      { stdio: 'inherit' },
    ).status === 0;
  const collected = run('collect');
  const passed = collected && (baseline || run('assert'));
  failed ||= !passed;
  mkdirSync(`${folder}/reports`);
  if (existsSync('.lighthouseci'))
    cpSync('.lighthouseci', `${folder}/reports`, { recursive: true });
  const groups = new Map<string, number[][]>();
  for (const file of readdirSync(`${folder}/reports`).filter((file) =>
    /^lhr-.*\.json$/.test(file),
  )) {
    const report = JSON.parse(readFileSync(`${folder}/reports/${file}`, 'utf8'));
    const path = new URL(report.requestedUrl).pathname;
    const scores = ['performance', 'accessibility', 'best-practices', 'seo'].map((category) =>
      Math.round(report.categories[category].score * 100),
    );
    groups.set(path, [...(groups.get(path) ?? []), scores]);
  }
  for (const path of routes) {
    const scores = groups.get(path) ?? [];
    if (scores.length !== runs) failed = true;
    rows.push(
      `| ${profile} | ${path} | ${scores.map((run) => run.join('/')).join(' · ') || 'MISSING'} |`,
    );
  }
  writeFileSync(
    `${output}/scores.md`,
    `# Lighthouse scores\n\nP/A/BP/SEO, each cold run. Browser: ${chromium.executablePath()}.\n\n| Profile | Route | Runs |\n| --- | --- | --- |\n${rows.join('\n')}\n`,
  );
}
console.log(`Reports: ${output}`);
if (failed) process.exitCode = 1;

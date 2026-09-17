---
title: "Keep your Javascript dependencies under control"
description: "The best way to explore the size and content of your frontend."
date: "2019-03-04"
tags: ["javascript", "webpack", "webdev", "rails"]
devto: "https://dev.to/svyatov/keep-your-javascript-dependencies-under-control-4fkn"
---

With all the Javascript libraries and their dependencies these days it’s easy to get carried away and lost track of how heavy your frontend is.

Here is a great tool for Webpack backed applications: [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer). It shows the exact size (parsed and gzipped included) of each dependency you put inside your `package.json` file.

And here is an example of how to add it to your Rails project.

First, we need to add it to the `package.json`:

```bash
# Save the package to your `devDependencies`
yarn add -D webpack-bundle-analyzer
```

Second, add this to your `config/webpack/environment.js` file, right before `module.exports = environment;` line:

```javascript
if (process.env.ANALYZE_BUNDLE) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  environment.plugins.append('BundleAnalyzer', new BundleAnalyzerPlugin());
}
```

Third, make it available as `yarn/npm run` task:

```javascript
// package.json
{
  // ...
  "scripts": {
    // ...
    "analyze": "ANALYZE_BUNDLE=true RAILS_ENV=production ./bin/webpack"
  },
  // ...
}
```

Done. You can run it like this now:

```bash
yarn run analyze
```

Happy keeping your Javascript dependencies under control! :)

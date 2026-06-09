#!/usr/bin/env node
'use strict';

const { ghAvailable, getRepos, getReviewPRs, formatText, formatJSON, formatMarkdown, parseArgs, HELP } = require('./src/index');

const opts = parseArgs(process.argv);

if (opts.help) {
  console.log(HELP);
  process.exit(0);
}

if (!ghAvailable()) {
  console.error('Error: gh CLI not found. Install from https://cli.github.com');
  process.exit(2);
}

try {
  let repos;
  if (opts.repo) {
    repos = [opts.repo];
  } else {
    repos = getRepos(opts.user);
  }

  const data = repos.map(repo => ({ repo, prs: getReviewPRs(repo) }));
  let total = data.reduce((s, d) => s + d.prs.length, 0);

  let output;
  if (opts.format === 'json') output = formatJSON(data);
  else if (opts.format === 'markdown') output = formatMarkdown(data);
  else output = formatText(data);

  console.log(output);
  process.exit(total > 0 ? 1 : 0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(2);
}

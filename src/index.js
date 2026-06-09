'use strict';

const { execSync } = require('child_process');

function ghAvailable() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function runGh(args) {
  const out = execSync(`gh ${args}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  return out.trim();
}

function getRepos(user) {
  const flag = user ? `--user ${user}` : '--user @me';
  const out = runGh(`repo list ${user || '@me'} --limit 500 --json nameWithOwner,isFork --jq '.[] | select(.isFork == false) | .nameWithOwner'`);
  return out.split('\n').filter(Boolean);
}

function getReviewPRs(repo) {
  try {
    const out = runGh(`pr list --repo ${repo} --json number,title,author,createdAt,updatedAt,url,labels,isDraft,reviewDecision,additions,deletions,changedFiles --limit 50`);
    if (!out) return [];
    const prs = JSON.parse(out);
    // Only return PRs where review is pending or requested
    return prs.filter(pr => pr.reviewDecision !== 'APPROVED');
  } catch {
    return [];
  }
}

function daysSince(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / 86400000);
}

function formatDays(days) {
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function reviewIcon(decision) {
  if (decision === 'CHANGES_REQUESTED') return '🔄';
  if (decision === 'APPROVED') return '✅';
  return '⏳'; // REVIEW_REQUIRED or null
}

function formatText(data, opts = {}) {
  const lines = [];
  let total = 0;

  for (const { repo, prs } of data) {
    if (!prs.length) continue;
    total += prs.length;
    lines.push(`\n📦 ${repo} (${prs.length})`);
    for (const pr of prs) {
      const icon = reviewIcon(pr.reviewDecision);
      const age = daysSince(pr.updatedAt);
      const draft = pr.isDraft ? ' [draft]' : '';
      const labels = pr.labels.length ? ` [${pr.labels.map(l => l.name).join(', ')}]` : '';
      lines.push(`  ${icon} #${pr.number} ${pr.title}${draft}${labels}`);
      lines.push(`     by @${pr.author?.login || 'unknown'} · updated ${formatDays(age)} · +${pr.additions}/-${pr.deletions} (${pr.changedFiles} files)`);
      lines.push(`     ${pr.url}`);
    }
  }

  if (total === 0) {
    return 'No PRs awaiting your review 🎉';
  }

  lines.unshift(`Found ${total} PR${total === 1 ? '' : 's'} awaiting review across ${data.filter(d => d.prs.length).length} repos\n`);
  return lines.join('\n');
}

function formatJSON(data) {
  const flat = [];
  for (const { repo, prs } of data) {
    for (const pr of prs) {
      flat.push({
        repo,
        number: pr.number,
        title: pr.title,
        author: pr.author?.login || null,
        url: pr.url,
        isDraft: pr.isDraft,
        reviewDecision: pr.reviewDecision || 'REVIEW_REQUIRED',
        labels: pr.labels.map(l => l.name),
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        createdAt: pr.createdAt,
        updatedAt: pr.updatedAt,
        ageDays: daysSince(pr.updatedAt),
      });
    }
  }
  return JSON.stringify(flat, null, 2);
}

function formatMarkdown(data) {
  const lines = ['# PRs Awaiting Review\n'];
  let total = 0;

  for (const { repo, prs } of data) {
    if (!prs.length) continue;
    total += prs.length;
    lines.push(`## ${repo}\n`);
    for (const pr of prs) {
      const decision = pr.reviewDecision || 'REVIEW_REQUIRED';
      const age = daysSince(pr.updatedAt);
      const draft = pr.isDraft ? ' *(draft)*' : '';
      const labels = pr.labels.length ? ` — ${pr.labels.map(l => `\`${l.name}\``).join(' ')}` : '';
      lines.push(`- [#${pr.number} ${pr.title}](${pr.url})${draft}${labels}`);
      lines.push(`  **${decision}** · @${pr.author?.login || 'unknown'} · ${formatDays(age)} · +${pr.additions}/-${pr.deletions}`);
    }
    lines.push('');
  }

  if (total === 0) return 'No PRs awaiting your review.';
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { format: 'text' };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--repo':
        opts.repo = args[++i];
        break;
      case '--user':
        opts.user = args[++i];
        break;
      case '--json':
        opts.format = 'json';
        break;
      case '--markdown':
        opts.format = 'markdown';
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
    }
  }
  return opts;
}

const HELP = `
gh-review — PRs awaiting your review across GitHub repos

Usage:
  gh-review              Show all PRs needing your review
  gh-review --repo owner/repo   Check a specific repo
  gh-review --user someone      Check another user's repos
  gh-review --json              JSON output
  gh-review --markdown          Markdown output
`;

module.exports = { ghAvailable, getRepos, getReviewPRs, daysSince, formatDays, reviewIcon, formatText, formatJSON, formatMarkdown, parseArgs, HELP };

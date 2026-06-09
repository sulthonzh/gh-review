import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { daysSince, formatDays, reviewIcon, formatText, formatJSON, formatMarkdown, parseArgs, HELP } from '../src/index.js';

describe('daysSince', () => {
  it('returns 0 for today', () => {
    assert.equal(daysSince(new Date().toISOString()), 0);
  });
  it('returns 1 for yesterday', () => {
    const d = new Date(Date.now() - 86400000);
    assert.equal(daysSince(d.toISOString()), 1);
  });
  it('returns correct days for past date', () => {
    const d = new Date(Date.now() - 5 * 86400000);
    assert.equal(daysSince(d.toISOString()), 5);
  });
});

describe('formatDays', () => {
  it('formats 0 as today', () => assert.equal(formatDays(0), 'today'));
  it('formats 1', () => assert.equal(formatDays(1), '1 day ago'));
  it('formats plural', () => assert.equal(formatDays(7), '7 days ago'));
});

describe('reviewIcon', () => {
  it('changes requested', () => assert.equal(reviewIcon('CHANGES_REQUESTED'), '🔄'));
  it('approved', () => assert.equal(reviewIcon('APPROVED'), '✅'));
  it('review required', () => assert.equal(reviewIcon('REVIEW_REQUIRED'), '⏳'));
  it('null', () => assert.equal(reviewIcon(null), '⏳'));
});

function makePR(overrides = {}) {
  return {
    number: 42,
    title: 'Fix bug',
    author: { login: 'dev' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: 'https://github.com/owner/repo/pull/42',
    labels: [],
    isDraft: false,
    reviewDecision: 'REVIEW_REQUIRED',
    additions: 10,
    deletions: 5,
    changedFiles: 3,
    ...overrides,
  };
}

describe('formatText', () => {
  it('shows empty message when no PRs', () => {
    assert.ok(formatText([]).includes('No PRs'));
  });
  it('shows repo and PR details', () => {
    const data = [{ repo: 'owner/repo', prs: [makePR()] }];
    const out = formatText(data);
    assert.ok(out.includes('owner/repo'));
    assert.ok(out.includes('#42'));
    assert.ok(out.includes('Fix bug'));
    assert.ok(out.includes('@dev'));
  });
  it('shows draft and labels', () => {
    const data = [{ repo: 'o/r', prs: [makePR({ isDraft: true, labels: [{ name: 'bug' }] })] }];
    const out = formatText(data);
    assert.ok(out.includes('[draft]'));
    assert.ok(out.includes('[bug]'));
  });
});

describe('formatJSON', () => {
  it('outputs valid JSON array', () => {
    const data = [{ repo: 'o/r', prs: [makePR()] }];
    const parsed = JSON.parse(formatJSON(data));
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].number, 42);
  });
  it('empty data gives empty array', () => {
    const parsed = JSON.parse(formatJSON([]));
    assert.equal(parsed.length, 0);
  });
});

describe('formatMarkdown', () => {
  it('shows empty message when no PRs', () => {
    assert.ok(formatMarkdown([]).includes('No PRs'));
  });
  it('formats as markdown with links', () => {
    const data = [{ repo: 'o/r', prs: [makePR()] }];
    const out = formatMarkdown(data);
    assert.ok(out.includes('# PRs Awaiting Review'));
    assert.ok(out.includes('[#42 Fix bug]'));
    assert.ok(out.includes('REVIEW_REQUIRED'));
  });
  it('shows draft and labels', () => {
    const data = [{ repo: 'o/r', prs: [makePR({ isDraft: true, labels: [{ name: 'enhancement' }, { name: 'wip' }] })] }];
    const out = formatMarkdown(data);
    assert.ok(out.includes('(draft)'));
    assert.ok(out.includes('`enhancement`'));
  });
});

describe('parseArgs', () => {
  it('defaults to text format', () => {
    assert.equal(parseArgs([]).format, 'text');
  });
  it('parses --json', () => {
    assert.equal(parseArgs(['node', 'cli', '--json']).format, 'json');
  });
  it('parses --markdown', () => {
    assert.equal(parseArgs(['node', 'cli', '--markdown']).format, 'markdown');
  });
  it('parses --repo', () => {
    assert.equal(parseArgs(['node', 'cli', '--repo', 'o/r']).repo, 'o/r');
  });
  it('parses --user', () => {
    assert.equal(parseArgs(['node', 'cli', '--user', 'bob']).user, 'bob');
  });
  it('parses --help', () => {
    assert.equal(parseArgs(['node', 'cli', '--help']).help, true);
  });
  it('parses -h', () => {
    assert.equal(parseArgs(['node', 'cli', '-h']).help, true);
  });
  it('unknown args are ignored', () => {
    const opts = parseArgs(['node', 'cli', '--unknown']);
    assert.equal(opts.format, 'text');
  });
});

describe('HELP', () => {
  it('contains usage info', () => {
    assert.ok(HELP.includes('gh-review'));
    assert.ok(HELP.includes('--json'));
  });
});

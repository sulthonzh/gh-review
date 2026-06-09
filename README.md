# gh-review

PRs awaiting your review, across all your GitHub repos, in one command.

Because checking each repo manually is a waste of time.

## Install

```bash
npm install -g gh-review
```

Requires [gh CLI](https://cli.github.com) with auth configured (`gh auth login`).

## Usage

```bash
# Show all PRs needing your review
gh-review

# Check a specific repo
gh-review --repo owner/repo

# Check someone else's repos
gh-review --user teammate

# Output formats
gh-review --json
gh-review --markdown
```

## Why

I got tired of missing PR reviews because they were spread across 30+ repos. This shows you everything in one shot — what needs review, what's been sitting there for days, and what's a draft.

## Exit Codes

- `0` — no PRs awaiting review (you're free!)
- `1` — PRs found that need attention
- `2` — error (gh not installed, auth issue, etc.)

## License

MIT

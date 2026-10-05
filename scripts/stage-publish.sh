#!/usr/bin/env bash
# Stages every workspace package whose package.json version isn't on npm
# yet. Replaces `changeset publish`, which calls `npm publish`: NPM_TOKEN is
# a stage-only token (ADR 0003), so `npm publish` is refused with
# E_STAGE_REQUIRED. `npm stage` doesn't handle workspaces, so it runs inside
# each package's folder instead.
#
# Nothing goes live until a maintainer approves each stage with 2FA:
#   npm login && npm stage list && npm stage approve <stage-id> --otp=<code>
set -euo pipefail

staged=0

for dir in packages/*/; do
  name=$(node -p "require('./${dir}package.json').name")
  version=$(node -p "require('./${dir}package.json').version")
  private=$(node -p "require('./${dir}package.json').private === true")

  if [ "$private" = "true" ]; then
    echo "skip  ${name} (private)"
    continue
  fi

  # `npm view` prints nothing (and exits non-zero on E404) when the version,
  # or the whole package, isn't published yet.
  if [ -n "$(npm view "${name}@${version}" version 2>/dev/null || true)" ]; then
    echo "skip  ${name}@${version} (already on npm)"
    continue
  fi

  echo "stage ${name}@${version}"
  (cd "$dir" && npm stage publish --access public)
  staged=$((staged + 1))
done

echo
if [ "$staged" -eq 0 ]; then
  echo "Nothing to stage: every package version is already on npm."
else
  echo "Staged ${staged} package(s). Approve each with 2FA:"
  echo "  npm login && npm stage list && npm stage approve <stage-id> --otp=<code>"
fi

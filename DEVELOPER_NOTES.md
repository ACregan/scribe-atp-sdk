# Developer Notes

Practical reference for day-to-day development on the Scribe ATP SDK.

---

## Making and releasing changes

This monorepo uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs. The golden rule: **every code change that should be released needs a changeset file to go with it.**

### 1. Make your code changes

`main` is a protected branch — all changes must go through a feature branch and merge request. Work in a branch:

```bash
git checkout -b feat/my-change
```

Edit files in the relevant package (`packages/core`, `packages/react`, `packages/angular`, etc.), write tests, etc.

### 2. Create a changeset

Once your changes are ready (before or during your commit):

```bash
npx changeset
```

The CLI will ask you three things:

- **Which packages changed?** — use arrow keys + space to select. Pick every package you touched.
- **What kind of bump?**
  - `patch` — bug fix, no API change (e.g. `1.0.0` → `1.0.1`)
  - `minor` — new feature, backwards compatible (e.g. `1.0.0` → `1.1.0`)
  - `major` — breaking change (e.g. `1.0.0` → `2.0.0`)
- **Summary** — one line describing the change. This goes into the changelog.

This creates a small markdown file in `.changeset/`. Commit it alongside your code changes.

```bash
git add .changeset/
git commit -m "feat: add useSite hook"
```

### 3. When ready to release

Run the version command — this reads all pending changeset files, bumps the correct package versions, updates each package's `CHANGELOG.md`, and deletes the processed changeset files:

```bash
npx changeset version
```

Review the version bumps and changelogs, then commit:

```bash
git add .
git commit -m "chore: version packages"
```

### 4. Publish to npm

```bash
npx changeset publish
```

This publishes only the packages that had version bumps. It will use your local npm credentials (`npm whoami` to check you're logged in).

In CI, the pipeline handles this step automatically — you don't need to run it manually when merging to `main`.

### 5. Push and tag

Changesets publish creates git tags automatically (e.g. `@scribe-atp/core@1.0.0`). Push them:

```bash
git push --follow-tags
```

---

## Key commands

```bash
npm install                               # install all workspace deps
npm run build                             # build all packages
npm run test                              # run all tests
npm run typecheck                         # type-check all packages

npx changeset                             # create a changeset for your changes
npx changeset version                     # bump versions + update changelogs
npx changeset publish                     # publish changed packages to npm

npm -w packages/core run build            # build a single package
npm -w packages/angular run build         # build the angular package
npm run test -- --project=angular         # test a single vitest project
```

---

## What NOT to do

- **Don't manually edit version numbers** in `package.json` — let Changesets do it.
- **Don't forget the changeset file** — if you merge code without one, the change won't be included in the next release.
- **Don't run `npx changeset publish` locally** unless you specifically need to — the CI pipeline handles production publishes.

---

## Checking what's pending

To see which changesets are queued up (not yet versioned):

```bash
npx changeset status
```

To see what would be published without actually publishing:

```bash
npx changeset status --verbose
```

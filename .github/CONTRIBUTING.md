# Contributing to Smarter Chat

Smarter Chat is released under the [GNU Affero General Public License v3.0 or later](../LICENSE), and follows a
standard GitHub workflow: issues in the GitHub tracker, and pull requests into `alpha`, which is merged into `main` for
each release. The [developer guide](https://docs.smarter.sh/en/latest/smarter-framework/smarter-chat/development.html)
explains the component's architecture; this file covers the workflow.

## Getting started

This repository is self-contained: clone it, and its Makefile does the rest. The Smarter backend is optional.

```console
git clone https://github.com/smarter-sh/smarter-chat.git
cd smarter-chat
make init    # npm install
make serve   # Storybook, at http://localhost:6006
```

`make serve` browses the components in Storybook, whose stories mock the Smarter api with [MSW](https://mswjs.io/), so
no backend is needed. When the Smarter dev server is running at http://localhost:9357, the stories use the web
console's own stylesheets; without it, they use Bootstrap, which the web console's theme is built on.

| Command         | What it does                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `make init`     | Installs the dependencies.                                                                        |
| `make serve`    | Browses the components in Storybook, with the Smarter api mocked.                                 |
| `make run`      | Runs the app with Vite's dev server, proxying api requests to the Smarter dev server (port 9357). |
| `make build`    | Builds the app, with a Vite manifest for Django, and the npm package into `dist/`.                |
| `make test`     | Runs the unit tests (Vitest and React Testing Library). Every story is also rendered as a test.   |
| `make coverage` | Runs the unit tests with a coverage report in `coverage/`, which CI uploads to Codecov.           |
| `make lint`     | Lints with ESLint, type-checks with TypeScript, and checks formatting with Prettier.              |
| `make format`   | Formats the code with Prettier.                                                                   |
| `make release`  | Runs the tests, then builds the npm package into `dist/` and publishes it to npm.                 |

## Inside the Smarter repository

Smarter's web console hosts Smarter Chat as one of the React apps in its npm workspace. `make react-install`, in the
[Smarter repository](https://github.com/smarter-sh/smarter), clones this repository into
`smarter/react/packages/smarter-chat`, which Smarter's `.gitignore` excludes:

```console
git clone https://github.com/smarter-sh/smarter.git
cd smarter
make react-install                            # clones smarter-chat's main branch
make react-install SMARTER_CHAT_BRANCH=alpha  # or another branch
```

The same `make` commands work there, in `smarter/react/packages/smarter-chat`, which is this repository's own git
working tree. Two differ: `make init` installs the whole workspace's dependencies, and `make build` builds the app into
the Smarter web console's static files, rather than into `build/`. The Smarter repository's `make react-test` and
`make react-lint`, and its GitHub Actions workflows, also test and lint Smarter Chat along with the other React apps.
Commit and push from inside `smarter/react/packages/smarter-chat`, never from the Smarter repository.

## Source

| Path                          | Contents                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `src/index.ts`                | The npm package's public api.                                                              |
| `src/main.tsx`, `src/App.tsx` | The app that the Smarter web console renders, configured by its root element's attributes. |
| `src/components/`             | `SmarterChat`, `Console`, `AppTitle` and `ErrorBoundary`, with their stories and tests.    |
| `src/lib/`                    | The Smarter api calls, the chat thread's messages, markdown, math, diagrams and cookies.   |
| `src/mocks/`                  | Example api data and MSW handlers, for the stories and tests.                              |
| `test/`                       | Vitest setup, the MSW server, and the helper that renders every story as a test.           |

## Making a change

1. Fork the repository, or branch from `alpha` if you have write access.
2. Make your change, with a story for any new visual state and a test for any new behavior. If the change depends on
   the Smarter api, add the response to `src/mocks/fixtures.ts`, copied from a real response.
3. Run `make lint` and `make test`.
4. Open a pull request into `alpha`.

## Commits, versions and releases

Run `make pre-commit-init` once per clone (the Smarter repository's `make react-install` does it when its virtual
environment is active). It installs two git hooks: pre-commit, which runs codespell, Prettier, ESLint and the standard
pre-commit-hooks checks, and commit-msg, which runs commitlint.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), as Smarter's do, because
[semantic-release](https://semantic-release.gitbook.io/) versions this package from them. On each push to `alpha`
(prereleases, e.g. `1.0.0-alpha.1`) and to `main`, `.github/workflows/pushMain.yml` determines the next version, writes
it to `package.json`, adds the release notes to `CHANGELOG.md`, tags the commit and creates a GitHub release. A release
on `main` is then merged back into `alpha`. `feat` commits are minor releases, `fix` and `perf` commits are patches, and
a `BREAKING CHANGE:` footer is a major release. See `release.config.cjs`.

semantic-release does not publish to npm itself. The GitHub release that it creates triggers
`.github/workflows/release.yml`, which checks out the release's tag, runs the tests, builds the library and the embed
script, checks the package (`npm run check:dist`), and publishes it with npm's trusted publishing and a provenance
statement: releases from `main` with the `latest` dist-tag, and prereleases with `alpha` or `beta`. `make release`
publishes by hand, if the workflow can't. `.github/workflows/build.yml` builds and checks the same package on every push
and pull request, and keeps the tarball as an artifact. npm displays the README of the published version, so README
changes appear on npmjs.com only after the next release.

## Code of Conduct

We expect all contributors to follow our [Code of Conduct](../CODE_OF_CONDUCT.md).

Thank you for considering contributing to Smarter Chat!

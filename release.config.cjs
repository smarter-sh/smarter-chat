/**
 * semantic-release: versions, the CHANGELOG.md and the GitHub releases of @smarter.sh/ui-chat, from
 * conventional commits. The same configuration as https://github.com/smarter-sh/smarter's, run by
 * .github/workflows/pushMain.yml. alpha and beta are prerelease branches.
 *
 * @semantic-release/npm writes the new version to package.json. It does not publish to npm
 * (npmPublish: false). Publish with `make release`. To publish automatically instead, set
 * npmPublish to true, and add an NPM_TOKEN secret to the repository.
 */
module.exports = {
  branches: ["main", "next", { name: "beta", prerelease: true }, { name: "alpha", prerelease: true }],
  dryRun: false,
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "docs", release: false },
          { type: "test", release: false },
          { type: "style", release: false },
          { type: "refactor", release: false },
        ],
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
        },
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "Features", hidden: false },
            { type: "fix", section: "Bug Fixes", hidden: false },
            { type: "refactor", section: "Refactoring", hidden: false },
            { type: "perf", section: "Performance", hidden: false },
          ],
        },
      },
    ],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
        changelogTitle: `# Change Log\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).\n\n`,
      },
    ],
    ["@semantic-release/npm", { npmPublish: false }],
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};

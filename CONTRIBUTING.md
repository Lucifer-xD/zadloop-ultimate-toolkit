# Contributing

Bug reports and focused pull requests are welcome.

1. Fork and clone the repository.
2. Use Node.js 22.19 or newer.
3. Run `npm ci --ignore-scripts`.
4. Make a narrowly scoped change.
5. Run `npm test` and `npm run check`.
6. Describe affected ZadLoop/DSH versions in the pull request.

Do not commit API keys, session exports, real conversation screenshots, credentials, or user data. Use the safe SVG mockups in `docs/images/` for documentation.

Computer Use changes belong in `packages/computer-use/`. Run its focused checks from that directory in an installed ZadLoop development environment, rebuild its vendor tarball, then update the exact `file:vendor/...` reference and toolkit tests together.

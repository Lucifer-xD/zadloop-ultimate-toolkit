# Architecture

The toolkit is a DSH managed bundle whose `cordis.patch.yml` activates seven feature packages. npm `bundledDependencies` embeds those packages and `fflate` inside the one release tarball.

```text
dsh-zadloop-ultimate-toolkit
├── @wasd258/dsh-context-surgery
├── dsh-zadloop-undo
├── dsh-zadloop-mode-switcher
├── dsh-zadloop-computer-use
├── dsh-zadloop-theme-studio
├── dsh-zadloop-session-transfer
└── fflate
```

DSH resolves the selected toolkit from the profile, walks its dependency closure, and exposes the child packages to the host and web client module loaders. Each feature keeps its own narrowly scoped host/client lifecycle and CSS namespace. Remote Control is the seventh component; it owns an authenticated fixed-target proxy and optional Cloudflare tunnel supervisor.

The auditable Computer Use and Remote Control sources live in `packages/computer-use/` and `packages/remote-control/`. Their deterministic release archives are stored in `vendor/` and embedded during `npm pack`; the source directories themselves are not duplicated inside the final tarball.

## Why a bundle instead of copied source

- Component boundaries and tests remain intact.
- Upstream Context Surgery attribution and license files remain inside its package.
- A feature can be upgraded by replacing one vendor tarball and changing one exact version.
- The public artifact still installs as one file and does not need the npm registry.

## Release verification

The test process checks:

1. The toolkit declares a valid `dsh.bundle.patch`.
2. Every feature row appears exactly once.
3. Every deterministic vendor archive is present.
4. `npm pack` embeds all eight dependencies.
5. An offline pnpm install from only the toolkit tarball succeeds.
6. DSH runtime resolution discovers all seven feature packages.
7. A separate web-profile smoke host binds successfully on a random loopback port.
8. A read-only Windows smoke captures a scaled desktop screenshot and verifies its coordinate metadata.

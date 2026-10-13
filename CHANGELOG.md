# Changelog

## 1.6.0 — 2026-10-13

- Upgrades Session Transfer to 1.2.0 with explicit, safe reconciliation for sessions that were continued independently on two computers.
- Keeps the current local timeline intact while storing the complete remote-only branch as a content-addressed JSONL attachment.
- Injects a structured remote transcript into the same session's next-turn model context, with fingerprint-based deduplication on repeated imports.
- Preserves the original refusal-first behavior: no divergent history is changed unless the user confirms **Preserve both branches**.
- Continues to require Git or file sync for workspace files, which are not contained in session archives.

## 1.5.0 — 2026-10-13

- Upgrades Session Transfer to 1.1.0 with safe fast-forward synchronization for session IDs that already exist.
- Appends only missing events when local history is an exact prefix, leaves newer local sessions unchanged, and refuses true two-sided divergence.
- Supports synchronization while the target session is live and handles equivalent cross-computer resume events whose timestamps differ.
- Fixes seeded subagent restoration by preserving the inherited-event boundary during import.
- Clarifies that session ZIPs include chat attachments but not the actual project directory; workspace changes should be synchronized with Git or a file-sync service.

## 1.4.1 — 2026-10-13

- Redesigns Remote Control around a one-click **Create secure remote link** flow.
- Automatically detects or installs `cloudflared`, generates a strong access code, starts a Quick Tunnel, and presents a single copyable invite.
- Moves local, LAN/IP, manual Quick Tunnel, and custom-domain settings under Advanced setup.
- Keeps the generated access code only in the host renderer session and stores only its salted scrypt hash on disk.
- Adds tests for one-click generation, fixed-package installation, hash-only storage, and automatic tunnel startup.
- Isolates Quick Tunnels from existing `~/.cloudflared/config.yml` files so named-tunnel ingress rules cannot hijack the one-click link.

## 1.3.0 — 2026-10-12

- Adds authenticated full-interface Remote Control 2.0.0.
- Adds Local browser, LAN/IP, Cloudflare Quick Tunnel, and Cloudflare custom-domain modes.
- Adds a native **Remote** dock panel with live URLs, tunnel state, session count, session revocation, and one-click stop.
- Stores passphrases as salted scrypt hashes, rate-limits login attempts, isolates ZadLoop's upstream browser credential, and forbids passwordless network exposure.
- Preserves HTTP streaming and WebSocket transport so the complete ZadLoop interface works remotely.

## 1.2.0 — 2026-10-12

- Adds the agent-facing `computer_access` tool for status, enable, and pause operations.
- Allows the agent to enable Computer Use automatically for requested desktop tasks instead of asking the user to arm it.
- Keeps the toolbar timer, live status, expiry, and immediate in-flight action cancellation.

## 1.1.1 — 2026-10-12

- Fixes Computer Use activation in ZadLoop's live plugin loader.
- Removes the activation-time dependency on ZadLoop's internal `dsh-tools` package and registers the tool through the stable native contract.
- Keeps the same guarded screenshot, mouse, keyboard, and emergency-pause behavior.

## 1.1.0 — 2026-10-12

- Adds Computer Use 1.0.1 to the all-in-one bundle.
- Adds screenshot-grounded mouse, keyboard, drag, scroll, shortcut, cursor, and wait actions for Windows.
- Adds an explicit toolbar arm switch, 15–120 minute expiry, live status, and emergency pause that terminates in-flight automation.
- Adds Computer Use documentation, examples, security guidance, tests, and an illustrative control-center mockup.

## 1.0.0 — 2026-10-11

- First all-in-one release.
- Bundles Context Surgery fixed-v4, Same-session Undo 1.5.1, Mode Switcher 2.0.3, Theme Studio 5.0.3, Session Transfer 1.0.2, and `fflate` 0.8.3.
- Includes reload-safe compact dock controls.
- Adds deterministic offline installation and clean-profile smoke coverage.
- Adds feature documentation, safe UI mockups, workflow examples, security guidance, and contribution templates.

# Changelog

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

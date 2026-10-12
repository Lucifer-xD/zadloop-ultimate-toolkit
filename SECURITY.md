# Security policy

Please do not file public issues containing session archives, credentials, API keys, private prompts, reasoning traces, or attachment contents.

For a suspected vulnerability, open a private GitHub security advisory for this repository. Include the affected toolkit version, ZadLoop/DSH version, reproduction steps using synthetic data, and expected impact.

## Security boundaries

- Context Surgery's HTTP API is loopback-only but intentionally unauthenticated locally.
- Session Transfer never exports machine-wide credentials or provider login secrets.
- Imported ZIP files are treated as untrusted and validated before session creation.
- Undo and Context Surgery do not reverse tool side effects.
- Computer Use starts paused, grants expire after at most 120 minutes, grants are never persisted, and pausing terminates in-flight automation.
- Computer Use can interact with anything visible in the signed-in Windows desktop. Keep sensitive applications closed, supervise consequential actions, and never arm it for an untrusted prompt or session.
- Computer Use does not expose arbitrary shell execution, network access, or clipboard reads; it is limited to screenshots, cursor movement, mouse buttons, scrolling, Unicode typing, documented key chords, and waiting.

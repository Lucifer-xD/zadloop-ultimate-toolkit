# Security policy

Please do not file public issues containing session archives, credentials, API keys, private prompts, reasoning traces, or attachment contents.

For a suspected vulnerability, open a private GitHub security advisory for this repository. Include the affected toolkit version, ZadLoop/DSH version, reproduction steps using synthetic data, and expected impact.

## Security boundaries

- Context Surgery's HTTP API is loopback-only but intentionally unauthenticated locally.
- Session Transfer never exports machine-wide credentials or provider login secrets.
- Imported ZIP files are treated as untrusted and validated before session creation.
- Undo and Context Surgery do not reverse tool side effects.

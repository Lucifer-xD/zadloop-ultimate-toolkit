# ZadLoop Session Transfer

Lossless transfer of complete ZadLoop sessions between computers.

The **Transfer** control in the conversation dock can:

- export the current session, all descendant subagent sessions, full event history, and referenced attachments;
- import that archive into another ZadLoop installation;
- safely fast-forward a session that already exists when the imported history extends its current history;
- detect a true two-computer fork and, after explicit confirmation, preserve the complete remote branch as an attachment plus model-visible recovered context in the current session;
- preserve the session title, mode, model selection, access/permission events, messages, reasoning streams, tool calls/results, compaction history, plans, goals, and other session-scoped state;
- refresh ZadLoop's session list immediately after a successful import.

Imports preserve the original session IDs. Existing sessions are synchronized automatically when one history is an exact prefix of the other: missing events are appended and an already-newer local copy is left alone. If both computers continued the same session, the first pass refuses the conflict. The UI then offers an explicit **Preserve both branches** action. It leaves the local timeline intact, stores the complete remote-only event branch as a deduplicated JSONL attachment, and adds a structured transcript to the next-turn context so the model knows what happened remotely. Event timestamps are ignored only when identifying equivalent resume events created independently on two computers.

Session archives include referenced chat attachments, but they do **not** include the files in the session's working directory. Sync the project itself with Git, cloud storage, or another file-sync tool before resuming on the other computer. Machine-wide credentials, provider secrets, and global application preferences are never exported.

Maximum compressed import size: 384 MiB. Maximum expanded archive size: 768 MiB.

# ZadLoop Session Transfer

Lossless transfer of complete ZadLoop sessions between computers.

The **Transfer** control in the conversation dock can:

- export the current session, all descendant subagent sessions, full event history, and referenced attachments;
- import that archive into another ZadLoop installation;
- safely fast-forward a session that already exists when the imported history extends its current history;
- preserve the session title, mode, model selection, access/permission events, messages, reasoning streams, tool calls/results, compaction history, plans, goals, and other session-scoped state;
- refresh ZadLoop's session list immediately after a successful import.

Imports preserve the original session IDs. Existing sessions are synchronized only when one history is an exact prefix of the other: missing events are appended, an already-newer local copy is left alone, and independently diverged histories are refused instead of being corrupted. Event timestamps are ignored only when identifying equivalent resume events created independently on two computers.

Session archives include referenced chat attachments, but they do **not** include the files in the session's working directory. Sync the project itself with Git, cloud storage, or another file-sync tool before resuming on the other computer. Machine-wide credentials, provider secrets, and global application preferences are never exported.

Maximum compressed import size: 384 MiB. Maximum expanded archive size: 768 MiB.

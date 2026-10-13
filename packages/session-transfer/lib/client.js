window.__ModuleLoader__.load({
  id: "dsh-zadloop-session-transfer",
  factory: (require) => {
    const module = { exports: {} };
    const React = require("react");
    const ReactDOM = require("react-dom");
    const h = React.createElement;
    const inject = ["slots", "sessions", "sessionPaneNavigation"];
    const STYLE_ID = "zadloop-session-transfer-css";
    const STYLE_OWNER = Symbol("zadloop-session-transfer-style-owner");
    const EXPORT_ROUTE = "api/session.export";
    const IMPORT_ROUTE = "api/zadloop-session-transfer/import";

    const CSS = `
      .zst-launch,.zst-shell,.zst-shell *{box-sizing:border-box}
      .zst-launch{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;flex:0 0 auto!important;width:auto!important;height:22px!important;min-width:0!important;max-width:100%!important;min-height:22px!important;max-height:22px!important;gap:6px!important;margin:0!important;padding:1px 8px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:var(--dsw-alias-label-tertiary)!important;font:inherit!important;font-size:calc(var(--dsh-content-font-size-secondary,13px) - 1px)!important;line-height:20px!important;white-space:nowrap!important;appearance:none!important;cursor:pointer;transition:background 120ms ease,color 120ms ease}
      .zst-launch:hover,.zst-launch[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)!important;color:var(--dsw-alias-label-secondary)!important}
      .zst-launch:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}
      .zst-icon{display:inline-grid!important;place-items:center!important;flex:0 0 14px!important;width:14px!important;height:14px!important;min-width:14px!important;max-width:14px!important;min-height:14px!important;max-height:14px!important;line-height:0!important}.zst-icon svg{display:block!important;width:14px!important;height:14px!important;min-width:14px!important;max-width:14px!important;min-height:14px!important;max-height:14px!important;stroke:currentColor}
      .zst-overlay{position:fixed;inset:0;z-index:2147483100;display:grid;place-items:center;padding:18px;background:color-mix(in srgb,#080b12 68%,transparent);backdrop-filter:blur(12px);animation:zst-fade 140ms ease-out}
      .zst-shell{width:min(760px,calc(100vw - 36px));max-height:min(760px,calc(100dvh - 36px));overflow:auto;overscroll-behavior:contain;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 88%,white 12%);border-radius:20px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 30px 100px rgba(0,0,0,.5);animation:zst-rise 170ms cubic-bezier(.2,.75,.25,1)}
      .zst-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px 24px 18px;border-bottom:1px solid var(--dsw-alias-border-l2)}
      .zst-title{display:flex;align-items:center;gap:11px}.zst-title-mark{display:grid;place-items:center;width:34px;height:34px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary) 30%,var(--dsw-alias-border-l2));border-radius:11px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);color:var(--dsw-alias-state-business-primary)}.zst-title-mark svg{width:18px;height:18px;stroke:currentColor}
      .zst-head h2{margin:0;font-size:17px;line-height:22px}.zst-head p{margin:3px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:17px}.zst-close{display:grid;place-items:center;width:30px;height:30px;padding:0;border:0;border-radius:9px;background:transparent;color:var(--dsw-alias-label-tertiary);font:400 22px/1 system-ui;cursor:pointer}.zst-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .zst-body{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:20px 24px}.zst-card{min-width:0;padding:18px;border:1px solid var(--dsw-alias-border-l2);border-radius:15px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 76%,transparent)}
      .zst-card-icon{display:grid;place-items:center;width:31px;height:31px;margin-bottom:12px;border-radius:9px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}.zst-card-icon svg{width:16px;height:16px;stroke:currentColor}.zst-card h3{margin:0 0 5px;font-size:14px}.zst-card p{min-height:54px;margin:0 0 15px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px}
      .zst-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;width:100%;min-height:34px;padding:7px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:600 11px/16px var(--dsw-font-family,system-ui);cursor:pointer;transition:transform 100ms ease,background 100ms ease,border-color 100ms ease}.zst-button:hover:not(:disabled){border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 50%,var(--dsw-alias-border-l2));background:var(--dsw-alias-interactive-bg-hover)}.zst-button:active:not(:disabled){transform:translateY(1px)}.zst-button:disabled{cursor:not-allowed;opacity:.52}.zst-button[data-primary=true]{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 58%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 15%,var(--dsw-alias-bg-layer-3))}
      .zst-drop{position:relative}.zst-drop[data-drag=true]{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 9%,var(--dsw-alias-bg-layer-2))}
      .zst-session{margin:0 24px;padding:11px 13px;border:1px solid var(--dsw-alias-border-l2);border-radius:11px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px}.zst-session strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:12px}
      .zst-status{margin:14px 24px 0;padding:11px 13px;border:1px solid var(--dsw-alias-border-l2);border-radius:11px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:17px}.zst-status[data-error=true]{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 45%,var(--dsw-alias-border-l2));color:var(--dsw-alias-state-error-primary,#e5484d)}.zst-status[data-success=true]{border-color:color-mix(in srgb,#3cb179 45%,var(--dsw-alias-border-l2));color:#54c991}
      .zst-foot{padding:16px 24px 20px;color:var(--dsw-alias-label-caption);font-size:10px;line-height:16px}.zst-foot strong{color:var(--dsw-alias-label-tertiary)}
      @keyframes zst-fade{from{opacity:0}to{opacity:1}}@keyframes zst-rise{from{opacity:0;transform:translateY(6px) scale(.99)}to{opacity:1;transform:none}}
      @media(max-width:680px){.zst-body{grid-template-columns:1fr}.zst-card p{min-height:0}.zst-shell{border-radius:15px}.zst-head,.zst-body{padding-left:17px;padding-right:17px}.zst-session,.zst-status{margin-left:17px;margin-right:17px}.zst-foot{padding-left:17px;padding-right:17px}}
      @media(prefers-reduced-motion:reduce){.zst-overlay,.zst-shell{animation:none}.zst-launch,.zst-button{transition:none}}
    `;

    function ensureCss() {
      let style = document.getElementById(STYLE_ID);
      if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
      }
      style.textContent = CSS;
      style.__zstOwner = STYLE_OWNER;
      return style;
    }

    function useStore(store) {
      const subscribe = React.useCallback((listener) => store.subscribe(listener), [store]);
      const snapshot = React.useCallback(() => store.getSnapshot(), [store]);
      return React.useSyncExternalStore(subscribe, snapshot, snapshot);
    }

    function formatSize(bytes) {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
    }

    function safeName(value) {
      return String(value || "session").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 80) || "session";
    }

    function parseResponse(text, status) {
      try { return JSON.parse(text); }
      catch { return { ok: false, message: status === 404 ? "Session Transfer backend is not loaded yet." : `ZadLoop returned an invalid import response (${status}).` }; }
    }

    function Glyph({ kind, size = 16 }) {
      const common = { width: String(size), height: String(size), viewBox: "0 0 16 16", fill: "none", strokeWidth: "1.25", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
      if (kind === "download") return h("svg", common, h("path", { d: "M8 2v7m0 0 2.6-2.6M8 9 5.4 6.4M2.5 11.5v1.25c0 .4.35.75.75.75h9.5c.4 0 .75-.35.75-.75V11.5" }));
      if (kind === "upload") return h("svg", common, h("path", { d: "M8 10V3m0 0 2.6 2.6M8 3 5.4 5.6M2.5 11.5v1.25c0 .4.35.75.75.75h9.5c.4 0 .75-.35.75-.75V11.5" }));
      return h("svg", { ...common, width: String(size), height: String(size), style: { display: "block", width: size, height: size, minWidth: size, maxWidth: size } },
        h("rect", { x: "2.25", y: "2.5", width: "11.5", height: "11", rx: "2" }),
        h("path", { d: "M4.5 6h7m0 0L9.7 4.2M11.5 6 9.7 7.8M11.5 10h-7m0 0 1.8-1.8M4.5 10l1.8 1.8" }),
      );
    }

    function TransferDialog({ ctx, currentId, currentTitle, onClose }) {
      const inputRef = React.useRef(null);
      const [busy, setBusy] = React.useState(false);
      const [drag, setDrag] = React.useState(false);
      const [status, setStatus] = React.useState(null);

      React.useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const key = (event) => { if (event.key === "Escape" && !busy) onClose(); };
        window.addEventListener("keydown", key);
        return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", key); };
      }, [busy, onClose]);

      const startExport = () => {
        if (!currentId) { setStatus({ error: true, text: "Open a chat before exporting it." }); return; }
        const route = `${EXPORT_ROUTE}?${new URLSearchParams({ sessionId: currentId, includeDescendants: "true" })}`;
        const anchor = document.createElement("a");
        anchor.href = route;
        anchor.download = `${safeName(currentTitle)}.zadloop-session.zip`;
        anchor.click();
        setStatus({ success: true, text: "Full-session download started. Keep this ZIP unchanged for importing." });
      };

      const importFile = async (file) => {
        if (!file || busy) return;
        if (file.size > 384 * 1024 * 1024) { setStatus({ error: true, text: "That transfer is larger than the 384 MiB safety limit." }); return; }
        setBusy(true);
        setStatus({ text: `Importing ${file.name} (${formatSize(file.size)})...` });
        try {
          const response = await fetch(IMPORT_ROUTE, { method: "POST", headers: { "content-type": "application/zip" }, body: file });
          const result = parseResponse(await response.text(), response.status);
          if (!response.ok || !result.ok) throw new Error(result.message || `Import failed (${response.status}).`);
          await ctx.sessions.refresh();
          const changes = `${result.createdSessions} created, ${result.updatedSessions} updated, ${result.unchangedSessions} already current`;
          const details = `${result.eventsAdded} new event${result.eventsAdded === 1 ? "" : "s"}, ${result.attachments} attachment${result.attachments === 1 ? "" : "s"}`;
          const summary = result.eventsAdded === 0 && result.createdSessions === 0 ? "Already up to date" : "Session synchronized";
          setStatus({ success: true, text: `${summary}: “${result.title}” (${changes}; ${details}).` });
        } catch (error) {
          setStatus({ error: true, text: error instanceof Error ? error.message : String(error) });
        } finally {
          setBusy(false);
          if (inputRef.current) inputRef.current.value = "";
        }
      };

      const onDrop = (event) => {
        event.preventDefault();
        setDrag(false);
        importFile(event.dataTransfer.files?.[0]);
      };

      return ReactDOM.createPortal(h("div", { className: "zst-overlay", onMouseDown: (event) => event.target === event.currentTarget && !busy && onClose() },
        h("section", { className: "zst-shell", role: "dialog", "aria-modal": "true", "aria-label": "Session Transfer" },
          h("header", { className: "zst-head" }, h("div", { className: "zst-title" }, h("span", { className: "zst-title-mark" }, h(Glyph, { kind: "transfer", size: 18 })), h("div", null, h("h2", null, "Session Transfer"), h("p", null, "Move a complete ZadLoop chat between computers"))), h("button", { type: "button", className: "zst-close", onClick: onClose, disabled: busy, title: "Close", "aria-label": "Close Session Transfer" }, "×")),
          h("div", { className: "zst-session" }, h("strong", null, currentTitle || "No chat open"), currentId || "Open a chat to enable export."),
          status ? h("div", { className: "zst-status", role: status.error ? "alert" : "status", "data-error": status.error || undefined, "data-success": status.success || undefined }, status.text) : null,
          h("div", { className: "zst-body" },
            h("article", { className: "zst-card" }, h("span", { className: "zst-card-icon" }, h(Glyph, { kind: "download" })), h("h3", null, "Export this chat"), h("p", null, "Downloads the complete raw session, title, mode, model and access settings, reasoning, tool calls, subagents, attached files, and images."), h("button", { type: "button", className: "zst-button", "data-primary": true, disabled: !currentId || busy, onClick: startExport }, h(Glyph, { kind: "download" }), "Export complete chat")),
            h("article", { className: "zst-card zst-drop", "data-drag": drag || undefined, onDragOver: (event) => { event.preventDefault(); setDrag(true); }, onDragLeave: () => setDrag(false), onDrop }, h("span", { className: "zst-card-icon" }, h(Glyph, { kind: "upload" })), h("h3", null, "Import or sync a chat"), h("p", null, "Choose or drop a session ZIP. If this session already exists, only its missing newer events are added safely."), h("input", { ref: inputRef, type: "file", accept: ".zip,.zadloop-session.zip,application/zip", hidden: true, onChange: (event) => importFile(event.target.files?.[0]) }), h("button", { type: "button", className: "zst-button", disabled: busy, onClick: () => inputRef.current?.click() }, h(Glyph, { kind: "upload" }), busy ? "Synchronizing..." : "Choose transfer file"))
          ),
          h("footer", { className: "zst-foot" }, h("strong", null, "Chat sync only: "), "project/workspace files are not inside the session ZIP. Sync the project with Git or your file-sync service before resuming. Credentials and global ZadLoop preferences are never copied.")
        )
      ), document.body);
    }

    function Launcher({ ctx }) {
      const [open, setOpen] = React.useState(false);
      const sessions = useStore(ctx.sessions.list);
      const navigation = useStore(ctx.sessionPaneNavigation.state);
      const currentId = navigation.current;
      const summary = currentId ? sessions.byId[currentId] : undefined;
      const title = summary?.displayTitle || summary?.title || "Current chat";
      return h(React.Fragment, null,
        h("button", { type: "button", className: "zst-launch", onClick: () => setOpen(true), title: "Import or export a complete chat", "aria-haspopup": "dialog", "aria-expanded": open }, h("span", { className: "zst-icon" }, h(Glyph, { kind: "transfer", size: 14 })), h("span", null, "Transfer")),
        open ? h(TransferDialog, { ctx, currentId, currentTitle: title, onClose: () => setOpen(false) }) : null
      );
    }

    function apply(ctx) {
      const ownedStyle = ensureCss();
      ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
        name: "conversation.composer.dock",
        id: "zadloop-session-transfer",
        order: -40,
        label: "Session Transfer",
        inject: () => ({ ctx }),
      }, Launcher));
      ctx.effect(() => () => {
        // Keep this uniquely scoped stylesheet across profile bundle reloads. ZadLoop can
        // dispose the client instance while its dock component is still mounted.
        void ownedStyle;
      }, "zadloop-session-transfer: cleanup");
    }

    module.exports = { apply, inject };
    return module.exports;
  },
});

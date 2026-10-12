window.__ModuleLoader__.load({
  id: "dsh-zadloop-computer-use",
  factory: (require) => {
    const module = { exports: {} };
    const React = require("react");
    const ReactDOM = require("react-dom");
    const h = React.createElement;
    const inject = ["slots"];
    const STYLE_ID = "zadloop-computer-use-css";
    const API = "api/zadloop-computer-use/state";

    const CSS = `
      .zcu-root,.zcu-root *,.zcu-dialog,.zcu-dialog *{box-sizing:border-box}
      .zcu-launch{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;flex:0 0 auto!important;width:auto!important;height:22px!important;min-height:22px!important;max-height:22px!important;gap:6px!important;margin:0!important;padding:1px 8px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:var(--dsw-alias-label-tertiary)!important;font:inherit!important;font-size:calc(var(--dsh-content-font-size-secondary,13px) - 1px)!important;line-height:20px!important;white-space:nowrap!important;cursor:pointer!important;appearance:none!important;transition:background 120ms ease,color 120ms ease}
      .zcu-launch:hover,.zcu-launch[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)!important;color:var(--dsw-alias-label-secondary)!important}.zcu-launch:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}
      .zcu-icon{display:inline-grid!important;place-items:center!important;flex:0 0 14px!important;width:14px!important;height:14px!important;line-height:0!important}.zcu-icon svg{display:block!important;width:14px!important;height:14px!important;stroke:currentColor!important}
      .zcu-live{width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-label-caption);transition:background 120ms ease,box-shadow 120ms ease}.zcu-launch[data-armed=true] .zcu-live{background:#35c979;box-shadow:0 0 0 2px color-mix(in srgb,#35c979 18%,transparent)}
      .zcu-backdrop{position:fixed;z-index:2147482000;inset:0;display:grid;place-items:center;padding:24px;background:color-mix(in srgb,#000 46%,transparent);backdrop-filter:blur(4px);animation:zcu-fade 140ms ease-out}
      .zcu-dialog{width:min(520px,calc(100vw - 32px));max-height:min(720px,calc(100vh - 32px));overflow:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:18px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);box-shadow:0 24px 80px rgba(0,0,0,.35);font-family:var(--dsw-font-family,system-ui);animation:zcu-rise 160ms ease-out}
      .zcu-head{position:sticky;z-index:2;top:0;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 20px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 92%,transparent);backdrop-filter:blur(14px)}.zcu-title{display:flex;align-items:center;gap:12px}.zcu-hero-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-state-business-primary)}.zcu-hero-icon svg{width:19px;height:19px;stroke:currentColor}.zcu-title h2{margin:0;font-size:16px;line-height:22px}.zcu-title p{margin:2px 0 0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.zcu-close{display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:20px;line-height:1;cursor:pointer}.zcu-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .zcu-body{display:grid;gap:14px;padding:16px 20px 20px}.zcu-status{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 14px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}.zcu-status-copy{display:grid;gap:3px}.zcu-status-copy strong{font-size:13px}.zcu-status-copy span{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.zcu-pill{display:inline-flex;align-items:center;gap:6px;flex:none;padding:4px 8px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:10px;font-weight:650}.zcu-pill:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-caption)}.zcu-pill[data-armed=true]{color:#35c979;background:color-mix(in srgb,#35c979 11%,transparent)}.zcu-pill[data-armed=true]:before{background:#35c979;box-shadow:0 0 0 2px color-mix(in srgb,#35c979 15%,transparent)}
      .zcu-controls{display:flex;align-items:center;gap:8px}.zcu-select,.zcu-button{height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-specific-button-secondary,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-label-primary);font:600 11px/1 var(--dsw-font-family,system-ui)}.zcu-select{min-width:112px;padding:0 9px;cursor:pointer}.zcu-button{padding:0 13px;cursor:pointer;transition:transform 100ms ease,background 100ms ease}.zcu-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-solid);transform:translateY(-1px)}.zcu-button:disabled{opacity:.55;cursor:wait}.zcu-button[data-primary=true]{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 50%,var(--dsw-alias-border-l2));background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-foreground,#fff)}.zcu-button[data-danger=true]{border-color:color-mix(in srgb,#ef5a67 45%,var(--dsw-alias-border-l2));color:#ef6b76}
      .zcu-section{display:grid;gap:9px}.zcu-section h3{margin:0;color:var(--dsw-alias-label-secondary);font-size:11px;letter-spacing:.02em}.zcu-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.zcu-cap{padding:9px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:10px;line-height:14px}.zcu-cap strong{display:block;margin-bottom:2px;color:var(--dsw-alias-label-primary);font-size:11px}
      .zcu-note{padding:11px 12px;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 7%,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-secondary);font-size:10px;line-height:16px}.zcu-note strong{color:var(--dsw-alias-label-primary)}.zcu-error{padding:9px 11px;border:1px solid color-mix(in srgb,#ef5a67 40%,var(--dsw-alias-border-l2));border-radius:9px;color:#ef6b76;font-size:10px;line-height:15px}
      @keyframes zcu-fade{from{opacity:0}to{opacity:1}}@keyframes zcu-rise{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}@media(max-width:560px){.zcu-backdrop{padding:10px}.zcu-dialog{width:100%;max-height:calc(100vh - 20px)}.zcu-grid{grid-template-columns:repeat(2,1fr)}.zcu-status{align-items:flex-start;flex-direction:column}.zcu-controls{width:100%}.zcu-select,.zcu-button{flex:1}}@media(prefers-reduced-motion:reduce){.zcu-backdrop,.zcu-dialog{animation:none}.zcu-button,.zcu-launch{transition:none}}
    `;

    function ensureCss() {
      let style = document.getElementById(STYLE_ID);
      if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
      }
      style.textContent = CSS;
    }

    function ComputerIcon({ large = false }) {
      return h("svg", { width: large ? 19 : 14, height: large ? 19 : 14, viewBox: "0 0 20 20", fill: "none", strokeWidth: "1.45", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
        h("rect", { x: "2.5", y: "3", width: "15", height: "10.5", rx: "2" }),
        h("path", { d: "M7 17h6M10 13.5V17" }),
        h("path", { d: "m11.6 7.1 3.25 1.45-1.45.55.8 1.7-1.15.52-.78-1.68-1.18.98z" }),
      );
    }

    async function decodeResponse(response) {
      const text = await response.text();
      let body;
      try { body = JSON.parse(text); } catch { throw new Error(response.status === 404 ? "Computer Use backend is not loaded yet." : `Computer Use returned an invalid response (${response.status}).`); }
      if (!response.ok || body?.ok === false) throw new Error(body?.message || `Computer Use request failed (${response.status}).`);
      return body;
    }

    function remainingLabel(ms) {
      if (!(ms > 0)) return "Paused";
      const minutes = Math.max(1, Math.ceil(ms / 60_000));
      return `Armed for ${minutes} min`;
    }

    const CAPABILITIES = [
      ["See", "Fresh screenshot after every action"],
      ["Point", "Move, click, double-click, right-click"],
      ["Drag", "Smooth drag between screen coordinates"],
      ["Scroll", "Vertical and horizontal scrolling"],
      ["Type", "Unicode text without clipboard access"],
      ["Keys", "Shortcuts such as Ctrl+L and Alt+Tab"],
    ];

    function Panel({ state, setState, onClose }) {
      const [minutes, setMinutes] = React.useState(30);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState("");

      React.useEffect(() => {
        const onKey = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [onClose]);

      const update = async (enabled) => {
        setBusy(true);
        setError("");
        try {
          const next = await decodeResponse(await fetch(API, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ enabled, minutes }),
          }));
          setState(next);
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : String(reason));
        } finally {
          setBusy(false);
        }
      };

      const armed = state?.enabled === true;
      return h("div", { className: "zcu-backdrop", onMouseDown: (event) => { if (event.target === event.currentTarget) onClose(); } },
        h("section", { className: "zcu-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "zcu-title" },
          h("header", { className: "zcu-head" },
            h("div", { className: "zcu-title" }, h("span", { className: "zcu-hero-icon" }, h(ComputerIcon, { large: true })), h("div", null, h("h2", { id: "zcu-title" }, "Computer Use"), h("p", null, "Observable Windows control for your ZadLoop agent"))),
            h("button", { type: "button", className: "zcu-close", onClick: onClose, title: "Close", "aria-label": "Close Computer Use" }, "x"),
          ),
          h("div", { className: "zcu-body" },
            h("div", { className: "zcu-status" },
              h("div", { className: "zcu-status-copy" }, h("strong", null, armed ? "Desktop control is ready" : "Desktop control is paused"), h("span", null, armed ? "The agent can operate the visible desktop until the timer expires." : "The computer tool cannot move the mouse or type until you arm it.")),
              h("span", { className: "zcu-pill", "data-armed": armed }, remainingLabel(state?.remainingMs)),
            ),
            h("div", { className: "zcu-controls" },
              armed ? null : h("select", { className: "zcu-select", value: minutes, disabled: busy, onChange: (event) => setMinutes(Number(event.target.value)), "aria-label": "Arm duration" }, [15, 30, 60, 120].map((value) => h("option", { key: value, value }, `${value} minutes`))),
              h("button", { type: "button", className: "zcu-button", "data-primary": armed ? undefined : true, "data-danger": armed || undefined, disabled: busy, onClick: () => update(!armed) }, busy ? "Working..." : armed ? "Pause now" : "Arm computer control"),
            ),
            error ? h("div", { className: "zcu-error", role: "alert" }, error) : null,
            h("div", { className: "zcu-section" }, h("h3", null, "AVAILABLE ACTIONS"), h("div", { className: "zcu-grid" }, CAPABILITIES.map(([title, copy]) => h("div", { className: "zcu-cap", key: title }, h("strong", null, title), copy)))),
            h("div", { className: "zcu-note" }, h("strong", null, "How to use it: "), "arm control, then ask naturally: 'Open Settings and turn on Night light' or 'Use the browser to download the invoice.' The agent starts with a screenshot and checks the screen after every action."),
            h("div", { className: "zcu-note" }, h("strong", null, "Safety: "), "keep sensitive apps closed and pause before passwords, payments, account changes, or anything you do not want automated. Pausing also terminates an action already in progress."),
          ),
        ),
      );
    }

    function Launcher() {
      const [open, setOpen] = React.useState(false);
      const [state, setState] = React.useState({ enabled: false, remainingMs: 0 });

      const refresh = React.useCallback(async () => {
        try { setState(await decodeResponse(await fetch(API))); } catch { setState((current) => ({ ...current, enabled: false, remainingMs: 0 })); }
      }, []);

      React.useEffect(() => {
        refresh();
        const timer = window.setInterval(refresh, state.enabled ? 5_000 : 20_000);
        return () => window.clearInterval(timer);
      }, [refresh, state.enabled]);

      React.useEffect(() => {
        if (!state.enabled) return;
        const timer = window.setInterval(() => setState((current) => ({ ...current, remainingMs: Math.max(0, (current.remainingMs || 0) - 1_000), enabled: (current.remainingMs || 0) > 1_000 })), 1_000);
        return () => window.clearInterval(timer);
      }, [state.enabled]);

      return h("span", { className: "zcu-root" },
        h("button", { type: "button", className: "zcu-launch", "data-armed": state.enabled, onClick: () => setOpen(true), title: state.enabled ? "Computer Use is armed" : "Open Computer Use", "aria-haspopup": "dialog", "aria-expanded": open }, h("span", { className: "zcu-icon" }, h(ComputerIcon)), h("span", null, "Computer"), h("span", { className: "zcu-live", "aria-hidden": "true" })),
        open ? ReactDOM.createPortal(h(Panel, { state, setState, onClose: () => setOpen(false) }), document.body) : null,
      );
    }

    function apply(ctx) {
      ensureCss();
      ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
        name: "conversation.composer.dock",
        id: "zadloop-computer-use",
        order: -40,
        label: "Computer Use",
        inject: () => ({}),
      }, Launcher));
    }

    module.exports = { apply, inject };
    return module.exports;
  },
});

window.__ModuleLoader__.load({
  id: "dsh-zadloop-remote-control",
  factory: (require) => {
    const module = { exports: {} };
    const React = require("react");
    const ReactDOM = require("react-dom");
    const h = React.createElement;
    const inject = ["slots"];
    const API = "api/zadloop-remote-control";
    const STYLE_ID = "zadloop-remote-control-css";
    const CODE_KEY = "zadloop-remote-control-access-code";
    const CSS = `
      .zrc-root,.zrc-root *,.zrc-modal,.zrc-modal *{box-sizing:border-box}.zrc-launch{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;flex:0 0 auto!important;height:22px!important;min-height:22px!important;gap:6px!important;padding:1px 8px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:var(--dsw-alias-label-tertiary)!important;font:inherit!important;font-size:calc(var(--dsh-content-font-size-secondary,13px) - 1px)!important;line-height:20px!important;cursor:pointer!important;transition:color 160ms ease,background 160ms ease!important}.zrc-launch:hover,.zrc-launch[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)!important;color:var(--dsw-alias-label-secondary)!important}.zrc-launch svg{display:block;width:14px;height:14px;stroke:currentColor}.zrc-dot{width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-label-caption)}.zrc-launch[data-live=true] .zrc-dot{background:#42d892;box-shadow:0 0 0 3px color-mix(in srgb,#42d892 18%,transparent),0 0 10px #42d89266}
      .zrc-modal{--zrc-accent:var(--dsw-alias-state-business-primary,#70a0ff);--zrc-glass:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#171a20) 94%,transparent);--zrc-glass-soft:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#20242c) 86%,transparent);position:fixed;z-index:2147482500;inset:0;display:grid;place-items:center;padding:22px;overflow:hidden;background:radial-gradient(circle at 16% 8%,color-mix(in srgb,var(--zrc-accent) 25%,transparent),transparent 35%),radial-gradient(circle at 86% 88%,color-mix(in srgb,#b875ff 18%,transparent),transparent 38%),color-mix(in srgb,#06080d 76%,transparent);backdrop-filter:blur(22px) saturate(1.35);animation:zrc-fade 180ms ease-out}.zrc-modal:before,.zrc-modal:after{content:"";position:absolute;width:300px;height:300px;border-radius:50%;filter:blur(4px);pointer-events:none;opacity:.22}.zrc-modal:before{left:-110px;bottom:-140px;background:linear-gradient(135deg,#56cfff,#7b6cff)}.zrc-modal:after{right:-130px;top:-150px;background:linear-gradient(135deg,#ff8ac8,#9d7bff)}.zrc-dialog{position:relative;isolation:isolate;width:min(760px,calc(100vw - 28px));max-height:min(850px,calc(100dvh - 28px));overflow:auto;border:1px solid color-mix(in srgb,#fff 20%,var(--dsw-alias-border-l2));border-radius:26px;background:linear-gradient(145deg,color-mix(in srgb,#fff 10%,transparent),transparent 28%),var(--zrc-glass);color:var(--dsw-alias-label-primary);box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 22%,transparent),inset 0 -1px 0 color-mix(in srgb,#000 20%,transparent),0 32px 100px #0009,0 0 0 1px color-mix(in srgb,var(--zrc-accent) 8%,transparent);font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui);backdrop-filter:blur(42px) saturate(1.55);animation:zrc-rise 260ms cubic-bezier(.2,.8,.2,1)}.zrc-dialog:before{content:"";position:absolute;z-index:-1;inset:0;border-radius:inherit;background:radial-gradient(circle at 8% -6%,color-mix(in srgb,#fff 16%,transparent),transparent 29%);pointer-events:none}.zrc-head{position:sticky;z-index:3;top:0;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:21px 22px 17px;border-bottom:1px solid color-mix(in srgb,#fff 12%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--zrc-glass) 96%,transparent);backdrop-filter:blur(30px) saturate(1.45)}.zrc-title{display:flex;align-items:center;gap:13px}.zrc-badge{display:grid;place-items:center;width:42px;height:42px;border:1px solid color-mix(in srgb,#fff 22%,transparent);border-radius:14px;background:linear-gradient(145deg,color-mix(in srgb,#fff 19%,transparent),color-mix(in srgb,var(--zrc-accent) 20%,transparent));color:var(--zrc-accent);box-shadow:inset 0 1px 0 #ffffff2b,0 8px 24px color-mix(in srgb,var(--zrc-accent) 18%,transparent)}.zrc-badge svg{width:20px;height:20px;stroke:currentColor}.zrc-title h2{margin:0;font-size:17px;letter-spacing:-.02em}.zrc-title p{margin:4px 0 0;color:var(--dsw-alias-label-tertiary);font-size:11px}.zrc-close{display:grid;place-items:center;width:31px;height:31px;border:1px solid color-mix(in srgb,#fff 10%,transparent);border-radius:50%;background:color-mix(in srgb,var(--dsw-alias-bg-layer-3) 65%,transparent);color:var(--dsw-alias-label-secondary);font-size:19px;cursor:pointer;backdrop-filter:blur(10px);transition:transform 140ms ease,background 140ms ease}.zrc-close:hover{background:color-mix(in srgb,var(--dsw-alias-interactive-bg-hover) 75%,transparent);transform:scale(1.06)}
      .zrc-body{display:grid;gap:15px;padding:19px 22px 23px}.zrc-instant{position:relative;overflow:hidden;padding:24px;border:1px solid color-mix(in srgb,#fff 18%,var(--dsw-alias-border-l1));border-radius:21px;background:linear-gradient(135deg,color-mix(in srgb,var(--zrc-accent) 20%,transparent),transparent 48%),linear-gradient(155deg,color-mix(in srgb,#fff 10%,transparent),var(--zrc-glass-soft));box-shadow:inset 0 1px 0 #ffffff25,0 18px 45px #0002;backdrop-filter:blur(24px) saturate(1.35)}.zrc-instant:before,.zrc-instant:after{content:"";position:absolute;border-radius:50%;pointer-events:none}.zrc-instant:before{right:-50px;top:-90px;width:230px;height:230px;background:radial-gradient(circle,color-mix(in srgb,var(--zrc-accent) 28%,transparent),transparent 68%)}.zrc-instant:after{right:66px;bottom:-85px;width:170px;height:170px;background:radial-gradient(circle,color-mix(in srgb,#d98cff 14%,transparent),transparent 70%)}.zrc-instant-copy{position:relative;z-index:1;max-width:560px}.zrc-kicker{margin-bottom:8px;color:var(--zrc-accent);font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.zrc-instant h3{margin:0 0 8px;font-size:21px;line-height:27px;letter-spacing:-.025em}.zrc-instant p{margin:0;max-width:570px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px}.zrc-instant-button{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:9px;min-width:236px;height:43px;margin-top:18px;padding:0 18px;border:1px solid color-mix(in srgb,#fff 28%,transparent);border-radius:14px;background:linear-gradient(180deg,color-mix(in srgb,#fff 18%,transparent),transparent),var(--zrc-accent);color:var(--dsw-alias-label-primary-foreground,#fff);font:750 12px var(--dsw-font-family,system-ui);cursor:pointer;box-shadow:inset 0 1px 0 #ffffff45,0 10px 30px color-mix(in srgb,var(--zrc-accent) 30%,transparent);transition:transform 150ms ease,filter 150ms ease}.zrc-instant-button:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.06)}.zrc-instant-button:active:not(:disabled){transform:scale(.985)}.zrc-instant-button:disabled{opacity:.62;cursor:wait}.zrc-spark{font-size:15px}.zrc-tiny{position:relative;z-index:1;margin-top:10px;max-width:590px;color:var(--dsw-alias-label-tertiary);font-size:9px;line-height:14px}
      .zrc-live{display:grid;gap:13px;padding:18px;border:1px solid color-mix(in srgb,#45dc96 38%,#fff 10%);border-radius:20px;background:linear-gradient(140deg,color-mix(in srgb,#45dc96 13%,transparent),transparent 50%),var(--zrc-glass-soft);box-shadow:inset 0 1px 0 #ffffff20;backdrop-filter:blur(22px) saturate(1.3)}.zrc-live-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.zrc-live-title{display:flex;align-items:center;gap:10px}.zrc-live-dot{width:9px;height:9px;border-radius:50%;background:#45dc96;box-shadow:0 0 0 5px #45dc9618,0 0 14px #45dc9688;animation:zrc-pulse 2.4s ease-in-out infinite}.zrc-live h3{margin:0;font-size:14px}.zrc-live p{margin:4px 0 0;color:var(--dsw-alias-label-tertiary);font-size:10px}.zrc-pill{padding:5px 9px;border:1px solid #45dc9638;border-radius:999px;background:#45dc9614;color:#5ce4a3;font-size:9px;font-weight:800;letter-spacing:.07em}.zrc-share{display:grid;grid-template-columns:1fr 190px;gap:9px}.zrc-share-box{min-width:0;padding:11px 12px;border:1px solid color-mix(in srgb,#fff 13%,var(--dsw-alias-border-l1));border-radius:13px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 54%,transparent);box-shadow:inset 0 1px 0 #ffffff13}.zrc-share-box label{display:block;margin-bottom:6px;color:var(--dsw-alias-label-tertiary);font-size:8px;font-weight:750;letter-spacing:.09em;text-transform:uppercase}.zrc-share-value{overflow:hidden;color:var(--dsw-alias-label-primary);font:600 11px/16px ui-monospace,SFMono-Regular,Consolas,monospace;text-overflow:ellipsis;white-space:nowrap}.zrc-share-value[data-code=true]{letter-spacing:.04em}.zrc-wait{padding:12px;border:1px solid color-mix(in srgb,#fff 10%,transparent);border-radius:12px;background:var(--zrc-glass-soft);color:var(--dsw-alias-label-secondary);font-size:10px}.zrc-live-actions{display:flex;flex-wrap:wrap;gap:8px}
      .zrc-details{overflow:hidden;border:1px solid color-mix(in srgb,#fff 13%,var(--dsw-alias-border-l1));border-radius:16px;background:var(--zrc-glass-soft);box-shadow:inset 0 1px 0 #ffffff12;backdrop-filter:blur(18px)}.zrc-details>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px;color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:700;cursor:pointer;list-style:none}.zrc-details>summary::-webkit-details-marker{display:none}.zrc-details>summary:after{content:"›";color:var(--dsw-alias-label-tertiary);font-size:18px;transform:rotate(90deg);transition:transform 160ms}.zrc-details[open]>summary:after{transform:rotate(-90deg)}.zrc-advanced{display:grid;gap:14px;padding:0 15px 15px;border-top:1px solid color-mix(in srgb,#fff 10%,var(--dsw-alias-border-l1))}.zrc-modes{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding-top:14px}.zrc-mode{min-height:68px;padding:10px;border:1px solid color-mix(in srgb,#fff 12%,var(--dsw-alias-border-l1));border-radius:13px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 55%,transparent);color:var(--dsw-alias-label-secondary);text-align:left;cursor:pointer;transition:transform 140ms ease,border-color 140ms ease,background 140ms ease}.zrc-mode:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--zrc-accent) 35%,var(--dsw-alias-border-l1))}.zrc-mode strong{display:block;margin-bottom:4px;color:var(--dsw-alias-label-primary);font-size:10px}.zrc-mode span{font-size:8px;line-height:12px}.zrc-mode[data-active=true]{border-color:color-mix(in srgb,var(--zrc-accent) 65%,#fff 12%);background:linear-gradient(145deg,color-mix(in srgb,var(--zrc-accent) 18%,transparent),var(--zrc-glass-soft));box-shadow:inset 0 1px 0 #ffffff20}.zrc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.zrc-field{display:grid;gap:6px}.zrc-field[data-wide=true]{grid-column:1/-1}.zrc-field label{color:var(--dsw-alias-label-secondary);font-size:9px;font-weight:650}.zrc-field input,.zrc-field select{width:100%;height:37px;padding:0 11px;border:1px solid color-mix(in srgb,#fff 14%,var(--dsw-alias-border-l2));border-radius:11px;outline:0;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 62%,transparent);color:var(--dsw-alias-label-primary);font:10px var(--dsw-font-family,system-ui);box-shadow:inset 0 1px 0 #ffffff0e;transition:border-color 140ms ease,box-shadow 140ms ease}.zrc-field input:focus,.zrc-field select:focus{border-color:var(--zrc-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--zrc-accent) 15%,transparent),inset 0 1px 0 #ffffff12}.zrc-help{margin-top:-2px;color:var(--dsw-alias-label-tertiary);font-size:8px;line-height:13px}.zrc-security{padding:11px 12px;border:1px solid color-mix(in srgb,#fff 9%,transparent);border-radius:13px;background:color-mix(in srgb,var(--zrc-accent) 7%,var(--zrc-glass-soft));color:var(--dsw-alias-label-secondary);font-size:9px;line-height:15px}.zrc-security strong{color:var(--dsw-alias-label-primary)}.zrc-error{padding:11px 12px;border:1px solid #ef5a6766;border-radius:12px;background:#ef5a6710;color:#ff8c95;font-size:10px;line-height:15px}.zrc-actions{display:flex;justify-content:flex-end;gap:8px}.zrc-button{height:35px;padding:0 14px;border:1px solid color-mix(in srgb,#fff 15%,var(--dsw-alias-border-l2));border-radius:11px;background:color-mix(in srgb,var(--dsw-specific-button-secondary,var(--dsw-alias-bg-layer-3)) 65%,transparent);color:var(--dsw-alias-label-primary);font:650 10px var(--dsw-font-family,system-ui);cursor:pointer;box-shadow:inset 0 1px 0 #ffffff13;transition:transform 140ms ease,background 140ms ease}.zrc-button:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-interactive-bg-hover-solid) 74%,transparent);transform:translateY(-1px)}.zrc-button:disabled{opacity:.55;cursor:wait}.zrc-button[data-primary=true]{border-color:color-mix(in srgb,#fff 22%,transparent);background:linear-gradient(180deg,#ffffff18,transparent),var(--zrc-accent);color:var(--dsw-alias-label-primary-foreground,#fff);box-shadow:inset 0 1px 0 #ffffff30,0 7px 20px color-mix(in srgb,var(--zrc-accent) 23%,transparent)}.zrc-button[data-danger=true]{color:#ff858f}
      @keyframes zrc-fade{from{opacity:0}to{opacity:1}}@keyframes zrc-rise{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}@keyframes zrc-pulse{50%{box-shadow:0 0 0 7px #45dc960e,0 0 18px #45dc9699}}@media(prefers-reduced-motion:reduce){.zrc-modal,.zrc-dialog,.zrc-live-dot{animation:none}.zrc-button,.zrc-mode,.zrc-instant-button,.zrc-close{transition:none}}@media(max-width:650px){.zrc-modal{padding:8px}.zrc-dialog{width:100%;max-height:calc(100dvh - 16px);border-radius:20px}.zrc-head{padding:17px}.zrc-body{padding:15px 17px 18px}.zrc-instant{padding:19px}.zrc-modes{grid-template-columns:1fr 1fr}.zrc-grid,.zrc-share{grid-template-columns:1fr}.zrc-field[data-wide=true]{grid-column:auto}.zrc-live-head{align-items:flex-start;flex-direction:column}.zrc-live-actions{display:grid;grid-template-columns:1fr 1fr}.zrc-instant-button{width:100%}}
    `;

    function ensureCss() {
      let style = document.getElementById(STYLE_ID);
      if (!style) { style = document.createElement("style"); style.id = STYLE_ID; document.head.appendChild(style); }
      style.textContent = CSS;
    }

    function RemoteIcon({ large = false }) {
      return h("svg", { width: large ? 19 : 14, height: large ? 19 : 14, viewBox: "0 0 20 20", fill: "none", strokeWidth: "1.45", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
        h("rect", { x: "2.5", y: "3.25", width: "15", height: "9.5", rx: "2" }),
        h("path", { d: "M6.5 16.75h7M10 12.75v4" }),
        h("path", { d: "M7.1 8a4.2 4.2 0 0 1 5.8 0M8.5 9.5a2.15 2.15 0 0 1 3 0" }),
      );
    }

    async function api(body) {
      const response = await fetch(API, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
      const text = await response.text();
      let value;
      try { value = JSON.parse(text); } catch { throw new Error(`Remote Control returned an invalid response (${response.status}).`); }
      if (!response.ok || value?.ok === false) throw new Error(value?.message || `Remote Control failed (${response.status}).`);
      return value;
    }

    const MODES = [
      ["local", "Local browser", "This PC only"],
      ["lan", "LAN / IP", "Same network"],
      ["quick", "Quick Tunnel", "Temporary URL"],
      ["named", "Custom domain", "Named tunnel"],
    ];

    function Panel({ state, setState, onClose }) {
      const current = state?.config || {};
      const [form, setForm] = React.useState(() => ({ mode: current.mode || "local", port: current.port || 48911, sessionHours: current.sessionHours || 8, passphrase: "", binary: current.cloudflare?.binary || "", id: current.cloudflare?.id || "", hostname: current.cloudflare?.hostname || "", credentialsFile: current.cloudflare?.credentialsFile || "" }));
      const [busy, setBusy] = React.useState(false);
      const [busyText, setBusyText] = React.useState("");
      const [error, setError] = React.useState("");
      const [accessCode, setAccessCode] = React.useState(() => sessionStorage.getItem(CODE_KEY) || "");
      const update = (key, value) => setForm((before) => ({ ...before, [key]: value }));
      const publicUrl = state?.urls?.find((url) => url.startsWith("https://")) || state?.urls?.[0] || "";

      React.useEffect(() => {
        const onKey = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [onClose]);

      const act = async (body, label = "Working…") => {
        setBusy(true); setBusyText(label); setError("");
        try { const next = await api(body); setState(next); return next; }
        catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); return undefined; }
        finally { setBusy(false); setBusyText(""); }
      };

      const createInstant = async () => {
        const next = await act({ operation: "quick_start" }, "Creating your secure link…");
        if (next?.accessCode) { setAccessCode(next.accessCode); sessionStorage.setItem(CODE_KEY, next.accessCode); }
      };
      const stop = async () => {
        const next = await act({ operation: "stop" }, "Stopping…");
        if (next) { setAccessCode(""); sessionStorage.removeItem(CODE_KEY); }
      };
      const saveStart = () => act({ operation: "configure", start: true, mode: form.mode, port: Number(form.port), sessionHours: Number(form.sessionHours), ...(form.passphrase ? { passphrase: form.passphrase } : {}), cloudflare: { binary: form.binary, id: form.id, hostname: form.hostname, credentialsFile: form.credentialsFile } }, "Starting advanced setup…");
      const copyInvite = () => navigator.clipboard?.writeText(`${publicUrl}\nAccess code: ${accessCode}`);
      const cloud = form.mode === "quick" || form.mode === "named";
      const named = form.mode === "named";

      return h("div", { className: "zrc-modal", onMouseDown: (event) => { if (event.target === event.currentTarget) onClose(); } },
        h("section", { className: "zrc-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "zrc-title" },
          h("header", { className: "zrc-head" },
            h("div", { className: "zrc-title" }, h("span", { className: "zrc-badge" }, h(RemoteIcon, { large: true })), h("div", null, h("h2", { id: "zrc-title" }, "Remote Control"), h("p", null, "Open your full ZadLoop securely from any device"))),
            h("button", { type: "button", className: "zrc-close", onClick: onClose, "aria-label": "Close" }, "×"),
          ),
          h("div", { className: "zrc-body" },
            state?.running ? h("div", { className: "zrc-live" },
              h("div", { className: "zrc-live-head" }, h("div", { className: "zrc-live-title" }, h("span", { className: "zrc-live-dot" }), h("div", null, h("h3", null, "Remote access is ready"), h("p", null, `${state.sessions || 0} signed-in session${state.sessions === 1 ? "" : "s"} · ${state.mode} mode`))), h("span", { className: "zrc-pill" }, "LIVE")),
              publicUrl ? h("div", { className: "zrc-share" },
                h("div", { className: "zrc-share-box" }, h("label", null, "Remote link"), h("div", { className: "zrc-share-value", title: publicUrl }, publicUrl)),
                h("div", { className: "zrc-share-box" }, h("label", null, "Access code"), h("div", { className: "zrc-share-value", "data-code": true }, accessCode || "Hidden after restart")),
              ) : h("div", { className: "zrc-wait" }, state.tunnelState === "failed" ? `Cloudflare could not connect. ${state.tunnelMessage || "Stop and create a new link."}` : state.tunnelMessage ? `Cloudflare is reconnecting: ${state.tunnelMessage}` : "Cloudflare is creating the public link… this normally takes a few seconds."),
              !accessCode && state.mode === "quick" ? h("div", { className: "zrc-security" }, h("strong", null, "The access code is no longer available. "), "Stop this link and create a new one to generate another code.") : null,
              h("div", { className: "zrc-live-actions" },
                publicUrl && accessCode ? h("button", { type: "button", className: "zrc-button", "data-primary": true, onClick: copyInvite }, "Copy link + code") : null,
                publicUrl ? h("button", { type: "button", className: "zrc-button", onClick: () => window.open(publicUrl, "_blank", "noopener,noreferrer") }, "Open link") : null,
                h("button", { type: "button", className: "zrc-button", disabled: busy, onClick: () => act({ operation: "revoke" }, "Revoking…") }, "Revoke sessions"),
                h("button", { type: "button", className: "zrc-button", "data-danger": true, disabled: busy, onClick: stop }, "Stop"),
              ),
            ) : h("div", { className: "zrc-instant" },
              h("div", { className: "zrc-instant-copy" }, h("div", { className: "zrc-kicker" }, "Recommended · one click"), h("h3", null, "Create a secure remote link"), h("p", null, "No domain, router setup, port forwarding, or password creation. ZadLoop generates the access code and Cloudflare link for you.")),
              h("button", { type: "button", className: "zrc-instant-button", disabled: busy, onClick: createInstant }, h("span", { className: "zrc-spark", "aria-hidden": "true" }, "✦"), busy ? busyText : "Create secure remote link"),
              h("div", { className: "zrc-tiny" }, "Cloudflare Tunnel is installed automatically with Windows Package Manager if this PC does not already have it. Remote access remains password-protected."),
            ),
            !state?.running ? h("details", { className: "zrc-details" },
              h("summary", null, h("span", null, "Advanced setup · LAN, local browser, or custom domain")),
              h("div", { className: "zrc-advanced" },
                h("div", { className: "zrc-modes" }, MODES.map(([value, title, copy]) => h("button", { type: "button", className: "zrc-mode", "data-active": form.mode === value, disabled: busy, onClick: () => update("mode", value), key: value }, h("strong", null, title), h("span", null, copy)))),
                h("div", { className: "zrc-grid" },
                  h("div", { className: "zrc-field" }, h("label", null, "Listener port"), h("input", { type: "number", min: 1024, max: 65535, value: form.port, disabled: busy, onChange: (event) => update("port", event.target.value) })),
                  h("div", { className: "zrc-field" }, h("label", null, "Session lifetime"), h("select", { value: form.sessionHours, disabled: busy, onChange: (event) => update("sessionHours", event.target.value) }, [[1, "1 hour"], [8, "8 hours"], [24, "24 hours"], [168, "7 days"]].map(([value, label]) => h("option", { value, key: value }, label)))),
                  h("div", { className: "zrc-field", "data-wide": true }, h("label", null, `${current.hasPassword ? "Replace remote passphrase" : "Remote passphrase"}${form.mode === "local" ? " (optional)" : ""}`), h("input", { type: "password", minLength: 12, maxLength: 256, value: form.passphrase, disabled: busy, autoComplete: "new-password", placeholder: current.hasPassword ? "Leave empty to keep the current passphrase" : "At least 12 characters", onChange: (event) => update("passphrase", event.target.value) }), h("div", { className: "zrc-help" }, form.mode === "local" ? "Passwordless access is allowed only on this PC." : "Required for every network or internet mode.")),
                  cloud ? h("div", { className: "zrc-field", "data-wide": true }, h("label", null, "cloudflared path (optional)"), h("input", { value: form.binary, disabled: busy, placeholder: "Auto-detect or auto-install", onChange: (event) => update("binary", event.target.value) })) : null,
                  named ? h(React.Fragment, null,
                    h("div", { className: "zrc-field" }, h("label", null, "Tunnel UUID"), h("input", { value: form.id, disabled: busy, placeholder: "00000000-0000-0000-0000-000000000000", onChange: (event) => update("id", event.target.value) })),
                    h("div", { className: "zrc-field" }, h("label", null, "Public hostname"), h("input", { value: form.hostname, disabled: busy, placeholder: "zadloop.example.com", onChange: (event) => update("hostname", event.target.value) })),
                    h("div", { className: "zrc-field", "data-wide": true }, h("label", null, "Tunnel credentials JSON"), h("input", { value: form.credentialsFile, disabled: busy, placeholder: "C:\\Users\\You\\.cloudflared\\<tunnel-id>.json", onChange: (event) => update("credentialsFile", event.target.value) })),
                  ) : null,
                ),
                h("div", { className: "zrc-actions" }, h("button", { type: "button", className: "zrc-button", "data-primary": true, disabled: busy, onClick: saveStart }, busy ? busyText : "Save advanced setup & start")),
              ),
            ) : null,
            h("div", { className: "zrc-security" }, h("strong", null, "What the remote browser can control: "), "the complete ZadLoop interface—sessions, chat, settings, plugins, themes, transfer, modes, and agent tools. No separate raw shell endpoint is added."),
            error || state?.error ? h("div", { className: "zrc-error", role: "alert" }, error || state.error) : null,
          ),
        ),
      );
    }

    function Launcher() {
      const [open, setOpen] = React.useState(false);
      const [state, setState] = React.useState({ running: false, config: {} });
      const refresh = React.useCallback(async () => { try { setState(await api()); } catch {} }, []);
      React.useEffect(() => { refresh(); const timer = window.setInterval(refresh, state.running ? 2_000 : 15_000); return () => window.clearInterval(timer); }, [refresh, state.running]);
      return h("span", { className: "zrc-root" },
        h("button", { type: "button", className: "zrc-launch", "data-live": state.running, onClick: () => { setOpen(true); refresh(); }, title: state.running ? "Remote Control is online" : "Open Remote Control", "aria-haspopup": "dialog", "aria-expanded": open }, h(RemoteIcon), h("span", null, "Remote"), h("span", { className: "zrc-dot", "aria-hidden": "true" })),
        open ? ReactDOM.createPortal(h(Panel, { state, setState, onClose: () => setOpen(false) }), document.body) : null,
      );
    }

    function apply(ctx) {
      ensureCss();
      ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({ name: "conversation.composer.dock", id: "zadloop-remote-control", order: -39, label: "Remote Control", inject: () => ({}) }, Launcher));
    }
    module.exports = { apply, inject };
    return module.exports;
  },
});

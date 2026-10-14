window.__ModuleLoader__.load({
  id: "dsh-zadloop-toolkit-ui",
  factory: (require) => {
    const module = { exports: {} };
    const React = require("react");
    const h = React.createElement;
    const inject = ["slots", "connection"];
    const STYLE_ID = "zadloop-toolkit-ui-css";
    const USAGE_STORE = "dsh-plugin-oauth-subs.usage";

    const CSS = `
      .ztu-usage,.ztu-usage *{box-sizing:border-box}
      .ztu-usage,.zms-button,.zst-launch{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;flex:0 0 auto!important;width:auto!important;height:24px!important;min-width:0!important;max-width:100%!important;min-height:24px!important;max-height:24px!important;gap:6px!important;margin:0!important;padding:2px 8px!important;border:1px solid transparent!important;border-radius:7px!important;background:transparent!important;color:var(--dsw-alias-label-tertiary)!important;font:500 12px/18px var(--dsw-font-family,system-ui)!important;letter-spacing:0!important;white-space:nowrap!important;appearance:none!important;box-shadow:none!important;cursor:pointer;transition:background-color 120ms ease,border-color 120ms ease,color 120ms ease!important}
      .ztu-usage:hover,.zms-button:hover:not(:disabled),.zst-launch:hover,.zms-button[data-active=true],.zst-launch[aria-expanded=true]{border-color:color-mix(in srgb,currentColor 14%,transparent)!important;background:var(--dsw-alias-interactive-bg-hover)!important;color:var(--dsw-alias-label-secondary)!important}
      .ztu-usage:focus-visible,.zms-button:focus-visible,.zst-launch:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))!important;outline-offset:1px!important}
      .ztu-usage-icon,.zms-icon,.zst-icon{position:relative!important;display:inline-grid!important;place-items:center!important;flex:0 0 14px!important;width:14px!important;height:14px!important;min-width:14px!important;max-width:14px!important;min-height:14px!important;max-height:14px!important;line-height:0!important;overflow:hidden!important}
      .zms-icon svg,.zst-icon svg{display:none!important}
      .ztu-usage-icon::before,.zms-icon::before,.zst-icon::before{content:"";display:block;width:14px;height:14px;background:currentColor;mask-repeat:no-repeat;mask-position:center;mask-size:14px 14px;-webkit-mask-repeat:no-repeat;-webkit-mask-position:center;-webkit-mask-size:14px 14px}
      .ztu-usage-icon::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M4 13a8 8 0 1 1 16 0M12 13l4-5M6.5 17.5h11'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M4 13a8 8 0 1 1 16 0M12 13l4-5M6.5 17.5h11'/%3E%3C/svg%3E")}
      .zst-icon::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M7 7h13m-3-3 3 3-3 3M17 17H4m3 3-3-3 3-3'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M7 7h13m-3-3 3 3-3 3M17 17H4m3 3-3-3 3-3'/%3E%3C/svg%3E")}
      .zms-icon::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M6 3v12a3 3 0 0 0 3 3h9M15 15l3 3-3 3M18 3v7'/%3E%3Ccircle cx='6' cy='3' r='2' fill='none' stroke='black' stroke-width='1.8'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M6 3v12a3 3 0 0 0 3 3h9M15 15l3 3-3 3M18 3v7'/%3E%3Ccircle cx='6' cy='3' r='2' fill='none' stroke='black' stroke-width='1.8'/%3E%3C/svg%3E")}
      .zms-dot{display:none!important}
      .ztu-usage-value{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-weight:600}
      .ztu-usage-sep{width:1px;height:11px;background:color-mix(in srgb,currentColor 22%,transparent)}

      .osubs{max-width:1180px!important;padding:0 28px 28px!important;isolation:isolate}
      .osubs::before{content:"";position:absolute;inset:64px 0 0;z-index:-1;pointer-events:none;background:radial-gradient(700px 360px at 85% 4%,color-mix(in srgb,var(--osubs-accent) 7%,transparent),transparent 66%),radial-gradient(520px 300px at 3% 96%,color-mix(in srgb,#59c2ff 5%,transparent),transparent 72%)}
      .osubs-ptabs{height:60px!important;margin:0 -28px!important;padding:0 28px!important;gap:22px!important;background:color-mix(in srgb,var(--dsw-alias-bg-base,Canvas) 82%,transparent);backdrop-filter:blur(18px) saturate(120%);-webkit-backdrop-filter:blur(18px) saturate(120%)}
      .osubs-ptab{height:38px!important;font-size:12.5px!important}
      .osubs-body{gap:22px!important;padding-top:18px!important}
      .osubs-rail{flex-basis:210px!important;padding:9px!important;border:1px solid var(--osubs-line);border-radius:14px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,Canvas) 70%,transparent);box-shadow:0 1px 0 color-mix(in srgb,white 5%,transparent) inset}
      .osubs-rail-label{padding:2px 8px 7px!important}
      .osubs-rail-item{min-height:34px!important;border-radius:9px!important}
      .osubs-rail-item--on{background:color-mix(in srgb,var(--osubs-accent) 11%,var(--osubs-fill-2))!important;box-shadow:inset 2px 0 0 var(--osubs-accent)}
      .osubs-card{border-radius:16px!important;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,Canvas) 76%,transparent);box-shadow:0 1px 0 color-mix(in srgb,white 5%,transparent) inset,0 10px 30px color-mix(in srgb,black 7%,transparent);transition:border-color 140ms ease,transform 140ms ease,box-shadow 140ms ease}
      .osubs-card:hover{border-color:color-mix(in srgb,currentColor 22%,transparent);box-shadow:0 1px 0 color-mix(in srgb,white 7%,transparent) inset,0 14px 34px color-mix(in srgb,black 9%,transparent)}
      .osubs-card--legend .osubs-card-title{border-radius:6px;background:var(--dsw-alias-bg-layer-2,Canvas)!important}
      .osubs-acct,.osubs-qbox,.osubs-ustat{border-radius:12px!important;background:color-mix(in srgb,var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2,Canvas)) 70%,transparent)}
      .osubs-bar,.osubs-ubar{overflow:hidden;border-radius:999px!important}
      .osubs-pane{scrollbar-gutter:stable;padding-right:3px}
      @media(max-width:760px){.osubs{padding:0 16px 18px!important}.osubs-ptabs{margin:0 -16px!important;padding:0 16px!important;gap:16px!important;overflow-x:auto}.osubs-body{gap:12px!important}.osubs-rail{flex-basis:164px!important}.ztu-usage-label{display:none}}
      @media(prefers-reduced-motion:reduce){.ztu-usage,.zms-button,.zst-launch,.osubs-card{transition:none!important}}
    `;

    function ensureCss() {
      let style = document.getElementById(STYLE_ID);
      if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
      }
      style.textContent = CSS;
      return style;
    }

    function callRpc(rpc, method, payload = {}) {
      if (rpc && typeof rpc.call === "function") {
        return Promise.resolve(rpc.call("/oauth-subs-auth", method, payload)).then((result) => {
          if (result && typeof result === "object" && "ok" in result) {
            if (result.ok) return result.value;
            throw new Error(result.error?.message || "Subscription usage is unavailable");
          }
          return result;
        });
      }
      if (rpc && typeof rpc.request === "function") return rpc.request(`/oauth-subs-auth/${method}`, payload);
      const nested = rpc?.["/oauth-subs-auth"] ?? rpc?.oauthSubs;
      if (nested && typeof nested[method] === "function") return nested[method](payload);
      throw new Error("Subscription usage is unavailable");
    }

    function readStoredUsage() {
      try {
        const value = JSON.parse(localStorage.getItem(USAGE_STORE) || "null");
        return value && Array.isArray(value.rows) ? value : null;
      } catch {
        return null;
      }
    }

    function compact(value) {
      const n = Math.max(0, Number(value) || 0);
      if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 1 : 2).replace(/\.0+$/, "")}B`;
      if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.0+$/, "")}M`;
      if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 1 : 2).replace(/\.0+$/, "")}K`;
      return String(Math.round(n));
    }

    function summarize(data) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      let calls = 0;
      let tokens = 0;
      let cacheRead = 0;
      let prompt = 0;
      let failed = 0;
      for (const row of data?.rows || []) {
        if (!Array.isArray(row) || Number(row[0]) < start.getTime()) continue;
        calls += Number(row[3]) || 0;
        prompt += (Number(row[4]) || 0) + (Number(row[6]) || 0) + (Number(row[7]) || 0);
        tokens += (Number(row[4]) || 0) + (Number(row[5]) || 0) + (Number(row[6]) || 0) + (Number(row[7]) || 0);
        cacheRead += Number(row[6]) || 0;
        failed += Number(row[8]) || 0;
      }
      const cache = prompt > 0 ? Math.round((cacheRead / prompt) * 100) : null;
      return { calls, tokens, cache, failed };
    }

    function openUsageWorkbench() {
      const buttons = Array.from(document.querySelectorAll("button,[role='button']"));
      const launcher = buttons.find((element) => {
        const words = `${element.getAttribute("aria-label") || ""} ${element.getAttribute("title") || ""} ${element.textContent || ""}`.trim();
        return /subscriptions|oauth subscriptions|订阅/i.test(words) && !element.classList.contains("ztu-usage");
      });
      launcher?.click();
      window.setTimeout(() => {
        const tab = Array.from(document.querySelectorAll(".osubs-ptab,[role='tab']"))
          .find((element) => /^(usage|用量)$/i.test((element.textContent || "").trim()));
        tab?.click();
      }, 80);
    }

    function UsageDock({ ctx }) {
      const connection = ctx.get("connection");
      const rpc = connection?.rpc;
      const [usage, setUsage] = React.useState(readStoredUsage);
      const [available, setAvailable] = React.useState(true);

      React.useEffect(() => {
        let live = true;
        const load = async () => {
          try {
            const next = await callRpc(rpc, "usage");
            if (!live) return;
            const normalized = Array.isArray(next) ? { at: Date.now(), rows: next } : next;
            if (normalized && Array.isArray(normalized.rows)) {
              setUsage(normalized);
              setAvailable(true);
              try { localStorage.setItem(USAGE_STORE, JSON.stringify(normalized)); } catch { /* private mode */ }
            }
          } catch {
            if (live) setAvailable(false);
          }
        };
        void load();
        const timer = window.setInterval(load, 5 * 60_000);
        return () => { live = false; window.clearInterval(timer); };
      }, [rpc]);

      const summary = summarize(usage);
      const value = usage ? `${compact(summary.tokens)} tok` : "—";
      const details = usage
        ? `Today: ${compact(summary.tokens)} tokens · ${summary.calls} calls${summary.cache === null ? "" : ` · ${summary.cache}% cache hit`}${summary.failed ? ` · ${summary.failed} failed` : ""}. Open subscription usage.`
        : available ? "Loading today's subscription usage…" : "Subscription usage is unavailable. Open Subscriptions to check the connection.";
      return h("button", { type: "button", className: "ztu-usage", onClick: openUsageWorkbench, title: details, "aria-label": details },
        h("span", { className: "ztu-usage-icon", "aria-hidden": "true" }),
        h("span", { className: "ztu-usage-label" }, "Usage"),
        h("span", { className: "ztu-usage-sep", "aria-hidden": "true" }),
        h("span", { className: "ztu-usage-value" }, value),
      );
    }

    function apply(ctx) {
      ensureCss();
      ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
        name: "conversation.composer.dock",
        id: "zadloop-toolkit-usage",
        order: -38,
        label: "Subscription usage",
        inject: () => ({ ctx }),
      }, UsageDock));
    }

    module.exports = { apply, inject };
    return module.exports;
  },
});

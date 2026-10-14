window.__ModuleLoader__.load({
  id: "dsh-zadloop-toolkit-ui",
  factory: (require) => {
    const module = { exports: {} };
    const React = require("react");
    const h = React.createElement;
    const inject = ["slots", "connection"];
    const STYLE_ID = "zadloop-toolkit-ui-css";
    const STATUS_STORE = "dsh-plugin-oauth-subs.status";

    const CSS = `
      .ztu-quota,.ztu-quota *{box-sizing:border-box}
      .ztu-quota,.zms-button,.zst-launch{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;flex:0 0 auto!important;width:auto!important;height:24px!important;min-width:0!important;max-width:100%!important;min-height:24px!important;max-height:24px!important;gap:6px!important;margin:0!important;padding:2px 8px!important;border:1px solid transparent!important;border-radius:7px!important;background:transparent!important;color:var(--dsw-alias-label-tertiary)!important;font:500 12px/18px var(--dsw-font-family,system-ui)!important;letter-spacing:0!important;white-space:nowrap!important;appearance:none!important;box-shadow:none!important;cursor:pointer;transition:background-color 120ms ease,border-color 120ms ease,color 120ms ease!important}
      .ztu-quota:hover,.zms-button:hover:not(:disabled),.zst-launch:hover,.zms-button[data-active=true],.zst-launch[aria-expanded=true]{border-color:color-mix(in srgb,currentColor 14%,transparent)!important;background:var(--dsw-alias-interactive-bg-hover)!important;color:var(--dsw-alias-label-secondary)!important}
      .ztu-quota:focus-visible,.zms-button:focus-visible,.zst-launch:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))!important;outline-offset:1px!important}
      .ztu-quota-icon,.zms-icon,.zst-icon{position:relative!important;display:inline-grid!important;place-items:center!important;flex:0 0 14px!important;width:14px!important;height:14px!important;min-width:14px!important;max-width:14px!important;min-height:14px!important;max-height:14px!important;line-height:0!important;overflow:hidden!important}
      .zms-icon svg,.zst-icon svg{display:none!important}
      .ztu-quota-icon::before,.zms-icon::before,.zst-icon::before{content:"";display:block;width:14px;height:14px;background:currentColor;mask-repeat:no-repeat;mask-position:center;mask-size:14px 14px;-webkit-mask-repeat:no-repeat;-webkit-mask-position:center;-webkit-mask-size:14px 14px}
      .ztu-quota-icon::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M4 13a8 8 0 1 1 16 0M12 13l4-5M6.5 17.5h11'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M4 13a8 8 0 1 1 16 0M12 13l4-5M6.5 17.5h11'/%3E%3C/svg%3E")}
      .zst-icon::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M7 7h13m-3-3 3 3-3 3M17 17H4m3 3-3-3 3-3'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M7 7h13m-3-3 3 3-3 3M17 17H4m3 3-3-3 3-3'/%3E%3C/svg%3E")}
      .zms-icon::before{mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M6 3v12a3 3 0 0 0 3 3h9M15 15l3 3-3 3M18 3v7'/%3E%3Ccircle cx='6' cy='3' r='2' fill='none' stroke='black' stroke-width='1.8'/%3E%3C/svg%3E");-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M6 3v12a3 3 0 0 0 3 3h9M15 15l3 3-3 3M18 3v7'/%3E%3Ccircle cx='6' cy='3' r='2' fill='none' stroke='black' stroke-width='1.8'/%3E%3C/svg%3E")}
      .zms-dot{display:none!important}
      .ztu-quota-item{display:inline-flex;align-items:baseline;gap:3px}
      .ztu-quota-label{color:var(--dsw-alias-label-tertiary)}
      .ztu-quota-value{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-weight:650}
      .ztu-quota-value[data-tone="warn"]{color:#d99728}
      .ztu-quota-value[data-tone="bad"]{color:#e15d68}
      .ztu-quota-sep{width:1px;height:11px;background:color-mix(in srgb,currentColor 22%,transparent)}

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
      @media(max-width:760px){.osubs{padding:0 16px 18px!important}.osubs-ptabs{margin:0 -16px!important;padding:0 16px!important;gap:16px!important;overflow-x:auto}.osubs-body{gap:12px!important}.osubs-rail{flex-basis:164px!important}.ztu-quota-icon{display:none!important}}
      @media(prefers-reduced-motion:reduce){.ztu-quota,.zms-button,.zst-launch,.osubs-card{transition:none!important}}
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
            throw new Error(result.error?.message || "Subscription quota is unavailable");
          }
          return result;
        });
      }
      if (rpc && typeof rpc.request === "function") return rpc.request(`/oauth-subs-auth/${method}`, payload);
      const nested = rpc?.["/oauth-subs-auth"] ?? rpc?.oauthSubs;
      if (nested && typeof nested[method] === "function") return nested[method](payload);
      throw new Error("Subscription quota is unavailable");
    }

    function readStoredStatus() {
      try {
        const value = JSON.parse(localStorage.getItem(STATUS_STORE) || "null");
        return value && typeof value === "object" ? value : null;
      } catch {
        return null;
      }
    }

    function remainingPercent(row) {
      const direct = typeof row?.remainingPercent === "number" ? row.remainingPercent : Number.NaN;
      const used = typeof row?.usedPercent === "number" ? row.usedPercent : Number.NaN;
      const value = Number.isFinite(direct) ? direct : Number.isFinite(used) ? 100 - used : null;
      return value === null ? null : Math.max(0, Math.min(100, value));
    }

    function quotaSummary(snapshot) {
      const family = snapshot?.accounts?.codex;
      const accounts = Array.isArray(family?.accounts) ? family.accounts : [];
      const active = accounts.find((row) => row?.active)
        || accounts.find((row) => row?.id === family?.activeId)
        || (family?.loggedIn ? family : null);
      const quota = active?.quota || family?.quota;
      const rows = Array.isArray(quota?.rows) ? quota.rows : [];
      const primary = rows.find((row) => row?.kind === "primary" || row?.key === "primary" || Number(row?.windowMinutes) === 300);
      const weekly = rows.find((row) => row?.kind === "weekly" || row?.key === "weekly");
      return {
        fiveHour: remainingPercent(primary),
        weekly: remainingPercent(weekly),
        plan: quota?.planType || active?.planType || family?.planType || "",
        connected: Boolean(active || family?.loggedIn),
      };
    }

    function formatPercent(value) {
      if (value === null) return "—";
      const rounded = Math.round(value * 10) / 10;
      return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
    }

    function quotaTone(value) {
      if (value === null || value > 40) return undefined;
      return value <= 15 ? "bad" : "warn";
    }

    function openQuotaWorkbench() {
      const buttons = Array.from(document.querySelectorAll("button,[role='button']"));
      const launcher = buttons.find((element) => {
        const words = `${element.getAttribute("aria-label") || ""} ${element.getAttribute("title") || ""} ${element.textContent || ""}`.trim();
        return /subscriptions|oauth subscriptions|订阅/i.test(words) && !element.classList.contains("ztu-quota");
      });
      launcher?.click();
      window.setTimeout(() => {
        const tab = Array.from(document.querySelectorAll(".osubs-ptab,[role='tab']"))
          .find((element) => /^(quota|额度)$/i.test((element.textContent || "").trim()));
        tab?.click();
      }, 80);
    }

    function QuotaDock({ ctx }) {
      const connection = ctx.get("connection");
      const rpc = connection?.rpc;
      const [status, setStatus] = React.useState(readStoredStatus);
      const [available, setAvailable] = React.useState(true);

      React.useEffect(() => {
        let live = true;
        const load = async () => {
          try {
            const next = await callRpc(rpc, "status", { revalidateQuota: true });
            if (!live) return;
            if (next && typeof next === "object") {
              setStatus(next);
              setAvailable(true);
              try { localStorage.setItem(STATUS_STORE, JSON.stringify(next)); } catch { /* private mode */ }
            }
          } catch {
            if (live) setAvailable(false);
          }
        };
        void load();
        const timer = window.setInterval(load, 60_000);
        return () => { live = false; window.clearInterval(timer); };
      }, [rpc]);

      const summary = quotaSummary(status);
      const fiveHour = formatPercent(summary.fiveHour);
      const weekly = formatPercent(summary.weekly);
      const details = summary.connected
        ? `${summary.plan ? `${summary.plan} · ` : ""}Plan remaining: 5-hour ${fiveHour} · Weekly ${weekly}. Open quota details.`
        : available ? "Loading your plan's 5-hour and weekly remaining quota…" : "Plan quota is unavailable. Open Subscriptions to sign in or refresh the account.";
      return h("button", { type: "button", className: "ztu-quota", onClick: openQuotaWorkbench, title: details, "aria-label": details },
        h("span", { className: "ztu-quota-icon", "aria-hidden": "true" }),
        h("span", { className: "ztu-quota-item" },
          h("span", { className: "ztu-quota-label" }, "5h"),
          h("span", { className: "ztu-quota-value", "data-tone": quotaTone(summary.fiveHour) }, fiveHour),
        ),
        h("span", { className: "ztu-quota-sep", "aria-hidden": "true" }),
        h("span", { className: "ztu-quota-item" },
          h("span", { className: "ztu-quota-label" }, "Week"),
          h("span", { className: "ztu-quota-value", "data-tone": quotaTone(summary.weekly) }, weekly),
        ),
      );
    }

    function apply(ctx) {
      ensureCss();
      ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
        name: "conversation.composer.dock",
        id: "zadloop-toolkit-quota",
        order: -38,
        label: "Plan quota remaining",
        inject: () => ({ ctx }),
      }, QuotaDock));
    }

    module.exports = { apply, inject };
    return module.exports;
  },
});

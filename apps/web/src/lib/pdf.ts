// Exportação de PDF (via impressão do navegador) com a identidade Txai Tech / VendaPro.
// Todas as telas usam este módulo: cabeçalho com emblema, KPIs, tabelas e rodapé padronizados.

export const BRLpdf = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

// Escapa texto vindo do usuário (nome de produto, cliente...) — a janela de impressão é da mesma origem.
export const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))

const cfg = () => { try { return JSON.parse(localStorage.getItem("storeConfig") || "{}") } catch { return {} } }
export const storeNameLS = () => cfg().name || "Minha Loja"

// Mesmas cores das paletas em dashboard/settings (PALETTES) — o PDF segue a cor escolhida pela loja.
const PALETTE_COLOR: Record<string, string> = { emerald: "#2DBE60", indigo: "#6366F1", amber: "#F59E0B", crimson: "#E11D48", violet: "#8B5CF6", ocean: "#0EA5E9", rose: "#EC4899", graphite: "#94A3B8" }
function accent() {
  let id = cfg().palette
  try { id = localStorage.getItem("vp-palette") || id } catch {}
  return PALETTE_COLOR[id] || PALETTE_COLOR.emerald
}

export type Tone = "pos" | "neg" | "warn" | "muted" | undefined
export type Kpi = { label: string; value: string; sub?: string; tone?: Tone }
export type Col = { label: string; align?: "left" | "right" | "center" }
// Célula: texto simples (escapado) ou { html } já montado/escapado pelo chamador.
export type Cell = string | number | { html: string; tone?: Tone; strong?: boolean }

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:0}
html,body{background:#fff}
:root{--ad:color-mix(in srgb,var(--a) 38%,#0A0F0C);--at:color-mix(in srgb,var(--a) 72%,#000);--tint:color-mix(in srgb,var(--a) 12%,#fff);--soft:color-mix(in srgb,var(--a) 4%,#fff);--line:color-mix(in srgb,var(--a) 16%,#E4E7E5)}
body{font-family:"Geist","Segoe UI",Helvetica,Arial,sans-serif;color:#0F1A14;font-size:12px;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{padding:14mm 14mm 20mm;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.hd{display:flex;align-items:center;justify-content:space-between;gap:24px;padding-bottom:18px;border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:12px}
.brand img{width:46px;height:46px;border-radius:50%;display:block}
.bw{font-size:19px;font-weight:600;letter-spacing:-.3px;color:#0B3A1F}.bw b{color:#1F8A47;font-weight:700}
.sc{display:flex;align-items:center;gap:12px;margin-top:16px;padding:12px 14px;border-radius:10px;background:var(--tint)}
.av{width:34px;height:34px;border-radius:9px;background:var(--a);color:#fff;font-weight:700;font-size:13px;display:grid;place-items:center;flex-shrink:0}
.sn{font-size:14px;font-weight:700;color:var(--ad)}.sd{font-size:10.5px;color:#5B6B62;margin-top:1px}
.by{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#6B7F74;margin-top:1px}
.meta{text-align:right}
.tt{font-size:20px;font-weight:700;letter-spacing:-.4px;color:#0F1A14}
.st{font-size:11px;color:#5B6B62;margin-top:3px}
.kpis{display:grid;gap:10px;margin:20px 0 22px}
.kpi{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:var(--soft);break-inside:avoid}
.kl{font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#6B7F74;display:flex;align-items:center;gap:6px}.kl:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--a)}
.kv{font-size:19px;font-weight:700;letter-spacing:-.4px;margin-top:5px;font-variant-numeric:tabular-nums;white-space:nowrap}
.ks{font-size:10px;color:#6B7F74;margin-top:2px}
h2{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ad);margin:22px 0 8px;display:flex;align-items:center;gap:8px}
h2:before{content:"";width:4px;height:12px;border-radius:2px;background:var(--a)}
table.t{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:10px}
.t th:first-child{border-top-left-radius:9px}.t th:last-child{border-top-right-radius:9px}
.t thead{display:table-header-group}
.t th{background:var(--ad);color:#fff;font-size:9.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:9px 12px;text-align:left}
.t td{padding:8px 12px;border-top:1px solid var(--line);font-size:11.5px;vertical-align:middle}
.t tbody tr:nth-child(even) td{background:var(--soft)}
.t tr{break-inside:avoid}
.t .r{text-align:right}.t .c{text-align:center}
.num{font-variant-numeric:tabular-nums;white-space:nowrap}
.pos{color:#1F8A47}.neg{color:#D93B3B}.warn{color:#C27803}.muted{color:#6B7F74}
.b{font-weight:600}
.empty{padding:22px;text-align:center;color:#6B7F74}
.ft{position:fixed;bottom:0;left:0;right:0;height:14mm;padding:0 14mm;display:flex;align-items:center;justify-content:space-between;font-size:9.5px;color:#6B7F74;border-top:1px solid var(--line);background:#fff}
.ft img{width:14px;height:14px;border-radius:50%;vertical-align:-3px;margin-right:6px}
.ft b{color:var(--ad)}
`

const toneCls = (t: Tone) => (t ? ` ${t}` : "")

export function kpiGrid(kpis: Kpi[]) {
  if (!kpis.length) return ""
  return `<div class="kpis" style="grid-template-columns:repeat(${kpis.length},1fr)">${kpis
    .map(k => `<div class="kpi"><div class="kl">${esc(k.label)}</div><div class="kv${toneCls(k.tone)}">${esc(k.value)}</div>${k.sub ? `<div class="ks">${esc(k.sub)}</div>` : ""}</div>`)
    .join("")}</div>`
}

export function table(cols: Col[], rows: Cell[][], title?: string) {
  const al = (c?: Col) => (c?.align === "right" ? ' class="r num"' : c?.align === "center" ? ' class="c"' : "")
  const head = cols.map(c => `<th${c.align === "right" ? ' class="r"' : c.align === "center" ? ' class="c"' : ""}>${esc(c.label)}</th>`).join("")
  const body = rows.length
    ? rows.map(r => `<tr>${r.map((cell, i) => {
        if (cell && typeof cell === "object") {
          const cls = [cols[i]?.align === "right" ? "r num" : cols[i]?.align === "center" ? "c" : "", cell.tone || "", cell.strong ? "b" : ""].filter(Boolean).join(" ")
          return `<td${cls ? ` class="${cls}"` : ""}>${cell.html}</td>`
        }
        return `<td${al(cols[i])}>${esc(cell)}</td>`
      }).join("")}</tr>`).join("")
    : `<tr><td colspan="${cols.length}" class="empty">Nenhum registro no período.</td></tr>`
  return `${title ? `<h2>${esc(title)}</h2>` : ""}<table class="t"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

// Abre a janela de impressão. Usa onload para só imprimir depois que o emblema carregar.
export function printDoc(docTitle: string, bodyHtml: string, extraCss = "") {
  const w = window.open("", "_blank")
  if (!w) { alert("Permita pop-ups para exportar o PDF."); return }
  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${esc(docTitle)}</title><style>:root{--a:${accent()}}${CSS}${extraCss}</style></head><body>${bodyHtml}<script>window.onload=function(){setTimeout(function(){window.focus();window.print()},150)}<\/script></body></html>`)
  w.document.close()
}

export function exportReport(opts: { title: string; subtitle?: string; kpis?: Kpi[]; body: string; storeName?: string; fileName?: string }) {
  const c = cfg()
  const store = opts.storeName || storeNameLS()
  const initials = store.split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
  const contact = [c.address, c.phone].filter(Boolean).join(" · ")
  const logo = `${location.origin}/brand/haux-emblem.png`
  const now = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
  const html = `
<div class="page">
  <div class="hd">
    <div class="brand"><img src="${logo}" alt=""><div><div class="bw">Venda<b>Pro</b></div><div class="by">by Txai Tech</div></div></div>
    <div class="meta"><div class="tt">${esc(opts.title)}</div><div class="st">${opts.subtitle ? esc(opts.subtitle) + " · " : ""}Gerado em ${esc(now)}</div></div>
  </div>
  <div class="sc"><div class="av">${esc(initials)}</div><div><div class="sn">${esc(store)}</div>${contact ? `<div class="sd">${esc(contact)}</div>` : ""}</div></div>
  ${kpiGrid(opts.kpis || [])}
  ${opts.kpis?.length ? "" : '<div style="height:18px"></div>'}
  ${opts.body}
</div>
<div class="ft"><span><img src="${logo}" alt=""><b>VendaPro</b> by Txai Tech · vendapro.com.br</span><span>${esc(store)} · ${esc(now)}</span></div>`
  printDoc(opts.fileName || `${opts.title} - ${store}`, html)
}

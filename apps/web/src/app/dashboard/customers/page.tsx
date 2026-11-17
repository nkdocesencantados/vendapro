"use client"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import { MessageCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { api } from "@/lib/api"
import { waLink } from "@/lib/pix"

const BRL = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const DATE = (d?: string) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—")
const PAY: Record<string, string> = { cash: "Dinheiro", pix: "PIX", credit_card: "Crédito", debit_card: "Débito", fiado: "Fiado" }
const initials = (n: string) => n.split(" ").filter(Boolean).map(x => x[0]).slice(0, 2).join("").toUpperCase()
const emptyForm = { name: "", phone: "", email: "", document: "", notes: "" }
const TABS = [["all", "Todos"], ["debt", "Com fiado"], ["inactive", "Sumidos há 30 dias"]] as const

const CLIENT_CSS = `
  .cx-tabs{display:flex;gap:4px;padding:4px;border-radius:12px;border:1px solid var(--border);background:var(--surface);flex-wrap:wrap}
  .cx-tab{min-height:36px;padding:0 14px;border-radius:9px;border:0;background:transparent;color:var(--text-muted);font-size:13px;font-weight:500;cursor:pointer}
  .cx-tab.on{background:var(--brand-tint);color:var(--text);font-weight:600;box-shadow:inset 0 0 0 1px var(--brand-soft)}
  .cx-av{width:34px;height:34px;border-radius:50%;background:var(--brand-tint);color:var(--brand-glow);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0}
  .cx-num{font-family:var(--font-mono);letter-spacing:-.02em}
  .cx-box{flex:1;padding:12px;border-radius:12px;background:var(--surface-2);display:flex;flex-direction:column;gap:4px}
  .cx-row{cursor:pointer}
  .cx-row.sel td{background:var(--brand-tint)}
`

export default function CustomersPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [detail, setDetail] = useState<any>(null)
  const [form, setForm] = useState<any>(null) // null = modal fechado; com id = edição
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [search, filter])

  async function load() {
    setLoading(true)
    try {
      const r = await api.get("/customers", { params: { search, filter } })
      setList(Array.isArray(r.data) ? r.data : [])
    } catch {
      setList([]); toast.error("Não foi possível carregar os clientes")
    } finally { setLoading(false) }
  }

  async function open(id: string) {
    try { setDetail((await api.get(`/customers/${id}`)).data) } catch { toast.error("Não foi possível abrir o cliente") }
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Informe o nome")
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("E-mail inválido")
    setSaving(true)
    const body = { name: form.name.trim(), phone: form.phone || undefined, email: form.email || undefined, document: form.document || undefined, notes: form.notes || undefined }
    try {
      if (form.id) await api.patch(`/customers/${form.id}`, body)
      else await api.post("/customers", body)
      toast.success("Cliente salvo")
      setForm(null); load()
      if (form.id && detail?.id === form.id) open(form.id)
    } catch (e: any) { toast.error(e?.response?.data?.message || "Erro ao salvar") }
    finally { setSaving(false) }
  }

  async function remove(c: any) {
    if (!confirm(`Excluir ${c.name}?`)) return
    try {
      await api.delete(`/customers/${c.id}`)
      toast.success("Cliente excluído"); setDetail(null); load()
    } catch (e: any) {
      toast.error(e?.response?.status === 409 ? "Este cliente tem fiado em aberto. Receba ou quite antes de excluir." : e?.response?.data?.message || "Erro ao excluir")
    }
  }

  const wa = (c: any) => waLink(c.phone, c.balance > 0
    ? `Oi ${c.name.split(" ")[0]}! Passando para lembrar do saldo em aberto de ${BRL(c.balance)}. Obrigado!`
    : `Oi ${c.name.split(" ")[0]}!`)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Toaster position="top-center" />
      <style dangerouslySetInnerHTML={{ __html: CLIENT_CSS }} />

      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <div style={{ marginRight: "auto" }}>
          <h1 className="vp-page-title" style={{ margin: 0 }}>Clientes</h1>
          <div className="vp-page-sub">{list.length} cliente{list.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="cx-tabs" role="tablist" aria-label="Filtro">
          {TABS.map(([v, l]) => (
            <button key={v} role="tab" aria-selected={filter === v} className={`cx-tab${filter === v ? " on" : ""}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
        <button className="vp-btn vp-btn-primary" onClick={() => setForm({ ...emptyForm })}><Plus size={16} /> Novo cliente</button>
      </header>

      <div className="vp-search" style={{ maxWidth: 420 }}>
        <Search size={15} />
        <input placeholder="Buscar por nome, telefone ou documento..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar clientes" />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <section className="vp-card" style={{ flex: "2 1 560px", minWidth: 0 }}>
          {loading ? (
            <div className="vp-empty"><div className="vp-empty-sub">Carregando...</div></div>
          ) : list.length === 0 ? (
            <div className="vp-empty">
              <div className="vp-empty-title">Nenhum cliente por aqui</div>
              <div className="vp-empty-sub">{filter === "all" && !search ? "Cadastre seu primeiro cliente para acompanhar compras e fiado." : "Nada encontrado com esse filtro."}</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="vp-table" style={{ minWidth: 560 }}>
                <thead><tr><th>Cliente</th><th>Última compra</th><th>Compras</th><th style={{ textAlign: "right" }}>Saldo</th></tr></thead>
                <tbody>
                  {list.map(c => (
                    <tr key={c.id} className={`cx-row${detail?.id === c.id ? " sel" : ""}`} onClick={() => open(c.id)}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className="cx-av">{initials(c.name)}</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ color: "var(--text)" }}>{c.name}</span>
                            <span className="cx-num" style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.phone || "sem telefone"}</span>
                          </div>
                        </div>
                      </td>
                      <td>{DATE(c.lastPurchase)}</td>
                      <td>{c.purchases || 0}</td>
                      <td className="cx-num" style={{ textAlign: "right" }}>
                        {c.balance > 0 ? <span className="vp-pill vp-pill-warn">{BRL(c.balance)}</span> : <span style={{ color: "var(--text-subtle)" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {detail && (
          <aside className="vp-card" style={{ flex: "1 1 320px", padding: 20, display: "flex", flexDirection: "column", gap: 16, borderColor: "var(--brand-soft)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="cx-av" style={{ width: 48, height: 48, fontSize: 16 }}>{initials(detail.name)}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: "auto", minWidth: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 600 }}>{detail.name}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Cliente desde {DATE(detail.createdAt)} · {detail.purchases || 0} compras</span>
              </div>
              <button className="vp-icon-btn" aria-label="Fechar" onClick={() => setDetail(null)}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="cx-box"><span style={{ fontSize: 12, color: "var(--text-muted)" }}>Deve</span><span className="cx-num" style={{ fontSize: 20, color: detail.balance > 0 ? "var(--danger)" : "var(--text)" }}>{BRL(detail.balance)}</span></div>
              <div className="cx-box"><span style={{ fontSize: 12, color: "var(--text-muted)" }}>Total comprado</span><span className="cx-num" style={{ fontSize: 20 }}>{BRL(detail.totalSpent)}</span></div>
            </div>
            {(detail.email || detail.document || detail.notes) && (
              <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
                {detail.email && <span>{detail.email}</span>}
                {detail.document && <span>Doc.: {detail.document}</span>}
                {detail.notes && <span style={{ whiteSpace: "pre-wrap" }}>{detail.notes}</span>}
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Histórico de compras</div>
              {!detail.sales?.length ? <div style={{ fontSize: 13, color: "var(--text-subtle)" }}>Nenhuma compra ainda.</div> : (
                <div style={{ display: "flex", flexDirection: "column", maxHeight: 280, overflowY: "auto" }}>
                  {detail.sales.map((s: any) => {
                    const open = s.paymentMethod === "fiado" && s.status !== "cancelled" && Number(s.total) - Number(s.paidAmount || 0) > 0
                    return (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                        <span>{DATE(s.saleDate || s.createdAt)} · {PAY[s.paymentMethod] || s.paymentMethod}{s.status === "cancelled" && " · cancelada"}</span>
                        <span className="cx-num" style={{ color: open ? "var(--warning)" : "var(--text)", textDecoration: s.status === "cancelled" ? "line-through" : "none" }}>{BRL(s.total)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <a className="vp-btn vp-btn-primary" style={{ justifyContent: "center", minHeight: 44, textDecoration: "none" }} href={wa(detail)} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> {detail.balance > 0 ? "Cobrar no WhatsApp" : "Chamar no WhatsApp"}
            </a>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="vp-btn vp-btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setForm({ ...emptyForm, ...detail, phone: detail.phone || "", email: detail.email || "", document: detail.document || "", notes: detail.notes || "" })}><Pencil size={14} /> Editar</button>
              <button className="vp-btn vp-btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={() => remove(detail)}><Trash2 size={14} /> Excluir</button>
            </div>
          </aside>
        )}
      </div>

      {form && (
        <div className="vp-modal-bg" onClick={() => setForm(null)}>
          <div className="vp-modal" role="dialog" aria-modal="true" aria-label={form.id ? "Editar cliente" : "Novo cliente"} onClick={e => e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>{form.id ? "Editar cliente" : "Novo cliente"}</h2>
              <button className="vp-icon-btn" aria-label="Fechar" onClick={() => setForm(null)}><X size={16} /></button>
            </div>
            <div className="vp-modal-body">
              <div className="vp-field"><label htmlFor="c-name">Nome *</label><input id="c-name" className="vp-input" autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="vp-field-row">
                <div className="vp-field"><label htmlFor="c-phone">WhatsApp</label><input id="c-phone" className="vp-input" inputMode="tel" placeholder="(11) 9 0000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="vp-field"><label htmlFor="c-doc">CPF/CNPJ</label><input id="c-doc" className="vp-input" value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} /></div>
              </div>
              <div className="vp-field"><label htmlFor="c-email">E-mail</label><input id="c-email" className="vp-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="vp-field"><label htmlFor="c-notes">Observações</label><textarea id="c-notes" className="vp-input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="vp-modal-foot">
              <button className="vp-btn vp-btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button className="vp-btn vp-btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

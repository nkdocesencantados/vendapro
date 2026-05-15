"use client" // v2
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt, fmtDate } from "@/lib/utils"

const emptyItem = () => ({ productId: "", name: "", quantity: "1", unitPrice: "", isManual: false })
const emptyForm = () => ({ customerName: "", paymentMethod: "cash", discount: 0, installments: 1, saleDate: new Date().toISOString().split("T")[0], items: [emptyItem()] })

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("active")
  const [form, setForm] = useState<any>(emptyForm())

  useEffect(() => { loadSales(); loadProducts() }, [])

  async function loadSales() {
    try { const r = await api.get("/sales"); setSales(r.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function loadProducts() {
    try { const r = await api.get("/products"); setProducts(r.data) }
    catch (e) { console.error(e) }
  }

  async function saveSale() {
    const validItems = form.items.filter((i: any) => i.name && +i.unitPrice > 0)
    if (!validItems.length) return alert("Adicione ao menos um produto com preco")
    setSaving(true)
    try {
      const payload = {
        ...form,
        items: validItems.map((i: any) => ({
          productId: i.productId || null,
          name: i.name,
          quantity: +i.quantity || 1,
          unitPrice: +i.unitPrice || 0,
          isManual: !i.productId,
        }))
      }
      await api.post("/sales", { ...payload, createdAt: form.saleDate ? new Date(form.saleDate).toISOString() : undefined })
      setShowForm(false)
      setForm(emptyForm())
      loadSales()
      loadProducts()
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Erro ao salvar venda"
      alert(typeof msg === "string" ? msg : JSON.stringify(msg))
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function cancelSale(id: string) {
    if (!confirm("Cancelar esta venda?")) return
    try { await api.patch(`/sales/${id}/cancel`); loadSales(); loadProducts() }
    catch { loadSales() }
  }

  const addItem = () => setForm({ ...form, items: [...form.items, emptyItem()] })
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_: any, j: number) => j !== i) })

  function selectProduct(i: number, productId: string) {
    const it = [...form.items]
    if (productId === "__manual__") {
      it[i] = { productId: "", name: "", quantity: it[i].quantity, unitPrice: "", isManual: true }
    } else {
      const p = products.find((p: any) => p.id === productId)
      if (p) it[i] = { productId: p.id, name: p.name, quantity: it[i].quantity, unitPrice: String(p.price), isManual: false }
      else it[i] = { ...it[i], productId: "" }
    }
    setForm({ ...form, items: it })
  }

  function updateItem(i: number, field: string, val: string) {
    const it = [...form.items]
    it[i] = { ...it[i], [field]: val }
    setForm({ ...form, items: it })
  }

  const total = form.items.reduce((a: number, i: any) => a + (+i.quantity || 0) * (+i.unitPrice || 0), 0) - form.discount
  const inputStyle: any = { padding: "8px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", background: "white", width: "100%", boxSizing: "border-box" }

  const payLabel: any = { cash: "Dinheiro", pix: "PIX", credit_card: "Credito", debit_card: "Debito" }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "0 20px", height: "50px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>Vendas</div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: "#1D9E75", color: "white", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "13px", cursor: "pointer" }}>+ Nova Venda</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {showForm && (
          <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ marginBottom: "16px", fontWeight: 500, fontSize: "15px" }}>Nova Venda</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>Cliente</label>
                <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Nome do cliente" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>Pagamento</label>
                <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} style={inputStyle}>
                  <option value="cash">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartao Credito</option>
                  <option value="debit_card">Cartao Debito</option>
                </select>
              </div>
              {form.paymentMethod === "credit_card" && (
                <div>
                  <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>Parcelas</label>
                  <select value={form.installments} onChange={e => setForm({ ...form, installments: +e.target.value })} style={inputStyle}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                      <option key={n} value={n}>{n}x de {fmt(total > 0 ? total / n : 0)}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>Data da venda</label>
                <input type="date" value={form.saleDate} onChange={e => setForm({ ...form, saleDate: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "12px", color: "#666" }}>Itens da venda</label>
                <button onClick={addItem} style={{ background: "none", border: "1px solid #1D9E75", color: "#1D9E75", borderRadius: "6px", padding: "4px 12px", fontSize: "12px", cursor: "pointer" }}>+ Adicionar item</button>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "8px" }}>
                <style>{`.item-grid { display: grid; grid-template-columns: 2.5fr 60px 90px 32px; gap: 6px; margin-bottom: 6px; } .item-grid-mobile { display: none; } @media (max-width: 767px) { .item-grid { display: none; } .item-grid-mobile { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; } }`}</style>
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 60px 90px 32px", gap: "6px", marginBottom: "6px" }} className="item-grid">
                  {["Produto", "Qtd", "Preco (R$)", ""].map(h => <div key={h} style={{ fontSize: "11px", color: "#888", fontWeight: 500 }}>{h}</div>)}
                </div>
                {form.items.map((item: any, i: number) => (
                  <>
                  <div key={i + "d"} className="item-grid">
                    {item.isManual ? (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <input value={item.name} onChange={e => updateItem(i, "name", e.target.value)} placeholder="Nome do produto" style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={() => { const it = [...form.items]; it[i] = { ...emptyItem(), quantity: it[i].quantity }; setForm({ ...form, items: it }) }} title="Voltar para selecao" style={{ padding: "0 8px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "white", cursor: "pointer", fontSize: "14px", color: "#666" }}>&#8617;</button>
                      </div>
                    ) : (
                      <select value={item.productId} onChange={e => selectProduct(i, e.target.value)} style={inputStyle}>
                        <option value="">Selecione um produto</option>
                        {products.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)} ({p.stock} un)</option>
                        ))}
                        <option value="__manual__">Digitar manualmente</option>
                      </select>
                    )}
                    <input value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} type="number" min="1" style={{ ...inputStyle, textAlign: "center" }} />
                    <input value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} type="number" min="0" step="0.01" placeholder="0,00" style={inputStyle} />
                    <button onClick={() => removeItem(i)} style={{ background: "#fee2e2", border: "none", borderRadius: "6px", color: "#ef4444", cursor: "pointer", fontSize: "16px", fontWeight: 700 }}>x</button>
                  </div>
                  <div key={i + "m"} className="item-grid-mobile">
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        {item.isManual ? (
                          <input value={item.name} onChange={e => updateItem(i, "name", e.target.value)} placeholder="Nome do produto" style={{ ...inputStyle }} />
                        ) : (
                          <select value={item.productId} onChange={e => selectProduct(i, e.target.value)} style={inputStyle}>
                            <option value="">Selecione um produto</option>
                            {products.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}</option>
                            ))}
                            <option value="__manual__">Digitar manualmente</option>
                          </select>
                        )}
                      </div>
                      <button onClick={() => removeItem(i)} style={{ background: "#fee2e2", border: "none", borderRadius: "6px", color: "#ef4444", cursor: "pointer", fontSize: "16px", fontWeight: 700, padding: "8px 10px" }}>x</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      <div><label style={{ fontSize: "11px", color: "#888" }}>Qtd</label><input value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} type="number" min="1" style={{ ...inputStyle, textAlign: "center" }} /></div>
                      <div><label style={{ fontSize: "11px", color: "#888" }}>Preco (R$)</label><input value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} type="number" min="0" step="0.01" placeholder="0,00" style={inputStyle} /></div>
                    </div>
                  </div>
                  </>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#1D9E75" }}>Total: {fmt(total)}</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setShowForm(false); setForm(emptyForm()) }} style={{ padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "13px" }}>Cancelar</button>
                <button onClick={saveSale} disabled={saving} style={{ padding: "8px 20px", background: saving ? "#9ca3af" : "#1D9E75", color: "white", border: "none", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500 }}>
                  {saving ? "Salvando..." : "Salvar Venda"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Carregando...</div>
        ) : sales.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888", padding: "60px" }}>Nenhuma venda registrada ainda.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              {[["active","Concluidas"],["cancelled","Canceladas"],["all","Todas"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{ padding: "5px 12px", fontSize: "12px", border: "0.5px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", background: filter === v ? "#1D9E75" : "white", color: filter === v ? "white" : "#666" }}>{l}</button>
              ))}
            </div>
            {sales.filter((s: any) => filter === "all" || s.status === filter || (filter === "active" && s.status === "completed")).map((s: any) => (
              <div key={s.id} style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "10px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "14px" }}>{s.customerName || "Cliente nao informado"}</div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>{fmtDate(s.createdAt)} - {payLabel[s.paymentMethod] || s.paymentMethod}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: s.status === "cancelled" ? "#888" : "#1D9E75", fontSize: "15px", textDecoration: s.status === "cancelled" ? "line-through" : "none" }}>{fmt(s.total)}</div>
                    <div style={{ fontSize: "11px", color: s.status === "completed" ? "#1D9E75" : "#ef4444" }}>{s.status === "completed" ? "Concluida" : "Cancelada"}</div>
                  </div>
                  {s.status !== "cancelled" && (
                    <button onClick={() => cancelSale(s.id)} style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", cursor: "pointer" }}>Cancelar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
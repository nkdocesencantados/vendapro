"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"

const emptyForm = () => ({ name: "", description: "", price: "", costPrice: "", stock: "", minStock: "", category: "" })

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [primary, setPrimary] = useState("#1D9E75")
  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    loadProducts()
    try {
      const c = localStorage.getItem("storeConfig")
      if (c) { const p = JSON.parse(c); if (p.primaryColor) setPrimary(p.primaryColor) }
    } catch {}
  }, [])

  async function loadProducts() {
    try { const r = await api.get("/products"); setProducts(r.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function openEdit(p: any) {
    setEditId(p.id)
    setForm({ name: p.name||"", description: p.description||"", price: String(p.price||""), costPrice: String(p.costPrice||""), stock: String(p.stock||""), minStock: String(p.minStock||""), category: p.category||"" })
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  function openNew() {
    setEditId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  async function saveProduct() {
    if (!form.name || !form.price) return alert("Nome e preco sao obrigatorios")
    setSaving(true)
    try {
      const payload = {
        name: form.name, description: form.description, category: form.category,
        price: Number(form.price), costPrice: form.costPrice ? Number(form.costPrice) : null,
        stock: Number(form.stock) || 0, minStock: Number(form.minStock) || 5,
      }
      if (editId) {
        await api.patch(`/products/${editId}`, payload)
      } else {
        await api.post("/products", payload)
      }
      setShowForm(false)
      setEditId(null)
      setForm(emptyForm())
      loadProducts()
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao salvar produto")
    } finally { setSaving(false) }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Esta acao nao pode ser desfeita.`)) return
    try { await api.delete(`/products/${id}`); loadProducts() }
    catch { alert("Erro ao excluir produto") }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <style>{`
        .inv-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        .inv-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        @media (min-width: 768px) {
          .inv-grid { grid-template-columns: repeat(3,1fr); gap: 12px; }
        }
      `}</style>
      <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "0 16px", height: "50px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>Estoque</div>
        <button onClick={openNew} style={{ background: primary, color: "white", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "13px", cursor: "pointer" }}>+ Novo Produto</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {showForm && (
          <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ marginBottom: "16px", fontWeight: 500 }}>{editId ? "Editar Produto" : "Novo Produto"}</h3>
            <div className="inv-form-grid">
              {([["Nome *","name","text"],["Categoria","category","text"],["Preco de venda *","price","number"],["Custo","costPrice","number"],["Estoque","stock","number"],["Estoque minimo","minStock","number"]] as [string,string,string][]).map(([label,field,type]) => (
                <div key={field}>
                  <label style={{ fontSize: "12px", color: "#666" }}>{label}</label>
                  <input type={type} value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", color: "#666" }}>Descricao</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ width: "100%", padding: "8px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", marginTop: "4px", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm()) }} style={{ padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "13px" }}>Cancelar</button>
              <button onClick={saveProduct} disabled={saving} style={{ padding: "8px 16px", background: saving ? "#9ca3af" : primary, color: "white", border: "none", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px" }}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: "center", color: "#888", padding: "40px" }}>Carregando...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888", padding: "60px" }}>Nenhum produto cadastrado.</div>
        ) : (
          <div className="inv-grid">
            {(products as any[]).map((p: any) => (
              <div key={p.id} style={{ background: "white", border: p.stock <= p.minStock ? "1px solid #f59e0b" : "0.5px solid #e5e7eb", borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontWeight: 500, marginBottom: "2px", fontSize: "14px" }}>{p.name}</div>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px" }}>{p.category}</div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#888" }}>Preco</div>
                    <div style={{ fontWeight: 600, color: primary, fontSize: "13px" }}>{fmt(p.price)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#888" }}>Estoque</div>
                    <div style={{ fontWeight: 600, color: p.stock <= p.minStock ? "#ef4444" : "#111", fontSize: "13px" }}>{p.stock} un</div>
                  </div>
                </div>
                {p.stock <= p.minStock && (
                  <div style={{ marginBottom: "8px", fontSize: "11px", color: "#d97706", background: "#fffbeb", padding: "3px 8px", borderRadius: "4px" }}>Estoque baixo</div>
                )}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => openEdit(p)} style={{ flex: 1, padding: "5px", border: `1px solid ${primary}`, color: primary, background: "white", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Editar</button>
                  <button onClick={() => deleteProduct(p.id, p.name)} style={{ flex: 1, padding: "5px", border: "1px solid #ef4444", color: "#ef4444", background: "white", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
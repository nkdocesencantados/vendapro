"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

function BRL(v:number){ return v?.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})||"R$ 0,00" }

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [view, setView] = useState<"grid"|"list">("grid")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:"", price:"", stock:"", description:"" })
  const [primary, setPrimary] = useState("#1D9E75")

  useEffect(() => {
    load()
    try { const sc=localStorage.getItem("storeConfig"); if(sc){const p=JSON.parse(sc);if(p.primaryColor)setPrimary(p.primaryColor)} } catch{}
  }, [])

  async function load() {
    try { const r = await api.get("/products"); setProducts(r.data) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }

  async function save() {
    if(!form.name||!form.price) return alert("Nome e preco sao obrigatorios")
    setSaving(true)
    try {
      if(editing) await api.patch(`/products/${editing.id}`, { name:form.name, price:+form.price, stock:+form.stock||0 })
      else await api.post("/products", { name:form.name, price:+form.price, stock:+form.stock||0 })
      setShowForm(false); setEditing(null); setForm({name:"",price:"",stock:"",description:""}); load()
    } catch(e:any){ alert(e?.response?.data?.message||"Erro") }
    finally { setSaving(false) }
  }

  async function remove(id:string) {
    if(!confirm("Excluir produto?")) return
    try { await api.delete(`/products/${id}`); load() } catch{}
  }

  function openEdit(p:any) {
    setEditing(p); setForm({name:p.name,price:String(p.price),stock:String(p.stock),description:p.description||""}); setShowForm(true)
  }

  const filtered = products.filter(p => {
    if(filter==="low") return p.stock > 0 && p.stock <= 5
    if(filter==="out") return p.stock === 0
    return true
  })
  const lowCount = products.filter(p=>p.stock>0&&p.stock<=5).length
  const outCount = products.filter(p=>p.stock===0).length
  const totalVal = products.reduce((a,p)=>a+p.stock*p.price,0)

  return (
    <div style={{padding:28,maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .vp-card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);}
        .vp-card-head h3{margin:0;font-size:14px;font-weight:600;}
        .vp-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;}
        .vp-tbl th{text-align:left;font-weight:500;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--text-subtle);padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface-2);}
        .vp-tbl td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle;}
        .vp-tbl tr:last-child td{border-bottom:0;}
        .vp-tbl tr:hover td{background:var(--surface-2);}
        .vp-pill{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:500;}
        .vp-pill-ok{background:var(--success-bg);color:var(--success);}
        .vp-pill-warn{background:var(--warning-bg);color:var(--warning);}
        .vp-pill-bad{background:var(--danger-bg);color:var(--danger);}
        .vp-pill-grey{background:var(--surface-3);color:var(--text-muted);}
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);} .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-btn-ghost{color:var(--text-muted);} .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}
        .vp-btn-danger{background:var(--danger-bg);color:var(--danger);} .vp-btn-danger:hover{background:var(--danger);color:white;}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-icon-btn{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;border:1px solid transparent;color:var(--text-muted);cursor:pointer;transition:all .12s;}
        .vp-icon-btn:hover{background:var(--surface-2);border-color:var(--border);color:var(--text);}
        .vp-modal-bg{position:fixed;inset:0;background:rgba(12,10,9,0.5);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;}
        .vp-modal{width:min(480px,94vw);background:var(--bg-elevated);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow-lg);}
        .vp-modal-head{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{margin:0;font-size:17px;font-weight:600;}
        .vp-modal-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
        .vp-modal-foot{padding:14px 22px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;background:var(--surface-2);border-radius:0 0 18px 18px;}
        .vp-field{display:flex;flex-direction:column;gap:6px;}
        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}
        .vp-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint);}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
        .kpi{padding:18px;background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .kpi .lbl{font-size:12px;color:var(--text-subtle);font-weight:500;margin-bottom:10px;}
        .kpi .val{font-size:22px;font-weight:600;letter-spacing:-.02em;font-family:var(--font-mono,"Geist Mono",monospace);}
        .prod-grid{padding:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}
        .prod-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:border-color .12s,box-shadow .12s;}
        .prod-card:hover{border-color:var(--border-strong);box-shadow:var(--shadow-md);}
        .prod-thumb{height:100px;background:var(--surface-2);display:grid;place-items:center;position:relative;font-size:36px;}
        .prod-body{padding:12px;}
        @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
      `}</style>

      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:600,letterSpacing:"-.02em"}}>Estoque</h1>
          <div style={{color:"var(--text-subtle)",fontSize:14,marginTop:4}}>{products.length} produtos · valor em estoque: {BRL(totalVal)}</div>
        </div>
        <button className="vp-btn vp-btn-primary" onClick={()=>{setEditing(null);setForm({name:"",price:"",stock:"",description:""});setShowForm(true)}}>+ Novo produto</button>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="lbl">Produtos cadastrados</div><div className="val">{products.length}</div></div>
        <div className="kpi"><div className="lbl">Valor em estoque</div><div className="val">{BRL(totalVal)}</div></div>
        <div className="kpi"><div className="lbl">Estoque baixo</div><div className="val" style={{color:"var(--warning)"}}>{lowCount}</div></div>
        <div className="kpi"><div className="lbl">Esgotados</div><div className="val" style={{color:"var(--danger)"}}>{outCount}</div></div>
      </div>

      <div className="vp-card">
        <div className="vp-card-head">
          <div style={{display:"flex",gap:4}}>
            {[["all","Todos"],["low","Estoque baixo"],["out","Esgotados"]].map(([v,l])=>(
              <button key={v} className={`vp-btn vp-btn-sm ${filter===v?"vp-btn-primary":"vp-btn-ghost"}`} onClick={()=>setFilter(v)}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:4}}>
            {(["grid","list"] as const).map(v=>(
              <button key={v} className="vp-icon-btn" onClick={()=>setView(v)} style={{background:view===v?"var(--surface-2)":"transparent"}}>
                {v==="grid"?"▦":"☰"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:48,color:"var(--text-subtle)"}}>Nenhum produto encontrado.</div>
        ) : view === "grid" ? (
          <div className="prod-grid">
            {filtered.map((p:any)=>(
              <div key={p.id} className="prod-card">
                <div className="prod-thumb">
                  📦
                  <div style={{position:"absolute",top:8,right:8}}>
                    {p.stock===0 ? <span className="vp-pill vp-pill-bad">Esgotado</span>
                    : p.stock<=5 ? <span className="vp-pill vp-pill-warn">{p.stock} un</span>
                    : <span className="vp-pill vp-pill-ok">{p.stock} un</span>}
                  </div>
                </div>
                <div className="prod-body">
                  <div style={{fontSize:13,fontWeight:500,marginBottom:8}}>{p.name}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:"var(--font-mono)",fontSize:15,fontWeight:600}}>{BRL(p.price)}</span>
                    <div style={{display:"flex",gap:4}}>
                      <button className="vp-icon-btn" onClick={()=>openEdit(p)} title="Editar">✎</button>
                      <button className="vp-icon-btn vp-btn-danger" onClick={()=>remove(p.id)} title="Excluir">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="vp-tbl">
            <thead><tr><th>Produto</th><th style={{textAlign:"right"}}>Preco</th><th style={{textAlign:"right"}}>Estoque</th><th></th></tr></thead>
            <tbody>
              {filtered.map((p:any)=>(
                <tr key={p.id}>
                  <td style={{fontWeight:500}}>{p.name}</td>
                  <td style={{textAlign:"right",fontFamily:"var(--font-mono)",fontWeight:500}}>{BRL(p.price)}</td>
                  <td style={{textAlign:"right"}}>
                    {p.stock===0 ? <span className="vp-pill vp-pill-bad">Esgotado</span>
                    : p.stock<=5 ? <span className="vp-pill vp-pill-warn">{p.stock} un</span>
                    : <span className="vp-pill vp-pill-ok">{p.stock} un</span>}
                  </td>
                  <td>
                    <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                      <button className="vp-icon-btn" onClick={()=>openEdit(p)}>✎</button>
                      <button className="vp-icon-btn" onClick={()=>remove(p.id)} style={{color:"var(--danger)"}}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>
          <div className="vp-modal" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>{editing?"Editar produto":"Novo produto"}</h2>
              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="vp-modal-body">
              <div className="vp-field"><label>Nome *</label><input className="vp-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nome do produto" /></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div className="vp-field"><label>Preco (R$) *</label><input className="vp-input" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0,00" /></div>
                <div className="vp-field"><label>Estoque</label><input className="vp-input" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} placeholder="0" /></div>
              </div>
            </div>
            <div className="vp-modal-foot">
              <button className="vp-btn vp-btn-ghost" onClick={()=>setShowForm(false)}>Cancelar</button>
              <button className="vp-btn vp-btn-primary" onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

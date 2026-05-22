"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:"", price:"", stock:"", minStock:"5", description:"" })
  const [primary, setPrimary] = useState("#1D9E75")
  const [threshold, setThreshold] = useState(5)

  useEffect(() => {
    load()
    try { const sc=localStorage.getItem("storeConfig"); if(sc){const p=JSON.parse(sc);if(p.primaryColor)setPrimary(p.primaryColor);if(p.lowStockThreshold)setThreshold(+p.lowStockThreshold||5)} } catch{}
  }, [])

  async function load() {
    try { const r = await api.get("/products"); setProducts(r.data) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }

  async function save() {
    if(!form.name||!form.price) return alert("Nome e preço sao obrigatórios")
    setSaving(true)
    try {
      if(editing) await api.patch(`/products/${editing.id}`, { name:form.name, price:+form.price, stock:+form.stock||0, minStock:+form.minStock||5 })
      else await api.post("/products", { name:form.name, price:+form.price, stock:+form.stock||0, minStock:+form.minStock||5 })
      setShowForm(false); setEditing(null); setForm({name:"",price:"",stock:"",minStock:"5",description:""}); load()
    } catch(e:any){ alert(e?.response?.data?.message||"Erro") }
    finally { setSaving(false) }
  }

  async function remove(id:string) {
    if(!confirm("Excluir produto?")) return
    try { await api.delete(`/products/${id}`); load() } catch{}
  }

  function openEdit(p:any) {
    setEditing(p); setForm({name:p.name,price:String(p.price),stock:String(p.stock),minStock:String(p.minStock||5),description:p.description||""}); setShowForm(true)
  }

  const filtered = products.filter(p => {
    if(filter==="low") return p.stock > 0 && p.stock <= (p.minStock||threshold)
    if(filter==="out") return p.stock === 0
    return true
  })
  const lowCount = products.filter(p=>p.stock>0&&p.stock<=(p.minStock||threshold)).length
  const outCount = products.filter(p=>p.stock===0).length
  const totalVal = products.reduce((a,p)=>a+p.stock*p.price,0)

  return (
    <div style={{padding:"clamp(12px,3vw,28px)",maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand,#1D9E75);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);} .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-btn-ghost{color:var(--text-muted);} .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}
        .vp-btn-danger{background:var(--danger-bg);color:var(--danger);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-pill{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:11px;font-weight:500;}
        .vp-pill-ok{background:rgba(29,158,117,0.15);color:#1D9E75;}
        .vp-pill-warn{background:rgba(180,83,9,0.2);color:#f59e0b;}
        .vp-pill-bad{background:var(--danger-bg);color:var(--danger);}
        .vp-pill-grey{background:var(--surface-3);color:var(--text-muted);}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}
        .vp-input:focus{border-color:var(--brand,#1D9E75);box-shadow:0 0 0 3px rgba(29,158,117,0.12);}
        .vp-field{display:flex;flex-direction:column;gap:6px;}
        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}
        .vp-modal-bg{position:fixed;inset:0;background:rgba(12,10,9,0.6);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;padding:16px;}
        .vp-modal{width:min(480px,100%);background:var(--bg-elevated);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow-lg);}
        .vp-modal-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{margin:0;font-size:16px;font-weight:600;}
        .vp-modal-body{padding:20px;display:flex;flex-direction:column;gap:14px;}
        .vp-modal-foot{padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;background:var(--surface-2);border-radius:0 0 18px 18px;}
        .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
        .kpi{padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;}
        .kpi .lbl{font-size:11px;color:var(--text-subtle);margin-bottom:4px;}
        .kpi .val{font-size:clamp(15px,4vw,20px);font-weight:600;letter-spacing:-.02em;}
        .prod-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;}
        .prod-icon{width:40px;height:40px;border-radius:10px;background:var(--surface-2);display:grid;place-items:center;flex-shrink:0;font-size:18px;}
        .prod-info{flex:1;min-width:0;}
        .prod-name{font-size:13px;font-weight:500;color:var(--text);}
        .prod-price{font-size:12px;color:var(--text-subtle);margin-top:2px;}
        .prod-actions{display:flex;gap:5px;flex-shrink:0;}
        .icon-btn{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text-muted);cursor:pointer;display:grid;place-items:center;font-size:13px;}
        .filter-row{display:flex;gap:5px;margin-bottom:12px;flex-wrap:wrap;}
        .fbtn{font-size:12px;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;font-weight:500;}
        .fbtn-on{background:var(--brand,#1D9E75);color:white;}
        .fbtn-off{background:var(--surface-2);color:var(--text-muted);}
        .nbtn{display:flex;align-items:center;justify-content:center;gap:6px;background:var(--brand,#1D9E75);color:white;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:600;width:100%;margin-bottom:14px;cursor:pointer;}
      `}</style>

      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(20px,5vw,26px)",fontWeight:600,letterSpacing:"-.02em"}}>Estoque</h1>
          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>{products.length} produtos - valor: {BRLshort(totalVal)}</div>
        </div>
      </div>

      <button className="nbtn" onClick={()=>{setEditing(null);setForm({name:"",price:"",stock:"",minStock:"5",description:""});setShowForm(true)}}>+ Novo produto</button>

      <div className="kpi-grid">
        <div className="kpi"><div className="lbl">Total produtos</div><div className="val">{products.length}</div></div>
        <div className="kpi"><div className="lbl">Valor estoque</div><div className="val">{BRLshort(totalVal)}</div></div>
        <div className="kpi"><div className="lbl">Estoque baixo</div><div className="val" style={{color:"#f59e0b"}}>{lowCount}</div></div>
        <div className="kpi"><div className="lbl">Esgotados</div><div className="val" style={{color:"var(--danger)"}}>{outCount}</div></div>
      </div>

      <div className="filter-row">
        {[["all","Todos"],["low","Baixo"],["out","Esgotados"]].map(([v,l])=>(
          <div key={v} className={`fbtn ${filter===v?"fbtn-on":"fbtn-off"}`} onClick={()=>setFilter(v)}>{l}</div>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:48,color:"var(--text-subtle)"}}>Nenhum produto encontrado.</div>
      ) : filtered.map((p:any)=>(
        <div key={p.id} className="prod-card">
          <div className="prod-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8M12 3v18M3 8l9-5 9 5"/></svg>
          </div>
          <div className="prod-info">
            <div className="prod-name">{p.name}</div>
            <div className="prod-price">{BRL(p.price)} por unidade</div>
            <div style={{marginTop:5}}>
              {p.stock===0 ? <span className="vp-pill vp-pill-bad">Esgotado</span>
              : p.stock<=(p.minStock||threshold) ? <span className="vp-pill vp-pill-warn">{p.stock} un - Baixo</span>
              : <span className="vp-pill vp-pill-ok">{p.stock} un</span>}
            </div>
          </div>
          <div className="prod-actions">
            <button className="icon-btn" onClick={()=>openEdit(p)} title="Editar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button className="icon-btn" style={{color:"var(--danger)"}} onClick={()=>remove(p.id)} title="Excluir">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      ))}

      {showForm && (
        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>
          <div className="vp-modal" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>{editing?"Editar produto":"Novo produto"}</h2>
              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowForm(false)}>X</button>
            </div>
            <div className="vp-modal-body">
              <div className="vp-field"><label>Nome *</label><input className="vp-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nome do produto" /></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="vp-field"><label>Preço (R$) *</label><input className="vp-input" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0,00" /></div>
                <div className="vp-field"><label>Estoque</label><input className="vp-input" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} placeholder="0" /></div>
                <div className="vp-field"><label>Estoque mínimo</label><input className="vp-input" type="number" min="1" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} placeholder="5" /><span style={{fontSize:11,color:"var(--text-subtle)",marginTop:3,display:"block"}}>Alerta de baixo quando chegar nesse número</span></div>
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





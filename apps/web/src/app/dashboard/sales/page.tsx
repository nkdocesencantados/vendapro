"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt, fmtDate } from "@/lib/utils"

const PAY: Record<string,string> = { cash:"Dinheiro", pix:"PIX", credit_card:"Crédito", debit_card:"Débito" }

function BRL(v:number){ return v?.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})||"R$ 0,00" }
const emptyItem = () => ({ productId:"", name:"", quantity:"1", unitPrice:"", isManual:false })
const emptyForm = () => ({ customerName:"", paymentMethod:"pix", discount:0, installments:1, saleDate:new Date().toISOString().split("T")[0], items:[emptyItem()] })

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("active")
  const [form, setForm] = useState<any>(emptyForm())
  const [cancelId, setCancelId] = useState<string|null>(null)
  const [primary, setPrimary] = useState("#1D9E75")

  useEffect(() => {
    load(); loadProducts()
    try { const sc = localStorage.getItem("storeConfig"); if(sc){const p=JSON.parse(sc);if(p.primaryColor)setPrimary(p.primaryColor)} } catch{}
  }, [])

  async function load() {
    try { const r = await api.get("/sales"); setSales(r.data) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }
  async function loadProducts() {
    try { const r = await api.get("/products"); setProducts(r.data) } catch{}
  }
  async function saveSale() {
    const valid = form.items.filter((i:any) => i.name && +i.unitPrice > 0)
    if(!valid.length) return alert("Adicione ao menos um produto")
    setSaving(true)
    try {
      await api.post("/sales", { ...form, items: valid.map((i:any) => ({ productId:i.productId||null, name:i.name, quantity:+i.quantity||1, unitPrice:+i.unitPrice||0, isManual:!i.productId })) })
      setShowForm(false); setForm(emptyForm()); load(); loadProducts()
    } catch(e:any) { alert(e?.response?.data?.message||"Erro ao salvar") }
    finally { setSaving(false) }
  }
  async function confirmCancel(id:string) {
    setCancelId(null)
    try { await api.patch(`/sales/${id}/cancel`); load(); loadProducts() } catch{ load() }
  }
  function selectProduct(i:number, pid:string) {
    const it = [...form.items]
    if(pid==="__manual__") { it[i]={productId:"",name:"",quantity:it[i].quantity,unitPrice:"",isManual:true} }
    else { const p=products.find((p:any)=>p.id===pid); if(p)it[i]={productId:p.id,name:p.name,quantity:it[i].quantity,unitPrice:String(p.price),isManual:false} }
    setForm({...form,items:it})
  }
  function updateItem(i:number, f:string, v:string) { const it=[...form.items]; it[i]={...it[i],[f]:v}; setForm({...form,items:it}) }
  const total = form.items.reduce((a:number,i:any) => a+(+i.quantity||0)*(+i.unitPrice||0), 0) - form.discount
  const filtered = sales.filter((s:any) => filter==="all" || s.status===filter || (filter==="active"&&s.status==="completed"))
  const totalRev = sales.filter((s:any)=>s.status==="completed").reduce((a:any,s:any)=>a+Number(s.total),0)

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
        .vp-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:500;}
        .vp-pill-ok{background:var(--success-bg);color:var(--success);}
        .vp-pill-bad{background:var(--danger-bg);color:var(--danger);}
        .vp-pill-grey{background:var(--surface-3);color:var(--text-muted);}
        .vp-av{width:24px;height:24px;border-radius:50%;display:inline-grid;place-items:center;font-size:10px;font-weight:600;flex-shrink:0;}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}
        .vp-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint);}
        .vp-select{appearance:none;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 32px 9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;cursor:pointer;}
        .vp-select:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint);}
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand);color:white;}
        .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);}
        .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-btn-ghost{color:var(--text-muted);}
        .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}
        .vp-btn-danger{background:var(--danger-bg);color:var(--danger);border-color:var(--danger-bg);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-modal-bg{position:fixed;inset:0;background:rgba(12,10,9,0.5);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;}
        .vp-modal{width:min(580px,94vw);background:var(--bg-elevated);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow-lg);max-height:88vh;overflow:auto;}
        .vp-modal-head{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{margin:0;font-size:17px;font-weight:600;}
        .vp-modal-body{padding:22px;}
        .vp-modal-foot{padding:14px 22px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;align-items:center;background:var(--surface-2);border-radius:0 0 18px 18px;}
        .vp-field{display:flex;flex-direction:column;gap:6px;}
        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
        .kpi{padding:18px;background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .kpi .lbl{font-size:12px;color:var(--text-subtle);font-weight:500;margin-bottom:10px;}
        .kpi .val{font-size:22px;font-weight:600;letter-spacing:-.02em;font-family:var(--font-mono,"Geist Mono",monospace);}
        .kpi .delta{margin-top:6px;font-size:11px;color:var(--success);}
        @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:600,letterSpacing:"-.02em"}}>Vendas</h1>
          <div style={{color:"var(--text-subtle)",fontSize:14,marginTop:4}}>
            {sales.filter((s:any)=>s.status==="completed").length} vendas · {BRL(totalRev)} faturados
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="vp-btn vp-btn-primary" onClick={()=>{setForm(emptyForm());setShowForm(true)}}>
            + Nova venda
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi"><div className="lbl">Faturamento do mes</div><div className="val">{BRL(totalRev)}</div><div className="delta">↑ {sales.filter((s:any)=>s.status==="completed").length} vendas</div></div>
        <div className="kpi"><div className="lbl">Concluidas</div><div className="val">{sales.filter((s:any)=>s.status==="completed").length}</div></div>
        <div className="kpi"><div className="lbl">Canceladas</div><div className="val" style={{color:"var(--danger)"}}>{sales.filter((s:any)=>s.status==="cancelled").length}</div></div>
        <div className="kpi"><div className="lbl">Ticket medio</div><div className="val">{BRL(sales.filter((s:any)=>s.status==="completed").length ? totalRev/sales.filter((s:any)=>s.status==="completed").length : 0)}</div></div>
      </div>

      {/* TABELA */}
      <div className="vp-card">
        <div className="vp-card-head">
          <div style={{display:"flex",gap:4}}>
            {[["active","Concluidas"],["cancelled","Canceladas"],["all","Todas"]].map(([v,l])=>(
              <button key={v} className={`vp-btn vp-btn-sm ${filter===v?"vp-btn-primary":"vp-btn-ghost"}`} onClick={()=>setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:48,color:"var(--text-subtle)"}}>Nenhuma venda encontrada.</div>
        ) : (
          <table className="vp-tbl">
            <thead>
              <tr><th>Cliente</th><th>Vendedor</th><th>Produtos</th><th>Pagamento</th><th>Status</th><th style={{textAlign:"right"}}>Total</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((s:any)=>(
                <tr key={s.id}>
                  <td style={{fontWeight:500}}>{s.customerName||"Cliente avulso"}</td>
                  <td>
                    {s.sellerName ? (
                      <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                        <span className="vp-av" style={{background:primary,color:"white"}}>{s.sellerName.split(" ").map((x:string)=>x[0]).slice(0,2).join("")}</span>
                        {s.sellerName}
                      </span>
                    ) : <span style={{color:"var(--text-subtle)"}}>—</span>}
                  </td>
                  <td>
                    {s.items?.length > 0 ? (
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        {s.items.slice(0,3).map((it:any,i:number)=>(
                          <span key={i} className="vp-pill vp-pill-grey">{it.quantity}x {it.name||"Produto"}</span>
                        ))}
                        {s.items.length>3 && <span className="vp-pill vp-pill-grey">+{s.items.length-3}</span>}
                      </div>
                    ) : <span style={{color:"var(--text-subtle)"}}>—</span>}
                  </td>
                  <td><span className="vp-pill vp-pill-grey">{PAY[s.paymentMethod]||s.paymentMethod}</span></td>
                  <td>
                    <span className={`vp-pill ${s.status==="completed"?"vp-pill-ok":"vp-pill-bad"}`}>
                      {s.status==="completed"?"Concluida":"Cancelada"}
                    </span>
                  </td>
                  <td style={{textAlign:"right",fontFamily:"var(--font-mono)",fontWeight:600,color:s.status==="cancelled"?"var(--text-subtle)":primary,textDecoration:s.status==="cancelled"?"line-through":"none"}}>{BRL(s.total)}</td>
                  <td>
                    {s.status!=="cancelled" && (
                      <button className="vp-btn vp-btn-sm vp-btn-danger" onClick={()=>setCancelId(s.id)}>Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL NOVA VENDA */}
      {showForm && (
        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>
          <div className="vp-modal" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>Nova venda</h2>
              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="vp-modal-body">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                <div className="vp-field">
                  <label>Cliente</label>
                  <input className="vp-input" value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} placeholder="Nome do cliente" />
                </div>
                <div className="vp-field">
                  <label>Pagamento</label>
                  <select className="vp-select" value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>
                    <option value="pix">PIX</option>
                    <option value="cash">Dinheiro</option>
                    <option value="credit_card">Cartao Credito</option>
                    <option value="debit_card">Cartao Debito</option>
                  </select>
                </div>
                <div className="vp-field">
                  <label>Data</label>
                  <input className="vp-input" type="date" value={form.saleDate} onChange={e=>setForm({...form,saleDate:e.target.value})} />
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:500,color:"var(--text-muted)"}}>Itens da venda</label>
                <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>setForm({...form,items:[...form.items,emptyItem()]})}>+ Item</button>
              </div>
              <div style={{background:"var(--surface-2)",borderRadius:10,padding:12}}>
                {form.items.map((item:any,i:number)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 80px 100px 32px",gap:8,marginBottom:8}}>
                    {item.isManual ? (
                      <input className="vp-input" value={item.name} onChange={e=>updateItem(i,"name",e.target.value)} placeholder="Nome do produto" />
                    ) : (
                      <select className="vp-select" value={item.productId} onChange={e=>selectProduct(i,e.target.value)}>
                        <option value="">Selecione</option>
                        {products.map((p:any)=><option key={p.id} value={p.id}>{p.name} — R$ {Number(p.price).toFixed(2)}</option>)}
                        <option value="__manual__">Digitar manualmente</option>
                      </select>
                    )}
                    <input className="vp-input" type="number" min="1" value={item.quantity} onChange={e=>updateItem(i,"quantity",e.target.value)} style={{textAlign:"center"}} />
                    <input className="vp-input" type="number" value={item.unitPrice} onChange={e=>updateItem(i,"unitPrice",e.target.value)} placeholder="0,00" />
                    <button onClick={()=>setForm({...form,items:form.items.filter((_:any,j:number)=>j!==i)})} style={{background:"var(--danger-bg)",color:"var(--danger)",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="vp-modal-foot">
              <div style={{marginRight:"auto"}}>
                <span style={{fontSize:11,color:"var(--text-subtle)"}}>Total</span>
                <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--font-mono)"}}>{BRL(total)}</div>
              </div>
              <button className="vp-btn vp-btn-ghost" onClick={()=>setShowForm(false)}>Cancelar</button>
              <button className="vp-btn vp-btn-primary" onClick={saveSale} disabled={saving}>{saving?"Salvando...":"Finalizar venda"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR */}
      {cancelId && (
        <div className="vp-modal-bg" onClick={()=>setCancelId(null)}>
          <div className="vp-modal" style={{maxWidth:340}} onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head"><h2>Cancelar venda?</h2></div>
            <div className="vp-modal-body">
              <p style={{margin:0,fontSize:14,color:"var(--text-muted)"}}>Esta acao nao pode ser desfeita.</p>
            </div>
            <div className="vp-modal-foot">
              <button className="vp-btn vp-btn-ghost" onClick={()=>setCancelId(null)}>Voltar</button>
              <button className="vp-btn vp-btn-danger" onClick={()=>confirmCancel(cancelId)}>Sim, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

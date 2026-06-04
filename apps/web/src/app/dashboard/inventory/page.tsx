"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"



function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }



function vpCSV(headers: string[], rows: any[][], filename: string) {

  const lines = [headers, ...rows].map(r => r.map((c:any) => String(c)).join(';')).join('\n');

  const blob = new Blob([lines], {type: 'text/csv;charset=utf-8'});

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url; a.download = filename + '.csv'; a.click();

  URL.revokeObjectURL(url);

}

function vpPDF(html: string) {

  const w = window.open('', '_blank');

  if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 600); }

}

function vpTable(title: string, headers: string[], rows: string[][]) {

  const th = headers.map((h:string) => '<th>' + h + '</th>').join('');

  const tr = rows.map((r:string[]) => '<tr>' + r.map((c:string) => '<td>' + c + '</td>').join('') + '</tr>').join('');

  return '<html><head><title>'+title+'</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th{background:#1D9E75;color:white;padding:8px;font-size:11px}td{padding:7px;border-bottom:1px solid #eee;font-size:11px}</style></head><body><h2>'+title+'</h2><table><thead><tr>'+th+'</tr></thead><tbody>'+tr+'</tbody></table></body></html>';

}









function exportInvCSV(products: any[], threshold: number) {

  vpCSV(['Produto','Preco','Estoque','Minimo','Status'],

    products.map((p:any) => [p.name,Number(p.price).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),p.stock,p.minStock||threshold||5,p.stock===0?'Esgotado':p.stock<=(p.minStock||threshold||5)?'Baixo':'OK']),

    'estoque');

}

function exportInvPDF(products: any[], threshold: number) {
  const rows=products.map((p:any,i:number)=>{const bg=i%2===0?'#fff':'#F8FAF9';const st=p.stock===0?'Esgotado':p.stock<=(p.minStock||threshold||5)?'Baixo':'OK';const col=p.stock===0?'#ef4444':p.stock<=(p.minStock||threshold||5)?'#f59e0b':'#1D9E75';return '<tr style="background:'+bg+';"><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+p.name+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">R$ '+Number(p.price).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+p.stock+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+( p.minStock||threshold||5)+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;font-weight:600;color:'+col+';">'+st+'</td></tr>';}).join('');
  const logo='<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="2.5" fill="white"/><circle cx="4" cy="18" r="2.5" fill="white"/><circle cx="20" cy="18" r="2.5" fill="white"/><line x1="12" y1="4" x2="4" y2="18" stroke="white" stroke-width="1.5"/><line x1="12" y1="4" x2="20" y2="18" stroke="white" stroke-width="1.5"/><line x1="4" y1="18" x2="20" y2="18" stroke="white" stroke-width="1.5"/></svg>';
  const low=products.filter((p:any)=>p.stock>0&&p.stock<=(p.minStock||threshold||5)).length;
  const out=products.filter((p:any)=>p.stock===0).length;
  const header='<div style="background:#04130F;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;background:#1D9E75;border-radius:10px;display:flex;align-items:center;justify-content:center;">'+logo+'</div><div><div style="font-size:16px;font-weight:700;color:white;">VendaPro</div><div style="font-size:11px;color:#6B8C82;">N&K Doces Encantados</div></div></div><div style="text-align:right;"><div style="font-size:18px;font-weight:700;color:white;">Relatorio de Estoque</div><div style="font-size:12px;color:#8DA39A;">Gerado em '+new Date().toLocaleString('pt-BR')+'</div></div></div>';
  const kpis='<div style="display:grid;grid-template-columns:repeat(3,1fr);background:#F8FAF9;border-bottom:2px solid #E5EDE9;"><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Total produtos</div><div style="font-size:22px;font-weight:700;color:#1D9E75;">'+products.length+'</div></div><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Estoque baixo</div><div style="font-size:22px;font-weight:700;color:#f59e0b;">'+low+'</div></div><div style="padding:16px 20px;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Esgotados</div><div style="font-size:22px;font-weight:700;color:#ef4444;">'+out+'</div></div></div>';
  const table='<div style="padding:20px 32px;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#1D9E75;"><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Produto</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Preco</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Estoque</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Minimo</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  const footer='<div style="padding:14px 32px;background:#F8FAF9;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #E5EDE9;"><div style="font-size:11px;color:#888;">VendaPro - vendapro.com.br</div><div style="font-size:11px;color:#1D9E75;font-weight:700;">N&K Doces Encantados</div></div>';
  const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body>'+header+kpis+table+footer+'</body></html>';
  vpPDF(html);
}


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
  const [mainTab,   setMainTab]   = useState<"produtos"|"movimentos">("produtos")
  const [movements, setMovements] = useState<any[]>([])
  const [movLoading,setMovLoading]= useState(false)
  const [movProduct,setMovProduct]= useState("")
  const [showMovForm,setShowMovForm]= useState(false)
  const [movForm,   setMovForm]   = useState({type:"in",productId:"",quantity:"1",reason:""})



  useEffect(() => {
    load()
    try { const sc=localStorage.getItem("storeConfig"); if(sc){const p=JSON.parse(sc);if(p.primaryColor)setPrimary(p.primaryColor);if(p.lowStockThreshold)setThreshold(+p.lowStockThreshold||5)} } catch{}
  }, [])

  useEffect(() => {
    if(mainTab === "movimentos") loadMovements(movProduct||undefined)
  }, [mainTab, movProduct])



  async function loadMovements(productId?:string) {
    setMovLoading(true)
    try {
      const url = productId ? `/stock?productId=${productId}` : "/stock"
      const r = await api.get(url)
      setMovements(Array.isArray(r.data) ? r.data : [])
    } catch { setMovements([]) }
    finally { setMovLoading(false) }
  }

  async function saveMovement() {
    if(!movForm.productId||!movForm.quantity) return alert("Selecione o produto e quantidade")
    try {
      await api.post("/stock/movement", {
        type: movForm.type,
        productId: movForm.productId,
        quantity: +movForm.quantity,
        reason: movForm.reason||undefined
      })
      setShowMovForm(false)
      setMovForm({type:"in",productId:"",quantity:"1",reason:""})
      load()
      loadMovements(movProduct||undefined)
    } catch(e:any) { alert(e?.response?.data?.message||"Erro ao salvar") }
  }

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
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:var(--transition);}

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

        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
        .kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px 22px;position:relative;overflow:hidden;transition:var(--transition);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--brand-glow) 8%,transparent),0 12px 28px -22px color-mix(in srgb,var(--brand) 50%,transparent);}
        .kpi:hover{border-color:var(--border-strong);transform:translateY(-2px);box-shadow:var(--shadow-md);}
        .kpi .lbl{font-size:11px;font-weight:600;color:var(--brand-glow);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:6px;opacity:.7;}
        .kpi .val{font-family:var(--font-mono);font-size:clamp(20px,2.5vw,32px);font-weight:700;color:var(--text);letter-spacing:-.03em;line-height:1;}
        .kpi .dlt{font-size:12px;color:var(--text-subtle);margin-top:8px;}
        .kpi .dlt.ok{color:var(--success);}
        .kpi .dlt.bad{color:var(--danger);}
        .kpi-glow{position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:var(--brand-glow);filter:blur(20px);pointer-events:none;}
        @media(max-width:1200px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:640px){.kpi-grid{grid-template-columns:1fr 1fr!important;}}

        .prod-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;}

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

          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>{products.length} produtos - valor: {BRL(totalVal)}</div>

        </div>

      </div>


      {/* abas principais */}
      <div style={{display:"flex",gap:4,borderBottom:"1px solid var(--border)",marginBottom:16}}>
        {(["produtos","movimentos"] as const).map(t=>(
          <button key={t} onClick={()=>setMainTab(t)} style={{padding:"9px 16px",fontSize:13,fontWeight:mainTab===t?600:400,color:mainTab===t?"var(--brand)":"var(--text-subtle)",background:"transparent",border:"none",borderBottom:mainTab===t?"2px solid var(--brand)":"2px solid transparent",marginBottom:-1,cursor:"pointer",transition:"var(--transition)"}}>
            {t==="produtos"?"Produtos":"Movimentos"}
          </button>
        ))}
      </div>

      {/* aba movimentos */}
      {mainTab==="movimentos" && (
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <select className="vp-input" style={{width:200,flex:"none"}} value={movProduct} onChange={e=>setMovProduct(e.target.value)}>
              <option value="">Todos os produtos</option>
              {products.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="vp-btn vp-btn-primary" onClick={()=>setShowMovForm(true)} style={{marginLeft:"auto"}}>+ Lançar entrada</button>
          </div>
          {movLoading ? <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div> : (
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",overflowX:"auto"}}>
              {movements.length===0 ? (
                <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)",fontSize:13}}>Nenhum movimento encontrado.</div>
              ) : (
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"var(--surface-2)"}}>
                    {["Data","Produto","Tipo","Qtd","Antes","Depois","Motivo"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".05em"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {movements.map((m:any,i:number)=>{
                      const TL:Record<string,string>={in:"Entrada",out:"Saída",adjust:"Ajuste",sale:"Venda",return:"Devolução"}
                      const TC:Record<string,string>={in:"var(--success)",out:"var(--danger)",adjust:"var(--warning)",sale:"var(--danger)",return:"var(--success)"}
                      const pName=products.find((p:any)=>p.id===m.productId)?.name||"—"
                      const isPositive=["in","return"].includes(m.type)
                      return (
                        <tr key={m.id} style={{borderBottom:"1px solid var(--border)",background:i%2===0?"transparent":"var(--surface-2)"}}>
                          <td style={{padding:"10px 14px",fontSize:12,color:"var(--text-muted)"}}>{new Date(m.createdAt).toLocaleDateString("pt-BR")}</td>
                          <td style={{padding:"10px 14px",fontSize:12,fontWeight:500,color:"var(--text)"}}>{pName}</td>
                          <td style={{padding:"10px 14px"}}><span style={{fontSize:11,fontWeight:600,color:TC[m.type]||"var(--text)",background:`${TC[m.type]||"var(--brand)"}22`,padding:"2px 8px",borderRadius:99}}>{TL[m.type]||m.type}</span></td>
                          <td style={{padding:"10px 14px",fontSize:12,fontWeight:600,color:isPositive?"var(--success)":"var(--danger)"}}>{isPositive?"+":"-"}{m.quantity}</td>
                          <td style={{padding:"10px 14px",fontSize:12,color:"var(--text-muted)"}}>{m.stockBefore}</td>
                          <td style={{padding:"10px 14px",fontSize:12,fontWeight:600,color:"var(--text)"}}>{m.stockAfter}</td>
                          <td style={{padding:"10px 14px",fontSize:12,color:"var(--text-muted)"}}>{m.reason||"—"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {showMovForm && (
            <div className="vp-modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowMovForm(false)}}>
              <div className="vp-modal">
                <div className="vp-modal-head"><h2>Lançar Movimento</h2><button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowMovForm(false)}>✕</button></div>
                <div className="vp-modal-body">
                  <div className="vp-field"><label>Tipo</label>
                    <select className="vp-input" value={movForm.type} onChange={e=>setMovForm({...movForm,type:e.target.value})}>
                      <option value="in">Entrada de mercadoria</option>
                      <option value="adjust">Ajuste de estoque</option>
                      <option value="return">Devolução</option>
                      <option value="out">Saída manual</option>
                    </select>
                  </div>
                  <div className="vp-field"><label>Produto</label>
                    <select className="vp-input" value={movForm.productId} onChange={e=>setMovForm({...movForm,productId:e.target.value})}>
                      <option value="">Selecione o produto</option>
                      {products.map((p:any)=><option key={p.id} value={p.id}>{p.name} (estoque: {p.stock})</option>)}
                    </select>
                  </div>
                  <div className="vp-field"><label>Quantidade</label>
                    <input className="vp-input" type="number" min="1" value={movForm.quantity} onChange={e=>setMovForm({...movForm,quantity:e.target.value})} placeholder="Ex: 10"/>
                  </div>
                  <div className="vp-field"><label>Motivo (opcional)</label>
                    <input className="vp-input" value={movForm.reason} onChange={e=>setMovForm({...movForm,reason:e.target.value})} placeholder="Ex: Compra fornecedor, Recontagem..."/>
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
                    <button className="vp-btn vp-btn-secondary" onClick={()=>setShowMovForm(false)}>Cancelar</button>
                    <button className="vp-btn vp-btn-primary" onClick={saveMovement}>Confirmar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* aba produtos */}
      {mainTab==="produtos" && <div>
            <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}><div style={{display:"flex",gap:8}}><button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>exportInvCSV(filtered,threshold)}>Exportar Excel</button><button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>exportInvPDF(filtered,threshold)}>Exportar PDF</button></div><button className="vp-btn vp-btn-primary" onClick={()=>{setEditing(null);setShowForm(true)}}>+ Novo produto</button></div>




      <div className="kpi-grid">

        <div className="kpi"><div className="lbl">Total produtos</div><div className="val">{products.length}</div></div>

        <div className="kpi"><div className="lbl">Valor estoque</div><div className="val">{BRL(totalVal)}</div></div>

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



      </div>}

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









 









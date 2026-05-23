"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"



const PAY: Record<string,string> = { cash:"Dinheiro", pix:"PIX", credit_card:"Crédito", debit_card:"Débito" }

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }

















function vpCSV(headers: string[], rows: any[][], filename: string) {

  const lines = [headers, ...rows].map(r => r.map(c => String(c).replace(/;/g,',')).join(';')).join('\n');

  const blob = new Blob(['\uFEFF' + lines], {type: 'text/csv;charset=utf-8'});

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

  const th = headers.map(h => '<th style="background:#1D9E75;color:white;padding:8px;font-size:11px;">' + h + '</th>').join('');

  const tr = rows.map(r => '<tr>' + r.map(c => '<td style="padding:7px;border-bottom:1px solid #eee;font-size:11px;">' + c + '</td>').join('') + '</tr>').join('');

  return '<html><head><style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}.f{margin-top:16px;font-size:10px;color:#999;text-align:center;}</style></head><body><h2>' + title + '</h2><p style="color:#666;font-size:11px;">Gerado em ' + new Date().toLocaleString('pt-BR') + ' - VendaPro</p><table><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table><div class="f">VendaPro - vendapro.com.br</div></body></html>';

}



function exportSalesCSV(sales: any[]) {

  const PAY2: Record<string,string> = {cash:'Dinheiro',pix:'PIX',credit_card:'Credito',debit_card:'Debito'};

  vpCSV(['Cliente','Vendedor','Pagamento','Status','Total','Data'],

    sales.map((s:any) => [s.customerName||'Avulso',s.sellerName||'-',PAY2[s.paymentMethod]||s.paymentMethod,s.status==='completed'?'Concluida':'Cancelada',Number(s.total).toFixed(2),new Date(s.createdAt).toLocaleDateString('pt-BR')]),

    'vendas');

}

function exportSalesPDF(sales: any[]) {
  const PAY2: Record<string,string>={cash:'Dinheiro',pix:'PIX',credit_card:'Credito',debit_card:'Debito'};
  const rows=sales.map((s:any,i:number)=>{const bg=i%2===0?'#fff':'#F8FAF9';return '<tr style="background:'+bg+';"><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+new Date(s.createdAt).toLocaleDateString('pt-BR')+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+( s.customerName||'Avulso')+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+( s.sellerName||'-')+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+( PAY2[s.paymentMethod]||s.paymentMethod)+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;font-weight:600;color:#1D9E75;">R$ '+Number(s.total).toFixed(2)+'</td></tr>';}).join('');
  const logo='<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="2.5" fill="white"/><circle cx="4" cy="18" r="2.5" fill="white"/><circle cx="20" cy="18" r="2.5" fill="white"/><line x1="12" y1="4" x2="4" y2="18" stroke="white" stroke-width="1.5"/><line x1="12" y1="4" x2="20" y2="18" stroke="white" stroke-width="1.5"/><line x1="4" y1="18" x2="20" y2="18" stroke="white" stroke-width="1.5"/></svg>';
  const total=sales.reduce((a:number,s:any)=>a+Number(s.total),0);
  const header='<div style="background:#04130F;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;background:#1D9E75;border-radius:10px;display:flex;align-items:center;justify-content:center;">'+logo+'</div><div><div style="font-size:16px;font-weight:700;color:white;">VendaPro</div><div style="font-size:11px;color:#6B8C82;">N&K Doces Encantados</div></div></div><div style="text-align:right;"><div style="font-size:18px;font-weight:700;color:white;">Relatorio de Vendas</div><div style="font-size:12px;color:#8DA39A;">Gerado em '+new Date().toLocaleString('pt-BR')+'</div></div></div>';
  const kpis='<div style="display:grid;grid-template-columns:repeat(3,1fr);background:#F8FAF9;border-bottom:2px solid #E5EDE9;"><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Total vendas</div><div style="font-size:22px;font-weight:700;color:#1D9E75;">'+sales.length+'</div></div><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Faturamento</div><div style="font-size:22px;font-weight:700;">R$ '+total.toFixed(2)+'</div></div><div style="padding:16px 20px;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Ticket medio</div><div style="font-size:22px;font-weight:700;">R$ '+(sales.length>0?(total/sales.length).toFixed(2):'0.00')+'</div></div></div>';
  const table='<div style="padding:20px 32px;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#1D9E75;"><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Data</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Cliente</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Vendedor</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Pagamento</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Total</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  const footer='<div style="padding:14px 32px;background:#F8FAF9;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #E5EDE9;"><div style="font-size:11px;color:#888;">VendaPro - vendapro.com.br</div><div style="font-size:11px;color:#1D9E75;font-weight:700;">N&K Doces Encantados</div></div>';
  const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body>'+header+kpis+table+footer+'</body></html>';
  vpPDF(html);
}


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

  const completed = sales.filter((s:any)=>s.status==="completed").length

  const cancelled = sales.filter((s:any)=>s.status==="cancelled").length



  return (

    <div style={{padding:"clamp(12px,3vw,28px)",maxWidth:1440,margin:"0 auto"}}>

      <style>{`

        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}

        .vp-input:focus{border-color:var(--brand,#1D9E75);box-shadow:0 0 0 3px rgba(29,158,117,0.12);}

        .vp-select{appearance:none;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 32px 9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;cursor:pointer;}

        .vp-select:focus{border-color:var(--brand,#1D9E75);}

        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}

        .vp-btn-primary{background:var(--brand,#1D9E75);color:white;}

        .vp-btn-primary:hover{background:#178A65;}

        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);}

        .vp-btn-ghost{color:var(--text-muted);}

        .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}

        .vp-btn-danger{background:var(--danger-bg);color:var(--danger);border-color:var(--danger-bg);}

        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}

        .vp-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:999px;font-size:11px;font-weight:500;}

        .vp-pill-ok{background:rgba(29,158,117,0.15);color:#1D9E75;}

        .vp-pill-bad{background:var(--danger-bg);color:var(--danger);}

        .vp-pill-grey{background:var(--surface-3);color:var(--text-muted);}

        .vp-modal-bg{position:fixed;inset:0;background:rgba(12,10,9,0.6);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;padding:16px;}

        .vp-modal{width:min(580px,100%);background:var(--bg-elevated);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow-lg);max-height:90vh;overflow:auto;}

        .vp-modal-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}

        .vp-modal-head h2{margin:0;font-size:16px;font-weight:600;}

        .vp-modal-body{padding:20px;}

        .vp-modal-foot{padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;align-items:center;background:var(--surface-2);border-radius:0 0 18px 18px;}

        .vp-field{display:flex;flex-direction:column;gap:6px;}

        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}

        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}

        .kpi{padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;}

        .kpi .lbl{font-size:11px;color:var(--text-subtle);font-weight:500;margin-bottom:6px;}

        .kpi .val{font-size:"clamp(16px,4vw,22px)";font-weight:600;letter-spacing:-.02em;}

        .kpi .dlt{margin-top:4px;font-size:11px;color:var(--success,#1D9E75);}

        .sale-card-m{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:8px;}

        .sc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;}

        .sc-name{font-size:14px;font-weight:600;color:var(--text);}

        .sc-seller{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-subtle);margin-top:3px;}

        .sc-av{width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:white;flex-shrink:0;}

        .sc-val{font-size:16px;font-weight:700;color:var(--brand,#1D9E75);}

        .sc-pills{display:flex;gap:5px;flex-wrap:wrap;}

        .sc-actions{margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;}

        .filter-row{display:flex;gap:5px;padding:10px 14px;border-bottom:1px solid var(--border);}

        .fbtn{font-size:12px;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;font-weight:500;transition:all .12s;}

        .fbtn-on{background:var(--brand,#1D9E75);color:white;}

        .fbtn-off{background:var(--surface-2);color:var(--text-muted);}

        @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}

        @media(max-width:640px){

          .kpi-grid{grid-template-columns:1fr 1fr!important;}

          .kpi .val{font-size:16px!important;}

          .page-actions{flex-direction:column;}

          .page-actions .vp-btn{width:100%;justify-content:center;}

        }

      `}</style>



      {/* HEADER */}

      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:16,flexWrap:"wrap"}}>

        <div>

          <h1 style={{margin:0,fontSize:"clamp(20px,5vw,26px)",fontWeight:600,letterSpacing:"-.02em"}}>Vendas</h1>

          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>

            {completed} vendas - {BRL(totalRev)} faturados

          </div>

        </div>

        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>exportSalesCSV(filtered)}>Excel</button><button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>exportSalesPDF(filtered)}>PDF</button><button className="vp-btn vp-btn-primary" onClick={()=>{setForm(emptyForm());setShowForm(true)}}>+ Nova venda</button></div>

      </div>



      {/* KPIs */}

      <div className="kpi-grid">

        <div className="kpi"><div className="lbl">Fat. do mês</div><div className="val">{BRLshort(totalRev)}</div><div className="dlt">+ {completed} vendas</div></div>

        <div className="kpi"><div className="lbl">Concluídas</div><div className="val">{completed}</div></div>

        <div className="kpi"><div className="lbl">Canceladas</div><div className="val" style={{color:"var(--danger)"}}>{cancelled}</div></div>

        <div className="kpi"><div className="lbl">Ticket médio</div><div className="val">{BRLshort(completed ? totalRev/completed : 0)}</div></div>

      </div>



      {/* LISTA */}

      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>

        <div className="filter-row">

          {[["active","Concluídas"],["cancelled","Canceladas"],["all","Todas"]].map(([v,l])=>(

            <button key={v} className={`fbtn ${filter===v?"fbtn-on":"fbtn-off"}`} onClick={()=>setFilter(v)}>{l}</button>

          ))}

        </div>



        {loading ? (

          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>

        ) : filtered.length === 0 ? (

          <div style={{textAlign:"center",padding:48,color:"var(--text-subtle)"}}>Nenhuma venda encontrada.</div>

        ) : (

          <div style={{padding:"8px 10px"}}>

            {filtered.map((s:any)=>(

              <div key={s.id} className="sale-card-m">

                <div className="sc-top">

                  <div>

                    <div className="sc-name">{s.customerName||"Cliente avulso"}</div>

                    {s.sellerName && (

                      <div className="sc-seller">

                        <div className="sc-av" style={{background:primary}}>{s.sellerName.split(" ").map((x:string)=>x[0]).slice(0,2).join("")}</div>

                        {s.sellerName}

                      </div>

                    )}

                  </div>

                  <div className="sc-val" style={{color:s.status==="cancelled"?"var(--text-subtle)":primary,textDecoration:s.status==="cancelled"?"line-through":"none"}}>

                    {BRL(s.total)}

                  </div>

                </div>

                <div className="sc-pills">

                  {s.items?.slice(0,2).map((it:any,i:number)=>(

                    <span key={i} className="vp-pill vp-pill-grey">{it.quantity}x {it.productName||it.name||it.manualDescription||"Produto"}</span>

                  ))}

                  {s.items?.length>2 && <span className="vp-pill vp-pill-grey">+{s.items.length-2}</span>}

                  <span className="vp-pill vp-pill-grey">{PAY[s.paymentMethod]||s.paymentMethod}</span>

                  <span className={`vp-pill ${s.status==="completed"?"vp-pill-ok":"vp-pill-bad"}`}>

                    {s.status==="completed"?"Concluída":"Cancelada"}

                  </span>

                </div>

                {s.status!=="cancelled" && (

                  <div className="sc-actions">

                    <button className="vp-btn vp-btn-sm vp-btn-danger" onClick={()=>setCancelId(s.id)}>Cancelar</button>

                  </div>

                )}

              </div>

            ))}

          </div>

        )}

      </div>



      {/* MODAL NOVA VENDA */}

      {showForm && (

        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>

          <div className="vp-modal" onClick={e=>e.stopPropagation()}>

            <div className="vp-modal-head">

              <h2>Nova venda</h2>

              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowForm(false)}>X</button>

            </div>

            <div className="vp-modal-body">

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>

                <div className="vp-field">

                  <label>Cliente</label>

                  <input className="vp-input" value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} placeholder="Nome do cliente" />

                </div>

                <div className="vp-field">

                  <label>Pagamento</label>

                  <select className="vp-select" value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>

                    <option value="pix">PIX</option>

                    <option value="cash">Dinheiro</option>

                    <option value="credit_card">Cartão Crédito</option>

                    <option value="debit_card">CartÃƒÆ’Ã‚Â£o DÃƒÆ’Ã‚Â©bito</option>

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

              <div style={{background:"var(--surface-2)",borderRadius:10,padding:10}}>

                {form.items.map((item:any,i:number)=>(

                  <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 60px 90px 30px",gap:6,marginBottom:6}}>

                    {item.isManual ? (

                      <input className="vp-input" value={item.name} onChange={e=>updateItem(i,"name",e.target.value)} placeholder="Nome do produto" />

                    ) : (

                      <select className="vp-select" value={item.productId} onChange={e=>selectProduct(i,e.target.value)}>

                        <option value="">Selecione</option>

                        {products.map((p:any)=><option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}</option>)}

                        <option value="__manual__">Digitar manualmente</option>

                      </select>

                    )}

                    <input className="vp-input" type="number" min="1" value={item.quantity} onChange={e=>updateItem(i,"quantity",e.target.value)} style={{textAlign:"center"}} />

                    <input className="vp-input" type="number" value={item.unitPrice} onChange={e=>updateItem(i,"unitPrice",e.target.value)} placeholder="0,00" />

                    <button onClick={()=>setForm({...form,items:form.items.filter((_:any,j:number)=>j!==i)})} style={{background:"var(--danger-bg)",color:"var(--danger)",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>x</button>

                  </div>

                ))}

              </div>

            </div>

            <div className="vp-modal-foot">

              <div style={{marginRight:"auto"}}>

                <span style={{fontSize:11,color:"var(--text-subtle)"}}>Total</span>

                <div style={{fontSize:18,fontWeight:700}}>{BRL(total)}</div>

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

          <div className="vp-modal" style={{maxWidth:320}} onClick={e=>e.stopPropagation()}>

            <div className="vp-modal-head"><h2>Cancelar venda?</h2></div>

            <div className="vp-modal-body">

              <p style={{margin:0,fontSize:14,color:"var(--text-muted)"}}>Esta aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o nÃƒÆ’Ã‚Â£o pode ser desfeita.</p>

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











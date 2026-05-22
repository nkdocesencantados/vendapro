"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
const PAY: Record<string,string> = { cash:"Dinheiro", pix:"PIX", credit_card:"Credito", debit_card:"Debito" }

export default function ReceiptsPage() {
  const [sales, setSales]       = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [storeName, setStoreName] = useState("Minha Loja")
  const [primary, setPrimary]   = useState("#1D9E75")

  useEffect(() => {
    try {
      const sc = localStorage.getItem("storeConfig")
      if(sc){ const p=JSON.parse(sc); if(p.primaryColor)setPrimary(p.primaryColor); if(p.name)setStoreName(p.name) }
    } catch{}
    load()
  }, [])

  async function load() {
    try {
      const r = await api.get("/sales")
      const completed = r.data.filter((s:any) => s.status === "completed")
      setSales(completed)
      if(completed.length > 0) setSelected(completed[0])
    } catch(e){ console.error(e) } finally { setLoading(false) }
  }

  function printReceipt() {
    window.print()
  }

  const filtered = sales.filter((s:any) => {
    if(!search) return true
    const q = search.toLowerCase()
    return (s.customerName||"").toLowerCase().includes(q) || (s.id||"").toLowerCase().includes(q)
  })

  const receiptNum = selected ? "#"+selected.id.slice(-8).toUpperCase() : ""

  return (
    <div style={{padding:28,maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .vp-card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);}
        .vp-card-head h3{margin:0;font-size:14px;font-weight:600;}
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);} .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:8px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s;}
        .vp-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint);}
        .receipt-item{padding:14px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;border-left:3px solid transparent;}
        .receipt-item:hover{background:var(--surface-2);}
        .receipt-item.active{background:var(--brand-tint);border-left-color:var(--brand);}
        .receipt-paper{font-family:"Geist Mono",monospace;background:var(--surface);border:1px dashed var(--border-strong);border-radius:10px;padding:24px;font-size:12px;line-height:1.7;max-width:360px;margin:0 auto;}
        .receipt-paper h4{margin:0 0 4px;font-family:var(--font);font-size:16px;text-align:center;font-weight:600;}
        .receipt-center{text-align:center;color:var(--text-subtle);}
        .receipt-row{display:flex;justify-content:space-between;gap:8px;}
        .receipt-divider{border:0;border-top:1px dashed var(--border-strong);margin:10px 0;}
        .receipts-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:18px;}
        @media(max-width:900px){.receipts-grid{grid-template-columns:1fr!important;}}
        @media print{
          body > *:not(#receipt-print){display:none!important;}
          #receipt-print{display:block!important;padding:0;margin:0;}
          .receipt-paper{border:none;max-width:100%;box-shadow:none;}
        }
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:600,letterSpacing:"-.02em"}}>Recibos</h1>
          <div style={{color:"var(--text-subtle)",fontSize:14,marginTop:4}}>{sales.length} recibos emitidos</div>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-subtle)"}}>Carregando...</div>
      ) : sales.length === 0 ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-subtle)"}}>Nenhum recibo emitido ainda.</div>
      ) : (
        <div className="receipts-grid">
          {/* LISTA */}
          <div className="vp-card">
            <div className="vp-card-head">
              <h3>Recibos emitidos</h3>
              <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--surface-2)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 10px",width:180}}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,color:"var(--text-subtle)"}}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
                <input style={{border:"none",background:"transparent",outline:"none",fontSize:12,color:"var(--text)",width:"100%"}} placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
            </div>
            <div style={{maxHeight:560,overflowY:"auto"}}>
              {filtered.map((s:any) => (
                <div key={s.id}
                  className={`receipt-item${selected?.id===s.id?" active":""}`}
                  onClick={()=>setSelected(s)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:500,fontSize:13}}>{s.customerName||"Cliente avulso"}</div>
                      <div style={{fontSize:11,color:"var(--text-subtle)",marginTop:2}}>
                        #{s.id.slice(-8).toUpperCase()} · {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div style={{fontFamily:"var(--font-mono)",fontWeight:600,fontSize:13}}>{BRL(s.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VISUALIZAÇÃO */}
          <div className="vp-card">
            <div className="vp-card-head">
              <h3>Visualizacao do recibo</h3>
              {selected && (
                <div style={{display:"flex",gap:6}}>
                  <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={printReceipt}>🖨 Imprimir</button>
                </div>
              )}
            </div>
            <div style={{padding:24,background:"var(--surface-2)",minHeight:400,display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
              {selected ? (
                <div id="receipt-print" className="receipt-paper">
                  {/* Logo / Loja */}
                  <div className="receipt-center" style={{marginBottom:12}}>
                    <div style={{width:36,height:36,borderRadius:8,background:primary,color:"white",display:"inline-grid",placeItems:"center",fontSize:13,fontWeight:700,fontFamily:"var(--font-mono)"}}>
                      {storeName.slice(0,2).toUpperCase()}
                    </div>
                  </div>
                  <h4>{storeName}</h4>
                  <div className="receipt-center">Comprovante de Venda</div>
                  <hr className="receipt-divider" />

                  <div className="receipt-row"><span>N. Pedido:</span><span>{receiptNum}</span></div>
                  <div className="receipt-row"><span>Data:</span><span>{new Date(selected.createdAt).toLocaleDateString("pt-BR")}</span></div>
                  <div className="receipt-row"><span>Cliente:</span><span>{selected.customerName||"Nao informado"}</span></div>
                  {selected.sellerName && <div className="receipt-row"><span>Vendedor:</span><span>{selected.sellerName}</span></div>}
                  <div className="receipt-row"><span>Pagamento:</span><span>{PAY[selected.paymentMethod]||selected.paymentMethod}</span></div>

                  <hr className="receipt-divider" />

                  <div style={{fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>ITENS</div>
                  {selected.items && selected.items.length > 0 ? (
                    selected.items.map((item:any, i:number) => (
                      <div key={i} className="receipt-row">
                        <span>{item.quantity}x {item.name||"Produto"}</span>
                        <span>{BRL(item.quantity * item.unitPrice)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="receipt-row"><span>Venda</span><span>{BRL(selected.total)}</span></div>
                  )}

                  <hr className="receipt-divider" />

                  <div className="receipt-row" style={{fontWeight:700,fontSize:14}}>
                    <span>TOTAL</span>
                    <span>{BRL(selected.total)}</span>
                  </div>

                  <hr className="receipt-divider" />

                  <div className="receipt-center" style={{marginTop:8}}>Obrigado pela preferencia! 💚</div>
                  <div className="receipt-center" style={{marginTop:4,fontSize:11}}>VendaPro · vendapro.com.br</div>
                </div>
              ) : (
                <div style={{color:"var(--text-subtle)",fontSize:13,padding:40}}>Selecione um recibo para visualizar.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
const PAY: Record<string,string> = { cash:"Dinheiro", pix:"PIX", credit_card:"Crédito", debit_card:"Débito" }

export default function ReceiptsPage() {
  const [sales, setSales] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [storeName, setStoreName] = useState("Minha Loja")
  const [primary, setPrimary] = useState("#1D9E75")
  const [showPreview, setShowPreview] = useState(false)

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

  const filtered = sales.filter((s:any) => {
    if(!search) return true
    const q = search.toLowerCase()
    return (s.customerName||"").toLowerCase().includes(q) || (s.id||"").toLowerCase().includes(q)
  })

  const receiptNum = selected ? "#"+selected.id.slice(-8).toUpperCase() : ""

  return (
    <div style={{padding:"clamp(12px,3vw,28px)",maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand,#1D9E75);color:white;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);}
        .vp-btn-ghost{color:var(--text-muted);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .rec-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--border);cursor:pointer;border-left:3px solid transparent;}
        .rec-item:hover{background:var(--surface-2);}
        .rec-item.active{background:rgba(29,158,117,0.1);border-left-color:#1D9E75;}
        .receipt-paper{font-family:Arial,sans-serif;background:white;border-radius:0;overflow:hidden;font-size:12px;line-height:1.7;width:100%;} .receipt-header{background:#04130F;padding:20px;text-align:center;} .receipt-header h4{color:white;margin:8px 0 4px;font-size:16px;letter-spacing:.05em;} .receipt-header .rc{color:#6B8C82;font-size:11px;} .receipt-body{padding:16px 20px;} .rr{display:flex;justify-content:space-between;gap:8px;padding:3px 0;font-size:12px;color:#333;} .rr span:first-child{color:#888;} .rdiv{border:0;border-top:1px dashed #E5EDE9;margin:10px 0;} .receipt-total{background:#F8FAF9;margin:0 -20px;padding:12px 20px;} .receipt-footer{padding:12px 20px;text-align:center;background:#04130F;} .receipt-footer div{color:#6B8C82;font-size:10px;}
        .receipt-paper h4{margin:0 0 4px;font-size:15px;text-align:center;font-weight:700;}
        .rc{text-align:center;color:var(--text-subtle);}
        .rr{display:flex;justify-content:space-between;gap:8px;}
        .rdiv{border:0;border-top:1px dashed var(--border);margin:8px 0;}
        .vp-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;padding:16px;}
        .vp-modal{width:min(400px,100%);background:var(--bg-elevated);border:1px solid var(--border);border-radius:18px;max-height:90vh;overflow:auto;}
        .vp-modal-head{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{margin:0;font-size:15px;font-weight:600;}
        @media print{body *{visibility:hidden;} #receipt-print,#receipt-print *{visibility:visible;} #receipt-print{position:fixed;left:0;top:0;width:100%;}}
      `}</style>

      <div style={{marginBottom:16}}>
        <h1 style={{margin:0,fontSize:"clamp(20px,5vw,26px)",fontWeight:600,letterSpacing:"-.02em"}}>Recibos</h1>
        <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>{sales.length} recibos emitidos</div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-subtle)"}}>Carregando...</div>
      ) : sales.length === 0 ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-subtle)"}}>Nenhum recibo emitido ainda.</div>
      ) : (
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input style={{border:"none",background:"transparent",outline:"none",fontSize:13,color:"var(--text)",flex:1}} placeholder="Buscar por cliente ou ID..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          {filtered.map((s:any) => (
            <div key={s.id} className={`rec-item${selected?.id===s.id?" active":""}`} onClick={()=>{setSelected(s);setShowPreview(true)}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:500,fontSize:13,color:"var(--text)"}}>{s.customerName||"Cliente avulso"}</div>
                <div style={{fontSize:11,color:"var(--text-subtle)",marginTop:2}}>
                  #{s.id.slice(-8).toUpperCase()} - {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                <div style={{fontWeight:600,fontSize:13,color:"#1D9E75"}}>{BRL(s.total)}</div>
                <div style={{fontSize:10,color:"var(--text-subtle)"}}>{PAY[s.paymentMethod]||s.paymentMethod}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPreview && selected && (
        <div className="vp-modal-bg" onClick={()=>setShowPreview(false)}>
          <div className="vp-modal" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>Recibo {receiptNum}</h2>
              <div style={{display:"flex",gap:6}}>
                <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>window.print()}>Exportar PDF</button>
                <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowPreview(false)}>X</button>
              </div>
            </div>
            <div style={{padding:20}}>
              <div id="receipt-print" className="receipt-paper">
                <div className="rc" style={{marginBottom:10}}>
                  <div style={{width:32,height:32,borderRadius:7,background:primary,color:"white",display:"inline-grid",placeItems:"center",fontSize:12,fontWeight:700}}>{storeName.slice(0,2).toUpperCase()}</div>
                </div>
                <h4>{storeName}</h4>
                <div className="rc">Comprovante de Venda</div>
                <hr className="rdiv"/>
                <div className="rr"><span>Pedido:</span><span>{receiptNum}</span></div>
                <div className="rr"><span>Data:</span><span>{new Date(selected.createdAt).toLocaleDateString("pt-BR")}</span></div>
                <div className="rr"><span>Cliente:</span><span>{selected.customerName||"Não informado"}</span></div>
                {selected.sellerName && <div className="rr"><span>Vendedor:</span><span>{selected.sellerName}</span></div>}
                <div className="rr"><span>Pagamento:</span><span>{PAY[selected.paymentMethod]||selected.paymentMethod}</span></div>
                <hr className="rdiv"/>
                <div style={{fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>ITENS</div>
                {selected.items?.length > 0 ? selected.items.map((item:any,i:number)=>(
                  <div key={i} className="rr"><span>{item.quantity}x {item.productName||item.name||item.manualDescription||"Produto"}</span><span>{BRL(item.quantity*item.unitPrice)}</span></div>
                )) : <div className="rr"><span>Venda</span><span>{BRL(selected.total)}</span></div>}
                <hr className="rdiv"/>
                <div className="rr" style={{fontWeight:700,fontSize:14}}><span>TOTAL</span><span>{BRL(selected.total)}</span></div>
                <hr className="rdiv"/>
                <div className="rc" style={{marginTop:6}}>Obrigado pela preferencia!</div>
                <div className="rc" style={{fontSize:10}}>VendaPro - vendapro.com.br</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

const PAY: Record<string,string> = {cash:"Dinheiro",pix:"PIX",credit_card:"Crédito",debit_card:"Débito"}
function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

export default function ReceiptsPage() {
  const [sales,       setSales]       = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState("")
  const [selected,    setSelected]    = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [store,       setStore]       = useState<any>(null)
  const [primary,     setPrimary]     = useState("#1D9E75")

  useEffect(() => {
    api.get("/stores").then(r => { const s=Array.isArray(r.data)?r.data[0]:r.data; if(s){setStore(s);if(s.primaryColor)setPrimary(s.primaryColor)} }).catch(()=>{})
    api.get("/sales?status=completed&limit=200").then(r => { setSales(Array.isArray(r.data)?r.data:r.data?.data||[]) }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const storeName  = store?.name || "Minha Loja"
  const storeInit  = storeName.slice(0,2).toUpperCase()
  const filtered   = sales.filter(s => !search || (s.customerName||"").toLowerCase().includes(search.toLowerCase()) || (s.id||"").toLowerCase().includes(search.toLowerCase()))
  const receiptNum = selected ? (selected.id||"").slice(-8).toUpperCase() : ""

  function openPDF() {
    const el = document.getElementById("receipt-print")
    if (!el) return
    const w = window.open("","_blank")
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;max-width:400px;margin:0 auto;}</style></head><body>${el.innerHTML}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(()=>w.print(),500)
  }

  return (
    <div>
      <style>{`
        .rec-list{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;}
        .rec-search{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;}
        .rec-search input{background:transparent;border:none;outline:none;font-size:13px;color:var(--text);width:100%;font-family:var(--font);}
        .rec-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:var(--transition);border-left:3px solid transparent;}
        .rec-item:last-child{border-bottom:none;}
        .rec-item:hover{background:var(--surface-2);}
        .rec-item.active{background:var(--brand-glow);border-left-color:var(--brand);}
        .rec-name{font-size:13px;font-weight:600;color:var(--text);}
        .rec-meta{font-size:11px;color:var(--text-subtle);margin-top:2px;}
        .rec-val{font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--brand);}
        .rec-pay{font-size:11px;color:var(--text-subtle);text-align:right;margin-top:2px;}
        .vp-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:100;padding:16px;animation:fadeIn .15s ease;}
        .vp-modal{background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-xl);width:min(420px,100%);max-height:90vh;overflow:auto;box-shadow:var(--shadow-lg);}
        .vp-modal-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{font-size:14px;font-weight:700;color:var(--text);margin:0;}
        .receipt-paper{font-family:Arial,sans-serif;background:white;border-radius:10px;overflow:hidden;font-size:12px;line-height:1.7;width:100%;}
        .rh{background:#0C1A14;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;}
        .rh-logo{width:36px;height:36px;border-radius:9px;background:#1D9E75;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;}
        .rh-store{font-size:13px;font-weight:700;color:white;}
        .rh-sub{font-size:10px;color:#5A8C72;margin-top:2px;}
        .rh-num-label{font-size:10px;color:#5A8C72;text-align:right;}
        .rh-num-val{font-size:12px;color:#9FE1CB;font-weight:600;text-align:right;}
        .rb{padding:16px 20px;}
        .rr{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #F0F0F0;font-size:12px;color:#333;}
        .rr:last-child{border:none;}
        .rr span:first-child{color:#888;}
        .rdiv{border:0;border-top:1px dashed #E5EDE9;margin:12px 0;}
        .r-section{font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;}
        .r-item{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#333;}
        .rtotal{background:#F8FAF9;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;}
        .rtotal-label{font-size:14px;font-weight:700;color:#1a1a1a;}
        .rtotal-val{font-size:22px;font-weight:700;color:#1D9E75;}
        .rfooter{background:#0C1A14;padding:14px 20px;text-align:center;}
        .rfooter-thanks{font-size:12px;color:#9FE1CB;margin-bottom:3px;}
        .rfooter-brand{font-size:10px;color:#5A8C72;}
        .pay-badge{background:#E1F5EE;color:#0F6E56;font-size:10px;padding:2px 8px;border-radius:99px;font-weight:600;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      <div style={{marginBottom:20,display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(22px,3vw,30px)",fontWeight:700,letterSpacing:"-.03em",color:"var(--text)"}}>Recibos</h1>
          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:4}}>{sales.length} recibos emitidos</div>
        </div>
      </div>

      <div className="rec-list">
        <div className="rec-search">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Buscar por cliente ou ID..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Nenhum recibo encontrado.</div>
        ) : filtered.map((s:any)=>(
          <div key={s.id} className={`rec-item${selected?.id===s.id?" active":""}`} onClick={()=>{setSelected(s);setShowPreview(true)}}>
            <div>
              <div className="rec-name">{s.customerName||"Cliente avulso"}</div>
              <div className="rec-meta">#{(s.id||"").slice(-8).toUpperCase()} · {new Date(s.createdAt).toLocaleDateString("pt-BR")}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div className="rec-val">{BRL(s.total)}</div>
              <div className="rec-pay">{PAY[s.paymentMethod]||s.paymentMethod}</div>
            </div>
          </div>
        ))}
      </div>

      {showPreview && selected && (
        <div className="vp-modal-bg" onClick={()=>setShowPreview(false)}>
          <div className="vp-modal" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>Recibo #{receiptNum}</h2>
              <div style={{display:"flex",gap:6}}>
                <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={openPDF}>Exportar PDF</button>
                <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowPreview(false)}>✕</button>
              </div>
            </div>
            <div style={{padding:20}}>
              <div id="receipt-print" className="receipt-paper">
                <div className="rh">
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div className="rh-logo">{storeInit}</div>
                    <div>
                      <div className="rh-store">{storeName}</div>
                      <div className="rh-sub">Comprovante de venda</div>
                    </div>
                  </div>
                  <div>
                    <div className="rh-num-label">Pedido</div>
                    <div className="rh-num-val">#{receiptNum}</div>
                  </div>
                </div>
                <div className="rb">
                  <div className="rr"><span>Data</span><span>{new Date(selected.createdAt).toLocaleDateString("pt-BR")}</span></div>
                  <div className="rr"><span>Cliente</span><span>{selected.customerName||"Não informado"}</span></div>
                  {selected.sellerName&&<div className="rr"><span>Vendedor</span><span>{selected.sellerName}</span></div>}
                  <div className="rr"><span>Pagamento</span><span><span className="pay-badge">{PAY[selected.paymentMethod]||selected.paymentMethod}</span></span></div>
                  <hr className="rdiv"/>
                  <div className="r-section">Itens</div>
                  {selected.items?.length>0?selected.items.map((item:any,i:number)=>(
                    <div key={i} className="r-item"><span>{item.quantity}x {item.productName||item.name||item.manualDescription||"Produto"}</span><span>{BRL(item.quantity*item.unitPrice)}</span></div>
                  )):<div className="r-item"><span>Venda</span><span>{BRL(selected.total)}</span></div>}
                </div>
                <div className="rtotal">
                  <span className="rtotal-label">Total</span>
                  <span className="rtotal-val">{BRL(selected.total)}</span>
                </div>
                <div className="rfooter">
                  <div className="rfooter-thanks">Obrigado pela preferência!</div>
                  <div className="rfooter-brand">VendaPro · vendapro.com.br</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

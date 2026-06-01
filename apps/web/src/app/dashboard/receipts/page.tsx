"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

const PAY: Record<string,string> = {cash:"Dinheiro",pix:"PIX",credit_card:"Crédito",debit_card:"Débito"}
function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

const PALETTES: Record<string,any> = {
  emerald:  {brand:"#1D9E75",dark:"#0C1A14",mid:"#5DCAA5",light:"#9FE1CB",tint:"#E1F5EE",border:"rgba(29,158,117,0.25)",dashed:"rgba(29,158,117,0.3)",text:"#085041"},
  indigo:   {brand:"#6366F1",dark:"#1E1B4B",mid:"#818CF8",light:"#C7D2FE",tint:"#EEF2FF",border:"rgba(99,102,241,0.25)",dashed:"rgba(99,102,241,0.3)",text:"#3730A3"},
  amber:    {brand:"#F59E0B",dark:"#2D1A00",mid:"#FCD34D",light:"#FDE68A",tint:"#FEF3C7",border:"rgba(245,158,11,0.25)",dashed:"rgba(245,158,11,0.3)",text:"#92400E"},
  crimson:  {brand:"#E11D48",dark:"#2D0010",mid:"#FB7185",light:"#FCA5A5",tint:"#FFF1F2",border:"rgba(225,29,72,0.25)",dashed:"rgba(225,29,72,0.3)",text:"#9F1239"},
  violet:   {brand:"#8B5CF6",dark:"#1A0A3D",mid:"#A78BFA",light:"#C4B5FD",tint:"#F5F3FF",border:"rgba(139,92,246,0.25)",dashed:"rgba(139,92,246,0.3)",text:"#5B21B6"},
  ocean:    {brand:"#0EA5E9",dark:"#001A2D",mid:"#38BDF8",light:"#7DD3FC",tint:"#F0F9FF",border:"rgba(14,165,233,0.25)",dashed:"rgba(14,165,233,0.3)",text:"#0369A1"},
  rose:     {brand:"#EC4899",dark:"#2D0022",mid:"#F472B6",light:"#F9A8D4",tint:"#FDF2F8",border:"rgba(236,72,153,0.25)",dashed:"rgba(236,72,153,0.3)",text:"#9D174D"},
  graphite: {brand:"#94A3B8",dark:"#0F172A",mid:"#CBD5E1",light:"#E2E8F0",tint:"#F8FAFC",border:"rgba(148,163,184,0.25)",dashed:"rgba(148,163,184,0.3)",text:"#475569"},
}

export default function ReceiptsPage() {
  const [sales,       setSales]       = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState("")
  const [selected,    setSelected]    = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })
  const [page, setPage] = useState(1)
  const PER_PAGE = 20
  const [store,       setStore]       = useState<any>(null)

  useEffect(() => {
    api.get("/stores").then(r => { const s=Array.isArray(r.data)?r.data[0]:r.data; if(s) setStore(s) }).catch(()=>{})
    api.get("/sales?status=completed&limit=200").then(r => { setSales(Array.isArray(r.data)?r.data:r.data?.data||[]) }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const storeName  = store?.name || "Minha Loja"
  const storeInit  = storeName.slice(0,2).toUpperCase()
  const paletteKey = (typeof window!=="undefined"?localStorage.getItem("vp-palette"):null) || store?.palette || "emerald"
  const P          = PALETTES[paletteKey] || PALETTES.emerald
  const byMonth = sales.filter(s => {
    const d = new Date(s.saleDate||s.createdAt)
    const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    return ym === monthFilter
  })
  const filtered   = byMonth.filter(s => !search || (s.customerName||"").toLowerCase().includes(search.toLowerCase()) || (s.id||"").toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)
  const receiptNum = selected ? (selected.id||"").slice(-8).toUpperCase() : ""

  function openPDF() {
    const el = document.getElementById("receipt-print")
    if (!el) return
    const pal = PALETTES[localStorage.getItem("vp-palette")||store?.palette||"emerald"] || PALETTES.emerald
    const css = `
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;max-width:420px;margin:0 auto;background:white;}
      .rh{background:${pal.dark};padding:18px 20px;display:flex;align-items:center;justify-content:space-between;}
      .rh-logo{width:38px;height:38px;border-radius:9px;background:${pal.brand};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;flex-shrink:0;}
      .rh-store{font-size:13px;font-weight:700;color:white;}
      .rh-sub{font-size:10px;color:${pal.mid};margin-top:2px;}
      .rh-num-l{font-size:10px;color:${pal.mid};text-align:right;}
      .rh-num-v{font-size:12px;color:${pal.light};font-weight:600;text-align:right;}
      .rb{padding:16px 20px;border-top:1px solid ${pal.border};}
      .rr{display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid ${pal.border};font-size:12px;}
      .rr:last-child{border:none;}
      .rr-l{color:#888;}
      .rr-r{color:#1a1a1a;font-weight:500;}
      .rdiv{border:none;border-top:1.5px dashed ${pal.dashed};margin:12px 0;}
      .rsec{font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;}
      .ritem{display:flex;justify-content:space-between;font-size:12px;color:#333;padding:4px 0;}
      .pay-badge{background:${pal.tint};color:${pal.text};font-size:10px;padding:2px 8px;border-radius:99px;font-weight:600;}
      .rtotal{background:${pal.tint};padding:14px 20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid ${pal.border};}
      .rtotal-l{font-size:14px;font-weight:700;color:#1a1a1a;}
      .rtotal-v{font-size:24px;font-weight:700;color:${pal.brand};}
      .rfooter{background:${pal.dark};padding:14px 20px;text-align:center;border-top:1px solid ${pal.border};}
      .rf-t{font-size:12px;color:${pal.light};margin-bottom:3px;}
      .rf-b{font-size:10px;color:${pal.mid};}
    `
    const w = window.open("","_blank")
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>${el.innerHTML}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(()=>w.print(),600)
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
        .vp-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:100;padding:16px;}
        .vp-modal{border-radius:var(--r-xl);width:min(440px,100%);max-height:90vh;overflow:auto;box-shadow:var(--shadow-lg);}
        .vp-modal-head{padding:16px 20px;border-bottom:1px solid;display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{font-size:14px;font-weight:700;margin:0;}
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
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
          <input type="month" value={monthFilter} onChange={e=>{setMonthFilter(e.target.value);setPage(1)}}
            style={{background:"var(--surface-2)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",fontSize:13,color:"var(--text)",outline:"none"}}/>
          <span style={{fontSize:13,color:"var(--text-muted)"}}>{filtered.length} recibo{filtered.length!==1?"s":""}</span>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Nenhum recibo encontrado neste mês.</div>
        ) : paginated.map((s:any)=>(
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

      {totalPages > 1 && (
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:6,padding:"14px 0"}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
            style={{padding:"5px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface-2)",color:page===1?"var(--text-subtle)":"var(--text)",fontSize:12,cursor:page===1?"default":"pointer"}}>← Anterior</button>
          <span style={{fontSize:12,color:"var(--text-muted)",padding:"0 8px"}}>{page} / {totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
            style={{padding:"5px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface-2)",color:page===totalPages?"var(--text-subtle)":"var(--text)",fontSize:12,cursor:page===totalPages?"default":"pointer"}}>Próximo →</button>
        </div>
      )}

      {showPreview && selected && (
        <div className="vp-modal-bg" onClick={()=>setShowPreview(false)}>
          <div className="vp-modal" style={{background:P.dark,border:`1px solid ${P.border}`}} onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head" style={{borderColor:P.border}}>
              <h2 style={{color:"#F0F7F4"}}>Recibo #{receiptNum}</h2>
              <div style={{display:"flex",gap:6}}>
                <button onClick={openPDF} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${P.border}`,background:"transparent",color:P.light,fontSize:12,fontWeight:600,cursor:"pointer"}}>Exportar PDF</button>
                <button onClick={()=>setShowPreview(false)} style={{background:"transparent",border:"none",color:P.mid,fontSize:18,cursor:"pointer",padding:"0 6px"}}>✕</button>
              </div>
            </div>
            <div style={{padding:16}}>
              <div id="receipt-print" style={{background:"white",borderRadius:10,overflow:"hidden",border:`1px solid ${P.border}`}}>
                <div className="rh" style={{background:P.dark,padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div className="rh-logo" style={{width:36,height:36,borderRadius:9,background:P.brand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"white",flexShrink:0}}>{storeInit}</div>
                    <div>
                      <div className="rh-store" style={{fontSize:13,fontWeight:700,color:"white"}}>{storeName}</div>
                      <div className="rh-sub" style={{fontSize:10,color:P.mid,marginTop:2}}>Comprovante de venda</div>
                    </div>
                  </div>
                  <div>
                    <div className="rh-num-l" style={{fontSize:10,color:P.mid,textAlign:"right"}}>Pedido</div>
                    <div className="rh-num-v" style={{fontSize:12,color:P.light,fontWeight:600,textAlign:"right"}}>#{receiptNum}</div>
                  </div>
                </div>
                <div className="rb" style={{padding:"14px 18px",borderTop:`1px solid ${P.border}`}}>
                  <div className="rr" style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`0.5px solid ${P.border}`,fontSize:12}}><span style={{color:"#888"}}>Data</span><span style={{color:"#1a1a1a",fontWeight:500}}>{new Date(selected.createdAt).toLocaleDateString("pt-BR")}</span></div>
                  <div className="rr" style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`0.5px solid ${P.border}`,fontSize:12}}><span style={{color:"#888"}}>Cliente</span><span style={{color:"#1a1a1a",fontWeight:500}}>{selected.customerName||"Não informado"}</span></div>
                  {selected.sellerName&&<div className="rr" style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`0.5px solid ${P.border}`,fontSize:12}}><span style={{color:"#888"}}>Vendedor</span><span style={{color:"#1a1a1a",fontWeight:500}}>{selected.sellerName}</span></div>}
                  <div className="rr" style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:12}}><span style={{color:"#888"}}>Pagamento</span><span><span className="pay-badge" style={{background:P.tint,color:P.text,fontSize:10,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{PAY[selected.paymentMethod]||selected.paymentMethod}</span></span></div>
                  <hr className="rdiv" style={{border:"none",borderTop:`1.5px dashed ${P.dashed}`,margin:"12px 0"}}/>
                  <div className="rsec" style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Itens</div>
                  {selected.items?.length>0?selected.items.map((item:any,i:number)=>(
                    <div key={i} className="ritem" style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#333",padding:"3px 0"}}><span>{item.quantity}x {item.productName||item.name||item.manualDescription||"Produto"}</span><span>{BRL(item.quantity*item.unitPrice)}</span></div>
                  )):<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#333"}}><span>Venda</span><span>{BRL(selected.total)}</span></div>}
                </div>
                <div className="rtotal" style={{background:P.tint,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${P.border}`}}>
                  <span className="rtotal-l" style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>Total</span>
                  <span className="rtotal-v" style={{fontSize:22,fontWeight:700,color:P.brand}}>{BRL(selected.total)}</span>
                </div>
                <div className="rfooter" style={{background:P.dark,padding:"13px 18px",textAlign:"center",borderTop:`1px solid ${P.border}`}}>
                  <div className="rf-t" style={{fontSize:12,color:P.light,marginBottom:3}}>Obrigado pela preferência!</div>
                  <div className="rf-b" style={{fontSize:10,color:P.mid}}>VendaPro · vendapro.com.br</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

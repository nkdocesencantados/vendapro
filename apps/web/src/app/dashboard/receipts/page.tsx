"use client"
import { useEffect, useState } from "react"
import QRCode from "qrcode"
import toast, { Toaster } from "react-hot-toast"
import { Copy, FileDown, MessageCircle, X } from "lucide-react"
import { api } from "@/lib/api"
import { printDoc } from "@/lib/pdf"
import { storePix, waLink } from "@/lib/pix"

const PAY: Record<string,string> = {cash:"Dinheiro",pix:"PIX",credit_card:"Crédito",debit_card:"Débito",fiado:"Fiado"}
function BRL(v:number){ return (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
const itemName = (it:any) => it.productName||it.name||it.manualDescription||"Produto"

// Cores do PDF impresso (papel branco), identidade Txai Tech.
const P = {brand:"#2DBE60",dark:"#060A08",mid:"#8FA89B",light:"#7EE8A8",tint:"#E8F7EE",border:"rgba(45,190,96,0.25)",dashed:"rgba(45,190,96,0.3)",text:"#0B3A1F"}

export default function ReceiptsPage() {
  const [sales,       setSales]       = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState("")
  const [selected,    setSelected]    = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    const n = new Date(); return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")
  })
  const [page, setPage] = useState(1)
  const PER_PAGE = 20
  const [store,       setStore]       = useState<any>(null)
  const [qr,          setQr]          = useState("")

  useEffect(() => {
    api.get("/stores").then(r => { const s=Array.isArray(r.data)?r.data[0]:r.data; if(s) setStore(s) }).catch(()=>{})
    api.get("/sales?limit=500").then(r => { setSales(Array.isArray(r.data)?r.data:r.data?.data||[]) }).catch(()=>toast.error("Não foi possível carregar os recibos")).finally(()=>setLoading(false))
  }, [])

  const storeName  = store?.name || "Minha Loja"
  const storeInit  = storeName.slice(0,2).toUpperCase()
  const byMonth = sales.filter(s => {
    const d = new Date(s.saleDate||s.createdAt)
    return (d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")) === monthFilter
  })
  const filtered   = byMonth.filter(s => !search || (s.customerName||"").toLowerCase().includes(search.toLowerCase()) || (s.id||"").toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)
  const receiptNum = selected ? (selected.id||"").slice(-8).toUpperCase() : ""
  // Fiado: cobra só o saldo; venda cancelada não gera PIX.
  const due  = selected ? Number(selected.total) - (selected.paymentMethod==="fiado" ? Number(selected.paidAmount||0) : 0) : 0
  const pix  = selected && selected.status!=="cancelled" && due>0 ? storePix(store, due) : null
  const when = selected ? new Date(selected.saleDate||selected.createdAt) : null

  useEffect(() => {
    setQr("")
    if (pix) QRCode.toDataURL(pix, { margin: 1, width: 360, color: { dark: "#06120B", light: "#F4FBF7" } }).then(setQr).catch(()=>{})
  }, [pix])

  function copyPix() {
    if (!pix) return
    navigator.clipboard.writeText(pix).then(()=>toast.success("Código PIX copiado")).catch(()=>toast.error("Não foi possível copiar"))
  }

  function sendWhatsApp() {
    const items = selected.items?.length ? selected.items.map((it:any)=>`${it.quantity}x ${itemName(it)} — ${BRL(it.quantity*it.unitPrice)}`).join("\n") : `Venda — ${BRL(selected.total)}`
    const text = `*Recibo — ${storeName}*\nVenda #${receiptNum} · ${when!.toLocaleDateString("pt-BR")}\n\n${items}\n\n*Total: ${BRL(selected.total)}*`
      + (pix ? `\n\nPague com PIX copia e cola:\n${pix}` : "")
      + `\n\nObrigado pela preferência!`
    window.open(waLink(selected.customerPhone, text), "_blank", "noopener")
  }

  function openPDF() {
    const el = document.getElementById("receipt-print")
    if (!el) return
    printDoc(`Recibo #${receiptNum} - ${storeName}`, el.innerHTML, "@page{size:auto;margin:10mm}body{max-width:420px;margin:0 auto}")
  }

  const row = {display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`0.5px solid ${P.border}`,fontSize:12} as const

  return (
    <div>
      <Toaster position="top-center" />
      <style dangerouslySetInnerHTML={{ __html: `
        .rec-list{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;}
        .rec-search{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;}
        .rec-search input{background:transparent;border:none;outline:none;font-size:13px;color:var(--text);width:100%;font-family:var(--font);}
        .rec-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:var(--transition);border-left:3px solid transparent;}
        .rec-item:last-child{border-bottom:none;}
        .rec-item:hover{background:var(--surface-2);}
        .rec-item.active{background:var(--brand-tint);border-left-color:var(--brand);}
        .rec-name{font-size:13px;font-weight:600;color:var(--text);}
        .rec-meta{font-size:11px;color:var(--text-subtle);margin-top:2px;}
        .rec-val{font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--brand);}
        .rec-pay{font-size:11px;color:var(--text-subtle);text-align:right;margin-top:2px;}
        .rc{width:min(400px,100%);max-height:92vh;overflow:auto;border-radius:var(--r-xl);border:1px solid var(--border);background:radial-gradient(420px 260px at 50% 0%,var(--brand-tint),transparent 70%),var(--bg);color:var(--text);padding:20px 18px;display:flex;flex-direction:column;gap:16px;box-shadow:var(--shadow-lg);}
        .rc-num{font-family:var(--font-mono);}
        .rc-qr{align-self:center;padding:14px;border-radius:20px;background:#F4FBF7;box-shadow:0 0 0 1px var(--brand-glow),var(--shadow-glow);}
        .rc-items{border-radius:14px;border:1px solid var(--border);background:var(--surface);padding:4px 14px;}
        .rc-it{display:flex;justify-content:space-between;gap:12px;padding:10px 0;font-size:14px;border-bottom:1px solid var(--border);}
        .rc-it:last-child{border-bottom:none;font-size:13px;color:var(--text-muted);}
        .rc-wa{min-height:50px;border-radius:14px;justify-content:center;font-size:15px;font-weight:600;}
      ` }} />

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
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",flexWrap:"wrap",borderBottom:"1px solid var(--border)"}}>
          <input type="month" value={monthFilter} onChange={e=>{setMonthFilter(e.target.value);setPage(1)}}
            style={{background:"var(--surface-2)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",fontSize:13,color:"var(--text)",outline:"none"}}/>
          <span style={{fontSize:13,color:"var(--text-muted)"}}>{filtered.length} recibo{filtered.length!==1?"s":""}</span>
        </div>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Nenhum recibo encontrado.</div>
        ) : paginated.map((s:any)=>(
          <div key={s.id} className={`rec-item${selected?.id===s.id?" active":""}`} onClick={()=>{setSelected(s);setShowPreview(true)}}>
            <div>
              <div className="rec-name">{s.customerName||"Cliente avulso"}</div>
              <div className="rec-meta">#{(s.id||"").slice(-8).toUpperCase()} · {new Date(s.saleDate||s.createdAt).toLocaleDateString("pt-BR")}</div>
              {s.sellerName&&<div style={{fontSize:11,color:"var(--brand)",marginTop:2}}>{s.sellerName}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div className="rec-val" style={{color:s.status==="cancelled"?"var(--danger)":"inherit"}}>{BRL(s.total)}</div>
              <div className="rec-pay">{PAY[s.paymentMethod]||s.paymentMethod}</div>
              {s.status==="cancelled"&&<div style={{fontSize:10,color:"var(--danger)",fontWeight:600}}>CANCELADO</div>}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{display:"flex",justifyContent:"center",gap:6,padding:"14px 0"}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
            style={{padding:"5px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface-2)",color:page===1?"var(--text-subtle)":"var(--text)",fontSize:12,cursor:page===1?"default":"pointer"}}>← Anterior</button>
          <span style={{fontSize:12,color:"var(--text-muted)",padding:"0 8px"}}>{page} / {totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
            style={{padding:"5px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface-2)",color:page===totalPages?"var(--text-subtle)":"var(--text)",fontSize:12,cursor:page===totalPages?"default":"pointer"}}>Próximo →</button>
        </div>
      )}

      {showPreview && selected && (
        <div className="vp-modal-bg" onClick={()=>setShowPreview(false)}>
          <div className="rc" role="dialog" aria-modal="true" aria-label={`Recibo ${receiptNum}`} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span className="vp-avatar" style={{width:30,height:30,borderRadius:"50%",background:"var(--brand)",color:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{storeInit}</span>
              <span style={{fontSize:15,fontWeight:700}}>{storeName}</span>
              <span style={{marginLeft:"auto",fontSize:12,color:"var(--text-muted)"}}>Venda #{receiptNum}</span>
              <button className="vp-icon-btn" aria-label="Exportar PDF" title="Exportar PDF" onClick={openPDF}><FileDown size={16}/></button>
              <button className="vp-icon-btn" aria-label="Fechar" onClick={()=>setShowPreview(false)}><X size={16}/></button>
            </div>

            <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:4}}>
              <span style={{fontSize:13,color:"var(--text-muted)"}}>{selected.status==="cancelled" ? "Venda cancelada" : due<Number(selected.total) ? "Saldo a pagar" : "Total"}</span>
              <span className="rc-num" style={{fontSize:38,fontWeight:500,letterSpacing:-1,textDecoration:selected.status==="cancelled"?"line-through":"none"}}>{BRL(due||selected.total)}</span>
              <span style={{fontSize:13,color:"var(--text-muted)"}}>{selected.customerName||"Cliente avulso"} · {selected.items?.length||1} {(selected.items?.length||1)===1?"item":"itens"} · {PAY[selected.paymentMethod]||selected.paymentMethod}</span>
            </div>

            {pix ? (
              <>
                <div className="rc-qr">
                  {qr ? <img src={qr} width={180} height={180} alt="QR Code PIX para pagamento" style={{display:"block"}}/> : <div style={{width:180,height:180}}/>}
                </div>
                <button className="vp-btn vp-btn-secondary" style={{minHeight:46,justifyContent:"center"}} onClick={copyPix}><Copy size={16}/> Copiar código PIX</button>
              </>
            ) : store && !store.pixKey && selected.status!=="cancelled" && (
              <div style={{fontSize:12,color:"var(--text-subtle)",textAlign:"center"}}>Cadastre a chave PIX em Configurações para gerar o QR Code.</div>
            )}

            <div className="rc-items">
              {selected.items?.length>0 ? selected.items.map((it:any,i:number)=>(
                <div key={i} className="rc-it"><span>{itemName(it)}{it.quantity>1?` × ${it.quantity}`:""}</span><span className="rc-num">{BRL(it.quantity*it.unitPrice)}</span></div>
              )) : <div className="rc-it"><span>Venda</span><span className="rc-num">{BRL(selected.total)}</span></div>}
              <div className="rc-it"><span>{when!.toLocaleDateString("pt-BR")} · {when!.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span><span>{selected.sellerName||storeName}</span></div>
            </div>

            <button className="vp-btn vp-btn-primary rc-wa" onClick={sendWhatsApp}><MessageCircle size={18}/> Enviar recibo no WhatsApp</button>

            {/* Versão impressa (PDF): fora da tela, mesmo HTML do recibo anterior. */}
            <div style={{position:"absolute",left:-9999,top:0}} aria-hidden="true">
              <div id="receipt-print">
                <div style={{background:"white",borderRadius:10,overflow:"hidden",border:`1px solid ${P.border}`}}>
                  <div style={{background:P.dark,padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      {store?.logoUrl
                        ? <img src={store.logoUrl} alt="" width={36} height={36} style={{width:36,height:36,borderRadius:9,objectFit:"cover",flexShrink:0}}/>
                        : <div style={{width:36,height:36,borderRadius:9,background:P.brand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"white",flexShrink:0}}>{storeInit}</div>}
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"white"}}>{storeName}</div>
                        <div style={{fontSize:10,color:P.mid,marginTop:2}}>Comprovante de venda</div>
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:P.mid,textAlign:"right"}}>Pedido</div>
                      <div style={{fontSize:12,color:P.light,fontWeight:600,textAlign:"right"}}>#{receiptNum}</div>
                    </div>
                  </div>
                  <div style={{padding:"14px 18px",borderTop:`1px solid ${P.border}`}}>
                    <div style={row}><span style={{color:"#888"}}>Data</span><span style={{color:"#1a1a1a",fontWeight:500}}>{when!.toLocaleDateString("pt-BR")}</span></div>
                    <div style={row}><span style={{color:"#888"}}>Cliente</span><span style={{color:"#1a1a1a",fontWeight:500}}>{selected.customerName||"Não informado"}</span></div>
                    {selected.sellerName&&<div style={row}><span style={{color:"#888"}}>Vendedor</span><span style={{color:"#1a1a1a",fontWeight:500}}>{selected.sellerName}</span></div>}
                    <div style={{...row,borderBottom:"none"}}><span style={{color:"#888"}}>Pagamento</span><span style={{background:P.tint,color:P.text,fontSize:10,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{PAY[selected.paymentMethod]||selected.paymentMethod}</span></div>
                    <hr style={{border:"none",borderTop:`1.5px dashed ${P.dashed}`,margin:"12px 0"}}/>
                    <div style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Itens</div>
                    {selected.items?.length>0?selected.items.map((item:any,i:number)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#333",padding:"3px 0"}}><span>{item.quantity}x {itemName(item)}</span><span>{BRL(item.quantity*item.unitPrice)}</span></div>
                    )):<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#333"}}><span>Venda</span><span>{BRL(selected.total)}</span></div>}
                  </div>
                  <div style={{background:P.tint,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${P.border}`}}>
                    <span style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>Total</span>
                    <span style={{fontSize:22,fontWeight:700,color:P.brand}}>{BRL(selected.total)}</span>
                  </div>
                  {pix && qr && (
                    <div style={{padding:"14px 18px",textAlign:"center",borderTop:`1px solid ${P.border}`}}>
                      <img src={qr} width={150} height={150} alt="QR Code PIX"/>
                      <div style={{fontSize:9,color:"#555",wordBreak:"break-all",marginTop:6}}>{pix}</div>
                    </div>
                  )}
                  <div style={{background:P.dark,padding:"13px 18px",textAlign:"center",borderTop:`1px solid ${P.border}`}}>
                    <div style={{fontSize:12,color:P.light,marginBottom:3}}>Obrigado pela preferência!</div>
                    <div style={{fontSize:10,color:P.mid,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><img src="/brand/haux-emblem.png" width={14} height={14} alt="" style={{borderRadius:"50%"}}/>VendaPro by Txai Tech · vendapro.com.br</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

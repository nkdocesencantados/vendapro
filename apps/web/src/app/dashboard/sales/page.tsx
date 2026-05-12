"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt, fmtDate } from "@/lib/utils"

const emptyForm = () => ({ customerName:"", paymentMethod:"cash", discount:0, items:[{ name:"", quantity:"", unitPrice:"", isManual:true }] })

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())

  useEffect(() => { loadSales() }, [])

  async function loadSales() {
    try { const r = await api.get("/sales"); setSales(r.data) } catch {} finally { setLoading(false) }
  }

  async function saveSale() {
    if (!form.items[0].name || !form.items[0].unitPrice) return alert("Preencha o produto e o preco")
    const payload = { ...form, items: form.items.map(i => ({ ...i, quantity: +i.quantity || 1, unitPrice: +i.unitPrice || 0 })) }
    try { await api.post("/sales", payload); setShowForm(false); setForm(emptyForm()); loadSales() } catch { alert("Erro ao salvar venda") }
  }

  async function cancelSale(id: string) {
    if (!confirm("Tem certeza que deseja cancelar esta venda?")) return
    try { await api.patch(`/sales/${id}/cancel`); loadSales() } catch { alert("Erro ao cancelar") }
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { name:"", quantity:"", unitPrice:"", isManual:true }] })
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_,j) => j!==i) })
  const updateItem = (i: number, field: string, val: string) => { const it = [...form.items]; it[i] = { ...it[i], [field]: val }; setForm({ ...form, items: it }) }
  const total = form.items.reduce((a,i) => a + (+i.quantity||0) * (+i.unitPrice||0), 0) - form.discount

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 20px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:"14px",fontWeight:500}}>Vendas</div>
        <button onClick={()=>setShowForm(!showForm)} style={{background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"13px",cursor:"pointer"}}>+ Nova Venda</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
        {showForm && (
          <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px",marginBottom:"20px"}}>
            <h3 style={{marginBottom:"16px",fontWeight:500,fontSize:"15px"}}>Nova Venda</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div><label style={{fontSize:"12px",color:"#666",display:"block",marginBottom:"4px"}}>Cliente</label><input value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} placeholder="Nome do cliente" style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px"}} /></div>
              <div><label style={{fontSize:"12px",color:"#666",display:"block",marginBottom:"4px"}}>Pagamento</label><select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px"}}><option value="cash">Dinheiro</option><option value="credit">Cartao Credito</option><option value="debit">Cartao Debito</option><option value="pix">PIX</option></select></div>
            </div>
            <div style={{marginBottom:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <label style={{fontSize:"12px",color:"#666"}}>Itens da venda</label>
                <button onClick={addItem} style={{background:"none",border:"1px solid #1D9E75",color:"#1D9E75",borderRadius:"6px",padding:"4px 12px",fontSize:"12px",cursor:"pointer"}}>+ Adicionar item</button>
              </div>
              <div style={{background:"#f9fafb",borderRadius:"8px",padding:"8px"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 80px 100px 36px",gap:"8px",marginBottom:"6px"}}>
                  {["Produto","Qtd","Preco (R$)",""].map(h=><div key={h} style={{fontSize:"11px",color:"#888",fontWeight:500}}>{h}</div>)}
                </div>
                {form.items.map((item,i) => (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 80px 100px 36px",gap:"8px",marginBottom:"6px"}}>
                    <input value={item.name} onChange={e=>updateItem(i,"name",e.target.value)} placeholder="Nome do produto" style={{padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",background:"white"}} />
                    <input value={item.quantity} onChange={e=>updateItem(i,"quantity",e.target.value)} placeholder="1" style={{padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",background:"white",textAlign:"center"}} />
                    <input value={item.unitPrice} onChange={e=>updateItem(i,"unitPrice",e.target.value)} placeholder="0,00" style={{padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",background:"white"}} />
                    <button onClick={()=>removeItem(i)} style={{background:"#fee2e2",border:"none",borderRadius:"6px",color:"#ef4444",cursor:"pointer",fontSize:"16px",fontWeight:700}}>x</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"12px",borderTop:"1px solid #f3f4f6"}}>
              <div style={{fontSize:"18px",fontWeight:700,color:"#1D9E75"}}>Total: {fmt(total)}</div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>{setShowForm(false);setForm(emptyForm())}} style={{padding:"8px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
                <button onClick={saveSale} style={{padding:"8px 20px",background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:500}}>Salvar Venda</button>
              </div>
            </div>
          </div>
        )}
        {loading ? <div style={{textAlign:"center",padding:"40px",color:"#888"}}>Carregando...</div> : sales.length===0 ? (
          <div style={{textAlign:"center",color:"#888",padding:"60px"}}>Nenhuma venda registrada ainda.</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {sales.map((s:any) => (
              <div key={s.id} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"10px",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:500,fontSize:"14px"}}>{s.customerName||"Cliente nao informado"}</div>
                  <div style={{fontSize:"12px",color:"#888",marginTop:"3px"}}>{fmtDate(s.createdAt)} - {s.paymentMethod==="cash"?"Dinheiro":s.paymentMethod==="pix"?"PIX":s.paymentMethod==="credit"?"Credito":"Debito"}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:700,color:s.status==="cancelled"?"#888":"#1D9E75",fontSize:"15px",textDecoration:s.status==="cancelled"?"line-through":"none"}}>{fmt(s.total)}</div>
                    <div style={{fontSize:"11px",color:s.status==="completed"?"#1D9E75":"#ef4444"}}>{s.status==="completed"?"Concluida":"Cancelada"}</div>
                  </div>
                  {s.status!=="cancelled" && (
                    <button onClick={()=>cancelSale(s.id)} style={{background:"#fee2e2",color:"#ef4444",border:"none",borderRadius:"6px",padding:"5px 10px",fontSize:"12px",cursor:"pointer"}}>Cancelar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
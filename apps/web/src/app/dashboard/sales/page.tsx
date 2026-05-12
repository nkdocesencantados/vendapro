"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt, fmtDate } from "@/lib/utils"

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customerName:"", paymentMethod:"cash", discount:0, items:[{name:"", quantity:1, unitPrice:0, isManual:true}] })

  useEffect(() => { loadSales() }, [])

  async function loadSales() {
    try { const r = await api.get("/sales"); setSales(r.data) } catch {} finally { setLoading(false) }
  }

  async function saveSale() {
    try {
      await api.post("/sales", form)
      setShowForm(false)
      setForm({ customerName:"", paymentMethod:"cash", discount:0, items:[{name:"", quantity:1, unitPrice:0, isManual:true}] })
      loadSales()
      alert("Venda registrada com sucesso!")
    } catch(e) { alert("Erro ao salvar venda") }
  }

  const total = form.items.reduce((a,i) => a + i.quantity * i.unitPrice, 0) - form.discount

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 20px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:"14px",fontWeight:500}}>Vendas</div>
        <button onClick={()=>setShowForm(true)} style={{background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"13px",cursor:"pointer"}}>+ Nova Venda</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
        {showForm && (
          <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px",marginBottom:"20px"}}>
            <h3 style={{marginBottom:"16px",fontWeight:500}}>Nova Venda</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div><label style={{fontSize:"12px",color:"#666"}}>Cliente</label><input value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} placeholder="Nome do cliente" style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}} /></div>
              <div><label style={{fontSize:"12px",color:"#666"}}>Pagamento</label><select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}}><option value="cash">Dinheiro</option><option value="credit">Credito</option><option value="debit">Debito</option><option value="pix">PIX</option></select></div>
            </div>
            <div style={{marginBottom:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><label style={{fontSize:"12px",color:"#666"}}>Itens</label><button onClick={()=>setForm({...form,items:[...form.items,{name:"",quantity:1,unitPrice:0,isManual:true}]})} style={{background:"none",border:"1px solid #1D9E75",color:"#1D9E75",borderRadius:"6px",padding:"3px 10px",fontSize:"12px",cursor:"pointer"}}>+ Item</button></div>
              {form.items.map((item,i) => (
                <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:"8px",marginBottom:"8px"}}>
                  <input value={item.name} onChange={e=>{const it=[...form.items];it[i]={...it[i],name:e.target.value};setForm({...form,items:it})}} placeholder="Produto" style={{padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px"}} />
                  <input type="number" value={item.quantity} onChange={e=>{const it=[...form.items];it[i]={...it[i],quantity:+e.target.value};setForm({...form,items:it})}} placeholder="Qtd" style={{padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px"}} />
                  <input type="number" value={item.unitPrice} onChange={e=>{const it=[...form.items];it[i]={...it[i],unitPrice:+e.target.value};setForm({...form,items:it})}} placeholder="Preco" style={{padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px"}} />
                  <button onClick={()=>{const it=form.items.filter((_,j)=>j!==i);setForm({...form,items:it})}} style={{background:"#fee2e2",border:"none",borderRadius:"6px",color:"#ef4444",cursor:"pointer",padding:"0 10px"}}>x</button>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:"16px",fontWeight:600,color:"#1D9E75"}}>Total: {fmt(total)}</div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>setShowForm(false)} style={{padding:"8px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
                <button onClick={saveSale} style={{padding:"8px 16px",background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>Salvar Venda</button>
              </div>
            </div>
          </div>
        )}
        {loading ? <div style={{textAlign:"center",color:"#888",padding:"40px"}}>Carregando...</div> : sales.length === 0 ? (
          <div style={{textAlign:"center",color:"#888",padding:"60px"}}>Nenhuma venda registrada ainda.</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {(sales as any[]).map((s:any) => (
              <div key={s.id} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"10px",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:500,fontSize:"14px"}}>{s.customerName||"Cliente nao informado"}</div>
                  <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>{fmtDate(s.createdAt)} - {s.paymentMethod}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:600,color:"#1D9E75",fontSize:"15px"}}>{fmt(s.total)}</div>
                  <div style={{fontSize:"11px",color:s.status==="completed"?"#1D9E75":"#ef4444"}}>{s.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

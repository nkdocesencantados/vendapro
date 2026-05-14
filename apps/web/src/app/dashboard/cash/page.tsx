"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"

export default function CashPage() {
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState({ income:0, expense:0, profit:0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type:"income", category:"other", description:"", amount:0, date:new Date().toISOString().split("T")[0], isPaid:true })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [e, s] = await Promise.all([api.get("/financial"), api.get("/financial/summary")])
      setEntries(e.data); setSummary(s.data)
    } catch {} finally { setLoading(false) }
  }

  async function saveEntry() {
    try { await api.post("/financial", form); setShowForm(false); loadData(); alert("Lancamento salvo!") } catch { alert("Erro ao salvar") }
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 20px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:"14px",fontWeight:500}}>Caixa</div>
        <button onClick={()=>setShowForm(true)} style={{background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"13px",cursor:"pointer"}}>+ Lancamento</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"20px"}}>
          {[{label:"Receitas",value:summary.income,color:"#1D9E75"},{label:"Despesas",value:summary.expense,color:"#ef4444"},{label:"Lucro",value:summary.profit,color:"#3b82f6"}].map(m=>(
            <div key={m.label} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
              <div style={{fontSize:"12px",color:"#888",marginBottom:"6px"}}>{m.label}</div>
              <div style={{fontSize:"22px",fontWeight:600,color:m.color}}>{fmt(m.value)}</div>
            </div>
          ))}
        </div>
        {showForm && (
          <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px",marginBottom:"20px"}}>
            <h3 style={{marginBottom:"16px",fontWeight:500}}>Novo Lancamento</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div><label style={{fontSize:"12px",color:"#666"}}>Tipo</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}}><option value="income">Receita</option><option value="expense">Despesa</option></select></div>
              <div><label style={{fontSize:"12px",color:"#666"}}>Valor</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:+e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}} /></div>
              <div><label style={{fontSize:"12px",color:"#666"}}>Descricao</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}} /></div>
              <div><label style={{fontSize:"12px",color:"#666"}}>Data</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}} /></div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
              <button onClick={()=>setShowForm(false)} style={{padding:"8px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
              <button onClick={saveEntry} style={{padding:"8px 16px",background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>Salvar</button>
            </div>
          </div>
        )}
        {loading ? <div style={{textAlign:"center",padding:"40px",color:"#888"}}>Carregando...</div> : entries.length===0 ? (
          <div style={{textAlign:"center",color:"#888",padding:"60px"}}>Nenhum lancamento.</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {(entries as any[]).map((e:any)=>(
              <div key={e.id} style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"10px",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:500,fontSize:"14px"}}>{e.description}</div>
                  <div style={{fontSize:"12px",color:"#888"}}>{e.category === "sale" ? "Venda" : e.category} - {new Date(e.date).toLocaleDateString("pt-BR")}</div>
                </div>
                <div style={{fontWeight:600,color:e.type==="income"?"#1D9E75":"#ef4444",fontSize:"15px"}}>{e.type==="income"?"+":"-"}{fmt(e.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

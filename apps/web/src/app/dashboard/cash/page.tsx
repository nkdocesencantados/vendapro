"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }
function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }
const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const CAT_MAP: Record<string,string> = { sale:"Venda", service:"Serviço", rent:"Aluguel", salary:"Salário", supplier:"Fornecedor", tax:"Imposto", utilities:"Contas", marketing:"Marketing", other:"Outros" }

export default function CashPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth()+1)
  const [year, setYear]   = useState(now.getFullYear())
  const [data, setData]   = useState<any>({income:0,expense:0,profit:0,entries:[]})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [primary, setPrimary] = useState("#1D9E75")
  const [form, setForm] = useState({type:"expense",category:"",description:"",amount:0,date:new Date().toISOString().split("T")[0],isPaid:true})

  useEffect(()=>{
    try{ const sc=localStorage.getItem("storeConfig"); if(sc){const p=JSON.parse(sc);if(p.primaryColor)setPrimary(p.primaryColor)} }catch{}
    load()
  },[month,year])

  async function load(){
    setLoading(true)
    try{
      const r = await api.get(`/financial/summary?month=${month}&year=${year}`).catch(()=>api.get("/financial"))
      setData(r.data)
    }catch(e){console.error(e)}finally{setLoading(false)}
  }

  async function save(){
    if(!form.amount||+form.amount<=0) return alert("Informe o valor")
    setSaving(true)
    try{
      await api.post("/financial",form)
      setShowForm(false)
      setForm({type:"expense",category:"",description:"",amount:0,date:new Date().toISOString().split("T")[0],isPaid:true})
      load()
    }catch(e:any){alert(e?.response?.data?.message||"Erro")}
    finally{setSaving(false)}
  }

  const margin = data.income>0?Math.round((data.profit/data.income)*100):0
  const entries: any[] = data.entries||[]
  const expByCat: Record<string,number> = {}
  entries.filter((e:any)=>e.type==="expense").forEach((e:any)=>{ expByCat[CAT_MAP[e.category]||e.category]=(expByCat[CAT_MAP[e.category]||e.category]||0)+Number(e.amount) })
  const cats = Object.entries(expByCat).sort((a,b)=>b[1]-a[1])
  const maxCat = cats[0]?.[1]||1

  return (
    <div style={{padding:"clamp(12px,3vw,28px)",maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand,#1D9E75);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-ghost{color:var(--text-muted);} .vp-btn-ghost:hover{background:var(--surface-2);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}
        .vp-input:focus{border-color:var(--brand,#1D9E75);box-shadow:0 0 0 3px rgba(29,158,117,0.12);}
        .vp-select{appearance:none;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);cursor:pointer;}
        .vp-select:focus{border-color:var(--brand,#1D9E75);}
        .vp-field{display:flex;flex-direction:column;gap:6px;}
        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}
        .vp-modal-bg{position:fixed;inset:0;background:rgba(12,10,9,0.6);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;padding:16px;}
        .vp-modal{width:min(480px,100%);background:var(--bg-elevated);border:1px solid var(--border);border-radius:18px;max-height:90vh;overflow:auto;}
        .vp-modal-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{margin:0;font-size:16px;font-weight:600;}
        .vp-modal-body{padding:20px;display:flex;flex-direction:column;gap:14px;}
        .vp-modal-foot{padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;background:var(--surface-2);border-radius:0 0 18px 18px;}
        .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
        .kpi{padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;}
        .kpi-lbl{font-size:11px;color:var(--text-subtle);margin-bottom:4px;}
        .kpi-val{font-size:clamp(14px,4vw,20px);font-weight:600;letter-spacing:-.02em;color:var(--text);}
        .kpi-dlt{font-size:11px;color:var(--text-subtle);margin-top:2px;}
        .nbtn{display:flex;align-items:center;justify-content:center;gap:6px;background:var(--brand,#1D9E75);color:white;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:600;width:100%;margin-bottom:14px;cursor:pointer;}
        .entry-card{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--border);}
        .entry-card:last-child{border:none;}
        .entry-icon{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;}
        .entry-name{font-size:13px;font-weight:500;color:var(--text);}
        .entry-meta{font-size:11px;color:var(--text-subtle);margin-top:2px;}
        .mini-bar{height:4px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:5px;}
        .mini-bar-fill{display:block;height:100%;border-radius:999px;}
        .month-sel{display:flex;gap:8px;margin-bottom:14px;}
        .card-wrap{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:12px;}
        .card-head-row{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .card-head-title{font-size:13px;font-weight:600;color:var(--text);}
        .card-head-sub{font-size:11px;color:var(--text-subtle);}
      `}</style>

      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(20px,5vw,26px)",fontWeight:600,letterSpacing:"-.02em"}}>Caixa</h1>
          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>{MONTHS[month-1]} de {year}</div>
        </div>
      </div>

      <div className="month-sel">
        <select className="vp-select" value={month} onChange={e=>setMonth(+e.target.value)} style={{flex:1}}>
          {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="vp-select" value={year} onChange={e=>setYear(+e.target.value)}>
          {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-lbl">Entradas</div><div className="kpi-val" style={{color:"#1D9E75"}}>{BRLshort(data.income)}</div></div>
        <div className="kpi"><div className="kpi-lbl">Saidas</div><div className="kpi-val" style={{color:"var(--danger)"}}>{BRLshort(data.expense)}</div></div>
        <div className="kpi" style={{gridColumn:"span 2"}}>
          <div className="kpi-lbl">Saldo do mês</div>
          <div className="kpi-val" style={{fontSize:"clamp(18px,5vw,26px)"}}>{BRL(data.profit)}</div>
          <div className="kpi-dlt">{margin}% margem</div>
        </div>
      </div>

      <button className="nbtn" onClick={()=>{setForm({type:"expense",category:"",description:"",amount:0,date:new Date().toISOString().split("T")[0],isPaid:true});setShowForm(true)}}>
        + Novo lançamento
      </button>

      <div className="card-wrap">
        <div className="card-head-row">
          <div className="card-head-title">Lançamentos</div>
          <div className="card-head-sub">{entries.length} registros</div>
        </div>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>
        ) : entries.length===0 ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Nenhum lançamento neste período.</div>
        ) : entries.map((e:any)=>(
          <div key={e.id} className="entry-card">
            <div className="entry-icon" style={{background:e.type==="income"?"rgba(29,158,117,0.15)":"rgba(185,28,28,0.15)"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={e.type==="income"?"#1D9E75":"#f87171"} strokeWidth="2.5" strokeLinecap="round">
                {e.type==="income" ? <path d="M12 19V5M5 12l7-7 7 7"/> : <path d="M12 5v14M5 12l7 7 7-7"/>}
              </svg>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div className="entry-name">{e.description||CAT_MAP[e.category]||e.category}</div>
              <div className="entry-meta">{new Date(e.date||e.createdAt).toLocaleDateString("pt-BR")} - {CAT_MAP[e.category]||e.category}</div>
            </div>
            <div style={{fontWeight:700,fontSize:13,color:e.type==="income"?"#1D9E75":"var(--danger)",whiteSpace:"nowrap"}}>
              {e.type==="income"?"+":"-"} {BRLshort(Number(e.amount))}
            </div>
          </div>
        ))}
      </div>

      {cats.length > 0 && (
        <div className="card-wrap">
          <div className="card-head-row">
            <div className="card-head-title">Despesas por categoria</div>
          </div>
          <div style={{padding:"10px 14px"}}>
            {cats.map(([cat,val])=>(
              <div key={cat} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                  <span style={{color:"var(--text)"}}>{cat}</span>
                  <span style={{fontWeight:600,color:"var(--text)"}}>{BRLshort(val as number)}</span>
                </div>
                <div className="mini-bar"><span className="mini-bar-fill" style={{width:`${((val as number)/maxCat)*100}%`,background:primary}}/></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>
          <div className="vp-modal" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>Novo lançamento</h2>
              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowForm(false)}>X</button>
            </div>
            <div className="vp-modal-body">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="vp-field">
                  <label>Tipo</label>
                  <select className="vp-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value,category:""})}>
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div className="vp-field">
                  <label>Categoria</label>
                  <select className="vp-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    <option value="">Selecione...</option>
                    {form.type==="income"?(
                      <><option value="sale">Venda</option><option value="service">Serviço</option><option value="other">Outros</option></>
                    ):(
                      <><option value="rent">Aluguel</option><option value="salary">Salário</option><option value="supplier">Fornecedor</option><option value="tax">Imposto</option><option value="utilities">Contas</option><option value="marketing">Marketing</option><option value="other">Outros</option></>
                    )}
                  </select>
                </div>
              </div>
              <div className="vp-field">
                <label>Descricao</label>
                <input className="vp-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ex: Aluguel do mês" />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="vp-field"><label>Valor (R$)</label><input className="vp-input" type="number" value={form.amount||""} onChange={e=>setForm({...form,amount:+e.target.value})} placeholder="0,00" /></div>
                <div className="vp-field"><label>Data</label><input className="vp-input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
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


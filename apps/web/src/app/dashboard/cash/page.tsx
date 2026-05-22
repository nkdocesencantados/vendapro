"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const CAT_MAP: Record<string,string> = { sale:"Venda", service:"Servico", rent:"Aluguel", salary:"Salario", supplier:"Fornecedor", tax:"Imposto", utilities:"Contas", marketing:"Marketing", other:"Outros" }
const PAY_MAP: Record<string,string> = { cash:"Dinheiro", pix:"PIX", credit_card:"Credito", debit_card:"Debito" }

export default function CashPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth()+1)
  const [year, setYear]   = useState(now.getFullYear())
  const [cmpMonth, setCmpMonth] = useState(now.getMonth()===0?12:now.getMonth())
  const [cmpYear, setCmpYear]   = useState(now.getMonth()===0?now.getFullYear()-1:now.getFullYear())
  const [showCmp, setShowCmp]   = useState(false)
  const [data, setData]         = useState<any>({income:0,expense:0,profit:0,entries:[]})
  const [cmpData, setCmpData]   = useState<any>({income:0,expense:0,profit:0})
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [primary, setPrimary]   = useState("#1D9E75")
  const [form, setForm]         = useState({type:"expense",category:"",description:"",amount:0,date:new Date().toISOString().split("T")[0],isPaid:true})

  useEffect(()=>{
    try{ const sc=localStorage.getItem("storeConfig"); if(sc){const p=JSON.parse(sc);if(p.primaryColor)setPrimary(p.primaryColor)} }catch{}
    load()
  },[month,year])

  async function load(){
    setLoading(true)
    try{
      const r = await api.get(`/financial?month=${month}&year=${year}`).catch(() => api.get('/financial'))
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
    <div style={{padding:28,maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .vp-card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);}
        .vp-card-head h3{margin:0;font-size:14px;font-weight:600;}
        .vp-card-head .sub{font-size:12px;color:var(--text-subtle);margin-top:2px;}
        .vp-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;}
        .vp-tbl th{text-align:left;font-weight:500;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--text-subtle);padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface-2);}
        .vp-tbl td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle;}
        .vp-tbl tr:last-child td{border-bottom:0;}
        .vp-tbl tr:hover td{background:var(--surface-2);}
        .vp-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:500;}
        .vp-pill-in{background:var(--success-bg);color:var(--success);}
        .vp-pill-out{background:var(--danger-bg);color:var(--danger);}
        .vp-pill-grey{background:var(--surface-3);color:var(--text-muted);}
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);} .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-btn-ghost{color:var(--text-muted);} .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-modal-bg{position:fixed;inset:0;background:rgba(12,10,9,0.5);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;}
        .vp-modal{width:min(480px,94vw);background:var(--bg-elevated);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow-lg);}
        .vp-modal-head{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{margin:0;font-size:17px;font-weight:600;}
        .vp-modal-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
        .vp-modal-foot{padding:14px 22px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;background:var(--surface-2);border-radius:0 0 18px 18px;}
        .vp-field{display:flex;flex-direction:column;gap:6px;}
        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}
        .vp-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint);}
        .vp-select{appearance:none;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 32px 9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;cursor:pointer;}
        .vp-select:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint);}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
        .kpi{padding:18px;background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .kpi .lbl{font-size:12px;color:var(--text-subtle);font-weight:500;margin-bottom:10px;}
        .kpi .val{font-size:22px;font-weight:600;letter-spacing:-.02em;font-family:var(--font-mono,"Geist Mono",monospace);}
        .kpi .delta{margin-top:6px;font-size:11px;}
        .mini-bar{height:4px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:6px;}
        .mini-bar span{display:block;height:100%;background:var(--brand);border-radius:999px;}
        @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}.cash-grid{grid-template-columns:1fr!important;}}
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:600,letterSpacing:"-.02em"}}>Caixa</h1>
          <div style={{color:"var(--text-subtle)",fontSize:14,marginTop:4}}>Controle financeiro · {MONTHS[month-1]} de {year}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <select className="vp-select" style={{width:"auto"}} value={month} onChange={e=>setMonth(+e.target.value)}>
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="vp-select" style={{width:90}} value={year} onChange={e=>setYear(+e.target.value)}>
            {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button className="vp-btn vp-btn-primary" onClick={()=>{setForm({type:"expense",category:"",description:"",amount:0,date:new Date().toISOString().split("T")[0],isPaid:true});setShowForm(true)}}>
            + Lancamento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi"><div className="lbl">Receitas</div><div className="val" style={{color:"var(--success)"}}>{BRL(data.income)}</div></div>
        <div className="kpi"><div className="lbl">Despesas</div><div className="val" style={{color:"var(--danger)"}}>{BRL(data.expense)}</div></div>
        <div className="kpi"><div className="lbl">Lucro liquido</div><div className="val">{BRL(data.profit)}</div></div>
        <div className="kpi"><div className="lbl">Margem</div><div className="val">{margin}%</div></div>
      </div>

      <div className="cash-grid" style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:18,marginBottom:18}}>
        {/* LANÇAMENTOS */}
        <div className="vp-card">
          <div className="vp-card-head">
            <div><h3>Lancamentos</h3><div className="sub">{MONTHS[month-1]} {year}</div></div>
          </div>
          {loading ? (
            <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>
          ) : entries.length===0 ? (
            <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Nenhum lancamento neste periodo.</div>
          ) : (
            <table className="vp-tbl">
              <thead><tr><th>Data</th><th>Descricao</th><th>Categoria</th><th>Tipo</th><th style={{textAlign:"right"}}>Valor</th></tr></thead>
              <tbody>
                {entries.map((e:any)=>(
                  <tr key={e.id}>
                    <td style={{color:"var(--text-muted)",fontSize:12,whiteSpace:"nowrap"}}>{new Date(e.date||e.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td style={{fontWeight:500}}>{e.description||CAT_MAP[e.category]||e.category}</td>
                    <td><span className="vp-pill vp-pill-grey">{CAT_MAP[e.category]||e.category}</span></td>
                    <td>
                      {e.type==="income"
                        ? <span className="vp-pill vp-pill-in">↑ Receita</span>
                        : <span className="vp-pill vp-pill-out">↓ Despesa</span>}
                    </td>
                    <td style={{textAlign:"right",fontFamily:"var(--font-mono)",fontWeight:600,color:e.type==="income"?"var(--success)":"var(--text)"}}>
                      {e.type==="income"?"+":"−"} {BRL(Number(e.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* DESPESAS POR CATEGORIA */}
        <div className="vp-card">
          <div className="vp-card-head">
            <h3>Despesas por categoria</h3>
            <span style={{background:"var(--surface-3)",color:"var(--text-muted)",padding:"3px 8px",borderRadius:999,fontSize:11}}>{cats.length} categorias</span>
          </div>
          <div style={{padding:18}}>
            {cats.length===0 ? (
              <div style={{color:"var(--text-subtle)",fontSize:13,padding:"8px 0"}}>Nenhuma despesa registrada.</div>
            ) : cats.map(([cat,val])=>(
              <div key={cat} style={{padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:500}}>{cat}</span>
                  <span style={{fontFamily:"var(--font-mono)",fontSize:13,fontWeight:600}}>{BRL(val as number)}</span>
                </div>
                <div className="mini-bar"><span style={{width:`${((val as number)/maxCat)*100}%`}}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>
          <div className="vp-modal" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>Novo lancamento</h2>
              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="vp-modal-body">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
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
                    {form.type==="income" ? (
                      <><option value="sale">Venda</option><option value="service">Servico</option><option value="other">Outros</option></>
                    ) : (
                      <><option value="rent">Aluguel</option><option value="salary">Salario</option><option value="supplier">Fornecedor</option><option value="tax">Imposto</option><option value="utilities">Contas</option><option value="marketing">Marketing</option><option value="other">Outros</option></>
                    )}
                  </select>
                </div>
              </div>
              <div className="vp-field">
                <label>Descricao</label>
                <input className="vp-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ex: Aluguel do mes" />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div className="vp-field">
                  <label>Valor (R$)</label>
                  <input className="vp-input" type="number" value={form.amount||""} onChange={e=>setForm({...form,amount:+e.target.value})} placeholder="0,00" />
                </div>
                <div className="vp-field">
                  <label>Data</label>
                  <input className="vp-input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
                </div>
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

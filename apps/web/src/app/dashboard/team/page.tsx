"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:"", email:"", password:"" })
  const [primary, setPrimary] = useState("#1D9E75")
  const [plan, setPlan] = useState("basic")
  const [error, setError] = useState("")

  useEffect(() => {
    load()
    try {
      const sc = localStorage.getItem("storeConfig")
      if(sc){ const p=JSON.parse(sc); if(p.primaryColor)setPrimary(p.primaryColor); if(p.plan)setPlan(p.plan) }
    } catch{}
  }, [])

  async function load() {
    try { const r = await api.get("/users"); setMembers(r.data) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }

  async function save() {
    if(!form.name||!form.email||!form.password) return setError("Preencha todos os campos")
    setSaving(true); setError("")
    try {
      await api.post("/users", { ...form, role:"seller" })
      setShowForm(false); setForm({name:"",email:"",password:""}); load()
    } catch(e:any) { setError(e?.response?.data?.message||"Erro ao cadastrar") }
    finally { setSaving(false) }
  }

  async function remove(id:string) {
    if(!confirm("Remover vendedor?")) return
    try { await api.delete(`/users/${id}`); load() } catch{}
  }

  const sellers = members.filter((m:any) => m.role === "seller")
  const owner   = members.find((m:any)  => m.role === "store_owner")
  const maxSellers = plan==="business"?10:plan==="pro"?2:0
  const atLimit = sellers.length >= maxSellers
  const planLabel: Record<string,string> = { basic:"Basic", pro:"Pro", business:"Business", trial:"Trial" }

  return (
    <div style={{padding:"clamp(12px,3vw,28px)",maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand,#1D9E75);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);}
        .vp-btn-ghost{color:var(--text-muted);} .vp-btn-ghost:hover{background:var(--surface-2);}
        .vp-btn-danger{background:var(--danger-bg);color:var(--danger);}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}
        .vp-input:focus{border-color:var(--brand,#1D9E75);box-shadow:0 0 0 3px rgba(29,158,117,0.12);}
        .vp-field{display:flex;flex-direction:column;gap:6px;}
        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}
        .vp-modal-bg{position:fixed;inset:0;background:rgba(12,10,9,0.6);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;padding:16px;}
        .vp-modal{width:min(440px,100%);background:var(--bg-elevated);border:1px solid var(--border);border-radius:18px;max-height:90vh;overflow:auto;}
        .vp-modal-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{margin:0;font-size:16px;font-weight:600;}
        .vp-modal-body{padding:20px;display:flex;flex-direction:column;gap:14px;}
        .vp-modal-foot{padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;background:var(--surface-2);border-radius:0 0 18px 18px;}
        .nbtn{display:inline-flex;align-items:center;gap:6px;background:var(--brand);color:white;border:none;border-radius:var(--r);padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:var(--transition);} .nbtn:hover{filter:brightness(1.1);}
        .member-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:8px;}
        .mc-top{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
        .mc-av{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;color:white;flex-shrink:0;}
        .mc-info{flex:1;min-width:0;}
        .mc-name{font-size:14px;font-weight:600;color:var(--text);}
        .mc-email{font-size:11px;color:var(--text-subtle);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .mc-pills{display:flex;gap:6px;flex-wrap:wrap;}
        .pill{display:inline-flex;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:500;}
        .pill-brand{background:rgba(29,158,117,0.15);color:#1D9E75;}
        .pill-ok{background:rgba(29,158,117,0.15);color:#1D9E75;}
        .pill-grey{background:var(--surface-3);color:var(--text-muted);}
        .prog{height:5px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:5px;}
        .pf{height:100%;background:var(--brand,#1D9E75);border-radius:999px;}
      `}</style>

      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:"clamp(20px,5vw,26px)",fontWeight:600,letterSpacing:"-.02em"}}>Equipe</h1>
          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>
            {sellers.length} / {maxSellers} vendedores - plano {planLabel[plan]||plan}
          </div>
        </div>
      </div>

      <button className="nbtn" disabled={atLimit} onClick={()=>setShowForm(true)} style={atLimit?{opacity:0.5,cursor:"not-allowed"}:{}}>
        + Adicionar vendedor
      </button>

      {atLimit && maxSellers > 0 && (
        <div style={{marginBottom:14,padding:14,background:"var(--info-bg)",border:"1px solid var(--info)",borderRadius:12}}>
          <div style={{fontWeight:500,fontSize:13}}>Limite atingido - plano {planLabel[plan]}</div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>Faca upgrade para Business para até 10 vendedores.</div>
        </div>
      )}

      {maxSellers === 0 && (
        <div style={{marginBottom:14,padding:14,background:"var(--warning-bg)",border:"1px solid var(--warning)",borderRadius:12}}>
          <div style={{fontWeight:500,fontSize:13,color:"var(--warning)"}}>Plano Basic não inclui vendedores.</div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>Faca upgrade para Pro e adicione até 2 vendedores.</div>
        </div>
      )}

      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text-subtle)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Uso do plano</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text)",marginBottom:5}}>
          <span>Membros</span>
          <span style={{color:"#1D9E75",fontWeight:500}}>{sellers.length} / {maxSellers||"ilimitado"}</span>
        </div>
        {maxSellers > 0 && <div className="prog"><div className="pf" style={{width:`${Math.min((sellers.length/maxSellers)*100,100)}%`}}/></div>}
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:40,color:"var(--text-subtle)"}}>Carregando...</div>
      ) : (
        <>
          {owner && (
            <div className="member-card">
              <div className="mc-top">
                <div className="mc-av" style={{background:primary}}>{(owner.name||"P").split(" ").map((x:string)=>x[0]).slice(0,2).join("")}</div>
                <div className="mc-info">
                  <div className="mc-name">{owner.name||"Proprietário"}</div>
                  <div className="mc-email">{owner.email}</div>
                </div>
              </div>
              <div className="mc-pills">
                <span className="pill pill-brand">Proprietário</span>
                <span className={`pill ${owner.status==="active"?"pill-ok":"pill-grey"}`}>{owner.status==="active"?"Ativo":"Inativo"}</span>
              </div>
            </div>
          )}
          {sellers.map((m:any)=>(
            <div key={m.id} className="member-card">
              <div className="mc-top">
                <div className="mc-av" style={{background:"var(--surface-3)",color:"var(--text)"}}>{(m.name||"V").split(" ").map((x:string)=>x[0]).slice(0,2).join("")}</div>
                <div className="mc-info">
                  <div className="mc-name">{m.name}</div>
                  <div className="mc-email">{m.email}</div>
                </div>
                <button className="vp-btn vp-btn-sm vp-btn-danger" onClick={()=>remove(m.id)}>Remover</button>
              </div>
              <div className="mc-pills">
                <span className="pill pill-grey">Vendedor</span>
                <span className={`pill ${m.status==="active"?"pill-ok":"pill-grey"}`}>{m.status==="active"?"Ativo":"Inativo"}</span>
              </div>
            </div>
          ))}
        </>
      )}

      {showForm && (
        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>
          <div className="vp-modal" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>Adicionar vendedor</h2>
              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowForm(false)}>X</button>
            </div>
            <div className="vp-modal-body">
              {error && <div style={{padding:10,background:"var(--danger-bg)",color:"var(--danger)",borderRadius:8,fontSize:13}}>{error}</div>}
              <div className="vp-field"><label>Nome completo</label><input className="vp-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex: Joana Silva" /></div>
              <div className="vp-field"><label>E-mail</label><input className="vp-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="joana@suaempresa.com" /></div>
              <div className="vp-field"><label>Senha inicial</label><input className="vp-input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" /></div>
              <div style={{padding:10,background:"var(--surface-2)",borderRadius:8,fontSize:12,color:"var(--text-muted)"}}>
                O vendedor tera acesso a Dashboard, Vendas e Recibos.
              </div>
            </div>
            <div className="vp-modal-foot">
              <button className="vp-btn vp-btn-ghost" onClick={()=>setShowForm(false)}>Cancelar</button>
              <button className="vp-btn vp-btn-primary" onClick={save} disabled={saving}>{saving?"Salvando...":"Adicionar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


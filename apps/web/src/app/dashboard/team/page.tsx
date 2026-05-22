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
    } catch(e:any) {
      setError(e?.response?.data?.message||"Erro ao cadastrar")
    } finally { setSaving(false) }
  }

  async function remove(id:string) {
    if(!confirm("Remover vendedor?")) return
    try { await api.delete(`/users/${id}`); load() } catch{}
  }

  const sellers = members.filter((m:any) => m.role === "seller")
  const owner   = members.find((m:any)  => m.role === "store_owner")
  const maxSellers = plan === "business" ? 10 : plan === "pro" ? 2 : 0
  const atLimit = sellers.length >= maxSellers
  const planLabel: Record<string,string> = { basic:"Basic", pro:"Pro", business:"Business", trial:"Trial" }

  return (
    <div style={{padding:28,maxWidth:1440,margin:"0 auto"}}>
      <style>{`
        .vp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;}
        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:all .12s;}
        .vp-btn-primary{background:var(--brand);color:white;} .vp-btn-primary:hover{background:#178A65;}
        .vp-btn-secondary{background:var(--surface);border-color:var(--border);color:var(--text);} .vp-btn-secondary:hover{background:var(--surface-2);}
        .vp-btn-ghost{color:var(--text-muted);} .vp-btn-ghost:hover{background:var(--surface-2);color:var(--text);}
        .vp-btn-danger{background:var(--danger-bg);color:var(--danger);} .vp-btn-danger:hover{background:var(--danger);color:white;}
        .vp-btn-sm{padding:5px 10px;font-size:12px;border-radius:8px;}
        .vp-modal-bg{position:fixed;inset:0;background:rgba(12,10,9,0.5);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:100;}
        .vp-modal{width:min(440px,94vw);background:var(--bg-elevated);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow-lg);}
        .vp-modal-head{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .vp-modal-head h2{margin:0;font-size:17px;font-weight:600;}
        .vp-modal-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
        .vp-modal-foot{padding:14px 22px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;background:var(--surface-2);border-radius:0 0 18px 18px;}
        .vp-field{display:flex;flex-direction:column;gap:6px;}
        .vp-field label{font-size:12px;font-weight:500;color:var(--text-muted);}
        .vp-input{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;color:var(--text);width:100%;transition:border-color .12s,box-shadow .12s;}
        .vp-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint);}
        .team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;}
        .member-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px;transition:border-color .12s,box-shadow .12s;}
        .member-card:hover{border-color:var(--border-strong);box-shadow:var(--shadow-md);}
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:600,letterSpacing:"-.02em"}}>Equipe</h1>
          <div style={{color:"var(--text-subtle)",fontSize:14,marginTop:4}}>
            {sellers.length} / {maxSellers} vendedores · plano {planLabel[plan]||plan}
          </div>
        </div>
        <button
          className="vp-btn vp-btn-primary"
          disabled={atLimit}
          onClick={()=>setShowForm(true)}
          style={atLimit?{opacity:0.5,cursor:"not-allowed"}:{}}>
          + Adicionar vendedor
        </button>
      </div>

      {/* BANNER LIMITE */}
      {atLimit && maxSellers > 0 && (
        <div style={{marginBottom:20,padding:16,background:"var(--info-bg)",border:"1px solid var(--info)",borderRadius:14,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1}}>
            <strong style={{fontSize:13}}>Limite atingido — plano {planLabel[plan]}</strong>
            <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>
              Faca upgrade para Business e adicione ate 10 vendedores.
            </div>
          </div>
          <button className="vp-btn vp-btn-primary vp-btn-sm">Fazer upgrade</button>
        </div>
      )}

      {maxSellers === 0 && (
        <div style={{marginBottom:20,padding:16,background:"var(--warning-bg)",border:"1px solid var(--warning)",borderRadius:14}}>
          <strong style={{fontSize:13,color:"var(--warning)"}}>Seu plano Basic nao inclui vendedores.</strong>
          <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>Faca upgrade para Pro e adicione ate 2 vendedores.</div>
        </div>
      )}

      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-subtle)"}}>Carregando...</div>
      ) : (
        <div className="team-grid">
          {/* Dono */}
          {owner && (
            <div className="member-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:primary,color:"white",display:"grid",placeItems:"center",fontSize:14,fontWeight:700,flexShrink:0}}>
                    {(owner.name||"P").split(" ").map((x:string)=>x[0]).slice(0,2).join("")}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600}}>{owner.name||"Proprietario"}</div>
                    <div style={{fontSize:11,color:"var(--text-subtle)"}}>{owner.email}</div>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <span style={{background:"var(--brand-tint)",color:"var(--brand-deep)",padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:500}}>Proprietario</span>
                <span style={{background:owner.status==="active"?"var(--success-bg)":"var(--danger-bg)",color:owner.status==="active"?"var(--success)":"var(--danger)",padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:500}}>
                  {owner.status==="active"?"Ativo":"Inativo"}
                </span>
              </div>
            </div>
          )}

          {/* Vendedores */}
          {sellers.map((m:any)=>(
            <div key={m.id} className="member-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:"var(--surface-3)",color:"var(--text)",display:"grid",placeItems:"center",fontSize:14,fontWeight:700,flexShrink:0}}>
                    {(m.name||"V").split(" ").map((x:string)=>x[0]).slice(0,2).join("")}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600}}>{m.name}</div>
                    <div style={{fontSize:11,color:"var(--text-subtle)"}}>{m.email}</div>
                  </div>
                </div>
                <button className="vp-btn vp-btn-sm vp-btn-danger" onClick={()=>remove(m.id)}>Remover</button>
              </div>
              <div style={{display:"flex",gap:6}}>
                <span style={{background:"var(--surface-3)",color:"var(--text-muted)",padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:500}}>Vendedor</span>
                <span style={{background:m.status==="active"?"var(--success-bg)":"var(--danger-bg)",color:m.status==="active"?"var(--success)":"var(--danger)",padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:500}}>
                  {m.status==="active"?"Ativo":"Inativo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL ADICIONAR */}
      {showForm && (
        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>
          <div className="vp-modal" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2>Adicionar vendedor</h2>
              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="vp-modal-body">
              {error && <div style={{padding:10,background:"var(--danger-bg)",color:"var(--danger)",borderRadius:8,fontSize:13}}>{error}</div>}
              <div className="vp-field"><label>Nome completo</label><input className="vp-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex: Joana Silva" /></div>
              <div className="vp-field"><label>E-mail</label><input className="vp-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="joana@suaempresa.com" /></div>
              <div className="vp-field"><label>Senha inicial</label><input className="vp-input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" /></div>
              <div style={{padding:12,background:"var(--surface-2)",borderRadius:8,fontSize:12,color:"var(--text-muted)"}}>
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

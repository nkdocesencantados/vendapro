"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/contexts/auth.store"
import { Pencil, Plus, Trash2, Users, X } from "lucide-react"


// Estilos de página no padrão aprovado (cartões 16px, rótulos uppercase, valores mono). Só tokens de globals.css.
const PG_CSS = `
  .pg{padding:clamp(16px,3vw,32px);max-width:1440px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
  .pg-head{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px}
  .pg-title{margin:0;font-size:28px;font-weight:600;letter-spacing:-0.6px;line-height:1.15;color:var(--text)}
  .pg-sub{font-size:13px;color:var(--text-muted);margin-top:4px}
  .pg-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-left:auto}
  .pg-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(170px,100%),1fr));gap:16px}
  .pg-kpi{padding:18px;border-radius:16px;border:1px solid var(--border);background:var(--surface);display:flex;flex-direction:column;gap:10px;min-width:0}
  .pg-kpi-l{font-size:12.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em}
  .pg-kpi-v{font-family:var(--font-mono);font-size:clamp(18px,4.6vw,28px);font-weight:500;letter-spacing:-0.02em;line-height:1.1;color:var(--text);overflow-wrap:anywhere}
  .pg-kpi-s{font-size:12.5px;color:var(--text-muted)}
  .pg-card{border-radius:16px;border:1px solid var(--border);background:var(--surface);min-width:0;overflow:hidden}
  .pg-card-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;padding:16px 20px}
  .pg-card-t{margin:0;font-size:16px;font-weight:600;color:var(--text)}
  .pg-card-s{font-size:13px;color:var(--text-muted);margin-left:auto}
  .pg-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .pg-tbl{width:100%;border-collapse:collapse;font-size:14px}
  .pg-tbl th{padding:10px 20px;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);text-align:left;white-space:nowrap}
  .pg-tbl td{padding:12px 20px;border-top:1px solid var(--border);color:var(--text);vertical-align:middle}
  .pg-tbl tbody tr:hover td{background:var(--surface-2)}
  .pg-num{font-family:var(--font-mono);letter-spacing:-0.02em;white-space:nowrap}
  .pg-r{text-align:right!important}
  .pg-muted{color:var(--text-muted)!important}
  .pg-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:3px 8px;border-radius:6px;white-space:nowrap}
  .pg-chip.ok{background:color-mix(in srgb,var(--brand) 14%,transparent);color:var(--brand-soft)}
  .pg-chip.warn{background:var(--warning-bg);color:var(--warning)}
  .pg-chip.bad{background:var(--danger-bg);color:var(--danger)}
  .pg-chip.grey{background:var(--surface-2);color:var(--text-muted)}
  .pg-empty{padding:48px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
  .pg-empty-i{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--brand) 12%,transparent);color:var(--brand-soft);margin-bottom:4px}
  .pg-empty-t{font-size:15px;font-weight:600;color:var(--text)}
  .pg-empty-s{font-size:13px;line-height:1.5;color:var(--text-muted);max-width:44ch;margin-bottom:8px}
  .pg-seg{display:inline-flex;flex-wrap:wrap;gap:4px;padding:4px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
  .pg-seg button{min-height:36px;padding:0 14px;border:0;border-radius:8px;background:transparent;color:var(--text-muted);font:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:var(--transition)}
  .pg-seg button:hover{color:var(--text)}
  .pg-seg button[aria-pressed="true"],.pg-seg button[aria-selected="true"]{background:color-mix(in srgb,var(--brand) 16%,transparent);color:var(--text);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 30%,transparent)}
  .pg button:focus-visible,.pg select:focus-visible,.pg input:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
  .pg .vp-modal-head h2{margin:0}
  .pg-x{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer}
  .pg-x:hover{color:var(--text);background:var(--surface-2)}
  @media(max-width:640px){.pg-actions{margin-left:0;width:100%}.pg-tbl th,.pg-tbl td{padding-left:16px;padding-right:16px}.pg-card-h{padding:14px 16px}}
`

export default function TeamPage() {
  const { user: authUser } = useAuthStore()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:"", email:"", password:"" })
  const [plan, setPlan] = useState("basic")
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<any>(null)
  const [editForm, setEditForm] = useState({name:"",email:"",commissionRate:""})
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    load()
    try {
      const sc = localStorage.getItem("storeConfig")
      if(sc){ const p=JSON.parse(sc); if(p.plan)setPlan(p.plan) }
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
      await api.post("/users", { ...form, role:"seller", storeId: authUser?.storeId })
      setShowForm(false); setForm({name:"",email:"",password:""}); load()
    } catch(e:any) { setError(e?.response?.data?.message||e?.message||"Erro ao cadastrar vendedor. Verifique se o e-mail já está em uso.") }
    finally { setSaving(false) }
  }

  function openEdit(m:any) {
    setEditing(m)
    setEditForm({name:m.name||"",email:m.email||"",commissionRate:String(m.commissionRate||"")})
    setShowEdit(true)
  }

  async function saveEdit() {
    if(!editForm.name) return setError("Nome obrigatório")
    try {
      await api.patch(`/users/${editing.id}`, {
        name: editForm.name,
        email: editForm.email,
        commissionRate: +editForm.commissionRate||0
      })
      setShowEdit(false); setEditing(null); load()
    } catch { setError("Erro ao salvar") }
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

  const initials = (n:string, f:string) => (n||f).split(" ").map((x:string)=>x[0]).slice(0,2).join("").toUpperCase()
  const usePct = maxSellers>0 ? Math.min((sellers.length/maxSellers)*100,100) : 0

  return (
    <div className="pg">
      <style dangerouslySetInnerHTML={{ __html: PG_CSS + `
        .tm-note{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;padding:14px 18px;border-radius:16px;border:1px solid var(--border);background:var(--surface)}
        .tm-note.warn{border-color:color-mix(in srgb,var(--warning) 45%,transparent);background:var(--warning-bg)}
        .tm-note-t{font-size:14px;font-weight:600;color:var(--text)}
        .tm-note-s{font-size:13px;color:var(--text-muted)}
        .tm-bar{height:8px;border-radius:8px;background:var(--surface-2);overflow:hidden}
        .tm-bar span{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,var(--brand-mid),var(--brand-soft))}
        .tm-row{display:flex;align-items:center;gap:12px;padding:14px 20px;border-top:1px solid var(--border);flex-wrap:wrap}
        .tm-av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:600;flex-shrink:0;background:color-mix(in srgb,var(--brand) 14%,var(--surface-2));color:var(--brand-soft)}
        .tm-av.owner{background:linear-gradient(180deg,var(--brand),var(--brand-mid));color:var(--bg)}
        .tm-info{flex:1 1 180px;min-width:0}
        .tm-name{font-size:14px;font-weight:600;color:var(--text)}
        .tm-email{font-size:13px;color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .tm-chips{display:flex;gap:6px;flex-wrap:wrap}
        @media(max-width:640px){.tm-row{padding:14px 16px}}
      ` }} />

      <header className="pg-head">
        <div>
          <h1 className="pg-title">Equipe</h1>
          <div className="pg-sub">Plano {planLabel[plan]||plan} · <span className="pg-num">{sellers.length}/{maxSellers}</span> vendedores</div>
        </div>
        <div className="pg-actions">
          <button className="vp-btn vp-btn-primary" disabled={atLimit} onClick={()=>setShowForm(true)} style={atLimit?{opacity:0.5,cursor:"not-allowed"}:undefined}>
            <Plus size={16} aria-hidden/>Adicionar vendedor
          </button>
        </div>
      </header>

      {maxSellers === 0 ? (
        <div className="tm-note warn" role="status">
          <div style={{flex:"1 1 240px"}}>
            <div className="tm-note-t">O plano Basic não inclui vendedores</div>
            <div className="tm-note-s">Faça upgrade para o Pro e adicione até 2 vendedores.</div>
          </div>
        </div>
      ) : (
        <section className="pg-card" style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:10}} aria-label="Uso do plano">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12,flexWrap:"wrap"}}>
            <span className="pg-kpi-l">Vagas de vendedor</span>
            <span className="pg-num" style={{fontSize:15,color:"var(--text)"}}>{sellers.length} <span className="pg-muted">de {maxSellers}</span></span>
          </div>
          <div className="tm-bar" role="progressbar" aria-valuenow={sellers.length} aria-valuemin={0} aria-valuemax={maxSellers} aria-label="Vagas usadas"><span style={{width:`${usePct}%`}}/></div>
          {atLimit && <div className="tm-note-s">Limite do plano {planLabel[plan]} atingido. Faça upgrade para o Business e tenha até 10 vendedores.</div>}
        </section>
      )}

      <section className="pg-card">
        <div className="pg-card-h">
          <h2 className="pg-card-t">Membros</h2>
          <span className="pg-card-s">{sellers.length+(owner?1:0)} no total</span>
        </div>

        {loading ? (
          <div style={{padding:"4px 20px 20px",display:"flex",flexDirection:"column",gap:10}} aria-busy="true" aria-label="Carregando equipe">
            {[0,1,2].map(i=><div key={i} className="vp-skeleton" style={{height:56}}/>)}
          </div>
        ) : (
          <>
            {owner && (
              <div className="tm-row">
                <div className="tm-av owner" aria-hidden>{initials(owner.name,"P")}</div>
                <div className="tm-info">
                  <div className="tm-name">{owner.name||"Proprietário"}</div>
                  <div className="tm-email">{owner.email}</div>
                </div>
                <div className="tm-chips">
                  <span className="pg-chip ok">Proprietário</span>
                  <span className={`pg-chip ${owner.status==="active"?"ok":"grey"}`}>{owner.status==="active"?"Ativo":"Inativo"}</span>
                </div>
              </div>
            )}
            {sellers.map((m:any)=>(
              <div key={m.id} className="tm-row">
                <div className="tm-av" aria-hidden>{initials(m.name,"V")}</div>
                <div className="tm-info">
                  <div className="tm-name">{m.name}</div>
                  <div className="tm-email">{m.email}</div>
                </div>
                <div className="tm-chips">
                  <span className="pg-chip grey">Vendedor</span>
                  <span className={`pg-chip ${m.status==="active"?"ok":"grey"}`}>{m.status==="active"?"Ativo":"Inativo"}</span>
                  {m.commissionRate>0&&<span className="pg-chip ok"><span className="pg-num">{m.commissionRate}%</span> comissão</span>}
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button className="vp-icon-btn" onClick={()=>openEdit(m)} aria-label={`Editar ${m.name}`} title="Editar"><Pencil size={14} aria-hidden/></button>
                  <button className="vp-icon-btn" style={{color:"var(--danger)"}} onClick={()=>remove(m.id)} aria-label={`Remover ${m.name}`} title="Remover"><Trash2 size={14} aria-hidden/></button>
                </div>
              </div>
            ))}
            {sellers.length===0 && (
              <div className="pg-empty" style={{borderTop:owner?"1px solid var(--border)":undefined}}>
                <div className="pg-empty-i"><Users size={22} aria-hidden/></div>
                <div className="pg-empty-t">Nenhum vendedor ainda</div>
                <div className="pg-empty-s">{maxSellers>0?"Adicione um vendedor para que ele registre vendas com o próprio acesso. Ele verá Dashboard, Vendas e Recibos.":"Com o plano Pro você pode adicionar vendedores com acesso próprio."}</div>
                {maxSellers>0 && <button className="vp-btn vp-btn-primary" onClick={()=>setShowForm(true)}><Plus size={16} aria-hidden/>Adicionar primeiro vendedor</button>}
              </div>
            )}
          </>
        )}
      </section>

      {showEdit && editing && (
        <div className="vp-modal-bg" onClick={e=>{if(e.target===e.currentTarget){setShowEdit(false);setEditing(null)}}}>
          <div className="vp-modal" role="dialog" aria-modal="true" aria-labelledby="tm-edit-t" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head"><h2 id="tm-edit-t">Editar vendedor</h2><button className="pg-x" onClick={()=>{setShowEdit(false);setEditing(null)}} aria-label="Fechar"><X size={16} aria-hidden/></button></div>
            <div className="vp-modal-body">
              {error&&<div role="alert" style={{padding:"10px 12px",background:"var(--danger-bg)",color:"var(--danger)",borderRadius:10,fontSize:13,marginBottom:14}}>{error}</div>}
              <div className="vp-field"><label htmlFor="tm-e-name">Nome</label><input id="tm-e-name" className="vp-input" value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} placeholder="Nome completo"/></div>
              <div className="vp-field"><label htmlFor="tm-e-email">E-mail</label><input id="tm-e-email" className="vp-input" type="email" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})}/></div>
              <div className="vp-field"><label htmlFor="tm-e-com">Taxa de comissão (%)</label><input id="tm-e-com" className="vp-input" type="number" inputMode="decimal" min="0" max="100" step="0.5" value={editForm.commissionRate} onChange={e=>setEditForm({...editForm,commissionRate:e.target.value})} placeholder="Ex: 10"/></div>
            </div>
            <div className="vp-modal-foot">
              <button className="vp-btn vp-btn-ghost" onClick={()=>{setShowEdit(false);setEditing(null)}}>Cancelar</button>
              <button className="vp-btn vp-btn-primary" onClick={saveEdit}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>
          <div className="vp-modal" role="dialog" aria-modal="true" aria-labelledby="tm-new-t" onClick={e=>e.stopPropagation()}>
            <div className="vp-modal-head">
              <h2 id="tm-new-t">Adicionar vendedor</h2>
              <button className="pg-x" onClick={()=>setShowForm(false)} aria-label="Fechar"><X size={16} aria-hidden/></button>
            </div>
            <div className="vp-modal-body">
              {error && <div role="alert" style={{padding:"10px 12px",background:"var(--danger-bg)",color:"var(--danger)",borderRadius:10,fontSize:13,marginBottom:14}}>{error}</div>}
              <div className="vp-field"><label htmlFor="tm-n-name">Nome completo</label><input id="tm-n-name" className="vp-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex: Joana Silva" /></div>
              <div className="vp-field"><label htmlFor="tm-n-email">E-mail</label><input id="tm-n-email" className="vp-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="joana@suaempresa.com" /></div>
              <div className="vp-field"><label htmlFor="tm-n-pwd">Senha inicial</label><input id="tm-n-pwd" className="vp-input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Senha de acesso do vendedor" /></div>
              <div style={{padding:"10px 12px",background:"var(--surface-2)",borderRadius:10,fontSize:13,color:"var(--text-muted)"}}>
                O vendedor terá acesso a Dashboard, Vendas e Recibos.
              </div>
            </div>
            <div className="vp-modal-foot">
              <button className="vp-btn vp-btn-ghost" onClick={()=>setShowForm(false)}>Cancelar</button>
              <button className="vp-btn vp-btn-primary" onClick={save} disabled={saving}>{saving?"Salvando...":"Adicionar vendedor"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

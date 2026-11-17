"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import { AlertTriangle, Download, FileText, Package, Pencil, Plus, Trash2, X } from "lucide-react"



function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }



function vpCSV(headers: string[], rows: any[][], filename: string) {

  const lines = [headers, ...rows].map(r => r.map((c:any) => String(c)).join(';')).join('\n');

  const blob = new Blob([lines], {type: 'text/csv;charset=utf-8'});

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url; a.download = filename + '.csv'; a.click();

  URL.revokeObjectURL(url);

}

// Nome da loja salvo pelas Configurações (storeConfig.name).
function storeNameLS(){ try{ return JSON.parse(localStorage.getItem("storeConfig")||"{}").name||"Minha Loja" }catch{ return "Minha Loja" } }

function vpPDF(html: string) {

  const w = window.open('', '_blank');

  if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 600); }

}

function vpTable(title: string, headers: string[], rows: string[][]) {

  const th = headers.map((h:string) => '<th>' + h + '</th>').join('');

  const tr = rows.map((r:string[]) => '<tr>' + r.map((c:string) => '<td>' + c + '</td>').join('') + '</tr>').join('');

  return '<html><head><title>'+title+'</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th{background:#1F8A47;color:white;padding:8px;font-size:11px}td{padding:7px;border-bottom:1px solid #eee;font-size:11px}</style></head><body><h2>'+title+'</h2><table><thead><tr>'+th+'</tr></thead><tbody>'+tr+'</tbody></table></body></html>';

}









function exportInvCSV(products: any[], threshold: number) {

  vpCSV(['Produto','Preco','Estoque','Minimo','Status'],

    products.map((p:any) => [p.name,Number(p.price).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),p.stock,p.minStock||threshold||5,p.stock===0?'Esgotado':p.stock<=(p.minStock||threshold||5)?'Baixo':'OK']),

    'estoque');

}

function exportInvPDF(products: any[], threshold: number) {
  const rows=products.map((p:any,i:number)=>{const bg=i%2===0?'#fff':'#F8FAF9';const st=p.stock===0?'Esgotado':p.stock<=(p.minStock||threshold||5)?'Baixo':'OK';const col=p.stock===0?'#ef4444':p.stock<=(p.minStock||threshold||5)?'#f59e0b':'#1F8A47';return '<tr style="background:'+bg+';"><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+p.name+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">R$ '+Number(p.price).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+p.stock+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+( p.minStock||threshold||5)+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;font-weight:600;color:'+col+';">'+st+'</td></tr>';}).join('');
  const logo='<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="2.5" fill="white"/><circle cx="4" cy="18" r="2.5" fill="white"/><circle cx="20" cy="18" r="2.5" fill="white"/><line x1="12" y1="4" x2="4" y2="18" stroke="white" stroke-width="1.5"/><line x1="12" y1="4" x2="20" y2="18" stroke="white" stroke-width="1.5"/><line x1="4" y1="18" x2="20" y2="18" stroke="white" stroke-width="1.5"/></svg>';
  const low=products.filter((p:any)=>p.stock>0&&p.stock<=(p.minStock||threshold||5)).length;
  const out=products.filter((p:any)=>p.stock===0).length;
  const header='<div style="background:#04130F;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;background:#1F8A47;border-radius:10px;display:flex;align-items:center;justify-content:center;">'+logo+'</div><div><div style="font-size:16px;font-weight:700;color:white;">VendaPro</div><div style="font-size:11px;color:#6B8C82;">'+storeNameLS()+'</div></div></div><div style="text-align:right;"><div style="font-size:18px;font-weight:700;color:white;">Relatorio de Estoque</div><div style="font-size:12px;color:#8DA39A;">Gerado em '+new Date().toLocaleString('pt-BR')+'</div></div></div>';
  const kpis='<div style="display:grid;grid-template-columns:repeat(3,1fr);background:#F8FAF9;border-bottom:2px solid #E5EDE9;"><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Total produtos</div><div style="font-size:22px;font-weight:700;color:#1F8A47;">'+products.length+'</div></div><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Estoque baixo</div><div style="font-size:22px;font-weight:700;color:#f59e0b;">'+low+'</div></div><div style="padding:16px 20px;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Esgotados</div><div style="font-size:22px;font-weight:700;color:#ef4444;">'+out+'</div></div></div>';
  const table='<div style="padding:20px 32px;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#1F8A47;"><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Produto</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Preco</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Estoque</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Minimo</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  const footer='<div style="padding:14px 32px;background:#F8FAF9;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #E5EDE9;"><div style="font-size:11px;color:#888;">VendaPro - vendapro.com.br</div><div style="font-size:11px;color:#1F8A47;font-weight:700;">'+storeNameLS()+'</div></div>';
  const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body>'+header+kpis+table+footer+'</body></html>';
  vpPDF(html);
}



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

export default function StockPage() {

  const [products, setProducts] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  const [filter, setFilter] = useState("all")

  const [showForm, setShowForm] = useState(false)

  const [editing, setEditing] = useState<any>(null)

  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name:"", price:"", stock:"", minStock:"5", description:"" })

  const [primary, setPrimary] = useState("#1F8A47")

  const [threshold, setThreshold] = useState(5)



  useEffect(() => {
    load()
    try { const sc=localStorage.getItem("storeConfig"); if(sc){const p=JSON.parse(sc);if(p.primaryColor)setPrimary(p.primaryColor);if(p.lowStockThreshold)setThreshold(+p.lowStockThreshold||5)} } catch{}
  }, [])




  async function load() {

    try { const r = await api.get("/products"); setProducts(r.data) }

    catch(e){ console.error(e) } finally { setLoading(false) }

  }



  async function save() {

    if(!form.name||!form.price) return alert("Nome e preço sao obrigatórios")

    setSaving(true)

    try {

      if(editing) await api.patch(`/products/${editing.id}`, { name:form.name, price:+form.price, stock:+form.stock||0, minStock:+form.minStock||5 })

      else await api.post("/products", { name:form.name, price:+form.price, stock:+form.stock||0, minStock:+form.minStock||5 })

      setShowForm(false); setEditing(null); setForm({name:"",price:"",stock:"",minStock:"5",description:""}); load()

    } catch(e:any){ alert(e?.response?.data?.message||"Erro") }

    finally { setSaving(false) }

  }



  async function remove(id:string) {

    if(!confirm("Excluir produto?")) return

    try { await api.delete(`/products/${id}`); load() } catch{}

  }



  function openEdit(p:any) {

    setEditing(p); setForm({name:p.name,price:String(p.price),stock:String(p.stock),minStock:String(p.minStock||5),description:p.description||""}); setShowForm(true)

  }



  const filtered = products.filter(p => {

    if(filter==="low") return p.stock > 0 && p.stock <= (p.minStock||threshold)

    if(filter==="out") return p.stock === 0

    return true

  })

  const lowCount = products.filter(p=>p.stock>0&&p.stock<=(p.minStock||threshold)).length

  const outCount = products.filter(p=>p.stock===0).length

  const totalVal = products.reduce((a,p)=>a+p.stock*p.price,0)



  const isLow = (p:any) => p.stock > 0 && p.stock <= (p.minStock||threshold)
  const attention = lowCount + outCount

  return (

    <div className="pg">

      <style dangerouslySetInnerHTML={{ __html: PG_CSS + `
        .inv-alert{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;padding:16px 18px;border-radius:16px;border:1px solid color-mix(in srgb,var(--warning) 45%,transparent);background:var(--warning-bg)}
        .inv-alert-i{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;background:color-mix(in srgb,var(--warning) 18%,transparent);color:var(--warning)}
        .inv-alert-t{font-size:15px;font-weight:600;color:var(--text)}
        .inv-alert-s{font-size:13px;color:var(--text-muted);margin-top:2px}
        .inv-prod{display:flex;align-items:center;gap:12px;min-width:0}
        .inv-prod-i{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;background:var(--surface-2);color:var(--text-muted)}
      ` }} />

      <header className="pg-head">
        <div>
          <h1 className="pg-title">Estoque</h1>
          <div className="pg-sub">{products.length} {products.length===1?"produto":"produtos"} · valor em estoque <span className="pg-num" style={{color:"var(--text)"}}>{BRL(totalVal)}</span></div>
        </div>
        <div className="pg-actions">
          <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>exportInvCSV(filtered,threshold)}><Download size={14} aria-hidden/>Excel</button>
          <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>exportInvPDF(filtered,threshold)}><FileText size={14} aria-hidden/>PDF</button>
          <button className="vp-btn vp-btn-primary" onClick={()=>{setEditing(null);setShowForm(true)}}><Plus size={16} aria-hidden/>Novo produto</button>
        </div>
      </header>

      {!loading && attention > 0 && (
        <div className="inv-alert" role="status">
          <div className="inv-alert-i"><AlertTriangle size={20} aria-hidden/></div>
          <div style={{flex:"1 1 220px",minWidth:0}}>
            <div className="inv-alert-t">{attention} {attention===1?"produto precisa":"produtos precisam"} de reposição</div>
            <div className="inv-alert-s">{outCount} {outCount===1?"esgotado":"esgotados"} · {lowCount} com estoque baixo</div>
          </div>
          <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>setFilter(outCount>0?"out":"low")}>Ver produtos</button>
        </div>
      )}

      <section className="pg-kpis" aria-label="Indicadores de estoque">
        <div className="pg-kpi"><span className="pg-kpi-l">Produtos</span><span className="pg-kpi-v">{loading?"—":products.length}</span><span className="pg-kpi-s">cadastrados</span></div>
        <div className="pg-kpi"><span className="pg-kpi-l">Valor em estoque</span><span className="pg-kpi-v">{loading?"—":BRL(totalVal)}</span><span className="pg-kpi-s">preço × quantidade</span></div>
        <div className="pg-kpi"><span className="pg-kpi-l">Estoque baixo</span><span className="pg-kpi-v" style={{color:lowCount?"var(--warning)":undefined}}>{loading?"—":lowCount}</span><span className="pg-kpi-s">no mínimo ou abaixo</span></div>
        <div className="pg-kpi"><span className="pg-kpi-l">Esgotados</span><span className="pg-kpi-v" style={{color:outCount?"var(--danger)":undefined}}>{loading?"—":outCount}</span><span className="pg-kpi-s">sem unidades</span></div>
      </section>

      <section className="pg-card">
        <div className="pg-card-h" style={{alignItems:"center"}}>
          <h2 className="pg-card-t">Produtos</h2>
          <div className="pg-seg" role="group" aria-label="Filtrar produtos" style={{marginLeft:"auto"}}>
            {[["all","Todos",products.length],["low","Baixo",lowCount],["out","Esgotados",outCount]].map(([v,l,n])=>(
              <button key={v as string} type="button" aria-pressed={filter===v} onClick={()=>setFilter(v as string)}>{l} <span className="pg-num" style={{opacity:.7}}>{n}</span></button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{padding:"4px 20px 20px",display:"flex",flexDirection:"column",gap:10}} aria-busy="true" aria-label="Carregando produtos">
            {[0,1,2,3,4].map(i=><div key={i} className="vp-skeleton" style={{height:44}}/>)}
          </div>
        ) : filtered.length === 0 ? (
          products.length === 0 ? (
            <div className="pg-empty">
              <div className="pg-empty-i"><Package size={22} aria-hidden/></div>
              <div className="pg-empty-t">Nenhum produto ainda</div>
              <div className="pg-empty-s">Cadastre o primeiro produto com preço e quantidade para acompanhar o estoque e receber alertas de reposição.</div>
              <button className="vp-btn vp-btn-primary" onClick={()=>{setEditing(null);setShowForm(true)}}><Plus size={16} aria-hidden/>Cadastrar primeiro produto</button>
            </div>
          ) : (
            <div className="pg-empty">
              <div className="pg-empty-t">{filter==="out"?"Nenhum produto esgotado":"Nenhum produto com estoque baixo"}</div>
              <div className="pg-empty-s">Tudo em dia por aqui.</div>
              <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>setFilter("all")}>Ver todos os produtos</button>
            </div>
          )
        ) : (
          <div className="pg-scroll">
            <table className="pg-tbl" style={{minWidth:600}}>
              <thead><tr><th>Produto</th><th className="pg-r">Preço</th><th className="pg-r">Estoque</th><th>Situação</th><th className="pg-r" aria-label="Ações"></th></tr></thead>
              <tbody>
                {filtered.map((p:any)=>(
                  <tr key={p.id}>
                    <td>
                      <div className="inv-prod">
                        <div className="inv-prod-i"><Package size={16} aria-hidden/></div>
                        <span style={{fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                      </div>
                    </td>
                    <td className="pg-num pg-r">{BRL(p.price)}</td>
                    <td className="pg-num pg-r">{p.stock} <span className="pg-muted" style={{fontSize:12}}>/ mín. {p.minStock||threshold}</span></td>
                    <td>
                      {p.stock===0 ? <span className="pg-chip bad">Esgotado</span>
                      : isLow(p) ? <span className="pg-chip warn">Repor</span>
                      : <span className="pg-chip ok">Em estoque</span>}
                    </td>
                    <td className="pg-r">
                      <div style={{display:"inline-flex",gap:6}}>
                        <button className="vp-icon-btn" onClick={()=>openEdit(p)} aria-label={`Editar ${p.name}`} title="Editar"><Pencil size={14} aria-hidden/></button>
                        <button className="vp-icon-btn" style={{color:"var(--danger)"}} onClick={()=>remove(p.id)} aria-label={`Excluir ${p.name}`} title="Excluir"><Trash2 size={14} aria-hidden/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (

        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>

          <div className="vp-modal" role="dialog" aria-modal="true" aria-labelledby="inv-form-t" onClick={e=>e.stopPropagation()}>

            <div className="vp-modal-head">
              <h2 id="inv-form-t">{editing?"Editar produto":"Novo produto"}</h2>
              <button className="pg-x" onClick={()=>setShowForm(false)} aria-label="Fechar"><X size={16} aria-hidden/></button>
            </div>

            <div className="vp-modal-body">

              <div className="vp-field"><label htmlFor="inv-name">Nome *</label><input id="inv-name" className="vp-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nome do produto" /></div>

              <div className="vp-field-row">
                <div className="vp-field"><label htmlFor="inv-price">Preço (R$) *</label><input id="inv-price" className="vp-input" type="number" inputMode="decimal" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0,00" /></div>
                <div className="vp-field"><label htmlFor="inv-stock">Estoque</label><input id="inv-stock" className="vp-input" type="number" inputMode="numeric" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} placeholder="0" /></div>
              </div>

              <div className="vp-field"><label htmlFor="inv-min">Estoque mínimo</label><input id="inv-min" className="vp-input" type="number" inputMode="numeric" min="1" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} placeholder="5" /><span style={{fontSize:12,color:"var(--text-muted)"}}>Você recebe o alerta de reposição quando o estoque chegar nesse número.</span></div>

            </div>

            <div className="vp-modal-foot">
              <button className="vp-btn vp-btn-ghost" onClick={()=>setShowForm(false)}>Cancelar</button>
              <button className="vp-btn vp-btn-primary" onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar produto"}</button>
            </div>

          </div>

        </div>

      )}

    </div>

  )

}

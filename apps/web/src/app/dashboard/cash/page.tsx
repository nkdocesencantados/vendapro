"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import { BRLpdf, exportReport, table } from "@/lib/pdf"
import { ArrowDownLeft, ArrowUpRight, Download, FileText, Plus, Wallet, X } from "lucide-react"



function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }



function vpCSV(headers: string[], rows: any[][], filename: string) {

  const lines = [headers, ...rows].map(r => r.map((c:any) => String(c)).join(';')).join('\n');

  const BOM = '\uFEFF'; // BOM para Excel reconhecer UTF-8
  const blob = new Blob([BOM + lines], {type: 'text/csv;charset=utf-8'});

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url; a.download = filename + '.csv'; a.click();

  URL.revokeObjectURL(url);

}





function exportCashCSV(entries: any[], month: number, year: number) {

  const M=['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const C: Record<string,string>={sale:'Venda',service:'Servico',rent:'Aluguel',salary:'Salario',supplier:'Fornecedor',tax:'Imposto',utilities:'Contas',marketing:'Marketing',other:'Outros'};

  vpCSV(['Data','Descricao','Categoria','Tipo','Valor'],

    entries.map((e:any)=>[new Date(e.date||e.createdAt).toLocaleDateString('pt-BR'),e.description||C[e.category]||e.category,C[e.category]||e.category,e.type==='income'?'Receita':'Despesa',(e.type==='income'?'+':'-')+Number(e.amount).toFixed(2).replace('.',',')]),

    'caixa-'+M[month-1]+'-'+year);

}

function exportCashPDF(entries: any[], income: number, expense: number, profit: number, month: number, year: number) {
  const M=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const C: Record<string,string>={sale:'Venda',service:'Serviço',rent:'Aluguel',salary:'Salário',supplier:'Fornecedor',tax:'Imposto',utilities:'Contas',marketing:'Marketing',other:'Outros'};
  const rows=entries.map((e:any)=>{const inc=e.type==='income';return [new Date(e.date||e.createdAt).toLocaleDateString('pt-BR'),e.description||C[e.category]||e.category,C[e.category]||e.category,{html:(inc?'+ ':'− ')+BRLpdf(e.amount),tone:inc?'pos':'neg',strong:true} as const];});
  exportReport({
    title:'Fluxo de Caixa', subtitle:M[month-1]+' de '+year,
    kpis:[{label:'Entradas',value:BRLpdf(income),tone:'pos'},{label:'Saídas',value:BRLpdf(expense),tone:'neg'},{label:'Saldo do mês',value:BRLpdf(profit),tone:profit<0?'neg':'pos'},{label:'Lançamentos',value:String(entries.length)}],
    body:table([{label:'Data'},{label:'Descrição'},{label:'Categoria'},{label:'Valor',align:'right'}],rows,'Lançamentos'),
  });
}



const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

const CAT_MAP: Record<string,string> = { sale:"Venda", service:"Serviço", rent:"Aluguel", salary:"Salário", supplier:"Fornecedor", tax:"Imposto", utilities:"Contas", marketing:"Marketing", other:"Outros" }




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

export default function CashPage() {

  const now = new Date()

  const [month, setMonth] = useState(now.getMonth()+1)

  const [year, setYear]   = useState(now.getFullYear())

  const [data, setData]   = useState<any>({income:0,expense:0,profit:0,entries:[]})

  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)

  const [saving, setSaving]   = useState(false)


  const [form, setForm] = useState({type:"expense",category:"",description:"",amount:0,date:new Date().toISOString().split("T")[0],isPaid:true})



  useEffect(()=>{


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



  function openNew(){ setForm({type:"expense",category:"",description:"",amount:0,date:new Date().toISOString().split("T")[0],isPaid:true});setShowForm(true) }

  return (

    <div className="pg">

      <style dangerouslySetInnerHTML={{ __html: PG_CSS + `
        .cash-filters{display:flex;gap:8px;flex-wrap:wrap}
        .cash-filters .vp-select{width:auto;min-width:120px;min-height:38px}
        .cash-dir{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
        .cash-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px;align-items:start}
        .cash-bar{height:6px;border-radius:6px;background:var(--surface-2);overflow:hidden;margin-top:6px}
        .cash-bar span{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,var(--brand-mid),var(--brand-soft))}
        @media(max-width:960px){.cash-grid{grid-template-columns:1fr}}
      ` }} />

      <header className="pg-head">
        <div>
          <h1 className="pg-title">Caixa</h1>
          <div className="pg-sub">Entradas e saídas de {MONTHS[month-1]} de {year}</div>
        </div>
        <div className="pg-actions">
          <div className="cash-filters">
            <select className="vp-select" aria-label="Mês" value={month} onChange={e=>setMonth(+e.target.value)}>
              {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="vp-select" aria-label="Ano" value={year} onChange={e=>setYear(+e.target.value)}>
              {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>exportCashCSV(entries,month,year)}><Download size={14} aria-hidden/>Excel</button>
          <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={()=>exportCashPDF(entries,data.income,data.expense,data.profit,month,year)}><FileText size={14} aria-hidden/>PDF</button>
          <button className="vp-btn vp-btn-primary" onClick={openNew}><Plus size={16} aria-hidden/>Novo lançamento</button>
        </div>
      </header>

      <section className="pg-kpis" aria-label="Resumo do mês">
        <div className="pg-kpi">
          <span className="pg-kpi-l">Entradas</span>
          <span className="pg-kpi-v" style={{color:"var(--brand-soft)"}}>{loading?"—":BRL(data.income)}</span>
          <span className="pg-kpi-s">receitas do mês</span>
        </div>
        <div className="pg-kpi">
          <span className="pg-kpi-l">Saídas</span>
          <span className="pg-kpi-v" style={{color:"var(--danger)"}}>{loading?"—":BRL(data.expense)}</span>
          <span className="pg-kpi-s">despesas do mês</span>
        </div>
        <div className="pg-kpi">
          <span className="pg-kpi-l">Saldo do mês</span>
          <span className="pg-kpi-v" style={{color:data.profit<0?"var(--danger)":undefined}}>{loading?"—":BRL(data.profit)}</span>
          <span className="pg-kpi-s" style={{color:margin<0?"var(--danger)":undefined}}>{margin}% de margem</span>
        </div>
      </section>

      <div className="cash-grid">

        <section className="pg-card">
          <div className="pg-card-h">
            <h2 className="pg-card-t">Lançamentos</h2>
            <span className="pg-card-s">{entries.length} {entries.length===1?"registro":"registros"}</span>
          </div>

          {loading ? (
            <div style={{padding:"4px 20px 20px",display:"flex",flexDirection:"column",gap:10}} aria-busy="true" aria-label="Carregando lançamentos">
              {[0,1,2,3,4].map(i=><div key={i} className="vp-skeleton" style={{height:40}}/>)}
            </div>
          ) : entries.length===0 ? (
            <div className="pg-empty">
              <div className="pg-empty-i"><Wallet size={22} aria-hidden/></div>
              <div className="pg-empty-t">Nenhum lançamento em {MONTHS[month-1]}</div>
              <div className="pg-empty-s">Registre aluguel, compras de fornecedor e outras receitas para ver o saldo real do mês.</div>
              <button className="vp-btn vp-btn-primary" onClick={openNew}><Plus size={16} aria-hidden/>Registrar lançamento</button>
            </div>
          ) : (
            <div className="pg-scroll">
              <table className="pg-tbl" style={{minWidth:520}}>
                <thead><tr><th>Descrição</th><th>Data</th><th>Categoria</th><th className="pg-r">Valor</th></tr></thead>
                <tbody>
                  {entries.map((e:any)=>{
                    const inc = e.type==="income"
                    return (
                      <tr key={e.id}>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                            <span className="cash-dir" style={{background:inc?"color-mix(in srgb,var(--brand) 14%,transparent)":"var(--danger-bg)",color:inc?"var(--brand-soft)":"var(--danger)"}}>
                              {inc?<ArrowDownLeft size={14} aria-label="Entrada"/>:<ArrowUpRight size={14} aria-label="Saída"/>}
                            </span>
                            <span style={{fontWeight:500}}>{e.description||CAT_MAP[e.category]||e.category}</span>
                          </div>
                        </td>
                        <td className="pg-num pg-muted">{new Date(e.date||e.createdAt).toLocaleDateString("pt-BR")}</td>
                        <td><span className="pg-chip grey">{CAT_MAP[e.category]||e.category||"Outros"}</span></td>
                        <td className="pg-num pg-r" style={{color:inc?"var(--brand-soft)":"var(--danger)"}}>{inc?"+":"−"} {BRL(Number(e.amount))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="pg-card">
          <div className="pg-card-h"><h2 className="pg-card-t">Despesas por categoria</h2></div>
          <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:14}}>
            {cats.length===0 ? (
              <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.5}}>{loading?"Carregando...":"As despesas registradas no mês aparecem aqui, agrupadas por categoria."}</div>
            ) : cats.map(([cat,val])=>(
              <div key={cat}>
                <div style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:13}}>
                  <span style={{color:"var(--text)"}}>{cat}</span>
                  <span className="pg-num" style={{color:"var(--text)"}}>{BRLshort(val as number)}</span>
                </div>
                <div className="cash-bar"><span style={{width:`${((val as number)/maxCat)*100}%`}}/></div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {showForm && (

        <div className="vp-modal-bg" onClick={()=>setShowForm(false)}>

          <div className="vp-modal" role="dialog" aria-modal="true" aria-labelledby="cash-form-t" onClick={e=>e.stopPropagation()}>

            <div className="vp-modal-head">
              <h2 id="cash-form-t">Novo lançamento</h2>
              <button className="pg-x" onClick={()=>setShowForm(false)} aria-label="Fechar"><X size={16} aria-hidden/></button>
            </div>

            <div className="vp-modal-body">

              <div className="vp-field-row">
                <div className="vp-field">
                  <label htmlFor="cash-type">Tipo</label>
                  <select id="cash-type" className="vp-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value,category:""})}>
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div className="vp-field">
                  <label htmlFor="cash-cat">Categoria</label>
                  <select id="cash-cat" className="vp-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
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
                <label htmlFor="cash-desc">Descrição</label>
                <input id="cash-desc" className="vp-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ex: Aluguel do mês" />
              </div>

              <div className="vp-field-row">
                <div className="vp-field"><label htmlFor="cash-amt">Valor (R$)</label><input id="cash-amt" className="vp-input" type="number" inputMode="decimal" value={form.amount||""} onChange={e=>setForm({...form,amount:+e.target.value})} placeholder="0,00" /></div>
                <div className="vp-field"><label htmlFor="cash-date">Data</label><input id="cash-date" className="vp-input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
              </div>

            </div>

            <div className="vp-modal-foot">
              <button className="vp-btn vp-btn-ghost" onClick={()=>setShowForm(false)}>Cancelar</button>
              <button className="vp-btn vp-btn-primary" onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar lançamento"}</button>
            </div>

          </div>

        </div>

      )}

    </div>

  )

}

"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"



function BRL(v:number){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

function BRLshort(v:number){ return v>=1000?"R$ "+(v/1000).toFixed(1)+"k":BRL(v) }



function vpCSV(headers: string[], rows: any[][], filename: string) {

  const lines = [headers, ...rows].map(r => r.map((c:any) => String(c)).join(';')).join('\n');

  const blob = new Blob([lines], {type: 'text/csv;charset=utf-8'});

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url; a.download = filename + '.csv'; a.click();

  URL.revokeObjectURL(url);

}

function vpPDF(html: string) {

  const w = window.open('', '_blank');

  if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 600); }

}

function vpTable(title: string, headers: string[], rows: string[][]) {

  const th = headers.map((h:string) => '<th>' + h + '</th>').join('');

  const tr = rows.map((r:string[]) => '<tr>' + r.map((c:string) => '<td>' + c + '</td>').join('') + '</tr>').join('');

  return '<html><head><title>'+title+'</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th{background:#1D9E75;color:white;padding:8px;font-size:11px}td{padding:7px;border-bottom:1px solid #eee;font-size:11px}</style></head><body><h2>'+title+'</h2><table><thead><tr>'+th+'</tr></thead><tbody>'+tr+'</tbody></table></body></html>';

}



function exportCashCSV(entries: any[], month: number, year: number) {

  const M=['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const C: Record<string,string>={sale:'Venda',service:'Servico',rent:'Aluguel',salary:'Salario',supplier:'Fornecedor',tax:'Imposto',utilities:'Contas',marketing:'Marketing',other:'Outros'};

  vpCSV(['Data','Descricao','Categoria','Tipo','Valor'],

    entries.map((e:any)=>[new Date(e.date||e.createdAt).toLocaleDateString('pt-BR'),e.description||C[e.category]||e.category,C[e.category]||e.category,e.type==='income'?'Receita':'Despesa',(e.type==='income'?'+':'-')+Number(e.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})]),

    'caixa-'+M[month-1]+'-'+year);

}

function exportCashPDF(entries: any[], income: number, expense: number, profit: number, month: number, year: number) {
  const M=['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const C: Record<string,string>={sale:'Venda',service:'Servico',rent:'Aluguel',salary:'Salario',supplier:'Fornecedor',tax:'Imposto',utilities:'Contas',marketing:'Marketing',other:'Outros'};
  const isInc=(e:any)=>e.type==='income';
  const rows=entries.map((e:any,i:number)=>{const bg=i%2===0?'#fff':'#F8FAF9';const v=(isInc(e)?'+ ':'- ')+Number(e.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});const col=isInc(e)?'#1D9E75':'#ef4444';return '<tr style="background:'+bg+'"><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+new Date(e.date||e.createdAt).toLocaleDateString('pt-BR')+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+( e.description||C[e.category]||e.category)+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;">'+( C[e.category]||e.category)+'</td><td style="padding:10px 14px;border-bottom:1px solid #E5EDE9;font-size:12px;color:'+col+';font-weight:600;">'+v+'</td></tr>';}).join('');
  const logo='<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="2.5" fill="white"/><circle cx="4" cy="18" r="2.5" fill="white"/><circle cx="20" cy="18" r="2.5" fill="white"/><line x1="12" y1="4" x2="4" y2="18" stroke="white" stroke-width="1.5"/><line x1="12" y1="4" x2="20" y2="18" stroke="white" stroke-width="1.5"/><line x1="4" y1="18" x2="20" y2="18" stroke="white" stroke-width="1.5"/></svg>';
  const header='<div style="background:#04130F;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;background:#1D9E75;border-radius:10px;display:flex;align-items:center;justify-content:center;">'+logo+'</div><div><div style="font-size:16px;font-weight:700;color:white;">VendaPro</div><div style="font-size:11px;color:#6B8C82;">N&K Doces Encantados</div></div></div><div style="text-align:right;"><div style="font-size:18px;font-weight:700;color:white;">Caixa - '+M[month-1]+' '+String(year)+'</div><div style="font-size:12px;color:#8DA39A;">Gerado em '+new Date().toLocaleString('pt-BR')+'</div></div></div>';
  const kpis='<div style="display:grid;grid-template-columns:repeat(3,1fr);background:#F8FAF9;border-bottom:2px solid #E5EDE9;"><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Entradas</div><div style="font-size:22px;font-weight:700;color:#1D9E75;">'+Number(income).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+'</div></div><div style="padding:16px 20px;border-right:1px solid #E5EDE9;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Saidas</div><div style="font-size:22px;font-weight:700;color:#ef4444;">'+Number(expense).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+'</div></div><div style="padding:16px 20px;"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;">Saldo</div><div style="font-size:22px;font-weight:700;">'+Number(profit).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+'</div></div></div>';
  const table='<div style="padding:20px 32px;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#1D9E75;"><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Data</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Descricao</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Categoria</th><th style="color:white;padding:10px 14px;text-align:left;font-size:11px;">Valor</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  const footer='<div style="padding:14px 32px;background:#F8FAF9;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #E5EDE9;"><div style="font-size:11px;color:#888;">VendaPro - vendapro.com.br</div><div style="font-size:11px;color:#1D9E75;font-weight:700;">N&K Doces Encantados</div></div>';
  const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body>'+header+kpis+table+footer+'</body></html>';
  vpPDF(html);
}


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

        .vp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid transparent;cursor:pointer;transition:var(--transition);}

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

                .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}
        .kpi{padding:20px 22px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);position:relative;overflow:hidden;transition:var(--transition);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--brand-glow) 8%,transparent),0 12px 28px -22px color-mix(in srgb,var(--brand) 50%,transparent);}
        .kpi:hover{border-color:var(--border-strong);transform:translateY(-2px);box-shadow:var(--shadow-md);}
        .kpi-lbl{font-size:11px;font-weight:600;color:var(--brand-glow);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;opacity:.7;}
        .kpi-val{font-family:var(--font-mono);font-size:clamp(20px,2.5vw,28px);font-weight:700;letter-spacing:-.03em;line-height:1;}
        .kpi-dlt{font-size:12px;color:var(--text-subtle);margin-top:8px;}

        .nbtn{display:inline-flex;align-items:center;gap:6px;background:var(--brand);color:white;border:none;border-radius:var(--r);padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:var(--transition);margin-bottom:0;} .nbtn:hover{filter:brightness(1.1);}

        .entry-card{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--border);}

        .entry-card:last-child{border:none;}

        .entry-icon{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;}

        .entry-name{font-size:13px;font-weight:500;color:var(--text);}

        .entry-meta{font-size:11px;color:var(--text-subtle);margin-top:2px;}

        .mini-bar{height:4px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:5px;}

        .mini-bar-fill{display:block;height:100%;border-radius:999px;}

        .month-sel{display:flex;gap:8px;margin-bottom:16px;align-items:center;} .month-sel select{flex:1;min-width:100px;width:auto!important;} .month-sel .vp-select{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r);padding:9px 14px;font-size:13px;color:var(--text);outline:none;cursor:pointer;}

        .card-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:12px;}

        .card-head-row{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}

        .card-head-title{font-size:13px;font-weight:600;color:var(--text);}

        .card-head-sub{font-size:11px;color:var(--text-subtle);}

      `}</style>



      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:14,flexWrap:"wrap"}}>

        <div>

          <h1 style={{margin:0,fontSize:"clamp(20px,5vw,26px)",fontWeight:600,letterSpacing:"-.02em"}}>Caixa</h1>

          <div style={{color:"var(--text-subtle)",fontSize:13,marginTop:3}}>{MONTHS[month-1]} de {year}</div>

        </div>
      <button className="nbtn" onClick={()=>{setForm({type:"expense",category:"",description:"",amount:0,date:new Date().toISOString().split("T")[0],isPaid:true});setShowForm(true)}}>+ Novo lançamento</button>

      </div>

      <div style={{display:"flex",gap:6,marginBottom:8}}>

        <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>exportCashCSV(entries,month,year)}>Exportar Excel</button>

        <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={()=>exportCashPDF(entries,data.income,data.expense,data.profit,month,year)}>Exportar PDF</button>

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
        <div className="kpi">
          <div className="kpi-lbl">Entradas</div>
          <div className="kpi-val" style={{color:"var(--success)"}}>{BRL(data.income)}</div>
          <div className="kpi-dlt" style={{color:"var(--success)"}}>receitas do mês</div>
          <div style={{position:"absolute",bottom:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(29,158,117,0.1)",filter:"blur(20px)",pointerEvents:"none"}}/>
        </div>
        <div className="kpi">
          <div className="kpi-lbl">Saídas</div>
          <div className="kpi-val" style={{color:"var(--danger)"}}>{BRL(data.expense)}</div>
          <div className="kpi-dlt" style={{color:"var(--danger)"}}>despesas do mês</div>
          <div style={{position:"absolute",bottom:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(239,68,68,0.1)",filter:"blur(20px)",pointerEvents:"none"}}/>
        </div>
        <div className="kpi" style={{gridColumn:"span 2"}}>
          <div className="kpi-lbl">Saldo do mês</div>
          <div className="kpi-val">{BRL(data.profit)}</div>
          <div className="kpi-dlt">{margin}% margem</div>
          <div style={{position:"absolute",bottom:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"var(--brand-glow)",filter:"blur(20px)",pointerEvents:"none"}}/>
        </div>
      </div>







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






"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:"", description:"", price:0, cost:0, stock:0, minStock:5, category:"" })

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    try { const r = await api.get("/products"); setProducts(r.data) } catch {} finally { setLoading(false) }
  }

  async function saveProduct() {
    try { await api.post("/products", form); setShowForm(false); setForm({ name:"", description:"", price:0, cost:0, stock:0, minStock:5, category:"" }); loadProducts(); alert("Produto salvo!") } catch { alert("Erro ao salvar") }
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:"white",borderBottom:"0.5px solid #e5e7eb",padding:"0 20px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:"14px",fontWeight:500}}>Estoque</div>
        <button onClick={()=>setShowForm(true)} style={{background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"13px",cursor:"pointer"}}>+ Novo Produto</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
        {showForm && (
          <div style={{background:"white",border:"0.5px solid #e5e7eb",borderRadius:"12px",padding:"20px",marginBottom:"20px"}}>
            <h3 style={{marginBottom:"16px",fontWeight:500}}>Novo Produto</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              {[
                ["Nome","name","text"],
                ["Categoria","category","text"],
                ["Preco de venda","price","number"],
                ["Custo","cost","number"],
                ["Estoque inicial","stock","number"],
                ["Estoque minimo","minStock","number"],
              ].map(([label,field,type]) => (
                <div key={field}><label style={{fontSize:"12px",color:"#666"}}>{label}</label><input type={type} value={(form as any)[field]} onChange={e=>setForm({...form,[field]:type==="number"?+e.target.value:e.target.value})} style={{width:"100%",padding:"8px",border:"1px solid #e5e7eb",borderRadius:"6px",fontSize:"13px",marginTop:"4px"}} /></div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
              <button onClick={()=>setShowForm(false)} style={{padding:"8px 16px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"white",cursor:"pointer",fontSize:"13px"}}>Cancelar</button>
              <button onClick={saveProduct} style={{padding:"8px 16px",background:"#1D9E75",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>Salvar</button>
            </div>
          </div>
        )}
        {loading ? <div style={{textAlign:"center",color:"#888",padding:"40px"}}>Carregando...</div> : products.length===0 ? (
          <div style={{textAlign:"center",color:"#888",padding:"60px"}}>Nenhum produto cadastrado.</div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>
            {(products as any[]).map((p:any) => (
              <div key={p.id} style={{background:"white",border:p.stock<=p.minStock?"1px solid #f59e0b":"0.5px solid #e5e7eb",borderRadius:"10px",padding:"14px"}}>
                <div style={{fontWeight:500,marginBottom:"4px"}}>{p.name}</div>
                <div style={{fontSize:"12px",color:"#888",marginBottom:"8px"}}>{p.category}</div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{fontSize:"11px",color:"#888"}}>Preco</div><div style={{fontWeight:600,color:"#1D9E75"}}>{fmt(p.price)}</div></div>
                  <div><div style={{fontSize:"11px",color:"#888"}}>Estoque</div><div style={{fontWeight:600,color:p.stock<=p.minStock?"#ef4444":"#111"}}>{p.stock} un</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

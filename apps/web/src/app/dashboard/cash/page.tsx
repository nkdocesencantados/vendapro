"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"

const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

function Bar({ value, max, color = "#1D9E75", height = 8 }: any) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 4, height, flex: 1 }}>
      <div style={{ background: color, borderRadius: 4, height, width: `${pct}%`, transition: "width 0.6s" }} />
    </div>
  )
}

export default function CashPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [compareMonth, setCompareMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth())
  const [compareYear, setCompareYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
  const [showCompare, setShowCompare] = useState(false)
  const [data, setData] = useState<any>({ income: 0, expense: 0, profit: 0, entries: [] })
  const [compareData, setCompareData] = useState<any>({ income: 0, expense: 0, profit: 0, entries: [] })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: "expense", category: "other", description: "", amount: 0, date: new Date().toISOString().split("T")[0], isPaid: true })
  const [saving, setSaving] = useState(false)
  const [primary, setPrimary] = useState("#1D9E75")
  useEffect(() => {
    try {
      const c = localStorage.getItem("storeConfig")
      if (c) { const p = JSON.parse(c); if (p.primaryColor) setPrimary(p.primaryColor) }
    } catch {}
  }, [])

  useEffect(() => { loadData() }, [month, year])
  useEffect(() => { if (showCompare) loadCompareData() }, [compareMonth, compareYear, showCompare])

  async function loadData() {
    setLoading(true)
    try {
      const r = await api.get(`/financial/summary?month=${month}&year=${year}`)
      setData(r.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function loadCompareData() {
    try {
      const r = await api.get(`/financial/summary?month=${compareMonth}&year=${compareYear}`)
      setCompareData(r.data)
    } catch (e) { console.error(e) }
  }

  async function saveEntry() {
    setSaving(true)
    try {
      await api.post("/financial", form)
      setShowForm(false)
      setForm({ type: "expense", category: "other", description: "", amount: 0, date: new Date().toISOString().split("T")[0], isPaid: true })
      loadData()
    } catch { alert("Erro ao salvar") }
    finally { setSaving(false) }
  }

  const margin = data.income > 0 ? Math.round((data.profit / data.income) * 100) : 0
  const incomeChange = compareData.income > 0 ? Math.round(((data.income - compareData.income) / compareData.income) * 100) : null
  const expenseChange = compareData.expense > 0 ? Math.round(((data.expense - compareData.expense) / compareData.expense) * 100) : null

  const catMap: any = { sale: "Venda", rent: "Aluguel", salary: "Salario", supplier: "Fornecedor", tax: "Imposto", other: "Outro" }
  const typeMap: any = { income: "Receita", expense: "Despesa" }

  // Agrupamento por categoria de despesas
  const expenseByCategory = (data.entries || [])
    .filter((e: any) => e.type === "expense")
    .reduce((acc: any, e: any) => {
      const cat = catMap[e.category] || e.category
      acc[cat] = (acc[cat] || 0) + Number(e.amount)
      return acc
    }, {})
  const maxCat = Math.max(...Object.values(expenseByCategory) as number[], 1)

  const inputStyle: any = { width: "100%", padding: "8px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "0 20px", height: "50px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>Caixa</div>
        <button onClick={() => setShowForm(true)} style={{ background: "#1D9E75", color: "white", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "13px", cursor: "pointer" }}>+ Lancamento</button>
      </div>

      {/* FILTRO DE MES */}
      <div style={{ background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "10px 20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#888" }}>Mes:</span>
          <select value={month} onChange={e => setMonth(+e.target.value)} style={{ padding: "5px 8px", border: "0.5px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(+e.target.value)} style={{ padding: "5px 8px", border: "0.5px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={() => { setShowCompare(!showCompare); if (!showCompare) loadCompareData() }} style={{ padding: "5px 12px", fontSize: "12px", border: "0.5px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", background: showCompare ? "#1D9E75" : "white", color: showCompare ? "white" : "#666" }}>
          {showCompare ? "Ocultar comparativo" : "Comparar com outro mes"}
        </button>
        {showCompare && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#888" }}>Comparar com:</span>
            <select value={compareMonth} onChange={e => setCompareMonth(+e.target.value)} style={{ padding: "5px 8px", border: "0.5px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={compareYear} onChange={e => setCompareYear(+e.target.value)} style={{ padding: "5px 8px", border: "0.5px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {/* FORMULARIO */}
        {showForm && (
          <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ marginBottom: "16px", fontWeight: 500 }}>Novo Lancamento</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#666" }}>Tipo</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#666" }}>Categoria</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                  <option value="sale">Venda</option>
                  <option value="rent">Aluguel</option>
                  <option value="salary">Salario</option>
                  <option value="supplier">Fornecedor</option>
                  <option value="tax">Imposto</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#666" }}>Descricao</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#666" }}>Valor</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: +e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#666" }}>Data</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "13px" }}>Cancelar</button>
              <button onClick={saveEntry} disabled={saving} style={{ padding: "8px 16px", background: saving ? "#9ca3af" : "#1D9E75", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        )}

        {loading ? <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Carregando...</div> : (
          <>
            {/* CARDS PRINCIPAIS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "Receitas", value: data.income, compare: compareData.income, color: "#1D9E75", change: incomeChange },
                { label: "Despesas", value: data.expense, compare: compareData.expense, color: "#ef4444", change: expenseChange },
                { label: "Lucro", value: data.profit, compare: compareData.profit, color: "#3b82f6", change: null },
                { label: "Margem", value: `${margin}%`, compare: null, color: "#8b5cf6", change: null, isText: true },
              ].map(m => (
                <div key={m.label} style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>{m.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: m.color }}>{m.isText ? m.value : fmt(m.value as number)}</div>
                  {showCompare && m.compare !== null && (
                    <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
                      Anterior: {fmt(m.compare as number)}
                      {m.change !== null && (
                        <span style={{ marginLeft: "6px", color: (m.change as number) >= 0 ? "#1D9E75" : "#ef4444", fontWeight: 500 }}>
                          {(m.change as number) >= 0 ? "+" : ""}{m.change}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* COMPARATIVO VISUAL */}
            {showCompare && (
              <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px" }}>
                  Comparativo: {MONTHS[month - 1]} {year} vs {MONTHS[compareMonth - 1]} {compareYear}
                </div>
                {[
                  { label: "Receitas", cur: data.income, prev: compareData.income, color: "#1D9E75" },
                  { label: "Despesas", cur: data.expense, prev: compareData.expense, color: "#ef4444" },
                  { label: "Lucro", cur: data.profit, prev: compareData.profit, color: "#3b82f6" },
                ].map(item => {
                  const max = Math.max(item.cur, item.prev, 1)
                  return (
                    <div key={item.label} style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", color: "#666" }}>{item.label}</span>
                        <span style={{ fontSize: "12px", color: "#666" }}>{fmt(item.cur)} vs {fmt(item.prev)}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", color: "#888", width: "60px" }}>{MONTHS[month - 1].slice(0, 3)}</span>
                          <Bar value={item.cur} max={max} color={item.color} height={10} />
                          <span style={{ fontSize: "11px", width: "70px", textAlign: "right" }}>{fmt(item.cur)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", color: "#aaa", width: "60px" }}>{MONTHS[compareMonth - 1].slice(0, 3)}</span>
                          <Bar value={item.prev} max={max} color="#94a3b8" height={10} />
                          <span style={{ fontSize: "12px", color: "#555", width: "70px", textAlign: "right", fontWeight: 500 }}>{fmt(item.prev)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "16px" }}>
              {/* DESPESAS POR CATEGORIA */}
              <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px" }}>Despesas por categoria</div>
                {Object.keys(expenseByCategory).length === 0 ? (
                  <div style={{ color: "#888", fontSize: "13px" }}>Sem despesas no periodo</div>
                ) : (
                  Object.entries(expenseByCategory).sort((a: any, b: any) => b[1] - a[1]).map(([cat, val]: any) => (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", width: "80px", flexShrink: 0 }}>{cat}</div>
                      <Bar value={val} max={maxCat} color="#ef4444" />
                      <div style={{ fontSize: "12px", width: "70px", textAlign: "right" }}>{fmt(val)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* ULTIMOS LANCAMENTOS */}
              <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px" }}>Ultimos lancamentos</div>
                {(data.entries || []).slice(0, 6).map((e: any) => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>{e.description || catMap[e.category] || e.category}</div>
                      <div style={{ fontSize: "11px", color: "#888" }}>{catMap[e.category] || e.category} - {new Date(e.date).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <div style={{ fontWeight: 600, color: e.type === "income" ? "#1D9E75" : "#ef4444", fontSize: "14px" }}>
                      {e.type === "income" ? "+" : "-"}{fmt(e.amount)}
                    </div>
                  </div>
                ))}
                {(data.entries || []).length === 0 && <div style={{ color: "#888", fontSize: "13px" }}>Sem lancamentos</div>}
              </div>
            </div>

            {/* LISTA COMPLETA */}
            <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px" }}>Todos os lancamentos - {MONTHS[month - 1]} {year}</div>
              {(data.entries || []).length === 0 ? (
                <div style={{ color: "#888", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>Nenhum lancamento neste mes</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(data.entries || []).map((e: any) => (
                    <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f9fafb", borderRadius: "8px" }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "13px" }}>{e.description || catMap[e.category] || e.category}</div>
                        <div style={{ fontSize: "11px", color: "#888" }}>{typeMap[e.type]} - {catMap[e.category] || e.category} - {new Date(e.date).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <div style={{ fontWeight: 600, color: e.type === "income" ? "#1D9E75" : "#ef4444", fontSize: "15px" }}>
                        {e.type === "income" ? "+" : "-"}{fmt(e.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
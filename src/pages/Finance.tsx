import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { financeApi } from "@/api/finance"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function FinancePage() {
  const { user } = useAuth()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filters, setFilters] = useState({ startDate: "", endDate: "" })

  const { data: incomeData } = useQuery({
    queryKey: ["finance-income", storeId, filters],
    queryFn: () => financeApi.getIncome(storeId, filters.startDate || undefined, filters.endDate || undefined),
  })

  const { data: expensesData } = useQuery({
    queryKey: ["finance-expenses", storeId, filters],
    queryFn: () => financeApi.getExpenses(storeId, filters.startDate || undefined, filters.endDate || undefined),
  })

  const { data: receivablesData } = useQuery({
    queryKey: ["finance-receivables", storeId],
    queryFn: () => financeApi.getAccountsReceivable(storeId),
  })

  const incomeTotal = Number(incomeData?.total || 0)
  const expensesTotal = Number(expensesData?.total || 0)
  const receivableTotal = Number(receivablesData?.total || 0)
  const profit = incomeTotal - expensesTotal

  const incomeItems = Array.isArray(incomeData?.items) ? incomeData.items : []
  const expensesItems = Array.isArray(expensesData?.items) ? expensesData.items : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">FINANZAS / CAJA</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Fecha: {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link
          to="/reports"
          className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-border bg-background hover:border-primary hover:text-primary transition-colors"
        >
          VER REPORTES
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="text-[10px] uppercase">FECHA DESDE</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-40 rounded-none"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase">FECHA HASTA</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-40 rounded-none"
          />
        </div>
        <Button
          onClick={() => setFilters({ startDate, endDate })}
          className="h-9 rounded-none uppercase tracking-widest font-bold"
        >
          FILTRAR
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ventas Totales</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-primary">${incomeTotal.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gastos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-destructive">${expensesTotal.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cuentas por Cobrar</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-foreground">${receivableTotal.toFixed(2)}</div></CardContent>
        </Card>
        <Card className={`rounded-none border shadow-none ${profit >= 0 ? "border-primary/30 bg-primary/5" : "border-destructive/50 bg-destructive/5"}`}>
          <CardHeader className="pb-2"><CardTitle className={`text-[10px] font-bold uppercase tracking-widest ${profit >= 0 ? "text-primary" : "text-destructive"}`}>Ganancia Neta</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-black ${profit >= 0 ? "text-primary" : "text-destructive"}`}>${profit.toFixed(2)}</div></CardContent>
        </Card>
      </div>

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">INGRESOS</h2>
        </div>
        <div className="divide-y divide-border">
          {incomeItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/50">No hay ingresos registrados</p>
            </div>
          ) : (
            incomeItems.map((row: any, idx: number) => (
              <div key={`${row.id || idx}`} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase">{row.description || "Ingreso"}</p>
                  <p className="text-[9px] text-muted-foreground">{row.date ? new Date(row.date).toLocaleDateString() : "-"}</p>
                </div>
                <span className="text-sm font-black text-primary">${Number(row.amount || 0).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">GASTOS REGISTRADOS</h2>
        </div>
        <div className="divide-y divide-border">
          {expensesItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/50">No hay gastos registrados</p>
            </div>
          ) : (
            expensesItems.map((row: any, idx: number) => (
              <div key={`${row.id || idx}`} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase">{row.description || "Gasto"}</p>
                  <p className="text-[9px] text-muted-foreground">{row.date ? new Date(row.date).toLocaleDateString() : "-"}</p>
                </div>
                <span className="text-sm font-black text-destructive">${Number(row.amount || 0).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
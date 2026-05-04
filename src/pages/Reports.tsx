import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { reportsApi } from "@/api/reports"
import { useAuth } from "@/context/AuthContext"

type SalesSnapshot = { total: number; count: number; average: number; sales: any[] }

function getTodayIso() {
  return new Date().toISOString().split("T")[0]
}

function getDateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split("T")[0]
}

export default function ReportsPage() {
  const { user } = useAuth()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"
  const [startDate, setStartDate] = useState(getDateDaysAgo(30))
  const [endDate, setEndDate] = useState(getTodayIso())
  const [filters, setFilters] = useState({ startDate: getDateDaysAgo(30), endDate: getTodayIso() })

  const todayQuery = useQuery({
    queryKey: ["reports-today", storeId],
    queryFn: () => reportsApi.getSalesReport(storeId, getTodayIso(), getTodayIso()),
  })

  const weeklyQuery = useQuery({
    queryKey: ["reports-weekly", storeId],
    queryFn: () => reportsApi.getSalesReport(storeId, getDateDaysAgo(7), getTodayIso()),
  })

  const periodSalesQuery = useQuery({
    queryKey: ["reports-period-sales", storeId, filters],
    queryFn: () => reportsApi.getSalesReport(storeId, filters.startDate, filters.endDate),
  })

  const periodProductsQuery = useQuery({
    queryKey: ["reports-period-products", storeId, filters],
    queryFn: () => reportsApi.getProductsReport(storeId, filters.startDate, filters.endDate),
  })

  const periodCustomersQuery = useQuery({
    queryKey: ["reports-period-customers", storeId, filters],
    queryFn: () => reportsApi.getCustomersReport(storeId, filters.startDate, filters.endDate),
  })

  const financialQuery = useQuery({
    queryKey: ["reports-period-financial", storeId, filters],
    queryFn: () => reportsApi.getFinancialReport(storeId, filters.startDate, filters.endDate),
  })

  const today = (todayQuery.data || { total: 0, count: 0 }) as SalesSnapshot
  const weekly = (weeklyQuery.data || { total: 0, count: 0 }) as SalesSnapshot
  const monthly = (periodSalesQuery.data || { total: 0, count: 0, sales: [] }) as SalesSnapshot

  const topProducts = useMemo(() => {
    const products = (periodProductsQuery.data as any)?.products || []
    return products
      .map((p: any) => ({
        productId: p.productId || p.id || p.name,
        productName: p.name || p.productName || "Producto",
        count: Number(p.quantitySold || p.count || 0),
        revenue: Number(p.revenue || p.total || 0),
      }))
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [periodProductsQuery.data])

  const topUsers = useMemo(() => {
    const rows = monthly.sales || []
    const grouped = rows.reduce((acc: Record<string, { count: number; total: number }>, row: any) => {
      const key = row.userName || row.cashier || "Sin Usuario"
      acc[key] = acc[key] || { count: 0, total: 0 }
      acc[key].count += 1
      acc[key].total += Number(row.total || 0)
      return acc
    }, {})
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
  }, [monthly.sales])

  const topDays = useMemo(() => {
    const rows = monthly.sales || []
    const grouped = rows.reduce((acc: Record<string, { count: number; total: number }>, row: any) => {
      const day = (row.date || row.createdAt || "").toString().slice(0, 10) || "Sin fecha"
      acc[day] = acc[day] || { count: 0, total: 0 }
      acc[day].count += 1
      acc[day].total += Number(row.total || 0)
      return acc
    }, {})
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7)
  }, [monthly.sales])

  const byPaymentType = useMemo(() => {
    const rows = monthly.sales || []
    const grouped = rows.reduce((acc: Record<string, number>, row: any) => {
      const method = row.paymentMethod || row.paymentType || "UNDEFINED"
      acc[method] = (acc[method] || 0) + Number(row.total || 0)
      return acc
    }, {})
    return grouped
  }, [monthly.sales])

  const profitMargin = Number((financialQuery.data as any)?.profitMargin || 0)

  const loading =
    todayQuery.isLoading ||
    weeklyQuery.isLoading ||
    periodSalesQuery.isLoading ||
    periodProductsQuery.isLoading ||
    periodCustomersQuery.isLoading ||
    financialQuery.isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">REPORTES Y ANALYTICS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Analisis de ventas y rendimiento
          </p>
        </div>
        <Link
          to="/finance"
          className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-border bg-background hover:border-primary hover:text-primary transition-colors"
        >
          VOLVER A FINANZAS
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="text-[10px] uppercase">FECHA DESDE</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 w-40 rounded-none" />
        </div>
        <div>
          <Label className="text-[10px] uppercase">FECHA HASTA</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 w-40 rounded-none" />
        </div>
        <Button
          onClick={() => setFilters({ startDate, endDate })}
          disabled={loading}
          className="h-9 rounded-none uppercase tracking-widest font-bold"
        >
          {loading ? "FILTRANDO..." : "FILTRAR"}
        </Button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">HOY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">${Number(today.total || 0).toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">{Number(today.count || 0)} transacciones</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ESTA SEMANA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">${Number(weekly.total || 0).toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">{Number(weekly.count || 0)} transacciones</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border border-primary/30 bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary">PERIODO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">${Number(monthly.total || 0).toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">{Number(monthly.count || 0)} transacciones</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">PRODUCTOS TOP ({topProducts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topProducts.length === 0 ? (
                <div className="p-4 text-center text-[10px] uppercase text-muted-foreground/50">Sin datos</div>
              ) : topProducts.map((p: any, i: number) => (
                <div key={p.productId} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-5 w-5 rounded-none flex items-center justify-center text-[9px] font-bold ${i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase">{p.productName}</p>
                      <p className="text-[9px] text-muted-foreground">{p.count} uds</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary">${p.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">POR CAJERO</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topUsers.length === 0 ? (
                <div className="p-4 text-center text-[10px] uppercase text-muted-foreground/50">Sin datos</div>
              ) : topUsers.map(([name, data]: [string, any]) => (
                <div key={name} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase">{name}</p>
                    <p className="text-[9px] text-muted-foreground">{data.count} ventas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary">${data.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">FLUJO DIARIO</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topDays.length === 0 ? (
                <div className="p-4 text-center text-[10px] uppercase text-muted-foreground/50">Sin datos</div>
              ) : topDays.map(([day, data]: [string, any]) => (
                <div key={day} className="p-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">{day}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-muted-foreground">{data.count} ventas</span>
                    <span className="text-[10px] font-black text-primary">${data.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none border border-border bg-card/30 shadow-none">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">METODO DE PAGO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(byPaymentType).length === 0 ? (
              <div className="text-[10px] uppercase text-muted-foreground/50">Sin datos de pagos</div>
            ) : (
              Object.entries(byPaymentType).map(([method, amount]) => (
                <div key={method} className="border border-border p-3 rounded-none">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{method}</p>
                  <p className="text-lg font-black text-foreground">${Number(amount).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border border-primary/30 bg-primary/5 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">MARGEN DE GANANCIA ESTIMADO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-primary">${profitMargin.toFixed(2)}</div>
          <p className="text-[10px] text-muted-foreground uppercase mt-1">Basado en costos registrados de productos</p>
        </CardContent>
      </Card>
    </div>
  )
}
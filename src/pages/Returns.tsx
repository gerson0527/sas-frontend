import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { salesApi } from "@/api/sales"
import { purchasesApi } from "@/api/purchases"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function getTodayIso() {
  return new Date().toISOString().split("T")[0]
}

function getDateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split("T")[0]
}

function isReturnedSale(row: any) {
  const status = `${row?.status || ""}`.toUpperCase()
  const hasReason = Boolean(row?.returnReason || row?.refundReason)
  const isNegative = Number(row?.total || 0) < 0
  return status.includes("RETURN") || hasReason || isNegative
}

function isReturnedPurchase(row: any) {
  const status = `${row?.status || ""}`.toUpperCase()
  const hasReason = Boolean(row?.returnReason || row?.reason)
  const isNegative = Number(row?.total || 0) < 0
  return status.includes("RETURN") || hasReason || isNegative
}

export default function ReturnsPage() {
  const { user } = useAuth()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"
  const [startDate, setStartDate] = useState(getDateDaysAgo(30))
  const [endDate, setEndDate] = useState(getTodayIso())
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({ startDate: getDateDaysAgo(30), endDate: getTodayIso() })

  const salesQuery = useQuery({
    queryKey: ["returns-sales", storeId, filters],
    queryFn: () => salesApi.getAll(storeId, { startDate: filters.startDate, endDate: filters.endDate }),
  })

  const purchasesQuery = useQuery({
    queryKey: ["returns-purchases", storeId, filters],
    queryFn: () => purchasesApi.getAll(storeId, filters.startDate, filters.endDate),
  })

  const allSales = Array.isArray(salesQuery.data) ? salesQuery.data : []
  const allPurchases = Array.isArray(purchasesQuery.data) ? purchasesQuery.data : []

  const saleReturns = useMemo(
    () => allSales.filter((row: any) => isReturnedSale(row)),
    [allSales],
  )

  const supplierReturns = useMemo(
    () => allPurchases.filter((row: any) => isReturnedPurchase(row)),
    [allPurchases],
  )

  const totalSalesRevenue = useMemo(
    () => allSales.reduce((acc: number, row: any) => acc + Math.max(0, Number(row?.total || 0)), 0),
    [allSales],
  )

  const saleReturnsTotal = useMemo(
    () => saleReturns.reduce((acc: number, row: any) => acc + Math.abs(Number(row?.total || 0)), 0),
    [saleReturns],
  )

  const supplierReturnsTotal = useMemo(
    () => supplierReturns.reduce((acc: number, row: any) => acc + Math.abs(Number(row?.total || 0)), 0),
    [supplierReturns],
  )

  const percentage = totalSalesRevenue > 0
    ? ((saleReturnsTotal / totalSalesRevenue) * 100).toFixed(1)
    : "0.0"

  const searchableRows = useMemo(() => {
    const mappedSales = saleReturns.map((row: any) => ({
      type: "VENTA",
      id: row.id,
      counterparty: row.customer?.name || row.customerName || "CLIENTE MOSTRADOR",
      total: Math.abs(Number(row.total || 0)),
      reason: row.returnReason || row.refundReason || "-",
      createdAt: row.createdAt || row.date,
    }))
    const mappedSuppliers = supplierReturns.map((row: any) => ({
      type: "PROVEEDOR",
      id: row.id,
      counterparty: row.supplier?.name || row.supplierName || "-",
      total: Math.abs(Number(row.total || 0)),
      reason: row.returnReason || row.reason || "-",
      createdAt: row.createdAt || row.date,
    }))
    const all = [...mappedSales, ...mappedSuppliers]
    if (!searchQuery.trim()) return all
    const q = searchQuery.toLowerCase()
    return all.filter((row) =>
      `${row.id} ${row.counterparty} ${row.reason}`.toLowerCase().includes(q),
    )
  }, [saleReturns, supplierReturns, searchQuery])

  const loading = salesQuery.isLoading || purchasesQuery.isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-destructive">DEVOLUCIONES</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Control de devoluciones de ventas y proveedores
          </p>
        </div>
        <Link
          to="/reports"
          className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-border bg-background hover:border-primary hover:text-primary transition-colors"
        >
          VOLVER A REPORTES
        </Link>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 mb-6 h-auto">
          <TabsTrigger value="reports" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-6 py-3 uppercase tracking-widest text-xs font-bold">
            REPORTES
          </TabsTrigger>
          <TabsTrigger value="search" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-6 py-3 uppercase tracking-widest text-xs font-bold">
            BUSCADOR DE DEVOLUCIONES
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6 mt-0">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-[10px] uppercase">FECHA DESDE</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 w-40 rounded-none" />
            </div>
            <div>
              <Label className="text-[10px] uppercase">FECHA HASTA</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 w-40 rounded-none" />
            </div>
            <div>
              <Label className="text-[10px] uppercase">TIPO</Label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 w-40 bg-card border border-border px-2 rounded-none text-xs uppercase">
                <option value="ALL">TODOS</option>
                <option value="SALES">VENTAS</option>
                <option value="SUPPLIERS">PROVEEDORES</option>
              </select>
            </div>
            <Button onClick={() => setFilters({ startDate, endDate })} disabled={loading} className="h-9 rounded-none uppercase tracking-widest font-bold">
              {loading ? "FILTRANDO..." : "FILTRAR"}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-none border border-destructive/30 bg-destructive/5 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-destructive">DEVOLUCIONES VENTAS</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-black text-destructive">${saleReturnsTotal.toFixed(2)}</div><p className="text-[10px] text-muted-foreground uppercase mt-1">{saleReturns.length} devoluciones</p></CardContent>
            </Card>
            <Card className="rounded-none border border-orange-500/30 bg-orange-500/5 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-orange-500">DEVOLUCIONES PROVEEDORES</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-black text-orange-500">${supplierReturnsTotal.toFixed(2)}</div><p className="text-[10px] text-muted-foreground uppercase mt-1">{supplierReturns.length} devoluciones</p></CardContent>
            </Card>
            <Card className="rounded-none border border-border bg-card/30 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">VENTAS TOTALES</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-black text-foreground">${totalSalesRevenue.toFixed(2)}</div><p className="text-[10px] text-muted-foreground uppercase mt-1">{allSales.length} ventas</p></CardContent>
            </Card>
            <Card className="rounded-none border border-border bg-card/30 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">% DEVOLUCIONES</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-black text-foreground">{percentage}%</div><p className="text-[10px] text-muted-foreground uppercase mt-1">Sobre ventas</p></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(typeFilter === "ALL" || typeFilter === "SALES") && (
              <Card className="rounded-none border border-destructive/30 bg-card/30 shadow-none">
                <CardHeader className="border-b border-destructive/20 pb-4"><CardTitle className="text-xs font-bold uppercase tracking-widest text-destructive">DEVOLUCIONES DE VENTAS</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-destructive/5">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px] uppercase text-destructive/70">ID</TableHead>
                        <TableHead className="text-[10px] uppercase text-destructive/70">CLIENTE</TableHead>
                        <TableHead className="text-[10px] uppercase text-destructive/70">MONTO</TableHead>
                        <TableHead className="text-[10px] uppercase text-destructive/70">MOTIVO</TableHead>
                        <TableHead className="text-[10px] uppercase text-destructive/70">FECHA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="font-mono text-xs">
                      {saleReturns.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center uppercase tracking-widest text-muted-foreground/50">Sin devoluciones</TableCell></TableRow>
                      ) : (
                        saleReturns.slice(0, 20).map((row: any) => (
                          <TableRow key={row.id} className="hover:bg-destructive/5">
                            <TableCell className="font-bold">#{String(row.id).slice(-4)}</TableCell>
                            <TableCell>{row.customer?.name || row.customerName || "—"}</TableCell>
                            <TableCell className="font-bold text-destructive">-${Math.abs(Number(row.total || 0)).toFixed(2)}</TableCell>
                            <TableCell className="text-muted-foreground">{row.returnReason || row.refundReason || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{(row.createdAt || row.date) ? new Date(row.createdAt || row.date).toLocaleDateString("es-CO") : "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {(typeFilter === "ALL" || typeFilter === "SUPPLIERS") && (
              <Card className="rounded-none border border-orange-500/30 bg-card/30 shadow-none">
                <CardHeader className="border-b border-orange-500/20 pb-4"><CardTitle className="text-xs font-bold uppercase tracking-widest text-orange-500">DEVOLUCIONES A PROVEEDORES</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-orange-500/5">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px] uppercase text-orange-500/70">ID</TableHead>
                        <TableHead className="text-[10px] uppercase text-orange-500/70">PROVEEDOR</TableHead>
                        <TableHead className="text-[10px] uppercase text-orange-500/70">MONTO</TableHead>
                        <TableHead className="text-[10px] uppercase text-orange-500/70">MOTIVO</TableHead>
                        <TableHead className="text-[10px] uppercase text-orange-500/70">FECHA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="font-mono text-xs">
                      {supplierReturns.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center uppercase tracking-widest text-muted-foreground/50">Sin devoluciones</TableCell></TableRow>
                      ) : (
                        supplierReturns.slice(0, 20).map((row: any) => (
                          <TableRow key={row.id} className="hover:bg-orange-500/5">
                            <TableCell className="font-bold">#{String(row.id).slice(-4)}</TableCell>
                            <TableCell>{row.supplier?.name || row.supplierName || "—"}</TableCell>
                            <TableCell className="font-bold text-orange-500">-${Math.abs(Number(row.total || 0)).toFixed(2)}</TableCell>
                            <TableCell className="text-muted-foreground">{row.returnReason || row.reason || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{(row.createdAt || row.date) ? new Date(row.createdAt || row.date).toLocaleDateString("es-CO") : "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-0 space-y-6">
          <Card className="rounded-none border border-border bg-card/30 shadow-none">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">BUSCAR DEVOLUCIONES</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="BUSCAR POR ID, CLIENTE O PRODUCTO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-none"
                />
              </div>
              {searchableRows.length > 0 ? (
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase">TIPO</TableHead>
                      <TableHead className="text-[10px] uppercase">ID</TableHead>
                      <TableHead className="text-[10px] uppercase">CLIENTE/PROVEEDOR</TableHead>
                      <TableHead className="text-[10px] uppercase">MONTO</TableHead>
                      <TableHead className="text-[10px] uppercase">MOTIVO</TableHead>
                      <TableHead className="text-[10px] uppercase">FECHA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-mono text-xs">
                    {searchableRows.slice(0, 100).map((row) => (
                      <TableRow key={`${row.type}-${row.id}`}>
                        <TableCell className="font-bold">{row.type}</TableCell>
                        <TableCell>#{String(row.id).slice(-4)}</TableCell>
                        <TableCell>{row.counterparty}</TableCell>
                        <TableCell className="font-bold">${Number(row.total).toFixed(2)}</TableCell>
                        <TableCell>{row.reason}</TableCell>
                        <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("es-CO") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery ? "No se encontraron devoluciones." : "Ingresa un termino de busqueda para encontrar devoluciones."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
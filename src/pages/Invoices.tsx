import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { salesApi } from "@/api/sales"
import { plemsiApi } from "@/api/plemsi"
import { useAuth } from "@/context/AuthContext"
import { alert } from "@/lib/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/Pagination"

type InvoiceRow = {
  id: string
  invoiceNumber?: string | null
  total: number
  paymentMethod?: string
  paymentType?: string
  paymentStatus?: string
  status?: string
  createdAt?: string
  date?: string
  customerName?: string
  customer?: { name?: string; document?: string | null } | null
  invoiceStatus?: string | null
  plemsiId?: string | null
  dianCufe?: string | null
  dianQrUrl?: string | null
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")
  const [paymentType, setPaymentType] = useState("ALL")
  const [filters, setFilters] = useState({ startDate: "", endDate: "" })
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingPlemsiId, setLoadingPlemsiId] = useState<string | null>(null)
  const pageSize = 15

  const { data } = useQuery({
    queryKey: ["invoices", storeId, filters],
    queryFn: () =>
      salesApi.getAll(storeId, {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }),
  })

  const invoices: InvoiceRow[] = Array.isArray(data) ? data : []

  async function handleSearch() {
    try {
      const filter: Record<string, any> = {}
      if (startDate) filter.startDate = startDate
      if (endDate) filter.endDate = endDate
      if (status !== "ALL") filter.status = status
      if (paymentType !== "ALL") filter.paymentType = paymentType

      const result = await salesApi.getAll(storeId, filter)
      // preserva el comportamiento actual basado en query cache/local state
      // actualizando solo filtros de consulta remota
      if (Array.isArray(result)) {
        // no-op visual: forzamos refresco de queryKey con filtros de fecha
        setFilters({ startDate, endDate })
      }
    } catch (error) {
      console.error(error)
    }
  }

  const filtered = useMemo(() => {
    return invoices.filter((row) => {
      const customerName = row.customer?.name || row.customerName || "CLIENTE MOSTRADOR"
      const rowStatus = row.paymentStatus || row.status || ""
      const rowPayment = row.paymentType || row.paymentMethod || ""
      const matchesSearch =
        !search ||
        row.id.toLowerCase().includes(search.toLowerCase()) ||
        customerName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === "ALL" || rowStatus === status
      const matchesPayment = paymentType === "ALL" || rowPayment === paymentType
      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [invoices, search, status, paymentType])

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, row) => ({
          subtotal: acc.subtotal + Number(row.total || 0) / 1.19,
          iva: acc.iva + (Number(row.total || 0) * 0.19) / 1.19,
          total: acc.total + Number(row.total || 0),
        }),
        { subtotal: 0, iva: 0, total: 0 },
      ),
    [filtered],
  )

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const dianLabel = (status?: string | null) => {
    if (!status) return "NO ENVIADA"
    const normalized = String(status).toUpperCase()
    if (normalized === "SENT") return "ENVIADA"
    if (normalized === "ACCEPTED") return "ACEPTADA"
    if (normalized === "REJECTED") return "RECHAZADA"
    if (normalized === "ERROR") return "ERROR"
    return normalized
  }

  const handleSendToPlemsi = async (invoiceId: string) => {
    try {
      setLoadingPlemsiId(invoiceId)
      const result = await plemsiApi.sendInvoice(invoiceId)
      setCurrentPage(1)
      await handleSearch()
      alert.success(result?.message || "FACTURA ENVIADA A DIAN")
    } catch (error: any) {
      alert.error(error?.response?.data?.error || error?.response?.data?.message || error?.message || "ERROR ENVIANDO FACTURA A DIAN")
    } finally {
      setLoadingPlemsiId(null)
    }
  }

  const handleCheckStatus = async (invoiceId: string) => {
    try {
      setLoadingPlemsiId(invoiceId)
      const result = await plemsiApi.getInvoiceStatus(invoiceId)
      setCurrentPage(1)
      await handleSearch()
      alert.success(result?.message || "ESTADO DIAN ACTUALIZADO")
    } catch (error: any) {
      alert.error(error?.response?.data?.error || error?.response?.data?.message || error?.message || "ERROR CONSULTANDO ESTADO DIAN")
    } finally {
      setLoadingPlemsiId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">FACTURAS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Gestion de facturas y facturacion
          </p>
        </div>
        <Link
          to="/reports"
          className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-border bg-background hover:border-primary hover:text-primary transition-colors"
        >
          VOLVER A REPORTES
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">TOTAL FACTURADO</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-foreground">${totals.total.toFixed(2)}</div><p className="text-[10px] text-muted-foreground uppercase mt-1">{filtered.length} facturas</p></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SUBTOTAL</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-black text-foreground">${totals.subtotal.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-border bg-card/30 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">IVA (19%)</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-black text-foreground">${totals.iva.toFixed(2)}</div></CardContent>
        </Card>
        <Card className="rounded-none border border-destructive/30 bg-destructive/5 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-destructive">PENDIENTES</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-destructive">{filtered.filter((i) => (i.paymentStatus || i.status) === "PENDING").length}</div></CardContent>
        </Card>
      </div>

      <div className="border border-border p-4 rounded-none bg-card/30">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <Label className="text-[10px] uppercase">FECHA DESDE</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 rounded-none" />
          </div>
          <div>
            <Label className="text-[10px] uppercase">FECHA HASTA</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 rounded-none" />
          </div>
          <div>
            <Label className="text-[10px] uppercase">BUSCAR</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID/Cliente" className="h-9 rounded-none" />
          </div>
          <div>
            <Label className="text-[10px] uppercase">ESTADO</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs">
              <option value="ALL">TODOS</option>
              <option value="PAID">PAGADA</option>
              <option value="PENDING">PENDIENTE</option>
            </select>
          </div>
          <div>
            <Label className="text-[10px] uppercase">METODO</Label>
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs">
              <option value="ALL">TODOS</option>
              <option value="CASH">EFECTIVO</option>
              <option value="CARD">TARJETA</option>
              <option value="TRANSFER">TRANSFERENCIA</option>
              <option value="NEQUI">NEQUI</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={() => setFilters({ startDate, endDate })} className="h-9 w-full rounded-none uppercase font-bold">
              FILTRAR
            </Button>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs uppercase">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-bold">#</th>
                <th className="p-3 text-left font-bold">FACTURA</th>
                <th className="p-3 text-left font-bold">FECHA</th>
                <th className="p-3 text-left font-bold">CLIENTE</th>
                <th className="p-3 text-left font-bold">METODO</th>
                <th className="p-3 text-left font-bold">ESTADO</th>
                <th className="p-3 text-left font-bold">DIAN</th>
                <th className="p-3 text-right font-bold">SUBTOTAL</th>
                <th className="p-3 text-right font-bold">IVA</th>
                <th className="p-3 text-right font-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {paginated.length === 0 ? (
                <tr><td colSpan={10} className="h-32 text-center text-muted-foreground/50 uppercase">Sin facturas</td></tr>
              ) : (
                paginated.map((inv, idx) => {
                  const date = inv.createdAt || inv.date
                  const customer = inv.customer?.name || inv.customerName || "CLIENTE MOSTRADOR"
                  const payment = inv.paymentType || inv.paymentMethod || "UNDEFINED"
                  const paymentStatus = inv.paymentStatus || inv.status || "UNDEFINED"
                  const total = Number(inv.total || 0)
                  return (
                    <tr key={inv.id} className="border-t border-border hover:bg-primary/5">
                      <td className="p-3 font-bold">{((currentPage - 1) * pageSize) + idx + 1}</td>
                      <td className="p-3 font-bold text-primary">{inv.invoiceNumber || "#" + inv.id.slice(-6)}</td>
                      <td className="p-3">{date ? new Date(date).toLocaleDateString("es-CO") : "-"}</td>
                      <td className="p-3">{customer}</td>
                      <td className="p-3">{payment}</td>
                      <td className="p-3">{paymentStatus === "PAID" ? "PAGADA" : paymentStatus === "PENDING" ? "PENDIENTE" : paymentStatus}</td>
                      <td className="p-3">
                        {!inv.invoiceStatus ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={loadingPlemsiId === inv.id}
                            onClick={() => handleSendToPlemsi(inv.id)}
                            className="h-6 rounded-none uppercase text-[9px] bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            {loadingPlemsiId === inv.id ? "..." : "ENVIAR"}
                          </Button>
                        ) : inv.invoiceStatus === "SENT" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={loadingPlemsiId === inv.id}
                            onClick={() => handleCheckStatus(inv.id)}
                            className="h-6 rounded-none uppercase text-[9px] bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                          >
                            {loadingPlemsiId === inv.id ? "..." : "VERIFICAR"}
                          </Button>
                        ) : (
                          <span className="text-[10px] font-bold">{dianLabel(inv.invoiceStatus)}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">${(total / 1.19).toFixed(2)}</td>
                      <td className="p-3 text-right">${((total * 0.19) / 1.19).toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-primary">${total.toFixed(2)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  )
}

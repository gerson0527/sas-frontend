import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { customersApi } from "@/api/customers"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/Pagination"
import { alert } from "@/lib/alert"

type Customer = {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  document?: string
  documentId?: string
  documentType?: string
  creditLimit?: number
  balance?: number
}

export default function CustomersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"
  const [search, setSearch] = useState("")
  const [withDebtOnly, setWithDebtOnly] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    documentId: "",
    documentType: "CC",
    address: "",
    creditLimit: "0",
  })

  const { data: customersData = [], isLoading } = useQuery({
    queryKey: ["customers", storeId],
    queryFn: () => customersApi.getAll(storeId),
  })

  const customers = (Array.isArray(customersData) ? customersData : []) as Customer[]

  const createMutation = useMutation({
    mutationFn: () =>
      customersApi.create({
        storeId,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        documentId: formData.documentId.trim() || undefined,
        documentType: formData.documentType || undefined,
        address: formData.address.trim() || undefined,
        creditLimit: Number(formData.creditLimit || 0),
      }),
    onSuccess: () => {
      alert.success("Cliente creado", "El cliente fue registrado correctamente.")
      setShowNew(false)
      setFormData({
        name: "",
        email: "",
        phone: "",
        documentId: "",
        documentType: "CC",
        address: "",
        creditLimit: "0",
      })
      queryClient.invalidateQueries({ queryKey: ["customers", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo crear el cliente."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      alert.success("Cliente eliminado")
      queryClient.invalidateQueries({ queryKey: ["customers", storeId] })
      setShowDetail(false)
    },
    onError: () => alert.error("Error", "No se pudo eliminar el cliente."),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => customersApi.updateBalance(id, amount, "SUBTRACT"),
    onSuccess: () => {
      alert.success("Pago registrado")
      queryClient.invalidateQueries({ queryKey: ["customers", storeId] })
      queryClient.invalidateQueries({ queryKey: ["customer-balance", selectedCustomerId] })
      queryClient.invalidateQueries({ queryKey: ["customer-payments", selectedCustomerId] })
    },
    onError: () => alert.error("Error", "No se pudo registrar el pago."),
  })

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  const { data: customerBalanceData } = useQuery({
    queryKey: ["customer-balance", selectedCustomerId],
    queryFn: () => customersApi.getBalance(selectedCustomerId),
    enabled: !!selectedCustomerId && showDetail,
  })

  const { data: customerPaymentsData = [] } = useQuery({
    queryKey: ["customer-payments", selectedCustomerId],
    queryFn: () => customersApi.getPaymentHistory(selectedCustomerId),
    enabled: !!selectedCustomerId && showDetail,
  })

  const effectiveBalance = Number(
    customerBalanceData?.balance ?? selectedCustomer?.balance ?? 0,
  )

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const document = c.document || c.documentId || ""
      const matchesSearch =
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase()) ||
        document.toLowerCase().includes(search.toLowerCase())
      const matchesDebt = !withDebtOnly || Number(c.balance || 0) > 0
      return matchesSearch && matchesDebt
    })
  }, [customers, search, withDebtOnly])

  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const withDebt = customers.filter((c) => Number(c.balance || 0) > 0).length
    const totalDebt = customers.reduce((acc, c) => acc + Number(c.balance || 0), 0)
    return {
      totalCustomers,
      withDebt,
      totalDebt,
      overdue30: withDebt,
    }
  }, [customers])

  const totalPages = Math.ceil(filteredCustomers.length / pageSize)
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCustomers.slice(start, start + pageSize)
  }, [filteredCustomers, currentPage])

  return (
    <div className="flex flex-col h-full bg-background space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border bg-card/30 p-3 rounded-none">
          <p className="text-[10px] uppercase text-muted-foreground">TOTAL CLIENTES</p>
          <p className="text-xl font-black">{stats.totalCustomers}</p>
        </div>
        <div className="border border-border bg-card/30 p-3 rounded-none">
          <p className="text-[10px] uppercase text-muted-foreground">CON DEUDA</p>
          <p className="text-xl font-black text-destructive">{stats.withDebt}</p>
        </div>
        <div className="border border-border bg-card/30 p-3 rounded-none">
          <p className="text-[10px] uppercase text-muted-foreground">DEUDA TOTAL</p>
          <p className="text-xl font-black text-destructive">${stats.totalDebt.toFixed(2)}</p>
        </div>
        <div className="border border-destructive/30 bg-destructive/5 p-3 rounded-none">
          <p className="text-[10px] uppercase text-destructive">VENCIDOS (+30D)</p>
          <p className="text-xl font-black text-destructive">{stats.overdue30}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold font-mono uppercase tracking-widest text-primary">
          DIRECTORIO DE CLIENTES
        </h1>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap h-9 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-primary bg-primary text-primary-foreground hover:bg-primary/90">
            ANADIR CLIENTE
          </DialogTrigger>
          <DialogContent className="rounded-none border-border bg-background sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-widest text-sm text-primary">NUEVO CLIENTE</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createMutation.mutate()
              }}
              className="space-y-3"
            >
              <div>
                <Label className="text-[10px] uppercase">NOMBRE</Label>
                <Input value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} required className="h-9 rounded-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">TIPO DOC</Label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, documentType: e.target.value }))}
                    className="h-9 w-full bg-card border border-border px-2 rounded-none text-xs uppercase"
                  >
                    <option value="CC">CC</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase">DOCUMENTO</Label>
                  <Input value={formData.documentId} onChange={(e) => setFormData((prev) => ({ ...prev, documentId: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">TELEFONO</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} className="h-9 rounded-none" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase">EMAIL</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase">DIRECCION</Label>
                <Input value={formData.address} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))} className="h-9 rounded-none" />
              </div>
              <div>
                <Label className="text-[10px] uppercase">LIMITE DE CREDITO</Label>
                <Input type="number" min={0} step={0.01} value={formData.creditLimit} onChange={(e) => setFormData((prev) => ({ ...prev, creditLimit: e.target.value }))} className="h-9 rounded-none" />
              </div>
              <Button type="submit" className="w-full rounded-none uppercase font-bold" disabled={createMutation.isPending}>
                {createMutation.isPending ? "GUARDANDO..." : "GUARDAR CLIENTE"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="BUSCAR POR NOMBRE, DOCUMENTO O TELEFONO..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-10 bg-card border-border rounded-none uppercase"
        />
        <Button
          variant={withDebtOnly ? "default" : "outline"}
          onClick={() => setWithDebtOnly((prev) => !prev)}
          className="rounded-none uppercase tracking-widest font-bold"
        >
          {withDebtOnly ? "CON DEUDA" : "TODOS"}
        </Button>
      </div>

      <div className="border border-border bg-card/30 rounded-none overflow-x-auto">
        <table className="w-full text-left text-sm font-mono">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border tracking-widest">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">NOMBRE</th>
              <th className="px-4 py-3 font-medium">CONTACTO</th>
              <th className="px-4 py-3 font-medium text-right">LIMITE</th>
              <th className="px-4 py-3 font-medium text-right">DEUDA</th>
              <th className="px-4 py-3 font-medium text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-xs uppercase tracking-widest">CARGANDO...</td></tr>
            ) : paginatedCustomers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-xs uppercase tracking-widest">NO HAY CLIENTES REGISTRADOS.</td></tr>
            ) : (
              paginatedCustomers.map((c, idx) => (
                <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{(currentPage - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedCustomerId(c.id)
                        setShowDetail(true)
                      }}
                      className="text-xs font-bold uppercase hover:text-primary text-left"
                    >
                      {c.name}
                    </button>
                    <p className="text-[9px] text-muted-foreground">{c.document || c.documentId || "Sin documento"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{c.phone || "N/A"}</p>
                    <p>{c.email || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-right">${Number(c.creditLimit || 0).toFixed(2)}</td>
                  <td className={`px-4 py-3 text-xs text-right font-bold ${Number(c.balance || 0) > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    ${Number(c.balance || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomerId(c.id)
                          setShowDetail(true)
                        }}
                        className="text-[9px] uppercase border border-primary/50 bg-primary/10 hover:bg-primary/20 px-2 py-1 text-primary rounded-none"
                      >
                        VER
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(c.id)}
                        className="text-[9px] uppercase border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 px-2 py-1 text-destructive rounded-none"
                      >
                        ELIMINAR
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="rounded-none border-border bg-background max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-primary">
              {selectedCustomer?.name || "CLIENTE"}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer ? (
            <div className="space-y-4 py-2">
              <div className={`border p-3 rounded-none ${effectiveBalance > 0 ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-muted-foreground">DEUDA ACTUAL</span>
                  <span className={`text-xl font-black ${effectiveBalance > 0 ? "text-destructive" : "text-primary"}`}>
                    ${effectiveBalance.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="border border-border p-3 rounded-none">
                <p className="text-[10px] uppercase text-muted-foreground mb-1">CONTACTO</p>
                <p className="text-xs">{selectedCustomer.phone || "N/A"}</p>
                <p className="text-xs">{selectedCustomer.email || "Sin email"}</p>
                <p className="text-xs">{selectedCustomer.address || "Sin direccion"}</p>
              </div>
              {effectiveBalance > 0 && (
                <Button
                  onClick={() => paymentMutation.mutate({ id: selectedCustomer.id, amount: effectiveBalance })}
                  className="w-full rounded-none uppercase font-bold"
                  disabled={paymentMutation.isPending}
                >
                  {paymentMutation.isPending ? "REGISTRANDO..." : "PAGAR TOTAL"}
                </Button>
              )}
              <div className="border border-border p-3 rounded-none">
                <p className="text-[10px] uppercase text-muted-foreground mb-2">ULTIMOS PAGOS</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {(Array.isArray(customerPaymentsData) ? customerPaymentsData : []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin pagos registrados</p>
                  ) : (
                    (customerPaymentsData as any[]).slice(0, 10).map((payment: any) => (
                      <div key={payment.id || payment.createdAt} className="flex justify-between text-xs border-b border-border/50 py-1">
                        <span>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "-"}</span>
                        <span className="text-primary font-bold">+${Number(payment.amount || 0).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
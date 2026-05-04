import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { suppliersApi } from "@/api/suppliers"
import { useAuth } from "@/context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/Pagination"
import { alert } from "@/lib/alert"

type Supplier = {
  id: string
  name: string
  email?: string
  phone?: string
  documentId?: string
  documentType?: string
  address?: string
}

export default function SuppliersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"
  const [search, setSearch] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    documentId: "",
    documentType: "NIT",
    address: "",
  })

  const { data: suppliersData = [], isLoading } = useQuery({
    queryKey: ["suppliers", storeId],
    queryFn: () => suppliersApi.getAll(storeId),
  })

  const suppliers = (Array.isArray(suppliersData) ? suppliersData : []) as Supplier[]

  const createMutation = useMutation({
    mutationFn: () =>
      suppliersApi.create({
        storeId,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        documentId: formData.documentId.trim() || undefined,
        documentType: formData.documentType || undefined,
        address: formData.address.trim() || undefined,
      }),
    onSuccess: () => {
      alert.success("Proveedor creado")
      setShowNew(false)
      setFormData({
        name: "",
        email: "",
        phone: "",
        documentId: "",
        documentType: "NIT",
        address: "",
      })
      queryClient.invalidateQueries({ queryKey: ["suppliers", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo crear el proveedor."),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => suppliersApi.update(payload.id, payload.data),
    onSuccess: () => {
      alert.success("Proveedor actualizado")
      setEditOpen(false)
      setEditingSupplier(null)
      queryClient.invalidateQueries({ queryKey: ["suppliers", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo actualizar el proveedor."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => {
      alert.success("Proveedor eliminado", "El registro fue eliminado del sistema.")
      queryClient.invalidateQueries({ queryKey: ["suppliers", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo eliminar el proveedor."),
  })

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter((s) =>
        `${s.name} ${s.email || ""} ${s.phone || ""} ${s.documentId || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [suppliers, search],
  )

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize)
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSuppliers.slice(start, start + pageSize)
  }, [filteredSuppliers, currentPage])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">PROVEEDORES</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Gestionar logistica y vendedores
          </p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex shrink-0 items-center justify-center border border-primary bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-none uppercase tracking-widest font-bold text-xs transition-colors">
            ANADIR PROVEEDOR
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px] rounded-none border border-border bg-background">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">NUEVO PROVEEDOR</DialogTitle>
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
                <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required className="h-9 rounded-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">TIPO DOC</Label>
                  <select value={formData.documentType} onChange={(e) => setFormData((p) => ({ ...p, documentType: e.target.value }))} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase">
                    <option value="NIT">NIT</option>
                    <option value="CC">CC</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase">DOCUMENTO</Label>
                  <Input value={formData.documentId} onChange={(e) => setFormData((p) => ({ ...p, documentId: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">EMAIL</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="h-9 rounded-none" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase">TELEFONO</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase">DIRECCION</Label>
                <Input value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} className="h-9 rounded-none" />
              </div>
              <Button type="submit" className="w-full rounded-none uppercase font-bold" disabled={createMutation.isPending}>
                {createMutation.isPending ? "GUARDANDO..." : "GUARDAR PROVEEDOR"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="BUSCAR PROVEEDORES..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-10 bg-card border-border rounded-none uppercase"
        />
      </div>

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <table className="w-full text-left text-sm font-mono uppercase">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3 font-medium">NOMBRE</th>
              <th className="p-3 font-medium">EMAIL</th>
              <th className="p-3 font-medium">TELEFONO</th>
              <th className="p-3 font-medium">DOCUMENTO</th>
              <th className="p-3 font-medium text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-xs uppercase">CARGANDO...</td></tr>
            ) : paginatedSuppliers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground/50 uppercase text-xs">NO HAY PROVEEDORES REGISTRADOS</td></tr>
            ) : (
              paginatedSuppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-border hover:bg-primary/5">
                  <td className="p-3 font-bold">{supplier.name}</td>
                  <td className="p-3 text-muted-foreground">{supplier.email || "—"}</td>
                  <td className="p-3 text-muted-foreground">{supplier.phone || "—"}</td>
                  <td className="p-3 text-muted-foreground">{`${supplier.documentType || ""} ${supplier.documentId || ""}`.trim() || "—"}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingSupplier(supplier)
                          setEditOpen(true)
                        }}
                        className="text-[10px] uppercase border border-primary/50 bg-primary/10 hover:bg-primary/20 px-2 py-1 text-primary rounded-none"
                      >
                        EDITAR
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(supplier.id)}
                        className="text-[10px] uppercase border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 px-2 py-1 text-destructive rounded-none"
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
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {editingSupplier && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[460px] rounded-none border border-border bg-background">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">EDITAR PROVEEDOR</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateMutation.mutate({
                  id: editingSupplier.id,
                  data: {
                    name: editingSupplier.name,
                    email: editingSupplier.email || "",
                    phone: editingSupplier.phone || "",
                    documentId: editingSupplier.documentId || "",
                    documentType: editingSupplier.documentType || "NIT",
                    address: editingSupplier.address || "",
                  },
                })
              }}
              className="space-y-3"
            >
              <div>
                <Label className="text-[10px] uppercase">NOMBRE</Label>
                <Input value={editingSupplier.name} onChange={(e) => setEditingSupplier((p) => (p ? { ...p, name: e.target.value } : p))} className="h-9 rounded-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">EMAIL</Label>
                  <Input value={editingSupplier.email || ""} onChange={(e) => setEditingSupplier((p) => (p ? { ...p, email: e.target.value } : p))} className="h-9 rounded-none" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase">TELEFONO</Label>
                  <Input value={editingSupplier.phone || ""} onChange={(e) => setEditingSupplier((p) => (p ? { ...p, phone: e.target.value } : p))} className="h-9 rounded-none" />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-none uppercase font-bold" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "ACTUALIZANDO..." : "GUARDAR CAMBIOS"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
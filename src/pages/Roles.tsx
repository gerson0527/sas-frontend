import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { rolesApi } from "@/api/roles"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { alert } from "@/lib/alert"

type RoleRecord = {
  id: string
  name: string
  description?: string | null
  permissions: Array<string | { id?: string; name?: string }>
}

function isProtectedRole(role: RoleRecord) {
  return role.name.trim().toLowerCase() === "administrador"
}

const FALLBACK_PERMISSIONS = [
  { name: "process_sales", label: "Operaciones POS", description: "Permite procesar ventas en POS" },
  { name: "manage_products", label: "Inventario", description: "Gestion de productos" },
  { name: "manage_categories", label: "Clasificaciones", description: "Gestion de categorias" },
  { name: "manage_suppliers", label: "Logistica", description: "Gestion de proveedores" },
  { name: "manage_returns", label: "Devoluciones", description: "Gestion de devoluciones" },
  { name: "manage_customers", label: "Directorio", description: "Gestion de clientes" },
  { name: "view_invoices", label: "Facturas", description: "Consulta de facturas y ventas" },
  { name: "manage_expenses", label: "Finanzas", description: "Gestion financiera" },
  { name: "view_reports", label: "Reportes", description: "Consulta de reportes" },
  { name: "manage_users", label: "Equipo", description: "Gestion de usuarios de tienda" },
  { name: "manage_roles", label: "Roles", description: "Gestion de roles y permisos" },
  { name: "manage_registers", label: "Cajas", description: "Gestion de cajas registradoras" },
]

function normalizePermissionName(permission: string | { name?: string }) {
  return typeof permission === "string" ? permission : permission?.name || ""
}

export default function RolesPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"

  const [open, setOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null)
  const [formData, setFormData] = useState<{ name: string; description: string; permissions: string[] }>({
    name: "",
    description: "",
    permissions: [],
  })

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", storeId],
    queryFn: async () => {
      const data = await rolesApi.getAll(storeId)
      return Array.isArray(data) ? (data as RoleRecord[]) : []
    },
    enabled: Boolean(storeId),
  })

  const { data: permissionCatalog = [] } = useQuery({
    queryKey: ["role-permissions-catalog"],
    queryFn: async () => {
      const data = await rolesApi.getPermissions()
      if (Array.isArray(data) && data.length > 0) return data
      return FALLBACK_PERMISSIONS
    },
  })

  const availablePermissions = useMemo(
    () =>
      permissionCatalog.map((perm: any) => ({
        name: perm.name,
        label: perm.label || perm.name?.replace(/_/g, " ").toUpperCase(),
        description: perm.description || "",
      })),
    [permissionCatalog],
  )

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description: string; permissions: string[] }) =>
      rolesApi.create({
        ...payload,
        storeId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles", storeId] })
      setOpen(false)
      setFormData({ name: "", description: "", permissions: [] })
      alert.success("ROL CREADO")
    },
    onError: (error: any) => alert.error(error?.message || "ERROR AL CREAR ROL"),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; name: string; description: string; permissions: string[] }) =>
      rolesApi.update(payload.id, {
        name: payload.name,
        description: payload.description,
        permissions: payload.permissions,
        storeId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles", storeId] })
      setOpen(false)
      setEditingRole(null)
      setFormData({ name: "", description: "", permissions: [] })
      alert.success("ROL ACTUALIZADO")
    },
    onError: (error: any) => alert.error(error?.response?.data?.error || error?.message || "ERROR AL ACTUALIZAR ROL"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id, storeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles", storeId] })
      alert.success("ROL ELIMINADO")
    },
    onError: (error: any) => alert.error(error?.response?.data?.error || error?.message || "ERROR AL ELIMINAR ROL"),
  })

  const openCreate = () => {
    setEditingRole(null)
    setFormData({ name: "", description: "", permissions: [] })
    setOpen(true)
  }

  const openEdit = (role: RoleRecord) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions.map((perm) => normalizePermissionName(perm)).filter(Boolean),
    })
    setOpen(true)
  }

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((entry) => entry !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert.error("INGRESE NOMBRE DEL ROL")
      return
    }

    if (editingRole) {
      await updateMutation.mutateAsync({
        id: editingRole.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions,
      })
      return
    }

    await createMutation.mutateAsync({
      name: formData.name.trim(),
      description: formData.description.trim(),
      permissions: formData.permissions,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">ROLES Y PERMISOS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Define roles personalizados y sus permisos
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            onClick={openCreate}
            className="inline-flex items-center justify-center whitespace-nowrap h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-primary bg-primary/10 hover:bg-primary/20 text-primary"
          >
            NUEVO ROL
          </DialogTrigger>
          <DialogContent className="rounded-none border-border bg-background sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">
                {editingRole ? "EDITAR ROL" : "CREAR ROL"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">NOMBRE</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="h-10 bg-card border border-border rounded-none text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">DESCRIPCION</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="h-10 bg-card border border-border rounded-none text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">PERMISOS</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto border border-border p-3 bg-card/20">
                  {availablePermissions.map((perm) => (
                    <button
                      key={perm.name}
                      type="button"
                      onClick={() => togglePermission(perm.name)}
                      className={`px-2 py-1 text-[10px] uppercase border rounded-none text-left ${
                        formData.permissions.includes(perm.name)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary"
                      }`}
                    >
                      {perm.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full rounded-none uppercase tracking-widest font-bold h-10"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "GUARDANDO..."
                  : editingRole
                    ? "ACTUALIZAR ROL"
                    : "CREAR ROL"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <div className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">PERMISOS DISPONIBLES</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {availablePermissions.map((perm) => (
              <div key={perm.name} className="bg-background border border-border p-2 rounded-none">
                <span className="text-[10px] font-bold uppercase text-foreground block">{perm.label}</span>
                <span className="text-[9px] text-muted-foreground">{perm.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">ROLES DEFINIDOS</h2>
        </div>
        <div className="divide-y divide-border">
          {roles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground/50">NO HAY ROLES DEFINIDOS</p>
            </div>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black uppercase text-primary">{role.name}</h3>
                    {isProtectedRole(role) ? (
                      <span className="text-[9px] uppercase px-2 py-0.5 bg-primary/10 text-primary">Protegido</span>
                    ) : null}
                    <span className="text-[9px] text-muted-foreground uppercase">
                      {role.permissions.length} permiso(s)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {isProtectedRole(role) ? (
                      <span className="text-[10px] uppercase text-muted-foreground">Bloqueado</span>
                    ) : (
                      <>
                        <button
                          onClick={() => openEdit(role)}
                          className="text-[10px] border border-border px-2 py-1 uppercase hover:bg-muted/20"
                        >
                          EDITAR
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("¿ELIMINAR ESTE ROL?")) deleteMutation.mutate(role.id)
                          }}
                          className="text-destructive hover:bg-destructive/10 px-2 py-1 rounded-none uppercase text-xs"
                        >
                          ELIMINAR
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm, idx) => {
                    const name = normalizePermissionName(perm)
                    const info = availablePermissions.find((entry) => entry.name === name)
                    return (
                      <span
                        key={`${role.id}-${name}-${idx}`}
                        className="text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-none"
                      >
                        {info ? info.label : name.replace(/_/g, " ")}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

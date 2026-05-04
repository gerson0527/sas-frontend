import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { registersApi } from "@/api/registers"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { alert } from "@/lib/alert"

type Register = {
  id: string
  name: string
  location: string | null
  isActive: boolean
  _count?: { cashShifts?: number }
}

function isProtectedRegister(register: Register) {
  return register.name.trim().toLowerCase() === "caja principal"
}

export default function RegistersPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const storeId = (user as any)?.stores?.[0]?.store?.id as string | undefined

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newRegister, setNewRegister] = useState({ name: "", location: "" })

  const { data: registers = [], isLoading } = useQuery({
    queryKey: ["registers-settings", storeId],
    queryFn: async () => {
      if (!storeId) return []
      const data = await registersApi.getAll(storeId)
      return Array.isArray(data) ? (data as Register[]) : []
    },
    enabled: Boolean(storeId),
  })

  const sortedRegisters = useMemo(
    () => [...registers].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [registers],
  )

  const createMutation = useMutation({
    mutationFn: () =>
      !storeId
        ? Promise.reject(new Error("Tu usuario no tiene tienda asignada"))
        :
      registersApi.create({
        storeId,
        name: newRegister.name.trim(),
        location: newRegister.location.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["registers-settings", storeId] })
      await queryClient.invalidateQueries({ queryKey: ["registers", storeId] })
      setOpen(false)
      setNewRegister({ name: "", location: "" })
      alert.success("CAJA CREADA")
    },
    onError: (error: any) => {
      alert.error(error?.message || "ERROR AL CREAR")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      registersApi.update(id, { isActive }),
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["registers-settings", storeId] })
      await queryClient.invalidateQueries({ queryKey: ["registers", storeId] })
      alert.success(vars.isActive ? "CAJA ACTIVADA" : "CAJA DESACTIVADA")
    },
    onError: (error: any) => {
      alert.error(error?.response?.data?.error || error?.message || "ERROR AL ACTUALIZAR")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => registersApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["registers-settings", storeId] })
      await queryClient.invalidateQueries({ queryKey: ["registers", storeId] })
      alert.success("CAJA ELIMINADA")
    },
    onError: (error: any) => {
      alert.error(error?.response?.data?.error || error?.message || "ERROR AL ELIMINAR")
    },
  })

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newRegister.name.trim()) {
      alert.error("INGRESE NOMBRE DE CAJA")
      return
    }
    if (!storeId) {
      alert.error("USUARIO SIN TIENDA ASIGNADA")
      return
    }
    try {
      setLoading(true)
      await createMutation.mutateAsync()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">CAJAS REGISTRADAS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Gestionar cajas fisicas de la tienda
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className="inline-flex items-center justify-center whitespace-nowrap h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-primary bg-primary/10 hover:bg-primary/20 text-primary"
          >
            NUEVA CAJA
          </DialogTrigger>
          <DialogContent className="rounded-none border-border bg-background sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">CREAR CAJA</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                  NOMBRE DE LA CAJA
                </label>
                <Input
                  required
                  placeholder="Caja Principal, Caja 2, etc."
                  value={newRegister.name}
                  onChange={(e) => setNewRegister((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-10 bg-card border border-border rounded-none text-xs uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                  UBICACION (OPCIONAL)
                </label>
                <Input
                  placeholder="Entrada, Piso 2, etc."
                  value={newRegister.location}
                  onChange={(e) => setNewRegister((prev) => ({ ...prev, location: e.target.value }))}
                  className="h-10 bg-card border border-border rounded-none text-xs uppercase"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-none uppercase tracking-widest font-bold h-10">
                {loading ? "CREANDO..." : "CREAR CAJA"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!storeId ? (
        <div className="border border-destructive/30 bg-destructive/5 rounded-none p-4">
          <p className="text-xs uppercase tracking-widest text-destructive font-bold">
            ESTE USUARIO NO TIENE TIENDA ASIGNADA. NO ES POSIBLE CREAR CAJAS.
          </p>
        </div>
      ) : null}

      <div className="border border-border bg-card/30 rounded-none overflow-hidden">
        <table className="w-full text-left text-sm font-mono">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border tracking-widest">
            <tr>
              <th className="px-4 py-3 font-medium">NOMBRE</th>
              <th className="px-4 py-3 font-medium">UBICACION</th>
              <th className="px-4 py-3 font-medium text-center">TURNOS</th>
              <th className="px-4 py-3 font-medium text-center">ESTADO</th>
              <th className="px-4 py-3 font-medium text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!isLoading && sortedRegisters.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs uppercase tracking-widest text-muted-foreground/50">
                  NO HAY CAJAS REGISTRADAS. CREA LA PRIMERA CAJA.
                </td>
              </tr>
            ) : (
              sortedRegisters.map((register) => (
                <tr key={register.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-foreground uppercase">{register.name}</span>
                    {isProtectedRegister(register) ? (
                      <span className="ml-2 text-[9px] uppercase px-2 py-0.5 bg-primary/10 text-primary">
                        Principal
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{register.location || "Sin ubicacion"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs">{register._count?.cashShifts ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded-none ${
                        register.isActive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {register.isActive ? "ACTIVA" : "INACTIVA"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {isProtectedRegister(register) ? (
                        <span className="text-[10px] uppercase text-muted-foreground">Protegida</span>
                      ) : (
                        <>
                          <button
                            onClick={() => updateMutation.mutate({ id: register.id, isActive: !register.isActive })}
                            disabled={updateMutation.isPending}
                            className="text-[10px] border border-border px-2 py-1 uppercase hover:bg-muted/20"
                          >
                            {register.isActive ? "DESACTIVAR" : "ACTIVAR"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("¿ELIMINAR ESTA CAJA?")) {
                                deleteMutation.mutate(register.id)
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:bg-destructive/10 px-2 py-1 rounded-none uppercase text-xs"
                          >
                            ELIMINAR
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

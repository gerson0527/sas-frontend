import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { teamApi } from "@/api/team"
import { rolesApi } from "@/api/roles"
import { registersApi } from "@/api/registers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { alert } from "@/lib/alert"

type Role = { id: string; name: string }
type Register = { id: string; name: string }

type TeamMember = {
  id: string
  userId?: string
  name?: string
  email?: string
  isActive?: boolean
  roleId?: string | null
  role?: { id: string; name: string } | null
  customRole?: { id: string; name: string } | null
  defaultCashRegister?: { id: string; name: string } | null
}

export default function TeamPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"
  const currentUserId = user?.id

  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedRegister, setSelectedRegister] = useState("")

  const { data: team = [] } = useQuery({
    queryKey: ["team", storeId],
    queryFn: async () => {
      const data = await teamApi.getAll(storeId)
      return Array.isArray(data) ? (data as TeamMember[]) : []
    },
  })

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", storeId],
    queryFn: async () => {
      const data = await rolesApi.getAll(storeId)
      return Array.isArray(data) ? (data as Role[]) : []
    },
    enabled: Boolean(storeId),
  })

  const { data: registers = [] } = useQuery({
    queryKey: ["registers-team", storeId],
    queryFn: async () => {
      const data = await registersApi.getAll(storeId)
      return Array.isArray(data) ? (data as Register[]) : []
    },
  })

  const normalizedTeam = useMemo(
    () =>
      team.map((member) => ({
        id: member.id,
        userId: member.userId || member.id,
        name: member.name || (member as any)?.user?.name || "Sin nombre",
        email: member.email || (member as any)?.user?.email || "",
        isActive: member.isActive ?? true,
        roleName: member.customRole?.name || member.role?.name || "Sin rol",
        roleId: member.customRole?.id || member.role?.id || member.roleId || null,
        defaultCashRegisterName: member.defaultCashRegister?.name || null,
      })),
    [team],
  )

  const createMutation = useMutation({
    mutationFn: () =>
      teamApi.create({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        storeId,
        roleId: selectedRole || undefined,
        defaultCashRegisterId: selectedRegister || undefined,
      } as any),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team", storeId] })
      setNewName("")
      setNewEmail("")
      setNewPassword("")
      setSelectedRole("")
      setSelectedRegister("")
      alert.success("USUARIO CREADO")
    },
    onError: (error: any) => {
      alert.error(error?.message || "ERROR AL CREAR USUARIO")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team", storeId] })
      alert.success("USUARIO ELIMINADO")
    },
    onError: (error: any) => {
      alert.error(error?.message || "ERROR AL ELIMINAR")
    },
  })

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newEmail || !newPassword || !selectedRole) {
      alert.error("TODOS LOS CAMPOS SON REQUERIDOS")
      return
    }
    try {
      setLoading(true)
      await createMutation.mutateAsync()
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (memberId: string, memberUserId?: string) => {
    if (memberUserId && memberUserId === currentUserId) {
      alert.error("NO PUEDES ELIMINARTE A TI MISMO")
      return
    }
    if (!confirm("¿ELIMINAR ESTE USUARIO?")) return
    try {
      setLoading(true)
      await deleteMutation.mutateAsync(memberId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-widest text-primary">
          GESTION DE EQUIPO
        </h1>
      </div>

      <div className="rounded-none border border-border bg-card/30 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Miembros del Equipo: {normalizedTeam.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs uppercase tracking-wider">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 font-medium">NOMBRE</th>
                <th className="pb-2 font-medium">EMAIL</th>
                <th className="pb-2 font-medium">ROL</th>
                <th className="pb-2 font-medium">CAJA</th>
                <th className="pb-2 font-medium">ESTADO</th>
                <th className="pb-2 font-medium text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {normalizedTeam.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground/50">
                    NO HAY MIEMBROS EN EL EQUIPO
                  </td>
                </tr>
              ) : (
                normalizedTeam.map((member) => (
                  <tr key={member.id} className="border-b border-border/50 hover:bg-primary/5">
                    <td className="py-3 font-bold">{member.name}</td>
                    <td className="py-3 text-muted-foreground">{member.email}</td>
                    <td className="py-3">
                      <span className="border border-border bg-background px-2 py-0.5 rounded-none">
                        {member.roleName}
                      </span>
                    </td>
                    <td className="py-3">
                      {member.defaultCashRegisterName ? (
                        <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-none">
                          {member.defaultCashRegisterName}
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 rounded-none ${
                          member.isActive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {member.isActive ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {member.userId !== currentUserId ? (
                        <button
                          onClick={() => handleRemove(member.id, member.userId)}
                          disabled={loading}
                          className="text-destructive hover:bg-destructive/10 px-2 py-1 rounded-none uppercase tracking-widest"
                        >
                          ELIMINAR
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-[10px] uppercase">TU</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-none border border-border bg-card/30 p-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
          CREAR NUEVO USUARIO
        </h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            placeholder="NOMBRE COMPLETO"
            className="rounded-none uppercase"
          />
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            placeholder="CORREO (USERNAME)"
            className="rounded-none lowercase"
          />
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="CONTRASEÑA"
            className="rounded-none"
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-10 w-full border border-border bg-card px-2 rounded-none text-xs uppercase"
            required
          >
            <option value="">SELECCIONAR ROL</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <select
            value={selectedRegister}
            onChange={(e) => setSelectedRegister(e.target.value)}
            className="h-10 w-full border border-border bg-card px-2 rounded-none text-xs uppercase"
          >
            <option value="">CAJA (OPCIONAL)</option>
            {registers.map((register) => (
              <option key={register.id} value={register.id}>
                {register.name}
              </option>
            ))}
          </select>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full rounded-none uppercase tracking-widest font-bold h-10">
              {loading ? "CREANDO..." : "CREAR USUARIO"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

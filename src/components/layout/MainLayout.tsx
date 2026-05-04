import { Outlet, Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { SidebarNavClient } from "@/components/layout/SidebarNavClient"
import type { NavItem } from "@/components/layout/SidebarNavClient"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuth } from "@/context/AuthContext"

type SidebarItem = NavItem & { permission?: string }

const NAV_ITEMS: SidebarItem[] = [
  { href: "/dashboard", label: "Centro de Mando", icon: "dashboard" },
  { href: "/pos", label: "Operaciones (POS)", icon: "pos", permission: "process_sales" },
  { href: "/products", label: "Inventario", icon: "products", permission: "manage_products" },
  { href: "/categories", label: "Clasificaciones", icon: "categories", permission: "manage_categories" },
  { href: "/suppliers", label: "Logística", icon: "suppliers", permission: "manage_suppliers" },
  { href: "/returns", label: "Devoluciones", icon: "returns", permission: "manage_returns" },
  { href: "/customers", label: "Directorio", icon: "customers", permission: "manage_customers" },
  { href: "/invoices", label: "Facturas", icon: "invoices", permission: "view_invoices" },
  { href: "/finance", label: "Finanzas", icon: "finance", permission: "manage_expenses" },
  { href: "/reports", label: "Reportes", icon: "reports", permission: "view_reports" },
  { href: "/settings/team", label: "Equipo", icon: "team", permission: "manage_users" },
  { href: "/settings/roles", label: "Roles", icon: "roles", permission: "manage_roles" },
  { href: "/settings/registers", label: "Cajas", icon: "registers", permission: "manage_registers" },
]

export default function MainLayout() {
  const { user, logout, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const activeSection = location.pathname.split("/").filter(Boolean)[0] ?? "dashboard"
  const hasStore = Boolean((user as any)?.stores?.[0]?.store?.id)

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!hasStore) {
    return <Navigate to="/store-setup" replace />
  }

  const rawPermissions =
    (user as any)?.customRole?.permissions ??
    (user as any)?.role?.permissions ??
    (user as any)?.permissions ??
    []

  const userPermissions = Array.isArray(rawPermissions)
    ? rawPermissions.map((permission: any) =>
        typeof permission === "string" ? permission : permission?.name,
      ).filter(Boolean)
    : []

  const navItems =
    userPermissions.length > 0
      ? NAV_ITEMS.filter((item) => !item.permission || userPermissions.includes(item.permission))
      : NAV_ITEMS

  const storeName = (user as any)?.stores?.[0]?.store?.name ?? "N/A"
  const userName = user?.name || user?.email || "Operador"

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 flex-col border-r border-border bg-card/30 md:flex sticky top-0 h-screen overflow-hidden">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-5 w-5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-primary text-sm uppercase tracking-widest leading-none mt-1">SAAS INVENTORY</span>
              <span className="text-[10px] text-muted-foreground uppercase">v1.0.0 Online</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNavClient items={navItems} />
        </div>

        <div className="mt-auto border-t border-border p-4">
          <div className="rounded-none border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-xs font-bold text-primary uppercase">Sistema en Línea</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase flex flex-col gap-1">
              <span>STORE: {storeName}</span>
              <span>USER: {userName}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate("/")
              }}
              className="mt-3 text-[10px] text-destructive hover:bg-destructive/10 w-full py-1 border border-destructive/30 uppercase transition-colors"
            >
              Iniciar Desconexión
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/30 px-6">
          <div className="flex items-center gap-4">
            <button type="button" className="md:hidden text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="h-6 w-6"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{activeSection}</span>
          </div>
          <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="hidden md:inline-block">Última Actualización: {new Date().toISOString().replace("T", " ").substring(0, 16)} UTC</span>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
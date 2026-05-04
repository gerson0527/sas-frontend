import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { categoriesApi } from "@/api/categories"
import { useAuth } from "@/context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/Pagination"
import { alert } from "@/lib/alert"

type Category = {
  id: string
  name: string
  parentId?: string | null
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"
  const [search, setSearch] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [hasSubcategories, setHasSubcategories] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15
  const [formData, setFormData] = useState({ name: "", parentId: "" })

  const { data: categoriesData = [], isLoading } = useQuery({
    queryKey: ["categories", storeId],
    queryFn: () => categoriesApi.getAll(storeId),
  })

  const categories = (Array.isArray(categoriesData) ? categoriesData : []) as Category[]
  const parentCategories = categories.filter((c) => !c.parentId)

  const createMutation = useMutation({
    mutationFn: () =>
      categoriesApi.create({
        name: formData.name.trim(),
        storeId,
        parentId: formData.parentId || undefined,
      }),
    onSuccess: () => {
      alert.success("Categoria creada")
      setShowNew(false)
      setHasSubcategories(false)
      setFormData({ name: "", parentId: "" })
      queryClient.invalidateQueries({ queryKey: ["categories", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo crear la categoria."),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; name: string }) => categoriesApi.update(payload.id, { name: payload.name }),
    onSuccess: () => {
      alert.success("Categoria actualizada")
      setEditOpen(false)
      setEditingCategory(null)
      queryClient.invalidateQueries({ queryKey: ["categories", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo actualizar la categoria."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      alert.success("Categoria eliminada")
      queryClient.invalidateQueries({ queryKey: ["categories", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo eliminar la categoria."),
  })

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [categories, search],
  )

  const totalPages = Math.ceil(filteredCategories.length / pageSize)
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCategories.slice(start, start + pageSize)
  }, [filteredCategories, currentPage])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">CATEGORIAS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Gestionar clasificaciones de la tienda
          </p>
        </div>
        <Dialog
          open={showNew}
          onOpenChange={(open) => {
            setShowNew(open)
            if (!open) {
              setHasSubcategories(false)
              setFormData({ name: "", parentId: "" })
            }
          }}
        >
          <DialogTrigger className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-primary bg-primary text-primary-foreground hover:bg-primary/90">
            ANADIR CATEGORIA
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px] rounded-none border border-border bg-background">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">NUEVA CATEGORIA</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createMutation.mutate()
              }}
              className="space-y-3"
            >
              <div>
                <Label className="text-[10px] uppercase">NOMBRE DE LA CATEGORIA</Label>
                <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required className="h-9 rounded-none" />
              </div>

              <div className="flex items-center gap-2 p-3 border border-border bg-card/30">
                <input
                  type="checkbox"
                  id="hasSubcategories"
                  checked={hasSubcategories}
                  onChange={(e) => setHasSubcategories(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <Label htmlFor="hasSubcategories" className="text-xs uppercase font-bold tracking-wider cursor-pointer">
                  ES CATEGORIA PRINCIPAL (TENDRA SUBCATEGORIAS)
                </Label>
              </div>

              {hasSubcategories && parentCategories.length > 0 ? (
                <div>
                  <Label className="text-[10px] uppercase">SELECCIONAR CATEGORIA PRINCIPAL:</Label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData((p) => ({ ...p, parentId: e.target.value }))}
                    className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase"
                  >
                    <option value="">NINGUNA (ES PRINCIPAL)</option>
                    {parentCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <Label className="text-[10px] uppercase">CATEGORIA PRINCIPAL (OPCIONAL)</Label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData((p) => ({ ...p, parentId: e.target.value }))}
                    className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase"
                  >
                    <option value="">NINGUNA (ES PRINCIPAL)</option>
                    {parentCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {parentCategories.length === 0 && (
                <p className="text-[10px] text-muted-foreground uppercase">Primero cree categorias principales</p>
              )}

              <Button type="submit" className="w-full rounded-none uppercase font-bold" disabled={createMutation.isPending}>
                {createMutation.isPending ? "GUARDANDO..." : "GUARDAR CATEGORIA"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="BUSCAR CATEGORIAS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-10 bg-card border-border rounded-none uppercase"
        />
      </div>

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <table className="w-full text-left text-sm font-mono">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border tracking-widest">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">NOMBRE</th>
              <th className="px-4 py-3 font-medium">TIPO</th>
              <th className="px-4 py-3 font-medium">PRINCIPAL</th>
              <th className="px-4 py-3 font-medium text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs uppercase">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">CARGANDO...</td></tr>
            ) : paginatedCategories.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground/50">NO SE DETECTARON CATEGORIAS</td></tr>
            ) : (
              paginatedCategories.map((category, idx) => (
                <tr key={category.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{(currentPage - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{category.parentId ? `↳ ${category.name}` : category.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-none ${
                      category.parentId ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    }`}>
                      {category.parentId ? "SUBCATEGORIA" : "PRINCIPAL"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {category.parentId ? categories.find((c) => c.id === category.parentId)?.name || "—" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category)
                          setEditOpen(true)
                        }}
                        className="text-[10px] uppercase border border-primary/50 bg-primary/10 hover:bg-primary/20 px-2 py-1 text-primary rounded-none"
                      >
                        EDITAR
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(category.id)}
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

      {editingCategory && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-none border border-border bg-background">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">EDITAR CATEGORIA</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateMutation.mutate({ id: editingCategory.id, name: editingCategory.name })
              }}
              className="space-y-3"
            >
              <div>
                <Label className="text-[10px] uppercase">NOMBRE</Label>
                <Input value={editingCategory.name} onChange={(e) => setEditingCategory((p) => (p ? { ...p, name: e.target.value } : p))} className="h-9 rounded-none" />
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
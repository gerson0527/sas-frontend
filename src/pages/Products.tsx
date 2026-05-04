import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { productsApi } from "@/api/products"
import { categoriesApi } from "@/api/categories"
import { suppliersApi } from "@/api/suppliers"
import { useAuth } from "@/context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/Pagination"
import { alert } from "@/lib/alert"

type Product = {
  id: string
  name: string
  sku?: string | null
  SKU?: string | null
  barcode?: string | null
  description?: string | null
  price: number
  regularPrice?: number | null
  cost?: number | null
  stock: number
  minStock?: number | null
  maxStock?: number | null
  supplierId?: string | null
  taxType?: string | null
  taxRate?: number | null
  unitMeasure?: string | null
  standardCode?: string | null
  category?: { id?: string; name?: string } | null
  supplier?: { id?: string; name?: string } | null
  categoryId?: string | null
}

export default function ProductsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const storeId = (user as any)?.stores?.[0]?.store?.id || "store_001"
  const [showNew, setShowNew] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterSupplier, setFilterSupplier] = useState("")
  const [filterStock, setFilterStock] = useState("")
  const pageSize = 20
  const [formData, setFormData] = useState({
    name: "",
    SKU: "",
    categoryId: "",
    supplierId: "",
    cost: "",
    regularPrice: "",
    price: "",
    stock: "0",
    minStock: "5",
    taxType: "TAXED",
    taxRate: "19",
    unitMeasure: "94",
    standardCode: "",
  })
  const [editFormData, setEditFormData] = useState({
    name: "",
    SKU: "",
    categoryId: "",
    supplierId: "",
    cost: "",
    regularPrice: "",
    price: "",
    stock: "0",
    minStock: "5",
    taxType: "TAXED",
    taxRate: "19",
    unitMeasure: "94",
    standardCode: "",
  })

  const { data: productsData = [], isLoading } = useQuery({
    queryKey: ["products", storeId],
    queryFn: () => productsApi.getAll(storeId),
  })

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories", storeId],
    queryFn: () => categoriesApi.getAll(storeId),
  })

  const { data: suppliersData = [] } = useQuery({
    queryKey: ["suppliers", storeId],
    queryFn: () => suppliersApi.getAll(storeId),
  })

  const products = (Array.isArray(productsData) ? productsData : []) as Product[]
  const categories = Array.isArray(categoriesData) ? categoriesData : []
  const suppliers = Array.isArray(suppliersData) ? suppliersData : []

  const createMutation = useMutation({
    mutationFn: () =>
      productsApi.create({
        storeId,
        name: formData.name.trim(),
        sku: formData.SKU.trim() || undefined,
        SKU: formData.SKU.trim() || undefined,
        supplierId: formData.supplierId || undefined,
        cost: formData.cost === "" ? undefined : Number(formData.cost),
        regularPrice: formData.regularPrice === "" ? undefined : Number(formData.regularPrice),
        price: Number(formData.price || 0),
        stock: Number(formData.stock || 0),
        minStock: Number(formData.minStock || 0),
        categoryId: formData.categoryId || undefined,
        taxType: formData.taxType,
        taxRate: Number(formData.taxRate || 0),
        unitMeasure: formData.unitMeasure,
        standardCode: formData.standardCode.trim() || undefined,
      }),
    onSuccess: () => {
      alert.success("Producto creado")
      setShowNew(false)
      setFormData({
        name: "",
        SKU: "",
        categoryId: "",
        supplierId: "",
        cost: "",
        regularPrice: "",
        price: "",
        stock: "0",
        minStock: "5",
        taxType: "TAXED",
        taxRate: "19",
        unitMeasure: "94",
        standardCode: "",
      })
      queryClient.invalidateQueries({ queryKey: ["products", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo crear el producto."),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => productsApi.update(payload.id, payload.data),
    onSuccess: () => {
      alert.success("Producto actualizado")
      setEditOpen(false)
      setEditingProduct(null)
      setEditFormData({
        name: "",
        SKU: "",
        categoryId: "",
        supplierId: "",
        cost: "",
        regularPrice: "",
        price: "",
        stock: "0",
        minStock: "5",
        taxType: "TAXED",
        taxRate: "19",
        unitMeasure: "94",
        standardCode: "",
      })
      queryClient.invalidateQueries({ queryKey: ["products", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo actualizar el producto."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      alert.success("Producto eliminado")
      queryClient.invalidateQueries({ queryKey: ["products", storeId] })
    },
    onError: () => alert.error("Error", "No se pudo eliminar el producto."),
  })

  const filteredProducts = useMemo(() => {
    let filtered = products
    if (search.trim()) {
      const query = search.toLowerCase().trim()
      filtered = filtered.filter((p) =>
        `${p.name || ""} ${p.sku || p.SKU || ""}`.toLowerCase().includes(query),
      )
    }
    if (filterCategory) {
      filtered = filtered.filter((p) => p.category?.name === filterCategory || p.categoryId === filterCategory)
    }
    if (filterSupplier) {
      filtered = filtered.filter((p) => p.supplier?.name === filterSupplier || p.supplier?.id === filterSupplier)
    }
    if (filterStock === "low") {
      filtered = filtered.filter((p) => Number(p.stock || 0) <= Number(p.minStock || 0))
    } else if (filterStock === "normal") {
      filtered = filtered.filter((p) => Number(p.stock || 0) > Number(p.minStock || 0))
    } else if (filterStock === "out") {
      filtered = filtered.filter((p) => Number(p.stock || 0) === 0)
    }
    return filtered
  }, [products, search, filterCategory, filterSupplier, filterStock])

  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage])

  const openEditProduct = async (id: string) => {
    try {
      setEditLoading(true)
      const detail = await productsApi.getById(id)
      const product = detail as Product
      setEditingProduct(product)
      setEditFormData({
        name: product.name || "",
        SKU: (product.sku || product.SKU || "").toString(),
        categoryId: (product.categoryId || product.category?.id || "").toString(),
        supplierId: (product.supplierId || product.supplier?.id || "").toString(),
        cost: product.cost == null ? "" : String(product.cost),
        regularPrice: product.regularPrice == null ? "" : String(product.regularPrice),
        price: product.price == null ? "" : String(product.price),
        stock: product.stock == null ? "0" : String(product.stock),
        minStock: product.minStock == null ? "5" : String(product.minStock),
        taxType: (product.taxType || "TAXED").toString(),
        taxRate: product.taxRate == null ? "19" : String(product.taxRate),
        unitMeasure: (product.unitMeasure || "94").toString(),
        standardCode: (product.standardCode || "").toString(),
      })
      setEditOpen(true)
    } catch (_error) {
      alert.error("Error", "No se pudo cargar el producto para editar.")
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">INVENTARIO DE PRODUCTOS</h1>
          <p className="text-xs uppercase text-muted-foreground mt-1 tracking-wider font-mono">
            Gestionar catalogo de tienda y stock
          </p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-none uppercase tracking-widest text-xs font-bold border border-primary bg-primary text-primary-foreground hover:bg-primary/90">
            ANADIR PRODUCTO
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-none border border-border bg-background">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">NUEVO PRODUCTO</DialogTitle>
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
                  <Label className="text-[10px] uppercase">CATEGORIA</Label>
                  <select value={formData.categoryId} onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase">
                    <option value="">-- SIN CLASIFICAR --</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase">SKU / CODIGO DE BARRAS</Label>
                  <Input value={formData.SKU} onChange={(e) => setFormData((p) => ({ ...p, SKU: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">PROVEEDOR</Label>
                  <select value={formData.supplierId} onChange={(e) => setFormData((p) => ({ ...p, supplierId: e.target.value }))} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase">
                    <option value="">-- SIN PROVEEDOR --</option>
                    {suppliers.map((supplier: any) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase">COSTO DE COMPRA (OPCIONAL)</Label>
                  <Input type="number" min={0} step={0.01} value={formData.cost} onChange={(e) => setFormData((p) => ({ ...p, cost: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">PRECIO NORMAL (SIN DESCUENTO)</Label>
                  <Input type="number" min={0} step={0.01} value={formData.regularPrice} onChange={(e) => setFormData((p) => ({ ...p, regularPrice: e.target.value }))} className="h-9 rounded-none" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-primary">PRECIO DE VENTA (FINAL)</Label>
                  <Input type="number" min={0} step={0.01} value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">STOCK INICIAL</Label>
                  <Input type="number" min={0} step={1} value={formData.stock} onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))} className="h-9 rounded-none" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase">NIVEL DE ALERTA</Label>
                  <Input type="number" min={0} step={1} value={formData.minStock} onChange={(e) => setFormData((p) => ({ ...p, minStock: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">DATOS DE FACTURACION</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">TIPO DE IMPUESTO</Label>
                    <select value={formData.taxType} onChange={(e) => setFormData((p) => ({ ...p, taxType: e.target.value }))} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase">
                      <option value="TAXED">GRAVADO (TAXED)</option>
                      <option value="EXEMPT">EXENTO (EXEMPT)</option>
                      <option value="EXCLUDED">EXCLUIDO (EXCLUDED)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">% IMPUESTO (IVA)</Label>
                    <Input type="number" min={0} step={1} value={formData.taxRate} onChange={(e) => setFormData((p) => ({ ...p, taxRate: e.target.value }))} className="h-9 rounded-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">UNIDAD DE MEDIDA (DIAN)</Label>
                    <select value={formData.unitMeasure} onChange={(e) => setFormData((p) => ({ ...p, unitMeasure: e.target.value }))} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase">
                      <option value="94">94 - UNIDAD</option>
                      <option value="KGM">KGM - KILOGRAMO</option>
                      <option value="LTR">LTR - LITRO</option>
                      <option value="MTR">MTR - METRO</option>
                      <option value="MTK">MTK - METRO CUADRADO</option>
                      <option value="MTQ">MTQ - METRO CUBICO</option>
                      <option value="DAY">DAY - DIA</option>
                      <option value="HUR">HUR - HORA</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">CODIGO UNSPSC (OPCIONAL)</Label>
                    <Input value={formData.standardCode} onChange={(e) => setFormData((p) => ({ ...p, standardCode: e.target.value }))} className="h-9 rounded-none" />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-none uppercase font-bold" disabled={createMutation.isPending}>
                {createMutation.isPending ? "GUARDANDO..." : "GUARDAR PRODUCTO"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2 p-3 border border-border bg-card/30 rounded-none">
        <Input
          type="text"
          placeholder="BUSCAR POR NOMBRE O SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 px-2 text-xs uppercase bg-background border-border rounded-none w-52"
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="h-8 px-2 text-xs uppercase bg-background border border-border rounded-none">
          <option value="">TODAS LAS CATEGORIAS</option>
          {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="h-8 px-2 text-xs uppercase bg-background border border-border rounded-none">
          <option value="">TODOS LOS PROVEEDORES</option>
          {suppliers.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="h-8 px-2 text-xs uppercase bg-background border border-border rounded-none">
          <option value="">CUALQUIER STOCK</option>
          <option value="low">STOCK BAJO</option>
          <option value="normal">STOCK OK</option>
          <option value="out">AGOTADO</option>
        </select>
        <button
          onClick={() => {
            setSearch("")
            setFilterCategory("")
            setFilterSupplier("")
            setFilterStock("")
          }}
          className="h-8 px-2 text-xs uppercase bg-destructive/10 border border-destructive/30 text-destructive rounded-none hover:bg-destructive/20"
        >
          LIMPIAR
        </button>
        <span className="ml-auto text-xs text-muted-foreground uppercase">
          {filteredProducts.length} RESULTADOS
        </span>
      </div>

      <div className="rounded-none border border-border bg-card/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground w-[40px]">#</th>
                <th className="text-left p-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[110px]">NOMBRE</th>
                <th className="text-left p-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[80px]">CATEGORIA</th>
                <th className="text-left p-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[80px]">PROVEEDOR</th>
                <th className="text-right p-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[70px]">COSTO</th>
                <th className="text-right p-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[70px]">PRECIO</th>
                <th className="text-center p-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[50px]">IVA</th>
                <th className="text-center p-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[60px]">STOCK</th>
                <th className="text-right p-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground min-w-[90px]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {isLoading ? (
                <tr><td colSpan={9} className="h-32 text-center uppercase tracking-widest">CARGANDO...</td></tr>
              ) : paginatedProducts.length === 0 ? (
                <tr><td colSpan={9} className="h-32 text-center uppercase tracking-widest text-muted-foreground/50">NO SE DETECTARON PRODUCTOS</td></tr>
              ) : (
                paginatedProducts.map((product, idx) => {
                  const sku = product.sku || product.SKU || ""
                  const minStock = Number(product.minStock || 0)
                  const stock = Number(product.stock || 0)
                  return (
                    <tr key={product.id} className="border-b border-border hover:bg-primary/5 transition-colors">
                      <td className="p-2 text-muted-foreground text-[10px]">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="p-2">
                        <div className="flex flex-col">
                          <span className="uppercase font-bold text-[10px] leading-tight">{product.name}</span>
                          <span className="text-[9px] text-muted-foreground">{sku || "Sin SKU"}</span>
                        </div>
                      </td>
                      <td className="p-2 uppercase text-muted-foreground text-[10px]">{product.category?.name || "—"}</td>
                      <td className="p-2 uppercase text-muted-foreground text-[10px]">{product.supplier?.name || "—"}</td>
                      <td className="p-2 text-right text-[10px] text-muted-foreground">{product.cost ? `$${Number(product.cost).toFixed(0)}` : "—"}</td>
                      <td className="p-2 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-primary text-[11px]">${Number(product.price || 0).toFixed(0)}</span>
                          {product.regularPrice && product.regularPrice > product.price ? (
                            <span className="text-[9px] line-through text-muted-foreground">${Number(product.regularPrice).toFixed(0)}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-2 text-center text-[10px]">
                        <span className={`${Number(product.taxRate || 0) > 0 ? "text-muted-foreground" : "text-orange-500"}`}>
                          {Number(product.taxRate || 0) > 0 ? `${product.taxRate}%` : "EX"}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-none text-[10px] font-bold ${stock <= minStock ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-primary/10 text-primary border border-primary/20"}`}>
                          {stock}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditProduct(product.id)}
                            className="text-[10px] uppercase border border-primary/50 bg-primary/10 hover:bg-primary/20 px-2 py-1 text-primary rounded-none"
                          >
                            {editLoading && editingProduct?.id === product.id ? "CARGANDO..." : "EDITAR"}
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(product.id)}
                            className="text-[10px] uppercase border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 px-2 py-1 text-destructive rounded-none"
                          >
                            ELIMINAR
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {editingProduct ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[550px] rounded-none border border-border bg-background">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-primary">EDITAR PRODUCTO</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateMutation.mutate({
                  id: editingProduct.id,
                  data: {
                    name: editFormData.name.trim(),
                    sku: editFormData.SKU.trim() || undefined,
                    SKU: editFormData.SKU.trim() || undefined,
                    price: Number(editFormData.price || 0),
                    stock: Number(editFormData.stock || 0),
                    minStock: Number(editFormData.minStock || 0),
                    categoryId: editFormData.categoryId || null,
                    supplierId: editFormData.supplierId || null,
                    cost: editFormData.cost === "" ? null : Number(editFormData.cost),
                    regularPrice: editFormData.regularPrice === "" ? null : Number(editFormData.regularPrice),
                    taxType: editFormData.taxType,
                    taxRate: Number(editFormData.taxRate || 0),
                    unitMeasure: editFormData.unitMeasure,
                    standardCode: editFormData.standardCode.trim() || null,
                  },
                })
              }}
              className="space-y-3"
            >
              <div>
                <Label className="text-[10px] uppercase">NOMBRE</Label>
                <Input value={editFormData.name} onChange={(e) => setEditFormData((p) => ({ ...p, name: e.target.value }))} className="h-9 rounded-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">CATEGORIA</Label>
                  <select value={editFormData.categoryId} onChange={(e) => setEditFormData((p) => ({ ...p, categoryId: e.target.value }))} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase">
                    <option value="">-- SIN CLASIFICAR --</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase">SKU / CODIGO DE BARRAS</Label>
                  <Input value={editFormData.SKU} onChange={(e) => setEditFormData((p) => ({ ...p, SKU: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">PROVEEDOR</Label>
                  <select value={editFormData.supplierId} onChange={(e) => setEditFormData((p) => ({ ...p, supplierId: e.target.value }))} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase">
                    <option value="">-- SIN PROVEEDOR --</option>
                    {suppliers.map((supplier: any) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase">COSTO DE COMPRA (OPCIONAL)</Label>
                  <Input type="number" min={0} step={0.01} value={editFormData.cost} onChange={(e) => setEditFormData((p) => ({ ...p, cost: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">PRECIO NORMAL (SIN DESCUENTO)</Label>
                  <Input type="number" min={0} step={0.01} value={editFormData.regularPrice} onChange={(e) => setEditFormData((p) => ({ ...p, regularPrice: e.target.value }))} className="h-9 rounded-none" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-primary">PRECIO DE VENTA (FINAL)</Label>
                  <Input type="number" min={0} step={0.01} value={editFormData.price} onChange={(e) => setEditFormData((p) => ({ ...p, price: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase">STOCK</Label>
                  <Input type="number" min={0} step={1} value={editFormData.stock} onChange={(e) => setEditFormData((p) => ({ ...p, stock: e.target.value }))} className="h-9 rounded-none" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase">MIN STOCK</Label>
                  <Input type="number" min={0} step={1} value={editFormData.minStock} onChange={(e) => setEditFormData((p) => ({ ...p, minStock: e.target.value }))} className="h-9 rounded-none" />
                </div>
              </div>
              <div className="border-t border-border pt-4 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">DATOS DE FACTURACION</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">TIPO DE IMPUESTO</Label>
                    <select value={editFormData.taxType} onChange={(e) => setEditFormData((p) => ({ ...p, taxType: e.target.value }))} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase">
                      <option value="TAXED">GRAVADO (TAXED)</option>
                      <option value="EXEMPT">EXENTO (EXEMPT)</option>
                      <option value="EXCLUDED">EXCLUIDO (EXCLUDED)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">% IMPUESTO (IVA)</Label>
                    <Input type="number" min={0} step={1} value={editFormData.taxRate} onChange={(e) => setEditFormData((p) => ({ ...p, taxRate: e.target.value }))} className="h-9 rounded-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">UNIDAD DE MEDIDA (DIAN)</Label>
                    <select value={editFormData.unitMeasure} onChange={(e) => setEditFormData((p) => ({ ...p, unitMeasure: e.target.value }))} className="h-9 w-full bg-card border border-border rounded-none px-2 text-xs uppercase">
                      <option value="94">94 - UNIDAD</option>
                      <option value="KGM">KGM - KILOGRAMO</option>
                      <option value="LTR">LTR - LITRO</option>
                      <option value="MTR">MTR - METRO</option>
                      <option value="MTK">MTK - METRO CUADRADO</option>
                      <option value="MTQ">MTQ - METRO CUBICO</option>
                      <option value="DAY">DAY - DIA</option>
                      <option value="HUR">HUR - HORA</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">CODIGO UNSPSC (OPCIONAL)</Label>
                    <Input value={editFormData.standardCode} onChange={(e) => setEditFormData((p) => ({ ...p, standardCode: e.target.value }))} className="h-9 rounded-none" />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-none uppercase font-bold" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "ACTUALIZANDO..." : "GUARDAR CAMBIOS"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
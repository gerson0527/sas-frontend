import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleDollarSign, Lock, Package, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/Pagination"
import { useAuth } from "@/context/AuthContext"
import { posApi } from "@/api/pos"
import api from "@/lib/api"
import { alert } from "@/lib/alert"
import { useConfirm } from "@/context/ConfirmContext"
import { ReturnDialog } from "@/components/pos/ReturnDialog"
import { TicketDialog } from "@/components/pos/TicketDialog"
import { CloseShiftDialog } from "@/components/pos/CloseShiftDialog"
import type { Category, Customer, Product, Shift } from "@/components/pos/types"

type CartItem = Product & {
  quantity: number
  basePrice: number
  taxAmount: number
}

type LastSale = {
  id: string
  items: { name: string; quantity: number; price: number; basePrice: number; taxAmount: number }[]
  total: number
}

export default function POSPage() {
  const { user } = useAuth()
  const { confirm } = useConfirm()
  const queryClient = useQueryClient()
  const storeId = user?.stores?.[0]?.store?.id || "store_001"
  const storeName = user?.stores?.[0]?.store?.name

  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("TODOS")
  const [isProcessing, setIsProcessing] = useState(false)
  const [shift, setShift] = useState<Shift | null>(null)
  const [showOpenShift, setShowOpenShift] = useState(true)
  const [startingCash, setStartingCash] = useState("100000")
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [selectedRegisterId, setSelectedRegisterId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string[]>(["CASH"])
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [amounts, setAmounts] = useState<Record<string, number>>({})
  const [showTicket, setShowTicket] = useState(false)
  const [lastSale, setLastSale] = useState<LastSale | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
    address: "",
    creditLimit: 0,
  })
  const [productsPage, setProductsPage] = useState(1)

  const productsPerPage = 20
  const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
  const unitTaxFrom = (basePrice: number, taxRate: number) => round2(basePrice * (taxRate / 100))

  const { data: products = [] } = useQuery({
    queryKey: ["products", storeId],
    queryFn: async () => {
      const res = await api.get(`/products?storeId=${storeId}`)
      return res.data as Product[]
    },
  })

  const { data: customers = [] } = useQuery({
    queryKey: ["customers", storeId],
    queryFn: async () => {
      const res = await api.get(`/customers?storeId=${storeId}`)
      return res.data as Customer[]
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", storeId],
    queryFn: async () => {
      const res = await api.get(`/categories?storeId=${storeId}`)
      return res.data as Category[]
    },
  })

  const { data: registers = [] } = useQuery({
    queryKey: ["registers", storeId],
    queryFn: () => posApi.getRegisters(storeId),
  })

  const { data: currentShift } = useQuery({
    queryKey: ["pos-shift", storeId, selectedRegisterId],
    queryFn: () => posApi.getCurrentShift(storeId, selectedRegisterId || undefined),
  })

  useEffect(() => {
    setShift(currentShift ?? null)
    setShowOpenShift(!currentShift || currentShift.status === "CLOSED")
  }, [currentShift])

  useEffect(() => {
    if (registers.length === 1 && !selectedRegisterId) {
      setSelectedRegisterId(registers[0].id)
    }
  }, [registers, selectedRegisterId])

  const createSaleMutation = useMutation({
    mutationFn: posApi.createSale,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products", storeId] })
      setCart([])
      setSelectedCustomerId("")
      setPaymentMethod(["CASH"])
      setAmounts({})
      alert.success("VENTA COMPLETADA")
    },
    onError: (error: any) => {
      alert.error(error?.message || "ERROR AL PROCESAR VENTA")
    },
  })

  const filteredProducts = useMemo(() => {
    let filtered = products
    if (selectedCategory && selectedCategory !== "TODOS") {
      filtered = filtered.filter((row) => row.categoryId === selectedCategory)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((row) => (row.name || "").toLowerCase().includes(query) || (row.sku || "").toLowerCase().includes(query))
    }
    return filtered
  }, [products, selectedCategory, searchQuery])

  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (productsPage - 1) * productsPerPage
    return filteredProducts.slice(start, start + productsPerPage)
  }, [filteredProducts, productsPage])

  useEffect(() => {
    setProductsPage(1)
  }, [searchQuery, selectedCategory])

  const subtotal = useMemo(() => cart.reduce((sum, row) => sum + row.basePrice * row.quantity, 0), [cart])
  const taxAmount = useMemo(() => cart.reduce((sum, row) => sum + row.taxAmount, 0), [cart])
  const total = subtotal + taxAmount
  const totalPaid = Object.values(amounts).reduce((sum, val) => sum + val, 0)
  const change = totalPaid - total

  const hasSales = (shift?.salesBreakdown?.transactionCount || 0) > 0
  const isPreviousDay = Boolean(shift?.isPreviousDay)
  const canClose = !isProcessing && (hasSales || (isPreviousDay && shift?.status !== "CLOSED"))

  const categoryOptions = [{ id: "TODOS", name: "TODOS", parentId: null }, ...categories]

  const togglePaymentMethod = (method: string) => {
    if (method === "DEBT") {
      setPaymentMethod((prev) => (prev.includes("DEBT") ? [] : ["DEBT"]))
      return
    }

    setPaymentMethod((prev) => {
      if (prev.includes("DEBT")) return [method]
      if (prev.includes(method)) return prev.filter((item) => item !== method)
      return [...prev, method]
    })
  }

  const handleOpenShift = async () => {
    try {
      setIsProcessing(true)
      const opened = await posApi.openShift(storeId, parseFloat(startingCash), selectedRegisterId || undefined)
      setShift(opened)
      setShowOpenShift(false)
      alert.success("CAJA APERTURADA")
      await queryClient.invalidateQueries({ queryKey: ["pos-shift", storeId] })
    } catch (error: any) {
      alert.error(error?.message || "ERROR AL ABRIR CAJA")
    } finally {
      setIsProcessing(false)
    }
  }

  const addToCart = (product: Product) => {
    if (!shift || shift.status === "CLOSED") {
      alert.error("ABRA LA CAJA PRIMERO")
      return
    }
    if (product.stock <= 0) {
      alert.error("AGOTADO")
      return
    }

    const basePrice = Number(product.price)
    const taxRate = Number(product.taxRate || 0)
    const unitTax = unitTaxFrom(basePrice, taxRate)
    const unitTotal = basePrice + unitTax

    setCart((prev) => {
      const existing = prev.find((row) => row.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert.warning("STOCK INSUFICIENTE")
          return prev
        }
        const nextQuantity = existing.quantity + 1
        return prev.map((row) =>
          row.id === product.id
            ? {
                ...row,
                quantity: nextQuantity,
                price: round2(unitTotal * nextQuantity),
                taxAmount: round2(unitTax * nextQuantity),
              }
            : row,
        )
      }
      return [...prev, { ...product, quantity: 1, basePrice, taxAmount: unitTax, price: round2(unitTotal) }]
    })
    setSearchQuery("")
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== productId) return item
          const nextQuantity = Math.max(0, item.quantity + delta)
          if (nextQuantity > item.stock) {
            alert.warning("MAXIMO STOCK ALCANZADO")
            return item
          }
          const taxRate = Number(item.taxRate || 0)
          const unitTax = unitTaxFrom(item.basePrice, taxRate)
          const unitTotal = item.basePrice + unitTax
          return {
            ...item,
            quantity: nextQuantity,
            price: round2(unitTotal * nextQuantity),
            taxAmount: round2(unitTax * nextQuantity),
          }
        })
        .filter((item) => item.quantity > 0),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const handleAmountChange = (method: string, value: number) => {
    setAmounts((prev) => ({ ...prev, [method]: value }))
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert.error("INGRESE NOMBRE DEL CLIENTE")
      return
    }
    try {
      const res = await api.post("/customers", {
        ...newCustomer,
        document: newCustomer.document || null,
        email: newCustomer.email || null,
        phone: newCustomer.phone || null,
        address: newCustomer.address || null,
        storeId,
      })
      const created = res.data
      if (created?.id) {
        await queryClient.invalidateQueries({ queryKey: ["customers", storeId] })
        setSelectedCustomerId(created.id)
        alert.success("CLIENTE CREADO")
        setShowNewCustomerDialog(false)
        setNewCustomer({ name: "", document: "", email: "", phone: "", address: "", creditLimit: 0 })
        setCustomerSearch("")
      }
    } catch {
      alert.error("ERROR AL CREAR CLIENTE")
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (!shift || shift.status === "CLOSED") {
      alert.error("ABRA LA CAJA PRIMERO")
      return
    }
    if (!selectedCustomerId) {
      alert.error("DEBE SELECCIONAR UN CLIENTE PARA FACTURAR")
      return
    }

    const isDebt = paymentMethod.includes("DEBT")
    if (!isDebt && paymentMethod.length === 0) {
      alert.error("SELECCIONE METODO DE PAGO")
      return
    }

    if (isDebt && selectedCustomerId) {
      const customer = customers.find((row) => row.id === selectedCustomerId)
      const availableCredit = (customer?.creditLimit || 0) - (customer?.balance || 0)
      if (total > availableCredit) {
        alert.error(`CREDITO INSUFICIENTE. DISPONIBLE: $${availableCredit.toFixed(2)}`)
        return
      }
    }

    if (!isDebt && totalPaid < total) {
      alert.error("EL MONTO NO CUBRE EL TOTAL")
      return
    }

    const payloadItems = cart.map((item) => {
      const taxRate = Number(item.taxRate || 0)
      const unitTax = unitTaxFrom(item.basePrice, taxRate)
      return {
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.basePrice,
        taxRate,
        lineSubtotal: round2(item.basePrice * item.quantity),
        lineTax: round2(unitTax * item.quantity),
        lineTotal: item.price,
      }
    })

    try {
      setIsProcessing(true)
      const status = isDebt ? "PENDING" : "PAID"
      const sale = await createSaleMutation.mutateAsync({
        storeId,
        customerId: selectedCustomerId || undefined,
        items: payloadItems,
        paymentMethod,
        total,
        subtotal,
        taxTotal: taxAmount,
        amountPaid: isDebt ? 0 : totalPaid,
        change: !isDebt && change > 0 ? change : 0,
        status,
        shiftId: shift.id,
      })

      setLastSale({
        id: String(sale?.id || `SALE${Date.now()}`),
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          basePrice: item.basePrice * item.quantity,
          taxAmount: item.taxAmount,
        })),
        total,
      })
      setShowTicket(true)
    } catch {
      // handled in mutation
    } finally {
      setIsProcessing(false)
    }
  }

  if (showOpenShift || !shift) {
    const hasRegisters = registers.length > 0
    return (
      <div className="flex flex-1 h-full w-full bg-background text-foreground font-mono uppercase overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 border-4 border-destructive flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-black text-destructive mb-2">CAJA CERRADA</h1>
          <p className="text-[10px] text-muted-foreground mb-6 text-center max-w-xs">
            {!hasRegisters ? "NO HAY CAJAS CONFIGURADAS. CONTACTE AL ADMINISTRADOR." : "DEBE ABRIR LA CAJA PARA OPERAR."}
          </p>
          <div className="w-full max-w-[200px] space-y-3">
            {hasRegisters ? (
              <>
                <div>
                  <label className="text-[8px] text-muted-foreground block mb-1">CAJA</label>
                  <select
                    value={selectedRegisterId}
                    onChange={(e) => setSelectedRegisterId(e.target.value)}
                    className="h-10 w-full bg-card border border-border text-center text-lg font-black rounded-none"
                  >
                    {registers.map((register) => (
                      <option key={register.id} value={register.id}>
                        {register.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] text-muted-foreground block mb-1">EFECTIVO BASE ($)</label>
                  <Input
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    className="h-10 bg-card rounded-none border border-border text-center text-lg font-black"
                  />
                </div>
                <Button onClick={handleOpenShift} disabled={isProcessing} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm rounded-none">
                  {isProcessing ? "ABRIENDO..." : "ABRIR CAJA"}
                </Button>
              </>
            ) : (
              <Button disabled className="w-full h-12 bg-muted text-muted-foreground font-black text-sm rounded-none cursor-not-allowed">
                SIN CAJAS
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 h-full w-full bg-background text-foreground font-mono overflow-hidden">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background pt-2 pb-2">
          <h1 className="text-xl font-black text-primary tracking-widest">OPERACIONES</h1>
          <div className="flex items-center gap-2">
            <ReturnDialog storeId={storeId} />
            <button
              onClick={() => setShowCloseDialog(true)}
              disabled={!canClose}
              className="text-[10px] border border-destructive/30 text-destructive px-3 py-2 hover:bg-destructive/10 transition-colors rounded-none disabled:opacity-30"
            >
              CERRAR CAJA
            </button>
            <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/10 px-3 py-2">
              <div className="w-2 h-2 bg-primary animate-pulse rounded-none" />
              {isPreviousDay && <span className="text-destructive">ANTERIOR</span>}
              CAJA #{shift.id.slice(-4)}
            </div>
          </div>
        </div>

        <Input
          placeholder="BUSCAR PRODUCTO O ESCANEAR SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 bg-card rounded-none border border-border text-xs"
          autoFocus
        />

        <div className="flex gap-1 overflow-x-auto">
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 text-[10px] font-bold border rounded-none whitespace-nowrap ${
                selectedCategory === cat.id ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {cat.parentId ? `↳ ${cat.name}` : cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-0">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="group relative bg-card border border-border hover:border-primary transition-all cursor-pointer flex flex-col p-1 rounded-none h-[140px] justify-between m-[1px]"
            >
              <div className="flex items-center justify-center">
                <CircleDollarSign className="w-4 h-4 text-border/50 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-center line-clamp-2 leading-tight">{product.name}</p>
                <p className="text-[14px] font-black text-center text-primary">
                  ${(product.price).toLocaleString()}
                </p>
                <p className="text-[8px] text-center text-muted-foreground">Stock: {product.stock}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">NO HAY PRODUCTOS</p>
          </div>
        )}

        {totalProductPages > 1 && <Pagination currentPage={productsPage} totalPages={totalProductPages} onPageChange={setProductsPage} />}
      </div>

      <div className="w-[320px] sticky top-0 flex flex-col bg-card border-l border-border h-[738px] overflow-y-auto">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="CEDULA - ENTER"
                className="w-full h-8 bg-background border border-border px-2 text-xs rounded-none uppercase"
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && customerSearch.trim()) {
                    e.preventDefault()
                    const queryDocument = customerSearch.trim()
                    const found = customers.find((row) => (row.document || "").trim() === queryDocument)
                    if (found) {
                      setSelectedCustomerId(found.id)
                    } else {
                      const wantsCreate = await confirm({
                        title: "CLIENTE NO ENCONTRADO",
                        description: "¿QUIERE CREARLO?",
                        confirmText: "SI",
                        cancelText: "NO",
                      })
                      if (wantsCreate) {
                        setNewCustomer((prev) => ({ ...prev, document: queryDocument }))
                        setShowNewCustomerDialog(true)
                      } else {
                        alert.info("NO SE CREO EL CLIENTE")
                      }
                    }
                  }
                }}
              />
            </div>
            {paymentMethod.includes("DEBT") && (
              <button
                onClick={() => {
                  setNewCustomer((prev) => ({ ...prev, document: customerSearch.trim() }))
                  setShowNewCustomerDialog(true)
                }}
                className="h-8 px-2 text-[10px] bg-primary text-primary-foreground rounded-none"
              >
                + NUEVO
              </button>
            )}
          </div>

          {selectedCustomerId && (
            <div className="flex items-center justify-between bg-primary/10 px-2 py-1 mt-2">
              <span className="text-[10px] font-bold">{customers.find((row) => row.id === selectedCustomerId)?.name}</span>
              <button onClick={() => setSelectedCustomerId("")} className="text-[10px] text-destructive">
                CAMBIAR
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
              <Package className="w-6 h-6 mb-2" />
              <p className="text-[10px] font-bold">CARRITO VACIO</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-background border-l-2 border-primary/50 p-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-bold truncate">{item.name}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-primary w-6 h-6 flex items-center justify-center border border-border text-xs font-bold">
                    -
                  </button>
                  <span className="text-[10px] font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-primary w-6 h-6 flex items-center justify-center border border-border text-xs font-bold">
                    +
                  </button>
                </div>
                <p className="text-[10px] font-black text-primary w-16 text-right">${item.price.toLocaleString()}</p>
                <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border/50">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => togglePaymentMethod("CASH")}
              disabled={paymentMethod.includes("DEBT")}
              className={`h-10 text-[10px] flex items-center justify-center border rounded-none font-bold ${
                paymentMethod.includes("CASH") ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"
              } ${paymentMethod.includes("DEBT") ? "opacity-30" : ""}`}
            >
              EFECTIVO
            </button>
            <button
              onClick={() => togglePaymentMethod("NEQUI")}
              disabled={paymentMethod.includes("DEBT")}
              className={`h-10 text-[10px] flex items-center justify-center border rounded-none font-bold ${
                paymentMethod.includes("NEQUI") ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"
              } ${paymentMethod.includes("DEBT") ? "opacity-30" : ""}`}
            >
              NEQUI
            </button>
            <button
              onClick={() => togglePaymentMethod("CARD")}
              disabled={paymentMethod.includes("DEBT")}
              className={`h-10 text-[10px] flex items-center justify-center border rounded-none font-bold ${
                paymentMethod.includes("CARD") ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"
              } ${paymentMethod.includes("DEBT") ? "opacity-30" : ""}`}
            >
              TARJETA
            </button>
          </div>

          <button
            onClick={() => togglePaymentMethod("DEBT")}
            disabled={paymentMethod.length > 1}
            className={`w-full h-10 text-[10px] flex items-center justify-center border rounded-none font-bold mb-3 ${
              paymentMethod.includes("DEBT") ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"
            }`}
          >
            FIADO (CREDITO)
          </button>

          {paymentMethod.some((method) => method !== "DEBT") && (
            <div className="space-y-2 mb-2">
              {paymentMethod
                .filter((method) => method !== "DEBT")
                .map((method) => (
                  <div key={method} className="flex items-center gap-2">
                    <span className="text-[10px] w-20 uppercase">{method === "CASH" ? "Efectivo" : method === "NEQUI" ? "NEQUI" : "Tarjeta"}:</span>
                    <input
                      type="number"
                      value={amounts[method] || ""}
                      onChange={(e) => handleAmountChange(method, parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      className="flex-1 h-9 bg-background border border-border rounded-none px-2 text-xs"
                    />
                  </div>
                ))}
            </div>
          )}

          {change > 0 && (
            <div className="bg-primary/10 border border-primary/30 p-2 rounded-none">
              <div className="flex justify-between text-sm font-bold text-primary uppercase">
                <span>CAMBIO:</span>
                <span>${change.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="space-y-1 border-t border-border/50 pt-2 mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>SUBTOTAL:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>IVA:</span>
              <span>${taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-primary">
              <span>TOTAL:</span>
              <span className="text-primary">${total.toLocaleString()}</span>
            </div>
          </div>

          <Button onClick={handleCheckout} disabled={cart.length === 0 || isProcessing} className="w-full h-12 bg-primary text-primary-foreground font-black text-sm rounded-none">
            {isProcessing ? "PROCESANDO..." : "COMPLETAR VENTA"}
          </Button>
        </div>
      </div>

      <CloseShiftDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        shift={shift}
        storeId={storeId}
        registerId={selectedRegisterId || undefined}
        onClosed={async () => {
          await queryClient.invalidateQueries({ queryKey: ["pos-shift", storeId] })
        }}
      />

      <TicketDialog
        open={showTicket}
        onClose={() => setShowTicket(false)}
        items={lastSale?.items || []}
        subtotal={subtotal}
        totalTaxAmount={taxAmount}
        total={lastSale?.total || total}
        paymentMethod={Array.isArray(paymentMethod) ? paymentMethod.join("+") : paymentMethod}
        storeName={storeName}
        customerName={selectedCustomerId ? customers.find((row) => row.id === selectedCustomerId)?.name : undefined}
        saleId={lastSale?.id}
      />

      {showNewCustomerDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border p-4 w-[400px] space-y-3">
            <h3 className="font-bold uppercase text-sm">NUEVO CLIENTE</h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">DOCUMENTO*</label>
                <input
                  value={newCustomer.document}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, document: e.target.value }))}
                  placeholder="CEDULA/NIT"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none uppercase"
                />
              </div>

              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">NOMBRE*</label>
                <input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="NOMBRE COMPLETO"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none uppercase"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">EMAIL</label>
                <input
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="EMAIL"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">TELEFONO</label>
                <input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="3001234567"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[9px] text-muted-foreground block mb-1">DIRECCION</label>
                <input
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="DIRECCION"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none uppercase"
                />
              </div>

              <div>
                <label className="text-[9px] text-muted-foreground block mb-1">LIMITE CREDITO ($)</label>
                <input
                  type="number"
                  value={newCustomer.creditLimit || ""}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full h-9 bg-background border border-border px-2 text-xs rounded-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => setShowNewCustomerDialog(false)} className="flex-1 h-10 border border-border text-xs rounded-none">
                CANCELAR
              </Button>
              <Button onClick={handleCreateCustomer} disabled={!newCustomer.name} className="flex-1 h-10 bg-primary text-primary-foreground font-bold text-xs rounded-none">
                CREAR
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
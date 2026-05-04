import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { alert } from "@/lib/alert"
import { posApi } from "@/api/pos"
import { useAuth } from "@/context/AuthContext"
import { useConfirm } from "@/context/ConfirmContext"
import type { SaleLookup } from "@/components/pos/types"

const RETURN_REASONS = [
  "PRODUCTO DANADO",
  "NO FUNCIONA",
  "NO ERA LO QUE QUERIA",
  "TALLA/DISENO INCORRECTO",
  "OTRO",
]

export function ReturnDialog({ storeId }: { storeId: string }) {
  const { user } = useAuth()
  const { confirm } = useConfirm()
  const [open, setOpen] = useState(false)
  const [saleId, setSaleId] = useState("")
  const [sale, setSale] = useState<SaleLookup | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([])
  const [reason, setReason] = useState("")
  const [refundMethod, setRefundMethod] = useState<"CASH" | "CREDIT">("CASH")
  const roleName = String(user?.role || user?.stores?.[0]?.customRole?.name || "").trim().toLowerCase()
  const isAdmin = roleName === "administrador" || roleName === "admin"

  const fetchSale = async (id: string) => {
    try {
      const normalizedSearch = String(id || "").trim().replace(/^#/, "")
      if (!normalizedSearch) {
        alert.error("INGRESE ID O NUMERO DE TICKET")
        return
      }

      const data = await posApi.getSaleForReturn(normalizedSearch, storeId)
      const validItems = Array.isArray(data?.items) ? data.items : []
      const validId = data?.id ? String(data.id) : ""

      if (data && validId && validItems.length > 0) {
        const normalizedSale: SaleLookup = {
          ...data,
          id: validId,
          items: validItems,
        }
        setSale(normalizedSale)
        setSelectedItems(validItems.map((item) => ({ productId: item.productId, quantity: item.quantity })))
      } else {
        alert.error("VENTA NO ENCONTRADA")
      }
    } catch {
      alert.error("ERROR AL BUSCAR VENTA")
    }
  }

  const handleQuantityChange = (productId: string, qty: number) => {
    const item = sale?.items.find((row) => row.productId === productId)
    if (!item || qty > item.quantity || qty < 0) return
    setSelectedItems((prev) => prev.map((row) => (row.productId === productId ? { ...row, quantity: qty } : row)))
  }

  const handleReturn = async () => {
    if (!isAdmin) {
      alert.error("SOLO ADMINISTRADOR PUEDE HACER DEVOLUCIONES")
      return
    }

    if (!sale || selectedItems.length === 0 || !reason) {
      alert.error("COMPLETE TODOS LOS CAMPOS")
      return
    }

    const itemsToReturn = selectedItems.filter((item) => item.quantity > 0)
    if (itemsToReturn.length === 0) {
      alert.error("SELECCIONE AL MENOS UN PRODUCTO")
      return
    }

    const confirmed = await confirm({
      title: "CONFIRMAR DEVOLUCION",
      description: `VENTA #${String(sale.id || "").slice(-6) || "N/A"} | ITEMS: ${itemsToReturn.length} | TOTAL: $${returnTotal.toLocaleString()}`,
      confirmText: "DEVOLVER",
      cancelText: "CANCELAR",
      variant: "destructive",
    })

    if (!confirmed) return

    setLoading(true)
    try {
      const normalizedItems = itemsToReturn.map((item) => {
        const saleItem = sale.items.find((row) => row.productId === item.productId)
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: saleItem?.price || 0,
        }
      })

      await posApi.createSaleReturn(sale.id, normalizedItems, reason, refundMethod)
      alert.success("DEVOLUCION PROCESADA")
      setOpen(false)
      setSaleId("")
      setSale(null)
      setSelectedItems([])
      setReason("")
    } catch (error: any) {
      alert.error(error?.message || "ERROR AL PROCESAR DEVOLUCION")
    } finally {
      setLoading(false)
    }
  }

  const returnTotal = selectedItems.reduce((sum, item) => {
    const saleItem = sale?.items.find((row) => row.productId === item.productId)
    return sum + (saleItem ? saleItem.price * item.quantity : 0)
  }, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            disabled={!isAdmin}
            title={!isAdmin ? "SOLO ADMINISTRADOR" : "DEVOLVER"}
            className="text-[10px] border border-destructive/30 text-destructive px-3 py-2 hover:bg-destructive/10 transition-colors rounded-none disabled:opacity-30"
          >
            DEVOLVER
          </button>
        }
      />
      <DialogContent className="sm:max-w-[600px] rounded-none border border-border bg-background">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest font-bold text-primary">DEVOLUCION DE VENTA</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="ID O #TICKET (ej. abc123 o #12ab3c)"
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              className="flex-1 uppercase"
            />
            <Button onClick={() => fetchSale(saleId)} className="rounded-none uppercase" disabled={!saleId}>
              BUSCAR
            </Button>
          </div>

          {sale && (
            <>
              <div className="border border-border p-3 rounded-none">
                <div className="text-xs uppercase text-muted-foreground mb-2">
                  VENTA #{String(sale.id || "").slice(-6) || "N/A"} - ${Number(sale.total || 0).toLocaleString()}
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {sale.items.map((item) => {
                    const selected = selectedItems.find((row) => row.productId === item.productId)
                    const qty = selected?.quantity || 0
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="uppercase">{item.product?.name || item.productId}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">x{item.quantity}</span>
                          <Input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={qty}
                            onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value, 10) || 0)}
                            className="w-16 h-7 text-center rounded-none"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-muted-foreground block mb-1">MOTIVO</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-10 border border-border bg-card px-3 rounded-none text-xs uppercase"
                >
                  <option value="">SELECCIONAR MOTIVO</option>
                  {RETURN_REASONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-muted-foreground block mb-1">REEMBOLSO</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as "CASH" | "CREDIT")}
                  className="w-full h-10 border border-border bg-card px-3 rounded-none text-xs uppercase"
                >
                  <option value="CASH">EFECTIVO</option>
                  <option value="CREDIT">CREDITO A CUENTA</option>
                </select>
              </div>

              <div className="border border-primary p-3 rounded-none bg-primary/10">
                <div className="text-xs uppercase text-muted-foreground">TOTAL A DEVOLVER</div>
                <div className="text-2xl font-bold text-primary">${returnTotal.toLocaleString()}</div>
              </div>

              <Button
                onClick={handleReturn}
                disabled={loading || !reason || returnTotal === 0}
                className="w-full rounded-none uppercase font-bold h-12 bg-destructive hover:bg-destructive/90"
              >
                {loading ? "PROCESANDO..." : "CONFIRMAR DEVOLUCION"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

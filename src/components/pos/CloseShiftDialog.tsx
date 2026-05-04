import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { alert } from "@/lib/alert"
import { posApi } from "@/api/pos"
import type { Shift } from "@/components/pos/types"

type ReturnInfo = {
  id: string
  total: number
  paymentType?: string
  reason?: string | null
  createdAt: Date | string
}

type CloseShiftDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift: Shift | null
  storeId: string
  registerId?: string
  onClosed?: () => Promise<void> | void
}

export function CloseShiftDialog({
  open,
  onOpenChange,
  shift,
  storeId,
  registerId,
  onClosed,
}: CloseShiftDialogProps) {
  const [actualCash, setActualCash] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [shiftData, setShiftData] = useState<Shift | null>(shift)
  const [closeResult, setCloseResult] = useState<{
    saleReturns: ReturnInfo[]
    supplierReturns: ReturnInfo[]
  } | null>(null)

  useEffect(() => {
    if (!open) return
    setCloseResult(null)
    posApi.getCurrentShift(storeId, registerId).then((data) => {
      if (!data) return
      setShiftData(data)
      setActualCash(String(data.expectedCash ?? data.startingCash))
    })
  }, [open, storeId, registerId])

  if (!shiftData) return null

  const cashSales = shiftData.salesBreakdown?.cashSales || 0
  const expectedCash = shiftData.startingCash + cashSales
  const difference = parseFloat(actualCash || "0") - expectedCash

  const handleClose = async () => {
    if (!shiftData?.id) return

    const actual = parseFloat(actualCash)
    if (Number.isNaN(actual) || actual < 0) {
      alert.error("MONTO INVALIDO")
      return
    }

    try {
      setIsProcessing(true)
      const result = await posApi.closeShift(shiftData.id, actual)
      setCloseResult({
        saleReturns: result.saleReturns || [],
        supplierReturns: result.supplierReturns || [],
      })
      alert.success("CIERRE REGISTRADO")
      await onClosed?.()
    } catch (error: any) {
      alert.error(error?.message || "ERROR AL CERRAR")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setCloseResult(null)
    onOpenChange(false)
  }

  const totalSaleReturns = closeResult?.saleReturns.reduce((sum, row) => sum + row.total, 0) || 0
  const totalSupplierReturns = closeResult?.supplierReturns.reduce((sum, row) => sum + row.total, 0) || 0

  if (closeResult) {
    return (
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCloseResult(null)
            onOpenChange(false)
          }
        }}
      >
        <DialogContent className="rounded-none border border-border bg-background max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-primary flex items-center gap-2">
              <span className="h-2 w-2 bg-primary inline-block"></span>
              CIERRE REGISTRADO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-card border border-border p-3 rounded-none text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">DIFERENCIA</div>
              <div className={`text-2xl font-black ${difference >= 0 ? "text-primary" : "text-destructive"}`}>
                {difference >= 0 ? "+" : ""}
                {difference.toFixed(2)}
              </div>
            </div>

            {closeResult.saleReturns.length > 0 ? (
              <div className="border border-destructive/30 p-3 rounded-none">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2">DEVOLUCIONES DE VENTAS</h3>
                <div className="space-y-1">
                  {closeResult.saleReturns.map((row) => (
                    <div key={row.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        #{row.id.slice(-4)} {row.reason ? `- ${row.reason}` : ""}
                      </span>
                      <span className="font-black text-destructive">-${row.total.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-destructive/20 pt-1 mt-1 flex justify-between text-xs">
                    <span className="uppercase font-bold">TOTAL</span>
                    <span className="font-black text-destructive">-${totalSaleReturns.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-muted/20 p-3 rounded-none">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">DEVOLUCIONES DE VENTAS</h3>
                <div className="text-xs text-muted-foreground">0.00</div>
              </div>
            )}

            {closeResult.supplierReturns.length > 0 ? (
              <div className="border border-orange-500/30 p-3 rounded-none">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">DEVOLUCIONES A PROVEEDORES</h3>
                <div className="space-y-1">
                  {closeResult.supplierReturns.map((row) => (
                    <div key={row.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        #{row.id.slice(-4)} {row.reason ? `- ${row.reason}` : ""}
                      </span>
                      <span className="font-black text-orange-500">-${row.total.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-orange-500/20 pt-1 mt-1 flex justify-between text-xs">
                    <span className="uppercase font-bold">TOTAL</span>
                    <span className="font-black text-orange-500">-${totalSupplierReturns.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-muted/20 p-3 rounded-none">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">DEVOLUCIONES A PROVEEDORES</h3>
                <div className="text-xs text-muted-foreground">0.00</div>
              </div>
            )}

            <Button onClick={handleCancel} className="w-full rounded-none uppercase tracking-widest font-bold h-10 bg-primary hover:bg-primary/90">
              ACEPTAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border border-border bg-background max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            <span className="h-2 w-2 bg-primary inline-block"></span>
            CIERRE DE CAJA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-card border border-border p-3 rounded-none">
            <div className="flex justify-between text-[10px] uppercase tracking-widest">
              <span className="text-muted-foreground">TURNO</span>
              <span className="font-black text-primary">#{shiftData.id.slice(-6)}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-widest mt-1">
              <span className="text-muted-foreground">FECHA</span>
              <span className="font-bold">{new Date(shiftData.startTime).toLocaleDateString("es-CO")}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-widest mt-1">
              <span className="text-muted-foreground">ABRIO</span>
              <span className="font-bold">{shiftData.userName || "Usuario"}</span>
            </div>
          </div>

          <div className="border border-border p-3 rounded-none">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">VENTAS DEL DIA</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="uppercase text-muted-foreground">Efectivo</span>
                <span className="font-black text-foreground">${shiftData.salesBreakdown?.cashSales.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="uppercase text-muted-foreground">Tarjeta</span>
                <span className="font-black text-foreground">${shiftData.salesBreakdown?.cardSales.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="uppercase text-muted-foreground">Transferencia</span>
                <span className="font-black text-foreground">${shiftData.salesBreakdown?.transferSales.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="uppercase text-muted-foreground">Fiado (Pendiente)</span>
                <span className="font-black text-destructive">${shiftData.salesBreakdown?.pendingSales.toFixed(2) || "0.00"}</span>
              </div>
              <div className="border-t border-border mt-2 pt-2 flex justify-between text-xs">
                <span className="uppercase font-bold">TOTAL</span>
                <span className="font-black text-primary">${shiftData.salesBreakdown?.totalSales.toFixed(2) || "0.00"}</span>
              </div>
              <div className="text-[9px] text-muted-foreground text-right">{shiftData.salesBreakdown?.transactionCount || 0} transaccion(es)</div>
            </div>
          </div>

          <div className="bg-card border border-border p-3 rounded-none">
            <div className="flex justify-between text-xs mb-2">
              <span className="uppercase text-muted-foreground">Base Inicial</span>
              <span className="font-bold">${shiftData.startingCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs mb-2">
              <span className="uppercase text-muted-foreground">+ Efectivo Ventas</span>
              <span className="font-bold">${shiftData.salesBreakdown?.cashSales.toFixed(2) || "0.00"}</span>
            </div>
            <div className="border-t border-border mt-2 pt-2 flex justify-between text-xs">
              <span className="uppercase font-bold">ESPERADO</span>
              <span className="font-black text-primary">${expectedCash.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">DINERO CONTADO ($)</label>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              className="w-full h-12 bg-card border border-border rounded-none px-3 text-center text-lg font-black"
              placeholder="0.00"
            />
          </div>

          <div
            className={`border p-3 rounded-none ${
              difference === 0
                ? "border-primary/30 bg-primary/5"
                : difference > 0
                  ? "border-primary/50 bg-primary/10"
                  : "border-destructive/50 bg-destructive/10"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">DIFERENCIA</span>
              <span
                className={`text-xl font-black ${
                  difference === 0 ? "text-primary" : difference > 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {difference >= 0 ? "+" : ""}
                {difference.toFixed(2)}
              </span>
            </div>
            {difference !== 0 && (
              <p className="text-[9px] uppercase text-muted-foreground mt-1">{difference > 0 ? "SOBRANTE" : "FALTANTE"}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1 rounded-none uppercase tracking-widest font-bold h-10">
              CANCELAR
            </Button>
            <Button onClick={handleClose} disabled={isProcessing} className="flex-1 rounded-none uppercase tracking-widest font-bold h-10 bg-primary hover:bg-primary/90">
              {isProcessing ? "CERRANDO..." : "CONFIRMAR"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import api from "@/lib/api"
import type {
  CashRegister,
  PosCreateSalePayload,
  SaleLookup,
  SaleReturnItem,
  Shift,
  ShiftCloseResult,
} from "@/components/pos/types"

function mapShift(raw: any): Shift {
  return {
    id: String(raw?.id ?? ""),
    status: raw?.status ?? "OPEN",
    startingCash: Number(raw?.startingCash ?? 0),
    expectedCash: raw?.expectedCash == null ? null : Number(raw.expectedCash),
    actualCash: raw?.actualCash == null ? null : Number(raw.actualCash),
    difference: raw?.difference == null ? null : Number(raw.difference),
    startTime: raw?.startTime ?? new Date().toISOString(),
    endTime: raw?.endTime ?? null,
    userName: raw?.userName ?? raw?.openedByUser?.name ?? null,
    closedByUserName: raw?.closedByUserName ?? raw?.closedByUser?.name ?? null,
    cashRegisterName: raw?.cashRegisterName ?? raw?.cashRegister?.name ?? null,
    salesBreakdown: raw?.salesBreakdown
      ? {
          cashSales: Number(raw.salesBreakdown.cashSales ?? 0),
          cardSales: Number(raw.salesBreakdown.cardSales ?? 0),
          transferSales: Number(raw.salesBreakdown.transferSales ?? 0),
          pendingSales: Number(raw.salesBreakdown.pendingSales ?? 0),
          totalSales: Number(raw.salesBreakdown.totalSales ?? 0),
          transactionCount: Number(raw.salesBreakdown.transactionCount ?? 0),
        }
      : undefined,
    isPreviousDay: Boolean(raw?.isPreviousDay),
  }
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export const posApi = {
  async getRegisters(storeId: string): Promise<CashRegister[]> {
    const byStore = await api.get(`/store/${storeId}/registers`)
    return safeArray<CashRegister>(byStore.data)
  },

  async getCurrentShift(storeId: string, registerId?: string): Promise<Shift | null> {
    if (registerId) {
      try {
        const registerShift = await api.get(`/registers/${registerId}/current-shift`)
        if (registerShift.data) return mapShift(registerShift.data)
      } catch {
        // Fallback to store-level endpoint.
      }
    }

    try {
      const shiftRes = await api.get(`/registers/shifts/current?storeId=${storeId}`)
      if (shiftRes.data) return mapShift(shiftRes.data)
    } catch {
      // Fallback for backend variants.
    }

    try {
      const shiftRes = await api.get(`/cash-shifts/current?storeId=${storeId}`)
      if (shiftRes.data) return mapShift(shiftRes.data)
    } catch {
      return null
    }

    return null
  },

  async openShift(storeId: string, startingCash: number, registerId?: string): Promise<Shift> {
    if (registerId) {
      try {
        const byRegister = await api.post(`/registers/${registerId}/open`, { startingCash })
        return mapShift(byRegister.data)
      } catch {
        // Fallback to store-level endpoint.
      }
    }

    const byStore = await api.post(`/cash-shifts/open`, { storeId, startingCash, registerId })
    return mapShift(byStore.data)
  },

  async closeShift(shiftId: string, actualCash: number): Promise<ShiftCloseResult> {
    try {
      const res = await api.post(`/registers/${shiftId}/close`, { actualCash })
      return res.data
    } catch {
      const res = await api.post(`/cash-shifts/${shiftId}/close`, { actualCash })
      return res.data
    }
  },

  async createSale(payload: PosCreateSalePayload): Promise<any> {
    const paymentMethod = payload.paymentMethod.join(",")
    const items = payload.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      // Keep compatibility with existing backend contract.
      price: item.unitPrice,
      subtotal: item.lineTotal,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      taxAmount: item.lineTax,
      total: item.lineTotal,
    }))

    const res = await api.post("/sales", {
      storeId: payload.storeId,
      customerId: payload.customerId ?? null,
      items,
      paymentMethod,
      total: payload.total,
      subtotal: payload.subtotal,
      taxTotal: payload.taxTotal,
      amountPaid: payload.amountPaid,
      change: payload.change,
      status: payload.status,
      shiftId: payload.shiftId,
    })

    return res.data
  },

  async getSaleForReturn(saleId: string, storeId: string): Promise<SaleLookup | null> {
    try {
      const res = await api.get(`/sales/${saleId}?storeId=${storeId}`)
      return res.data ?? null
    } catch {
      try {
        const res = await api.get(`/returns/sale/${saleId}?storeId=${storeId}`)
        return res.data ?? null
      } catch {
        return null
      }
    }
  },

  async createSaleReturn(
    originalSaleId: string,
    items: SaleReturnItem[],
    reason: string,
    refundMethod: "CASH" | "CREDIT",
  ): Promise<any> {
    try {
      const res = await api.post("/sales/returns", {
        originalSaleId,
        items,
        reason,
        refundMethod,
      })
      return res.data
    } catch {
      const res = await api.post(`/sales/${originalSaleId}/return`, {
        items,
        reason,
        refundMethod,
      })
      return res.data
    }
  },
}

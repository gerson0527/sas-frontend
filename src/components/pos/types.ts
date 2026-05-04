export type Product = {
  id: string
  name: string
  sku: string | null
  price: number
  stock: number
  categoryId: string | null
  category?: { name: string } | null
  taxRate?: number
}

export type Customer = {
  id: string
  name: string
  document: string | null
  balance: number
  creditLimit: number
}

export type Category = {
  id: string
  name: string
  parentId?: string | null
}

export type SalesBreakdown = {
  cashSales: number
  cardSales: number
  transferSales: number
  pendingSales: number
  totalSales: number
  transactionCount: number
}

export type CashRegister = {
  id: string
  name: string
  location?: string | null
}

export type Shift = {
  id: string
  status: "OPEN" | "CLOSED" | string
  startingCash: number
  expectedCash: number | null
  actualCash: number | null
  difference: number | null
  startTime: string | Date
  endTime?: string | Date | null
  userName?: string | null
  closedByUserName?: string | null
  cashRegisterName?: string | null
  salesBreakdown?: SalesBreakdown
  isPreviousDay?: boolean
}

export type ShiftCloseResult = {
  id?: string
  status?: string
  saleReturns?: Array<{
    id: string
    total: number
    paymentType?: string
    reason?: string | null
    createdAt: Date | string
  }>
  supplierReturns?: Array<{
    id: string
    total: number
    paymentType?: string
    reason?: string | null
    createdAt: Date | string
  }>
}

export type SaleReturnItem = {
  productId: string
  quantity: number
  price: number
}

export type PosSaleItemPayload = {
  productId: string
  quantity: number
  unitPrice: number
  taxRate: number
  lineSubtotal: number
  lineTax: number
  lineTotal: number
}

export type PosCreateSalePayload = {
  storeId: string
  customerId?: string | null
  items: PosSaleItemPayload[]
  paymentMethod: string[]
  total: number
  subtotal: number
  taxTotal: number
  amountPaid: number
  change: number
  status: "PAID" | "PENDING"
  shiftId?: string
}

export type SaleLookupItem = {
  id: string
  productId: string
  quantity: number
  price: number
  product?: { name?: string }
}

export type SaleLookup = {
  id: string
  total: number
  createdAt: Date | string
  items: SaleLookupItem[]
  shiftId?: string
  customer?: { name?: string }
}
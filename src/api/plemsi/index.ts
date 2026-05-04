import api from "@/lib/api";

export const plemsiApi = {
  sendInvoice: async (saleId: string) => {
    const res = await api.post("/plemsi/invoices", { saleId });
    return res.data;
  },
  getInvoiceStatus: async (saleId: string) => {
    const res = await api.get(`/plemsi/invoices?saleId=${encodeURIComponent(saleId)}`);
    return res.data;
  },
};

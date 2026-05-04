import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/api/sales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SalesPage() {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales', dateFilter],
    queryFn: () => salesApi.getAll('default', { startDate: dateFilter.startDate, endDate: dateFilter.endDate }),
  });

  const filteredSales = sales.filter((s: any) =>
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalSales = filteredSales.reduce((acc: number, s: any) => acc + (s.total || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Ventas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Número de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${filteredSales.length > 0 ? Math.round(totalSales / filteredSales.length).toLocaleString() : 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar por ID o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Input type="date" value={dateFilter.startDate} onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })} className="w-40" />
            <Input type="date" value={dateFilter.endDate} onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })} className="w-40" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7}>Cargando...</TableCell></TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow><TableCell colSpan={7}>No hay ventas</TableCell></TableRow>
              ) : (
                filteredSales.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">{sale.id.slice(0, 8)}</TableCell>
                    <TableCell>{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>{sale.customerName || 'Venta General'}</TableCell>
                    <TableCell>{sale.paymentMethod || '-'}</TableCell>
                    <TableCell className="font-medium">${sale.total?.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        sale.status === 'PAID' ? 'bg-green-500/20 text-green-500' :
                        sale.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {sale.status === 'PAID' ? 'Pagado' : sale.status === 'PENDING' ? 'Pendiente' : 'Cancelado'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Ver</Button>
                        {sale.status === 'PAID' && (
                          <Button variant="outline" size="sm">Imprimir</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
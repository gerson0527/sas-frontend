import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/api/team';
import { rolesApi } from '@/api/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
      
      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>
        
        <TabsContent value="roles">
          <RolesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TeamSettings() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', roleId: '' });

  const { data: team = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => teamApi.getAll('default'),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll('default'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => teamApi.create({ ...data, storeId: 'default' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', roleId: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Equipo</CardTitle>
        <Button onClick={() => setIsModalOpen(true)}>Nuevo Usuario</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Cargando...</TableCell></TableRow>
            ) : team.length === 0 ? (
              <TableRow><TableCell colSpan={5}>No hay usuarios</TableCell></TableRow>
            ) : (
              team.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.role?.name || 'Sin rol'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${member.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {member.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(member.id)}>Eliminar</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nuevo Usuario</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña</label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select className="w-full p-2 border rounded" value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}>
                  <option value="">Seleccionar rol</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}

function RolesSettings() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{ name: string; description: string; permissions: string[] }>({ name: '', description: '', permissions: [] });

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll('default'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => rolesApi.create({ ...data, storeId: 'default' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
      setFormData({ name: '', description: '', permissions: [] });
    },
  });

  const allPermissions = [
    'dashboard', 'pos', 'products', 'categories', 'customers', 
    'suppliers', 'sales', 'returns', 'reports', 'finance', 'settings'
  ];

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Roles</CardTitle>
        <Button onClick={() => setIsModalOpen(true)}>Nuevo Rol</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}>Cargando...</TableCell></TableRow>
            ) : roles.length === 0 ? (
              <TableRow><TableCell colSpan={4}>No hay roles</TableCell></TableRow>
            ) : (
              roles.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(role.permissions || []).map((p: any, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-muted rounded text-xs">{typeof p === 'string' ? p : p?.name}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Editar</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nuevo Rol</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Permisos</label>
                <div className="flex flex-wrap gap-2">
                  {allPermissions.map(perm => (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePermission(perm)}
                      className={`px-3 py-1 rounded text-sm border ${formData.permissions.includes(perm) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      {perm}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
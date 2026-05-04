import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { storeApi } from '@/api/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { alert } from '@/lib/alert';

export default function StoreSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: () => storeApi.create({ name: name.trim() }),
    onSuccess: async (data: any) => {
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['store'] });
      alert.success(
        data?.adminRoleName && data?.cashierRoleName && data?.registerName
          ? `ESPACIO CREADO: ${data.adminRoleName}, ${data.cashierRoleName}, ${data.registerName}`
          : 'ESPACIO CREADO',
      );
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      alert.error(error?.response?.data?.error || error?.message || 'ERROR AL CREAR TIENDA');
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      alert.error('INGRESE NOMBRE DE LA TIENDA');
      return;
    }
    await createMutation.mutateAsync();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-xl border border-border bg-card/30 rounded-none p-6">
        <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">CREAR ESPACIO DE NEGOCIO</h1>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">
          Antes de ingresar al dashboard debes registrar tu negocio.
        </p>
        <div className="mt-4 border border-border bg-background/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Al crear se configura automaticamente:
          </p>
          <p className="text-[10px] uppercase tracking-wider text-foreground mt-1">- Rol Administrador (tu usuario)</p>
          <p className="text-[10px] uppercase tracking-wider text-foreground">- Rol Caja</p>
          <p className="text-[10px] uppercase tracking-wider text-foreground">- Caja Principal asignada a ti</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              Nombre del negocio
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Negocio"
              className="h-10 rounded-none border-border bg-background"
            />
          </div>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full h-10 rounded-none uppercase tracking-widest font-bold"
          >
            {createMutation.isPending ? 'CREANDO...' : 'CREAR Y CONTINUAR'}
          </Button>
        </form>
      </div>
    </div>
  );
}

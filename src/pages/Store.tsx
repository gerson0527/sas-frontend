import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { storeApi } from '@/api/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { alert } from '@/lib/alert';

export default function StorePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const storeId = (user as any)?.stores?.[0]?.store?.id as string | undefined;
  const hasStore = Boolean(storeId);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    nit: '',
    phone: '',
    address: '',
    city: '',
    department: '',
  });

  const { data: store, isLoading } = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => storeApi.get(storeId as string),
    enabled: hasStore,
  });

  useEffect(() => {
    if (!store) return;
    setFormData({
      name: store.name || '',
      legalName: store.legalName || '',
      nit: store.nit || '',
      phone: store.phone || '',
      address: store.address || '',
      city: store.city || '',
      department: store.department || '',
    });
  }, [store]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => storeApi.update(storeId as string, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['store', storeId] });
      setIsEditing(false);
      alert.success('TIENDA ACTUALIZADA');
    },
    onError: (error: any) => {
      alert.error(error?.response?.data?.error || error?.message || 'ERROR AL ACTUALIZAR TIENDA');
    },
  });

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (!hasStore) {
    return <Navigate to="/store-setup" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">CONFIGURACION DE TIENDA</h1>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
            Gestionar datos comerciales y fiscales de la tienda
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setIsEditing((value) => !value)}
          className="rounded-none uppercase tracking-widest text-xs font-bold"
        >
          {isEditing ? 'CANCELAR' : 'EDITAR'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-xs uppercase tracking-widest text-muted-foreground">CARGANDO...</div>
      ) : (
        <form onSubmit={handleUpdate} className="border border-border bg-card/30 rounded-none p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre" value={formData.name} disabled={!isEditing} onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))} />
            <Field label="Nombre legal" value={formData.legalName} disabled={!isEditing} onChange={(value) => setFormData((prev) => ({ ...prev, legalName: value }))} />
            <Field label="NIT" value={formData.nit} disabled={!isEditing} onChange={(value) => setFormData((prev) => ({ ...prev, nit: value }))} />
            <Field label="Telefono" value={formData.phone} disabled={!isEditing} onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))} />
            <Field label="Direccion" value={formData.address} disabled={!isEditing} onChange={(value) => setFormData((prev) => ({ ...prev, address: value }))} />
            <Field label="Ciudad" value={formData.city} disabled={!isEditing} onChange={(value) => setFormData((prev) => ({ ...prev, city: value }))} />
            <Field label="Departamento" value={formData.department} disabled={!isEditing} onChange={(value) => setFormData((prev) => ({ ...prev, department: value }))} />
          </div>

          {isEditing ? (
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-10 rounded-none uppercase tracking-widest font-bold"
            >
              {updateMutation.isPending ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </Button>
          ) : null}
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">{label}</label>
      <Input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-none border-border bg-background disabled:opacity-80"
      />
    </div>
  );
}
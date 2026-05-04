import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ConfirmOptions = {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

type ConfirmState = {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'destructive';
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

const DEFAULT_STATE: ConfirmState = {
  open: false,
  title: '',
  description: '',
  confirmText: 'ACEPTAR',
  cancelText: 'CANCELAR',
  variant: 'default',
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmState>(DEFAULT_STATE);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const closeWith = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, open: false }));
    if (resolver) {
      resolver(value);
      setResolver(null);
    }
  }, [resolver]);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({
      open: true,
      title: options.title || 'CONFIRMAR ACCION',
      description: options.description,
      confirmText: options.confirmText || 'SI',
      cancelText: options.cancelText || 'NO',
      variant: options.variant || 'default',
    });
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <Dialog open={state.open} onOpenChange={(nextOpen) => { if (!nextOpen) closeWith(false); }}>
        <DialogContent showCloseButton={false} className="rounded-none border border-border bg-card p-0 max-w-[420px]">
          <DialogHeader className="px-4 pt-4 pb-3">
            <DialogTitle className="text-sm font-black uppercase tracking-wide">{state.title}</DialogTitle>
            <DialogDescription className="text-xs uppercase text-foreground">{state.description}</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
            <Button variant="outline" size="sm" onClick={() => closeWith(false)} className="rounded-none uppercase font-bold">
              {state.cancelText}
            </Button>
            <Button
              variant={state.variant === 'destructive' ? 'destructive' : 'default'}
              size="sm"
              onClick={() => closeWith(true)}
              className="rounded-none uppercase font-bold"
            >
              {state.confirmText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

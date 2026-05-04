import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'

interface FirstPasswordModalProps {
  isOpen: boolean
  onSuccess: () => void
}

export function FirstPasswordModal({ isOpen, onSuccess }: FirstPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validatePassword = (value: string) => {
    if (value.length < 8) return 'Minimo 8 caracteres'
    if (!/[A-Z]/.test(value)) return 'Al menos 1 mayuscula'
    if (!/[0-9]/.test(value)) return 'Al menos 1 numero'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validation = validatePassword(password)
    if (validation) {
      setError(validation)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden')
      return
    }

    setLoading(true)
    try {
      await authApi.setFirstPassword(password)
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px] rounded-none border-2 border-primary bg-background shadow-2xl shadow-primary/20">
        <DialogHeader className="space-y-3">
          <DialogTitle className="uppercase tracking-widest font-bold text-primary">
            Restablecer Contrasena
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            Esta es tu primera vez. Debes establecer una contrasena para continuar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first-password" className="text-xs uppercase tracking-widest font-mono">
              Nueva Contrasena
            </Label>
            <Input
              id="first-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-none border-border focus:border-primary font-mono tracking-wider"
              placeholder="********"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="first-password-confirm" className="text-xs uppercase tracking-widest font-mono">
              Confirmar Contrasena
            </Label>
            <Input
              id="first-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-none border-border focus:border-primary font-mono tracking-wider"
              placeholder="********"
            />
          </div>

          {error ? (
            <div className="bg-destructive/10 border border-destructive/50 p-3">
              <p className="text-xs text-destructive uppercase tracking-widest font-mono">{error}</p>
            </div>
          ) : null}

          <div className="bg-muted/30 p-3 border border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              La contrasena debe incluir:
            </p>
            <ul className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mt-1 space-y-1">
              <li className={password.length >= 8 ? 'text-primary' : ''}>
                {password.length >= 8 ? '✓' : '○'} Minimo 8 caracteres
              </li>
              <li className={/[A-Z]/.test(password) ? 'text-primary' : ''}>
                {/[A-Z]/.test(password) ? '✓' : '○'} Al menos 1 mayuscula
              </li>
              <li className={/[0-9]/.test(password) ? 'text-primary' : ''}>
                {/[0-9]/.test(password) ? '✓' : '○'} Al menos 1 numero
              </li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none uppercase tracking-widest font-bold bg-primary hover:bg-primary/90"
            >
              {loading ? 'Guardando...' : 'Establecer Contrasena'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

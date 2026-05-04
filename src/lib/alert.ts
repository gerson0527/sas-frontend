import { toast } from "sonner"

export const alert = {
  success(message: string, description?: string) {
    return toast.success(message, description ? { description } : undefined)
  },
  error(message: string, description?: string) {
    return toast.error(message, description ? { description } : undefined)
  },
  warning(message: string, description?: string) {
    return toast.warning(message, description ? { description } : undefined)
  },
  info(message: string, description?: string) {
    return toast.info(message, description ? { description } : undefined)
  },
}

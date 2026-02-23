import { toast } from "sonner";

export function toastError(message: string, options?: { description?: string }) {
  return toast.error(message, {
    duration: Infinity,
    closeButton: true,
    ...options,
  });
}

export function toastSuccess(message: string, options?: { description?: string }) {
  return toast.success(message, {
    duration: 4000,
    closeButton: true,
    ...options,
  });
}

export function toastWarning(message: string, options?: { description?: string }) {
  return toast.warning(message, {
    duration: Infinity,
    closeButton: true,
    ...options,
  });
}

export function toastInfo(message: string, options?: { description?: string }) {
  return toast.info(message, {
    duration: 4000,
    closeButton: true,
    ...options,
  });
}

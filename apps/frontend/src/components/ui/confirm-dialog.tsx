"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "bg-red-500/20 text-red-400",
      button: "bg-red-500 hover:bg-red-600 text-white",
    },
    warning: {
      icon: "bg-amber-500/20 text-amber-400",
      button: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    default: {
      icon: "bg-violet-500/20 text-violet-400",
      button: "bg-violet-500 hover:bg-purple-500 text-white",
    },
  };

  const styles = variantStyles[variant];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[80]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-start gap-4 p-6">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", styles.icon)}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg  shrink-0"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white/5 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-gray-300 font-medium rounded-xl hover:bg-white/10  disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl  disabled:opacity-50 disabled:cursor-not-allowed",
                styles.button
              )}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

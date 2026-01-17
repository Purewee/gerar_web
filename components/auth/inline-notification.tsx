"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

interface InlineNotificationProps {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function InlineNotification({
  type,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
}: InlineNotificationProps) {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-xl border ${
        type === "success"
          ? "bg-green-50/80 border-green-200/60 text-green-700"
          : "bg-red-50/80 border-red-200/60 text-red-700"
      } animate-in slide-in-from-top-2 duration-300`}
    >
      <div className="shrink-0 mt-0.5">
        {type === "success" ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`shrink-0 mt-0.5 transition-colors rounded-full p-1 ${
            type === "success"
              ? "text-green-600 hover:text-green-700 hover:bg-green-100/50"
              : "text-red-500 hover:text-red-600 hover:bg-red-100/50"
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, Info, CheckCircle2, ShieldAlert, X, Loader2 } from "lucide-react";

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  highlight?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  isAlertOnly?: boolean; // If true, only shows a single "OK" button
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  highlight,
  isLoading = false,
  onConfirm,
  onClose,
  isAlertOnly = false,
}: ConfirmationModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case "danger":
        return <Trash2 className="size-6 text-red-500" />;
      case "warning":
        return <AlertTriangle className="size-6 text-amber-400" />;
      case "success":
        return <CheckCircle2 className="size-6 text-[#1db954]" />;
      case "info":
      default:
        return <Info className="size-6 text-blue-400" />;
    }
  };

  const iconBg = {
    danger: "bg-red-500/15 border-red-500/20",
    warning: "bg-amber-500/15 border-amber-500/20",
    success: "bg-emerald-500/15 border-emerald-500/20",
    info: "bg-blue-500/15 border-blue-500/20",
  }[type];

  const confirmBtnStyle = {
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20",
    warning: "bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-600/20",
    success: "bg-[#1db954] hover:bg-[#1ed760] text-black shadow-lg shadow-[#1db954]/20",
    info: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20",
  }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={isLoading ? undefined : onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#181818] border border-white/10 shadow-2xl space-y-5 text-left z-10 animate-in zoom-in-95 duration-200">
        {/* Header with Icon and Close Button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`size-11 rounded-xl flex items-center justify-center border shrink-0 ${iconBg}`}>
              {renderIcon()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{title}</h3>
              <span className="text-[11px] text-[#727272] uppercase tracking-wider font-semibold">
                Action Confirmation
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="space-y-2 text-xs text-[#b3b3b3] leading-relaxed">
          <p>{message}</p>
          {highlight && (
            <div className="p-3 rounded-lg bg-[#242424] border border-white/5 text-white font-medium text-xs break-all">
              {highlight}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isAlertOnly && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-full bg-[#242424] hover:bg-[#333333] text-xs font-semibold text-white transition-colors"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 ${confirmBtnStyle}`}
          >
            {isLoading && <Loader2 className="size-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}


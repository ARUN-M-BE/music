"use client";

import React from "react";
import { AlertTriangle, Trash2, Info, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";

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
  isAlertOnly?: boolean;
}

const ICONS = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
} as const;

const TONES = {
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-info/10 text-info border-info/20",
  success: "bg-success/10 text-success border-success/20",
} as const;

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
  const Icon = ICONS[type];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <DialogContent className="max-w-md gap-5">
        <DialogHeader className="gap-3 text-left">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl border",
              TONES[type]
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Action confirmation
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>{message}</p>
          {highlight && (
            <div className="break-all rounded-lg border border-border bg-muted p-3 text-foreground">
              {highlight}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {!isAlertOnly && (
            <Button variant="secondary" onClick={onClose} disabled={isLoading} className="rounded-full">
              {cancelText}
            </Button>
          )}
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant={type === "danger" ? "destructive" : "default"}
            className="gap-2 rounded-full px-5"
          >
            {isLoading && <Loader2 className="size-3.5 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

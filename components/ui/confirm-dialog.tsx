"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** "destructive" colours the confirm button red. */
  tone?: "default" | "destructive";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal confirmation instead of window.confirm(). Escape and a backdrop click cancel. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Latest props for the key handler, so the effect runs only when the dialog opens/closes.
  const latest = useRef({ busy, onCancel });
  latest.current = { busy, onCancel };

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !latest.current.busy) latest.current.onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !busy && onCancel()} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-lg bg-card p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-bold text-foreground">
          {title}
        </h2>
        {description && (
          <div id={descriptionId} className="mt-2 text-sm text-muted-foreground">
            {description}
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            className={tone === "destructive" ? "bg-destructive hover:bg-destructive-hover text-primary-foreground" : "bg-success hover:bg-success-hover text-primary-foreground"}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

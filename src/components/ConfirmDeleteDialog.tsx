
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  open?: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  triggerButton?: React.ReactNode;
  mode?: "delete" | "archive"; // NOVO: define se é arquivar/excluir
}

export function ConfirmDeleteDialog({ 
  open: controlledOpen,
  onClose: controlledOnClose,
  onConfirm,
  title,
  description,
  triggerButton,
  mode = "delete" // padrão antigo
}: ConfirmDeleteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Controlado x não controlado
  const isControlled = controlledOpen !== undefined && controlledOnClose !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalOpen(open);
    }
  };

  const handleConfirm = () => {
    onConfirm();
    handleOpenChange(false);
  };

  const confirmLabel = mode === "archive" ? "Arquivar" : "Excluir";
  const confirmClass = mode === "archive"
    ? "bg-yellow-500 hover:bg-yellow-600 text-white" // Botão amarelo
    : "bg-destructive text-destructive-foreground hover:bg-destructive/90";

  if (triggerButton && !isControlled) {
    return (
      <>
        <div onClick={() => setInternalOpen(true)}>
          {triggerButton}
        </div>
        <Dialog open={internalOpen} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={mode === "archive" ? "text-yellow-500" : "text-destructive"}>
                {title}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">{description}</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button className={confirmClass} onClick={handleConfirm}>{confirmLabel}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={mode === "archive" ? "text-yellow-500" : "text-destructive"}>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">{description}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button className={confirmClass} onClick={handleConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

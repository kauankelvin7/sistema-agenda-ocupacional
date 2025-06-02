
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { FileAttachment } from './FileAttachment';
import { Paperclip } from 'lucide-react';
import { attachFileToAppointment } from '@/services/appointment-service';
import { toast } from '@/hooks/use-toast';

interface AppointmentAttachmentModalProps {
  appointmentId: string;
  onSuccess?: () => void;
}

export const AppointmentAttachmentModal = ({ appointmentId, onSuccess }: AppointmentAttachmentModalProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileAttach = async (fileBase64: string, fileName: string) => {
    setIsLoading(true);
    try {
      await attachFileToAppointment(appointmentId, fileBase64, fileName);
      toast({
        title: "Arquivo anexado com sucesso",
        description: `O arquivo ${fileName} foi anexado ao agendamento.`
      });
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao anexar arquivo:", error);
      toast({
        title: "Erro ao anexar arquivo",
        description: "Não foi possível anexar o arquivo ao agendamento.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Paperclip className="h-4 w-4" />
          Anexar Documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anexar Documento ao Agendamento</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Anexe um documento ao agendamento (PDF, imagem ou documento). Tamanho máximo: 3MB.
          </p>
          <FileAttachment 
            onFileAttach={handleFileAttach}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

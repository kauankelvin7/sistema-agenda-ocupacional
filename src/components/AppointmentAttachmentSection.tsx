
import React, { useState } from 'react';
import { FileAttachment } from './FileAttachment';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Paperclip } from 'lucide-react';

interface AppointmentAttachmentSectionProps {
  onFileAttach: (fileBase64: string, fileName: string) => void;
  attachmentUrl?: string;
  attachmentName?: string;
  disabled?: boolean;
}

export const AppointmentAttachmentSection: React.FC<AppointmentAttachmentSectionProps> = ({
  onFileAttach,
  attachmentUrl,
  attachmentName,
  disabled = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Anexar Documentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attachmentUrl && attachmentName ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Arquivo anexado: {attachmentName}
            </div>
            <div className="text-xs text-green-600">
              ✅ Documento anexado com sucesso
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Anexe documentos relacionados ao atendimento (opcional)
            </div>
            <FileAttachment 
              onFileAttach={onFileAttach}
              className={disabled ? "opacity-50 pointer-events-none" : ""}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

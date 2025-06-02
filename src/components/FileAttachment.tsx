
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Paperclip, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FileAttachmentProps {
  onFileAttach: (fileBase64: string, fileName: string) => void;
  className?: string;
}

export const FileAttachment = ({ onFileAttach, className }: FileAttachmentProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 10MB for better UX)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const simulateProgress = () => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 95) {
          setUploadProgress(95);
          clearInterval(interval);
          resolve();
        } else {
          setUploadProgress(progress);
        }
      }, 100);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo para anexar",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      await simulateProgress();
      
      // Convert file to base64
      const base64 = await convertFileToBase64(selectedFile);
      
      // Complete the progress
      setUploadProgress(100);
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 200));
      
      onFileAttach(base64, selectedFile.name);
      
      toast({
        title: "Arquivo anexado",
        description: `${selectedFile.name} foi anexado com sucesso`,
      });
      
      // Reset selection
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro ao anexar arquivo",
        description: "Não foi possível anexar o arquivo",
        variant: "destructive"
      });
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
          ref={fileInputRef}
          type="file" 
          onChange={handleFileChange} 
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.xls,.xlsx" 
          className="flex-grow"
          disabled={isLoading}
        />
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isLoading}
          className="whitespace-nowrap"
        >
          <Paperclip className="mr-2 h-4 w-4" />
          {isLoading ? "Anexando..." : "Anexar"}
        </Button>
      </div>
      
      {selectedFile && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
          
          {isLoading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Enviando arquivo...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Component to display and download attached files
interface FileDownloadProps {
  fileData?: string;
  fileName?: string;
  onDelete?: () => void;
  showDelete?: boolean;
}

export const FileDownload = ({ fileData, fileName, onDelete, showDelete = false }: FileDownloadProps) => {
  if (!fileData || !fileName) return null;
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      const confirmDelete = window.confirm(`Deseja realmente excluir o anexo "${fileName}"?`);
      if (confirmDelete) {
        onDelete();
      }
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Paperclip size={16} className="text-muted-foreground" />
      <span className="text-sm text-blue-500 hover:underline cursor-pointer" onClick={handleDownload}>
        {fileName}
      </span>
      {showDelete && onDelete && (
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 w-6 p-0 text-destructive"
          onClick={handleDelete}
        >
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  );
};

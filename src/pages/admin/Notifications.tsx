
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Bell, Send } from "lucide-react";
import { getCompanies } from "@/services/company-service";
import { createNotification, getNotifications } from "@/services/notification-service";
import { Notification, NotificationType } from "@/types";

const AdminNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientId, setRecipientId] = useState("all");
  const [type, setType] = useState<NotificationType>("info");

  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications()
  });

  const createMutation = useMutation({
    mutationFn: (notificationData: Omit<Notification, "id" | "createdAt">) => 
      createNotification(notificationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setTitle("");
      setMessage("");
      setRecipientId("all");
      setType("info");
      toast({
        title: "Notificação enviada",
        description: "A notificação foi enviada com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast({
        title: "Campos incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate({
      title,
      message,
      recipientId,
      type,
      read: false
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notificações</h2>
          <p className="text-muted-foreground">
            Envie notificações para empresas
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              <span>Nova Notificação</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título*</label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da notificação"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem*</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva a mensagem da notificação aqui..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Destinatário</label>
                <Select 
                  value={recipientId} 
                  onValueChange={setRecipientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destinatário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select 
                  value={type} 
                  onValueChange={(value) => setType(value as NotificationType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Enviando..." : "Enviar Notificação"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span>Notificações Recentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="mb-2 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhuma notificação enviada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => {
                  const company = companies.find(c => c.id === notification.recipientId);
                  const recipientName = notification.recipientId === "all" ? "Todas as empresas" : company?.name || "Empresa não encontrada";
                  
                  return (
                    <div key={notification.id} className="border-b pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground">Para: {recipientName}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          notification.type === "info" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : 
                          notification.type === "warning" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                          notification.type === "success" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}>
                          {notification.type === "info" ? "Informação" : 
                           notification.type === "warning" ? "Aviso" :
                           notification.type === "success" ? "Sucesso" : "Erro"}
                        </div>
                      </div>
                      <p className="mt-1 text-sm">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {notification.createdAt instanceof Date ? 
                          notification.createdAt.toLocaleString() : 
                          new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;

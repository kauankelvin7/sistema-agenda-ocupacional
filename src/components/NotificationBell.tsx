
import { useState, useEffect } from "react";
import { Bell, BellDot, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Notification } from "@/types";
import { 
  getCompanyNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  hideNotificationForUser,
  clearAllNotificationsForUser
} from "@/services/notification-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onHide: (id: string) => void;
}

const NotificationItem = ({ notification, onRead, onHide }: NotificationItemProps) => {
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
  };

  let typeClass = "bg-blue-50 dark:bg-blue-950/20";
  if (notification.type === "warning") typeClass = "bg-amber-50 dark:bg-amber-950/20";
  if (notification.type === "success") typeClass = "bg-green-50 dark:bg-green-950/20";
  if (notification.type === "error") typeClass = "bg-red-50 dark:bg-red-950/20";

  return (
    <div 
      className={`p-3 mb-2 rounded-md ${typeClass} ${notification.read ? 'opacity-70' : ''} relative`}
    >
      <div className="flex justify-between items-start">
        <h4 
          className="font-medium text-sm cursor-pointer flex-1 pr-2" 
          onClick={handleClick}
        >
          {notification.title}
        </h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary"></span>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onHide(notification.id);
            }}
            className="text-gray-400 hover:text-red-500 rounded p-1 transition-colors"
            aria-label="Ocultar notificação"
            title="Ocultar notificação"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p 
        className="text-xs mt-1 text-muted-foreground line-clamp-2 cursor-pointer" 
        onClick={handleClick}
      >
        {notification.message}
      </p>
      <p className="text-xs mt-2 text-muted-foreground">
        {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', {locale: ptBR})}
      </p>
    </div>
  );
};

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  // Fix: Added forcedRefetch to trigger requery
  const [forcedRefetch, setForcedRefetch] = useState(0);
  
  const { data: notifications = [], isError, refetch } = useQuery({
    queryKey: ["notifications", user?.id, forcedRefetch],
    queryFn: () => getCompanyNotifications(user?.id || ""),
    enabled: !!user?.id,
    refetchInterval: 30000, // Recarregar a cada 30 segundos para atualizações mais frequentes
    staleTime: 10000, // Considerar dados "frescos" por 10 segundos
  });
  
  // Lida com erros de busca de notificações
  useEffect(() => {
    if (isError) {
      toast({ 
        title: "Erro", 
        description: "Não foi possível carregar as notificações",
        variant: "destructive"
      });
    }
  }, [isError]);
  
  // Atualiza notificações quando o popover for aberto
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Force refresh on component mount
  useEffect(() => {
    const intervalId = setInterval(() => {
      setForcedRefetch(prev => prev + 1);
    }, 60000); // Check for new notifications every minute
    
    // Initial fetch
    refetch();
    
    return () => clearInterval(intervalId);
  }, [refetch]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleReadNotification = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive"
      });
    }
  };
  
  const handleHideNotification = async (notificationId: string) => {
    try {
      if (!user?.id) return;
      
      await hideNotificationForUser(notificationId, user.id);
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      toast({ 
        title: "Notificação ocultada", 
        description: "A notificação foi removida da sua visualização" 
      });
    } catch (error) {
      console.error("Erro ao ocultar notificação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível ocultar a notificação",
        variant: "destructive"
      });
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      if (user?.id) {
        await markAllNotificationsAsRead(user.id);
        queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        toast({ 
          title: "Notificações", 
          description: "Todas as notificações foram marcadas como lidas" 
        });
      }
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas",
        variant: "destructive"
      });
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      if (user?.id) {
        await clearAllNotificationsForUser(user.id);
        queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        toast({ 
          title: "Histórico limpo", 
          description: "Todas as notificações foram removidas da sua visualização" 
        });
      }
    } catch (error) {
      console.error("Erro ao limpar notificações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar o histórico de notificações",
        variant: "destructive"
      });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Notificações</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                className="text-xs h-6 px-2"
                title="Marcar todas como lidas"
              >
                Marcar lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAllNotifications}
                className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                title="Limpar histórico"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[300px] p-3">
          {notifications.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground text-sm">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification}
                onRead={handleReadNotification}
                onHide={handleHideNotification}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

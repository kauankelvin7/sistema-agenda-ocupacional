
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlockedDates, addBlockedDate, removeBlockedDate } from "@/services/blocked-dates-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Trash2, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { createDateForBlocking, formatBlockedDateForDisplay } from "@/lib/date-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

const BlockedDatesManager = () => {
  const [newBlockedDate, setNewBlockedDate] = useState({
    date: "",
    reason: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch blocked dates
  const { data: blockedDates = [], isLoading } = useQuery({
    queryKey: ["blockedDates"],
    queryFn: getBlockedDates
  });

  // Mutation to add blocked date
  const addBlockedDateMutation = useMutation({
    mutationFn: ({ date, reason }: { date: string; reason: string }) => 
      addBlockedDate(date, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedDates"] });
      setNewBlockedDate({ date: "", reason: "" });
      setIsAdding(false);
      toast({
        title: "Data bloqueada",
        description: "A data foi bloqueada com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível bloquear a data",
        variant: "destructive"
      });
    }
  });

  // Mutation to remove blocked date
  const removeBlockedDateMutation = useMutation({
    mutationFn: removeBlockedDate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedDates"] });
      toast({
        title: "Data desbloqueada",
        description: "A data foi desbloqueada com sucesso"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível desbloquear a data",
        variant: "destructive"
      });
    }
  });

  const handleAddBlockedDate = () => {
    if (!newBlockedDate.date) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione uma data para bloquear",
        variant: "destructive"
      });
      return;
    }
    
    // Use the createDateForBlocking function to ensure proper formatting
    const formattedDate = createDateForBlocking(newBlockedDate.date);
    
    if (!formattedDate) {
      toast({
        title: "Formato de data inválido",
        description: "Por favor, selecione uma data válida",
        variant: "destructive"
      });
      return;
    }
    
    console.log(`Bloqueando data: ${formattedDate}, original: ${newBlockedDate.date}`);
    
    addBlockedDateMutation.mutate({
      date: formattedDate,
      reason: newBlockedDate.reason
    });
  };

  const handleRemoveBlockedDate = (id: string) => {
    removeBlockedDateMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Gerenciar Datas Bloqueadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Bloqueie datas específicas para impedir novos agendamentos (feriados, recessos, etc.)
            </p>
            <Button onClick={() => setIsAdding(!isAdding)}>
              <Plus className="h-4 w-4 mr-2" />
              Bloquear Data
            </Button>
          </div>

          {isAdding && (
            <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Data</label>
                  <Input
                    type="date"
                    value={newBlockedDate.date}
                    onChange={(e) => setNewBlockedDate({
                      ...newBlockedDate,
                      date: e.target.value
                    })}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Motivo</label>
                  <Input
                    placeholder="Ex: Feriado Nacional, Recesso..."
                    value={newBlockedDate.reason}
                    onChange={(e) => setNewBlockedDate({
                      ...newBlockedDate,
                      reason: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddBlockedDate}
                  disabled={addBlockedDateMutation.isPending}
                >
                  {addBlockedDateMutation.isPending ? "Bloqueando..." : "Confirmar Bloqueio"}
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              Carregando datas bloqueadas...
            </div>
          ) : blockedDates.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
              <Calendar size={48} className="text-muted-foreground/50" />
              <p>Nenhuma data bloqueada</p>
              <p className="text-sm text-muted-foreground">
                Adicione datas que devem ser bloqueadas para agendamentos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Bloqueado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedDates.map((blockedDate) => (
                    <TableRow key={blockedDate.id}>
                      <TableCell className="font-medium">
                        {formatBlockedDateForDisplay(blockedDate.date)}
                      </TableCell>
                      <TableCell>{blockedDate.reason}</TableCell>
                      <TableCell>
                        {format(new Date(blockedDate.createdAt), "dd/MM/yyyy HH:mm", {locale: ptBR})}
                      </TableCell>
                      <TableCell>
                        <ConfirmDeleteDialog
                          title="Desbloquear data"
                          description="Tem certeza que deseja desbloquear esta data? Empresas poderão fazer agendamentos novamente."
                          onConfirm={() => handleRemoveBlockedDate(blockedDate.id)}
                          triggerButton={
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Desbloquear
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockedDatesManager;

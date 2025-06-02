
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar as CalendarIcon, Clock, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import {
  getAllBlockedTimeSlots,
  addBlockedTimeSlot,
  removeBlockedTimeSlot,
  BlockedTimeSlot
} from "@/services/blocked-time-slots-service";

export default function BlockedTimeSlotsManager() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  // Query para buscar horários bloqueados
  const { data: blockedSlots = [], isLoading, refetch } = useQuery({
    queryKey: ["blockedTimeSlots"],
    queryFn: getAllBlockedTimeSlots
  });

  // Mutation para adicionar horário bloqueado
  const addBlockedSlotMutation = useMutation({
    mutationFn: async ({ date, timeSlot, reason }: { date: Date, timeSlot: string, reason: string }) => {
      console.log(`🚀 Starting mutation to add blocked slot:`, { date, timeSlot, reason });
      
      try {
        const result = await addBlockedTimeSlot(date, timeSlot, reason);
        console.log(`✅ Mutation successful:`, result);
        return result;
      } catch (error) {
        console.error(`❌ Mutation failed:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log(`🎉 Mutation onSuccess triggered:`, data);
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["blockedTimeSlots"] });
      refetch();
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setReason("");
      
      toast({
        title: "Horário bloqueado",
        description: `Horário ${data.timeSlot} bloqueado para ${data.date}`
      });
    },
    onError: (error) => {
      console.error(`❌ Mutation onError triggered:`, error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao bloquear horário";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Mutation para remover horário bloqueado
  const removeBlockedSlotMutation = useMutation({
    mutationFn: (id: string) => {
      console.log(`🗑️ Starting mutation to remove blocked slot: ${id}`);
      return removeBlockedTimeSlot(id);
    },
    onSuccess: () => {
      console.log(`✅ Remove mutation successful`);
      queryClient.invalidateQueries({ queryKey: ["blockedTimeSlots"] });
      refetch();
      toast({
        title: "Horário desbloqueado",
        description: "O horário foi desbloqueado com sucesso"
      });
    },
    onError: (error) => {
      console.error(`❌ Remove mutation failed:`, error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao desbloquear horário";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Carregar dados iniciais
  useEffect(() => {
    console.log("🔄 Initial data load for BlockedTimeSlotsManager");
    refetch();
  }, [refetch]);

  // Gerar slots de horário de 6:30 às 18:00
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 18; hour++) {
      for (let minute of [0, 30]) {
        // Pular 6:00 (queremos começar em 6:30)
        if (hour === 6 && minute === 0) continue;
        
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Verificar se horário já está bloqueado para a data selecionada
  const isTimeSlotAlreadyBlocked = (date: Date, timeSlot: string) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const isBlocked = blockedSlots.some(slot => 
      slot.date === formattedDate && slot.timeSlot === timeSlot
    );
    
    console.log(`🔍 Checking if ${timeSlot} on ${formattedDate} is already blocked: ${isBlocked}`);
    console.log(`📊 Current blocked slots count:`, blockedSlots.length);
    
    return isBlocked;
  };

  const handleAddBlockedSlot = () => {
    console.log(`👆 Add button clicked`);
    console.log(`📊 Form data:`, { selectedDate, selectedTime, reason: reason.trim() });
    
    if (!selectedDate || !selectedTime || !reason.trim()) {
      console.warn(`⚠️ Form validation failed - missing data`);
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o horário já está bloqueado
    if (isTimeSlotAlreadyBlocked(selectedDate, selectedTime)) {
      console.warn(`⚠️ Time slot already blocked`);
      toast({
        title: "Horário já bloqueado",
        description: "Este horário já está bloqueado para a data selecionada",
        variant: "destructive"
      });
      return;
    }

    console.log(`🚀 Triggering mutation...`);
    addBlockedSlotMutation.mutate({
      date: selectedDate,
      timeSlot: selectedTime,
      reason: reason.trim()
    });
  };

  const handleRemoveBlockedSlot = (id: string) => {
    console.log(`🗑️ Remove button clicked for slot: ${id}`);
    if (window.confirm("Tem certeza que deseja desbloquear este horário?")) {
      removeBlockedSlotMutation.mutate(id);
    }
  };

  // Agrupar slots bloqueados por data
  const groupedBlockedSlots = blockedSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, BlockedTimeSlot[]>);

  console.log(`📊 BlockedTimeSlotsManager render:`, {
    totalBlockedSlots: blockedSlots.length,
    groupedSlots: Object.keys(groupedBlockedSlots).length,
    isLoading,
    selectedDate,
    selectedTime,
    reason
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bloquear Horário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      console.log(`📅 Date selected:`, date);
                      setSelectedDate(date);
                    }}
                    initialFocus
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time">Horário</Label>
              <Select value={selectedTime} onValueChange={(value) => {
                console.log(`⏰ Time selected:`, value);
                setSelectedTime(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar horário" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => {
                    const isBlocked = selectedDate && isTimeSlotAlreadyBlocked(selectedDate, time);
                    return (
                      <SelectItem 
                        key={time} 
                        value={time}
                        disabled={isBlocked}
                        className={isBlocked ? "opacity-50" : ""}
                      >
                        {time} {isBlocked ? "(Já bloqueado)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => {
                  console.log(`✏️ Reason updated:`, e.target.value);
                  setReason(e.target.value);
                }}
                placeholder="Ex: Feriado, Manutenção..."
                maxLength={100}
              />
            </div>
          </div>

          <Button 
            onClick={handleAddBlockedSlot}
            disabled={addBlockedSlotMutation.isPending || !selectedDate || !selectedTime || !reason.trim()}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {addBlockedSlotMutation.isPending ? "Bloqueando..." : "Bloquear Horário"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Horários Bloqueados ({blockedSlots.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} title="Atualizar lista">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Carregando horários bloqueados...
            </div>
          ) : Object.keys(groupedBlockedSlots).length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum horário bloqueado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedBlockedSlots)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([date, slots]) => (
                  <div key={date} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">
                      {format(new Date(date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {slots
                        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                        .map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between p-2 border rounded bg-muted/50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-xs">
                                  {slot.timeSlot}
                                </Badge>
                                <span className="text-sm text-muted-foreground truncate">
                                  {slot.reason}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBlockedSlot(slot.id)}
                              disabled={removeBlockedSlotMutation.isPending}
                              className="ml-2 shrink-0"
                              title="Remover bloqueio"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

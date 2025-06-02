
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Clock, Save, RotateCcw } from "lucide-react";
import { SlotLimit } from "@/types/slot-limits";
import { getSlotLimits, saveSlotLimits } from "@/services/slot-limits-service";

/**
 * Componente para gerenciar limites de agendamento por slot de tempo
 */
export const SlotLimitsManager: React.FC = () => {
  const [slotLimits, setSlotLimits] = useState<SlotLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Gerar slots de 15 em 15 minutos das 6:30 às 16:45
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    const startHour = 6;
    const startMinute = 30;
    const endHour = 16;
    const endMinute = 45;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const startMin = hour === startHour ? startMinute : 0;
      const endMin = hour === endHour ? endMinute : 45;
      
      for (let minute = startMin; minute <= endMin; minute += 15) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeSlot);
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    loadSlotLimits();
  }, []);

  const loadSlotLimits = async () => {
    try {
      setIsLoading(true);
      const limits = await getSlotLimits();
      
      // Criar mapeamento dos limites existentes
      const limitsMap = new Map(limits.map(limit => [limit.timeSlot, limit]));
      
      // Garantir que todos os slots tenham uma entrada
      const allSlotLimits = timeSlots.map(timeSlot => {
        const existingLimit = limitsMap.get(timeSlot);
        return existingLimit || {
          timeSlot,
          limit: 0
        };
      });
      
      setSlotLimits(allSlotLimits);
    } catch (error) {
      console.error('Erro ao carregar limites dos slots:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os limites dos slots",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimitChange = (timeSlot: string, newLimit: string) => {
    const limitValue = parseInt(newLimit) || 0;
    setSlotLimits(prev => 
      prev.map(slot => 
        slot.timeSlot === timeSlot 
          ? { ...slot, limit: limitValue }
          : slot
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Filtrar apenas slots com limite > 0 para economizar espaço
      const slotsToSave = slotLimits.filter(slot => slot.limit > 0);
      
      await saveSlotLimits(slotsToSave);
      
      toast({
        title: "Sucesso",
        description: "Limites dos slots salvos com sucesso"
      });
    } catch (error) {
      console.error('Erro ao salvar limites dos slots:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os limites dos slots",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSlotLimits(prev => prev.map(slot => ({ ...slot, limit: 0 })));
    toast({
      title: "Limites zerados",
      description: "Todos os limites foram definidos como 0"
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Carregando configurações...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Limites por Slot de Tempo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure quantas pessoas podem agendar para cada slot de 15 minutos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
          <Button 
            onClick={handleReset} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Zerar Todos
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
          {slotLimits.map((slot) => (
            <div key={slot.timeSlot} className="flex items-center gap-2 p-2 border rounded">
              <span className="font-mono text-sm w-12 text-center">
                {slot.timeSlot}
              </span>
              <Input
                type="number"
                min="0"
                max="100"
                value={slot.limit}
                onChange={(e) => handleLimitChange(slot.timeSlot, e.target.value)}
                className="w-20 h-8 text-center"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">pessoas</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          * Slots com limite 0 retornarão ao valor padrão pré-estabelecido no sistema.<br />
          <br />
          * As configurações se aplicam a todos os dias
        </div>
      </CardContent>
    </Card>
  );
};

export default SlotLimitsManager;


import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getDaySlotStats } from "@/services/slot-availability-service";
import { getBlockedTimeSlotsForDate } from "@/services/blocked-time-slots-service";
import { SlotAvailability } from "@/types/slot-limits";

interface ModernTimeSlotSelectorProps {
  selectedDate: Date | undefined;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  hasAdditionalExams: boolean;
  disabled?: boolean;
}

export const ModernTimeSlotSelector: React.FC<ModernTimeSlotSelectorProps> = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  hasAdditionalExams,
  disabled = false
}) => {
  const [slotStats, setSlotStats] = useState<SlotAvailability[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate) {
      setSlotStats([]);
      setBlockedSlots([]);
      return;
    }

    loadSlotData();
  }, [selectedDate]);

  const loadSlotData = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const [dayStats, blockedTimes] = await Promise.all([
        getDaySlotStats(dateStr),
        getBlockedTimeSlotsForDate(selectedDate)
      ]);

      setSlotStats(dayStats.slots);
      setBlockedSlots(blockedTimes.map(slot => slot.timeSlot));
    } catch (error) {
      console.error("Erro ao carregar dados dos slots:", error);
      setSlotStats([]);
      setBlockedSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSlotsForAdditionalExams = (slots: SlotAvailability[]) => {
    if (!hasAdditionalExams) return slots;
    
    return slots.filter(slot => {
      const hour = parseInt(slot.timeSlot.split(':')[0]);
      const minute = parseInt(slot.timeSlot.split(':')[1]);
      const timeInMinutes = hour * 60 + minute;
      const startTime = 6 * 60 + 30; // 6:30
      const endTime = 12 * 60; // 12:00
      
      return timeInMinutes >= startTime && timeInMinutes < endTime;
    });
  };

  const handleSlotClick = (timeSlot: string) => {
    if (disabled || loading) return;
    
    const slot = slotStats.find(s => s.timeSlot === timeSlot);
    if (!slot?.available || blockedSlots.includes(timeSlot)) return;
    
    onTimeSelect(timeSlot);
  };

  const isSlotDisabled = (slot: SlotAvailability): boolean => {
    return !slot.available || blockedSlots.includes(slot.timeSlot) || loading || disabled;
  };

  const isSlotAlmostFull = (slot: SlotAvailability): boolean => {
    return slot.available && slot.limit > 0 && (slot.current / slot.limit) >= 0.7;
  };

  const isSlotEmpty = (slot: SlotAvailability): boolean => {
    return slot.available && slot.current === 0;
  };

  const getSlotStatus = (slot: SlotAvailability) => {
    if (selectedTime === slot.timeSlot) return "selected";
    if (isSlotDisabled(slot)) return "disabled";
    if (isSlotEmpty(slot)) return "empty";
    if (isSlotAlmostFull(slot)) return "almost-full";
    return "available";
  };

  const getSlotTooltip = (slot: SlotAvailability) => {
    if (blockedSlots.includes(slot.timeSlot)) return "Bloqueado pela clínica";
    if (!slot.available) return `Esgotado (${slot.current}/${slot.limit})`;
    if (isSlotAlmostFull(slot)) return `Quase lotado (${slot.current}/${slot.limit})`;
    if (isSlotEmpty(slot)) return `Vazio (${slot.current}/${slot.limit})`;
    return `Disponível (${slot.current}/${slot.limit})`;
  };

  const filteredSlots = filterSlotsForAdditionalExams(slotStats);

  return (
    <div className="space-y-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Horários Disponíveis</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione uma data"}
            </p>
          </div>
        </div>
      </div>

      {/* Aviso exames complementares */}
      {hasAdditionalExams && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">Exames Complementares</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Disponível apenas de 6:30 às 12:00</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de horários */}
      {!selectedDate ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <Calendar className="h-16 w-16 mb-6 opacity-50" />
          <p className="text-xl font-medium">Selecione uma data</p>
          <p className="text-sm">Para visualizar os horários disponíveis</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <Clock className="h-12 w-12 mb-6 animate-spin text-blue-500" />
          <p className="text-lg">Carregando horários...</p>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <AlertTriangle className="h-16 w-16 mb-6 opacity-50" />
          <p className="text-xl font-medium">Nenhum horário disponível</p>
          <p className="text-sm">Tente outra data</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grid responsivo melhorado */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-h-96 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            {filteredSlots.map((slot) => {
              const status = getSlotStatus(slot);
              
              return (
                <Button
                  key={slot.timeSlot}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSlotClick(slot.timeSlot)}
                  disabled={status === "disabled"}
                  className={cn(
                    "relative h-16 p-2 font-medium transition-all duration-300 hover:scale-105 border-2 group",
                    {
                      // Selecionado
                      "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800": status === "selected",
                      
                      // Desabilitado/Esgotado
                      "bg-gradient-to-br from-red-500 to-red-600 text-white border-red-500 cursor-not-allowed opacity-80": status === "disabled",
                      
                      // Vazio
                      "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 hover:bg-gradient-to-br hover:from-green-100 hover:to-green-200 hover:border-green-400": status === "empty",
                      
                      // Quase lotado
                      "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-800/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600 hover:bg-gradient-to-br hover:from-amber-100 hover:to-orange-200 hover:border-amber-400": status === "almost-full",
                      
                      // Disponível normal
                      "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-500 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 hover:border-gray-400": status === "available"
                    }
                  )}
                  title={getSlotTooltip(slot)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-mono text-xs font-bold">{slot.timeSlot}</span>
                    <span className="text-[10px] opacity-80 font-medium">
                      {slot.current}/{slot.limit}
                    </span>
                  </div>
                  
                  {/* Indicadores visuais */}
                  {status === "empty" && (
                    <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white dark:bg-gray-800 rounded-full" />
                  )}
                  
                  {status === "almost-full" && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-lg">
                      <Zap className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
                    </div>
                  )}
                  
                  {status === "selected" && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded-md animate-pulse" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legenda melhorada */}
      <div className="flex flex-wrap items-center gap-6 text-sm bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded bg-gray-50 dark:bg-gray-700"></div>
          <span className="font-medium">Disponível</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded shadow-sm"></div>
          <span className="font-medium">Selecionado</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded shadow-sm"></div>
          <span className="font-medium">Indisponível</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded relative">
            <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />
          </div>
          <span className="font-medium">Vazio</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-400 rounded relative shadow-sm">
            <div className="absolute inset-0 bg-amber-400 rounded animate-pulse"></div>
          </div>
          <span className="font-medium">Quase lotado</span>
        </div>
      </div>

      {/* Status seleção melhorado */}
      {selectedTime && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-bold text-green-800 dark:text-green-200 text-lg">
                Horário selecionado: {selectedTime}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Prossiga com o agendamento para confirmar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

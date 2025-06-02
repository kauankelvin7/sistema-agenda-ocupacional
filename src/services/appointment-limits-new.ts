import { validateSlotAvailability } from "./slot-availability-service";
import { isTimeSlotBlocked } from "./blocked-time-slots-service";
import { getDaySlotStats } from "./slot-availability-service";
import { format } from "date-fns";

/**
 * Novo serviço de validação de agendamentos usando limites por slot
 */

/**
 * Valida se um agendamento pode ser criado
 */
export const validateAppointmentAvailability = async (
  date: string,
  hour: number
): Promise<{ success: boolean; reason?: string }> => {
  try {
    // Formar o timeSlot no formato HH:mm
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    
    // Verificar se está bloqueado pela clínica
    const dateObj = new Date(`${date}T${timeSlot}`);
    const isBlocked = await isTimeSlotBlocked(dateObj, timeSlot);
    
    if (isBlocked) {
      return {
        success: false,
        reason: `Horário ${timeSlot} está bloqueado para agendamentos`
      };
    }
    
    // Verificar disponibilidade do slot
    const availability = await validateSlotAvailability(date, timeSlot);
    
    if (!availability.success) {
      return {
        success: false,
        reason: availability.reason || 'Horário não disponível'
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao validar disponibilidade:', error);
    return {
      success: false,
      reason: 'Erro interno na validação'
    };
  }
};

/**
 * Obtém estatísticas de agendamentos para um dia (compatibilidade)
 */
export const getDayAppointmentStats = async (date: string) => {
  try {
    const dayStats = await getDaySlotStats(date);
    
    // Converter para formato compatível com AppointmentStatsDisplay
    const hourlyStats = [];
    
    // Agrupar slots por hora
    const hourGroups: { [hour: number]: { current: number; limit: number } } = {};
    
    dayStats.slots.forEach(slot => {
      const hour = parseInt(slot.timeSlot.split(':')[0]);
      if (!hourGroups[hour]) {
        hourGroups[hour] = { current: 0, limit: 0 };
      }
      hourGroups[hour].current += slot.current;
      hourGroups[hour].limit += slot.limit;
    });
    
    // Converter para array de estatísticas por hora
    for (let hour = 6; hour < 17; hour++) {
      const group = hourGroups[hour] || { current: 0, limit: 0 };
      hourlyStats.push({
        hour,
        current: group.current,
        limit: group.limit,
        available: group.current < group.limit && group.limit > 0
      });
    }
    
    // Calcular totais por turno
    const morningTotal = hourlyStats
      .filter(h => h.hour >= 6 && h.hour < 12)
      .reduce((sum, h) => sum + h.current, 0);
      
    const afternoonTotal = hourlyStats
      .filter(h => h.hour >= 12 && h.hour < 17)
      .reduce((sum, h) => sum + h.current, 0);
    
    return {
      date,
      morningTotal,
      afternoonTotal,
      hourlyStats
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas do dia:', error);
    return {
      date,
      morningTotal: 0,
      afternoonTotal: 0,
      hourlyStats: []
    };
  }
};

/**
 * Obtém limites da clínica (mantido para compatibilidade)
 */
export const getClinicLimits = async () => {
  // Retorna estrutura compatível com sistema antigo
  return {
    morningEarly: 2,
    morningLate: 1,
    afternoon: 1,
    evening: 1,
    morningShiftTotal: 100,
    afternoonShiftTotal: 50
  };
};

/**
 * Salva limites da clínica (mantido para compatibilidade)
 */
export const saveClinicLimits = async (limits: any) => {
  console.log('⚠️ saveClinicLimits foi chamado, mas agora usamos SlotLimitsManager');
  // Não faz nada, pois agora usamos o SlotLimitsManager
  return;
};

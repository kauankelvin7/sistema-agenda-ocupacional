
import { 
  collection, 
  query, 
  getDocs, 
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppointmentStatus } from "@/types";
import { format, isValid } from "date-fns";
import { getSlotLimit } from "./slot-limits-service";
import { SlotAvailability, DaySlotStats } from "@/types/slot-limits";

/**
 * Serviço para verificar disponibilidade de slots em tempo real
 */

/**
 * Conta agendamentos para um slot específico em uma data
 */
export const countAppointmentsForSlot = async (
  date: string, 
  timeSlot: string
): Promise<number> => {
  try {
    const appointmentsRef = collection(db, "appointments");
    const q = query(
      appointmentsRef,
      where("status", "in", [
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.COMPLETED
      ])
    );
    
    const querySnapshot = await getDocs(q);
    let count = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.date) {
        try {
          const appointmentDate = new Date(data.date);
          const appointmentDateStr = format(appointmentDate, 'yyyy-MM-dd');
          const appointmentTimeStr = format(appointmentDate, 'HH:mm');
          
          if (appointmentDateStr === date && appointmentTimeStr === timeSlot) {
            count++;
          }
        } catch (error) {
          console.error('Erro ao processar agendamento:', error);
        }
      }
    });
    
    return count;
  } catch (error) {
    console.error('Erro ao contar agendamentos por slot:', error);
    return 0;
  }
};

/**
 * Verifica se um slot específico está disponível
 */
export const checkSlotAvailability = async (
  date: string, 
  timeSlot: string
): Promise<{ available: boolean; reason?: string; current: number; limit: number }> => {
  try {
    const hour = parseInt(timeSlot.split(':')[0]);
    const minute = parseInt(timeSlot.split(':')[1]);
    
    // Verificar horário de funcionamento
    if (hour < 6 || hour > 16 || (hour === 16 && minute > 45) || (hour === 6 && minute < 30)) {
      return {
        available: false,
        reason: 'Fora do horário de funcionamento (6:30 - 16:45)',
        current: 0,
        limit: 0
      };
    }
    
    const [currentCount, slotLimit] = await Promise.all([
      countAppointmentsForSlot(date, timeSlot),
      getSlotLimit(timeSlot)
    ]);
    
    if (slotLimit === 0) {
      return {
        available: false,
        reason: 'Slot sem limite configurado',
        current: currentCount,
        limit: slotLimit
      };
    }
    
    const available = currentCount < slotLimit;
    
    return {
      available,
      reason: available ? undefined : `Slot esgotado (${currentCount}/${slotLimit})`,
      current: currentCount,
      limit: slotLimit
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do slot:', error);
    return {
      available: false,
      reason: 'Erro ao verificar disponibilidade',
      current: 0,
      limit: 0
    };
  }
};

/**
 * Obtém estatísticas de todos os slots para um dia
 */
export const getDaySlotStats = async (date: string): Promise<DaySlotStats> => {
  try {
    const slots: SlotAvailability[] = [];
    
    // Gerar todos os slots do dia
    for (let hour = 6; hour < 17; hour++) {
      for (let minute of [0, 15, 30, 45]) {
        if (hour === 6 && minute < 30) continue;
        if (hour === 16 && minute > 45) continue;
        
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        const [current, limit] = await Promise.all([
          countAppointmentsForSlot(date, timeSlot),
          getSlotLimit(timeSlot)
        ]);
        
        slots.push({
          timeSlot,
          limit,
          current,
          available: current < limit && limit > 0,
          occupancyRate: limit > 0 ? Math.round((current / limit) * 100) : 0
        });
      }
    }
    
    const totalBooked = slots.reduce((sum, slot) => sum + slot.current, 0);
    const totalAvailable = slots.filter(slot => slot.available).length;
    
    return {
      date,
      slots,
      totalAvailable,
      totalBooked
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas do dia:', error);
    return {
      date,
      slots: [],
      totalAvailable: 0,
      totalBooked: 0
    };
  }
};

/**
 * Valida se um agendamento pode ser criado
 */
export const validateSlotAvailability = async (
  date: string,
  timeSlot: string
): Promise<{ success: boolean; reason?: string }> => {
  try {
    const availability = await checkSlotAvailability(date, timeSlot);
    
    if (!availability.available) {
      return {
        success: false,
        reason: availability.reason || 'Slot não disponível'
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


import { AppointmentLimits, ExamShift, AppointmentStatus } from "@/types";
import { format, parseISO, isValid } from "date-fns";

/**
 * Utilitários para limites de agendamento
 */

/**
 * Determina a faixa de horário baseada na hora
 */
export function getTimeSlot(hour: number): 'morning-early' | 'morning-late' | 'afternoon' | 'evening' {
  if (hour >= 6 && hour < 8) {
    return 'morning-early'; // 6:30-8:00 usa limite morning-early
  } else if (hour >= 8 && hour < 10) {
    return 'morning-early'; // 8:00-10:00 (7 pessoas)
  } else if (hour >= 10 && hour < 12) {
    return 'morning-late'; // 10:00-12:00 (3 pessoas)
  } else if (hour >= 12 && hour < 16) {
    return 'afternoon'; // 12:00-16:00 (3 pessoas)
  } else {
    return 'evening'; // 16:00-16:45 (1 pessoa)
  }
}

/**
 * Obtém limite por faixa de horário
 */
export function getHourLimit(hour: number, limits: AppointmentLimits): number {
  const timeSlot = getTimeSlot(hour);
  
  switch (timeSlot) {
    case 'morning-early':
      return limits.morningEarly;
    case 'morning-late':
      return limits.morningLate;
    case 'afternoon':
      return limits.afternoon;
    case 'evening':
      return limits.evening;
    default:
      return 0;
  }
}

/**
 * Determina o turno baseado na hora
 */
export function getShiftFromHour(hour: number): ExamShift {
  return hour >= 6 && hour < 12 ? ExamShift.MORNING : ExamShift.AFTERNOON;
}

/**
 * Obtém limite por turno
 */
export function getShiftLimit(shift: ExamShift, limits: AppointmentLimits): number {
  return shift === ExamShift.MORNING ? limits.morningShiftTotal : limits.afternoonShiftTotal;
}

/**
 * Verifica se o agendamento deve ser contado
 */
export function shouldCountAppointment(appointment: any): boolean {
  return appointment.status !== AppointmentStatus.CANCELED && 
         appointment.status !== AppointmentStatus.ARCHIVED;
}

/**
 * Formata data para comparação
 */
export function formatDateForComparison(date: string): string {
  return format(parseISO(date), 'yyyy-MM-dd');
}

/**
 * Valida se a data é válida
 */
export function isValidAppointmentDate(date: string): boolean {
  try {
    const appointmentDate = new Date(`${date}T00:00:00`);
    return isValid(appointmentDate);
  } catch {
    return false;
  }
}


/**
 * Serviço principal de agendamentos - Arquivo refatorado
 * Este arquivo agora importa funções de módulos especializados
 */

// Exportar todas as funções dos módulos especializados
export * from './appointment-validation';
export * from './appointment-queries';
export * from './appointment-mutations';
export * from './appointment-attachments';

// Manter compatibilidade com imports existentes
export { 
  getAppointments,
  getAppointmentsWithDetails,
  getAppointment,
  getAllAppointments,
  getCompanyAppointments
} from './appointment-queries';

export {
  createAppointment,
  updateAppointment,
  clearAllAppointments,
  clearAppointmentsByStatus,
  deleteAppointment
} from './appointment-mutations';

export {
  attachFileToAppointment,
  removeFileFromAppointment
} from './appointment-attachments';

export {
  validateAppointmentData,
  isAppointment,
  sanitizeString,
  normalizeDateString,
  safeFormatDate,
  canManageAttachments
} from './appointment-validation';

/**
 * Verifica se uma data está bloqueada
 */
import { getBlockedDates } from "./blocked-dates-service";
import { normalizeDateString } from './appointment-validation';

export async function isDateBlocked(date: string | Date): Promise<boolean> {
  try {
    if (!date) {
      return false;
    }

    // Obter todas as datas bloqueadas
    const blockedDates = await getBlockedDates();
    
    // Formatar a data de entrada para comparação
    const formattedDate = normalizeDateString(date);
    if (!formattedDate) return false;
    
    // Verificar se a data existe nas datas bloqueadas
    return blockedDates.some(blockedDate => 
      blockedDate.date === formattedDate
    );
  } catch (error) {
    return false;
  }
}

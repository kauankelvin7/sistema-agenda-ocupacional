
import { AppointmentStatus, Appointment } from "@/types";
import { isValid, format, isBefore, isAfter } from "date-fns";

/**
 * Serviço de validação de agendamentos com segurança aprimorada
 * Provides comprehensive validation for appointment data
 */

/**
 * Validates appointment data with comprehensive checks
 * @param data Appointment data to validate
 * @returns Boolean indicating if data is valid
 */
export const validateAppointmentData = (data: any): boolean => {
  if (!data || typeof data !== 'object') {
    console.warn('Invalid appointment data: not an object');
    return false;
  }

  const requiredFields = ['companyId', 'employeeId', 'examTypeId', 'date', 'status'];
  
  const isValid = requiredFields.every(field => {
    const value = data[field];
    const isFieldValid = value !== undefined && 
                        value !== null && 
                        value !== "" && 
                        String(value).trim() !== "";
    
    if (!isFieldValid) {
      console.warn(`Invalid appointment data: missing or empty field '${field}'`);
    }
    
    return isFieldValid;
  });
  
  return isValid;
};

/**
 * Type guard to check if data is a valid Appointment
 * @param data Data to check
 * @returns Type predicate for Appointment
 */
export const isAppointment = (data: any): data is Appointment => {
  return data && 
         typeof data === 'object' && 
         'id' in data &&
         validateAppointmentData(data);
};

/**
 * Sanitizes string input to prevent XSS and other security issues
 * @param input Input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    console.warn('sanitizeString: input is not a string');
    return '';
  }
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 500); // Limit length to prevent DoS
};

/**
 * Normalizes date string to YYYY-MM-DD format with validation
 * @param dateStr Date string or Date object
 * @returns Normalized date string or null if invalid
 */
export const normalizeDateString = (dateStr: string | Date | null): string | null => {
  if (!dateStr) {
    return null;
  }
  
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    
    if (!isValid(date)) {
      console.warn('normalizeDateString: invalid date provided');
      return null;
    }
    
    // Check for reasonable date ranges (not too far in past or future)
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 10, 0, 1); // 10 years ago
    const maxDate = new Date(now.getFullYear() + 2, 11, 31); // 2 years in future
    
    if (isBefore(date, minDate) || isAfter(date, maxDate)) {
      console.warn('normalizeDateString: date outside reasonable range');
      return null;
    }
    
    return format(date, "yyyy-MM-dd");
  } catch (error) {
    console.error('normalizeDateString: error processing date', error);
    return null;
  }
};

/**
 * Safely formats date for display with error handling
 * @param dateString Date string or Date object
 * @returns Formatted date string or error message
 */
export const safeFormatDate = (dateString: string | Date | null): string => {
  if (!dateString) {
    return "Data não informada";
  }
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return isValid(date) ? format(date, "dd/MM/yyyy") : "Data inválida";
  } catch (error) {
    console.error('safeFormatDate: error formatting date', error);
    return "Erro na data";
  }
};

/**
 * Validates appointment date and time with business rules
 * @param appointmentData Appointment data to validate
 * @throws Error with specific validation message
 */
export const validateAppointmentDateTime = async (
  appointmentData: Omit<Appointment, "id">
): Promise<void> => {
  if (!appointmentData.date) {
    throw new Error("Data do agendamento é obrigatória");
  }

  const appointmentDate = new Date(appointmentData.date);
  
  if (!isValid(appointmentDate)) {
    throw new Error("Data do agendamento é inválida");
  }

  // Check if date is in the past (except for today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentDay = new Date(appointmentDate);
  appointmentDay.setHours(0, 0, 0, 0);
  
  if (isBefore(appointmentDay, today)) {
    throw new Error("Não é possível agendar em datas passadas");
  }

  // Business hours validation (6:30 AM to 4:45 PM)
  const hours = appointmentDate.getHours();
  const minutes = appointmentDate.getMinutes();
  
  const timeInMinutes = hours * 60 + minutes;
  const startTime = 6 * 60 + 30; // 6:30 AM
  const endTime = 16 * 60 + 45;  // 4:45 PM
  
  if (timeInMinutes < startTime || timeInMinutes > endTime) {
    throw new Error("Horário fora do funcionamento da clínica (6:30 - 16:45)");
  }

  // Weekend validation (optional - uncomment if needed)
  // const dayOfWeek = appointmentDate.getDay();
  // if (dayOfWeek === 0 || dayOfWeek === 6) {
  //   throw new Error("Agendamentos não são permitidos nos finais de semana");
  // }
};

/**
 * Validates time constraints for appointments with additional exams
 * @param appointmentData Appointment data to validate
 * @throws Error if time constraints are violated
 */
export const validateAdditionalExamsTime = (appointmentData: Omit<Appointment, "id">): void => {
  if (!appointmentData.hasAdditionalExams || !appointmentData.date) {
    return;
  }

  const appointmentDate = new Date(appointmentData.date);
  const hours = appointmentDate.getHours();
  const minutes = appointmentDate.getMinutes();
  
  const timeInMinutes = hours * 60 + minutes;
  const startTime = 6 * 60 + 30; // 6:30 AM
  const endTime = 12 * 60;       // 12:00 PM
  
  if (timeInMinutes < startTime || timeInMinutes >= endTime) {
    throw new Error("Agendamentos com exames complementares só podem ser marcados entre 6:30 e 12:00");
  }
};

/**
 * Checks if user can manage attachments based on appointment status
 * @param status Current appointment status
 * @returns Boolean indicating if attachments can be managed
 */
export const canManageAttachments = (status: AppointmentStatus): boolean => {
  return status === AppointmentStatus.SCHEDULED;
};

/**
 * Validates complete appointment with all business rules
 * @param appointmentData Appointment data to validate
 * @returns Validation result with errors if any
 */
export const validateCompleteAppointment = async (
  appointmentData: Omit<Appointment, "id">
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  try {
    // Basic data validation
    if (!validateAppointmentData(appointmentData)) {
      errors.push("Dados obrigatórios não preenchidos ou inválidos");
    }
    
    // Individual field validations with sanitization
    if (!appointmentData.companyId || sanitizeString(appointmentData.companyId).trim() === "") {
      errors.push("ID da empresa é obrigatório");
    }
    
    if (!appointmentData.employeeId || sanitizeString(appointmentData.employeeId).trim() === "") {
      errors.push("ID do funcionário é obrigatório");
    }
    
    if (!appointmentData.examTypeId || sanitizeString(appointmentData.examTypeId).trim() === "") {
      errors.push("ID do tipo de exame é obrigatório");
    }
    
    // Date and time validation
    try {
      await validateAppointmentDateTime(appointmentData);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Erro na validação de data/horário");
    }
    
    // Additional exams time validation
    try {
      validateAdditionalExamsTime(appointmentData);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Erro na validação de horário para exames complementares");
    }
    
    // Custom field validations - removed notes validation since it doesn't exist in Appointment type
    if (appointmentData.description && appointmentData.description.length > 1000) {
      errors.push("Descrição não pode exceder 1000 caracteres");
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('validateCompleteAppointment: unexpected error', error);
    return {
      valid: false,
      errors: ["Erro interno na validação"]
    };
  }
};

/**
 * Validates appointment status transition
 * @param currentStatus Current appointment status
 * @param newStatus New appointment status
 * @returns Boolean indicating if transition is valid
 */
export const validateStatusTransition = (
  currentStatus: AppointmentStatus, 
  newStatus: AppointmentStatus
): boolean => {
  const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    [AppointmentStatus.SCHEDULED]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW],
    [AppointmentStatus.COMPLETED]: [], // Final state
    [AppointmentStatus.CANCELED]: [], // Final state
    [AppointmentStatus.NO_SHOW]: [], // Final state
    [AppointmentStatus.ARCHIVED]: [], // Final state
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};


import { 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc,
  deleteDoc,
  writeBatch,
  collection,
  query,
  getDocs,
  where,
  getDoc,
  limit,
  orderBy,
  startAfter,
  DocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Appointment, AppointmentStatus, ExamShift } from "@/types";
import { format, isValid } from "date-fns";
import { 
  validateAppointmentData, 
  sanitizeString, 
  validateAppointmentDateTime,
  validateAdditionalExamsTime,
  canManageAttachments 
} from "./appointment-validation";

/**
 * Cria um novo agendamento
 */
/**
 * Cria um novo agendamento
 */
export async function createAppointment(appointmentData: Omit<Appointment, "id">): Promise<Appointment> {
  try {
    // Validar campos obrigatórios
    if (!validateAppointmentData(appointmentData)) {
      throw new Error("Campos obrigatórios não preenchidos");
    }
    
    // Validar data e horário
    await validateAppointmentDateTime(appointmentData);
    
    // Validar horário para exames complementares
    validateAdditionalExamsTime(appointmentData);
    
    // Sanitizar dados
    const sanitizedData = {
      ...appointmentData,
      description: appointmentData.description ? sanitizeString(appointmentData.description) : "",
      sector: appointmentData.sector ? sanitizeString(appointmentData.sector) : "",
      createdAt: appointmentData.createdAt || Date.now(),
      hasAdditionalExams: appointmentData.hasAdditionalExams || false,
      // Adicionar índices para consultas rápidas
      dateIndex: appointmentData.date ? format(new Date(appointmentData.date), "yyyy-MM-dd") : "",
      hourIndex: appointmentData.date ? new Date(appointmentData.date).getHours() : 0,
      companyEmployeeIndex: `${appointmentData.companyId}_${appointmentData.employeeId}`,
      // Adicionar campos para relatórios
      yearMonth: appointmentData.date ? format(new Date(appointmentData.date), "yyyy-MM") : "",
      isActive: true
    };
    
    // Determinar turno baseado no horário
    if (!sanitizedData.shift && sanitizedData.date) {
      const appointmentDate = new Date(sanitizedData.date);
      const hours = appointmentDate.getHours();
      sanitizedData.shift = hours >= 6 && hours <= 12 ? ExamShift.MORNING : ExamShift.AFTERNOON;
    }
    
    // Garantir que a data seja armazenada como string ISO
    if (sanitizedData.date) {
      const dateObj = new Date(sanitizedData.date);
      if (isValid(dateObj)) {
        sanitizedData.date = dateObj.toISOString();
      } else {
        throw new Error("Formato de data inválido");
      }
    }

    // Remover campos undefined (especialmente attachmentUrl)
    Object.keys(sanitizedData).forEach((key) => {
      if (sanitizedData[key] === undefined) {
        delete sanitizedData[key];
      }
    });
    
    // Usar batch write para consistência
    const batch = writeBatch(db);
    const appointmentsRef = collection(db, "appointments");
    const docRef = doc(appointmentsRef);
    
    batch.set(docRef, sanitizedData);
    
    await batch.commit();
    
    return {
      id: docRef.id,
      ...sanitizedData
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza um agendamento existente
 */
export async function updateAppointment(id: string, appointmentData: Partial<Appointment>): Promise<void> {
  try {
    // Validar ID
    if (!id || typeof id !== 'string') {
      throw new Error("ID do agendamento inválido");
    }

    // Sanitizar dados
    const sanitizedData = { ...appointmentData };
    if (sanitizedData.description) {
      sanitizedData.description = sanitizeString(sanitizedData.description);
    }
    if (sanitizedData.sector) {
      sanitizedData.sector = sanitizeString(sanitizedData.sector);
    }

    // Capturar horário de conclusão com timestamp preciso
    if (sanitizedData.status === AppointmentStatus.COMPLETED) {
      sanitizedData.completedAt = Date.now();
      sanitizedData.completedAtISO = new Date().toISOString();
    }

    // Atualizar índices se a data mudou
    if (sanitizedData.date) {
      const dateObj = new Date(sanitizedData.date);
      if (isValid(dateObj)) {
        sanitizedData.date = dateObj.toISOString();
        sanitizedData.dateIndex = format(dateObj, "yyyy-MM-dd");
        sanitizedData.hourIndex = dateObj.getHours();
        sanitizedData.yearMonth = format(dateObj, "yyyy-MM");
      }
    }

    // Remover anexos se status não for SCHEDULED
    if (sanitizedData.status && sanitizedData.status !== AppointmentStatus.SCHEDULED) {
      try {
        const appointmentDoc = await getDoc(doc(db, "appointments", id));
        if (appointmentDoc.exists() && appointmentDoc.data().attachmentUrl) {
          sanitizedData.attachmentUrl = null;
          sanitizedData.attachmentName = null;
        }
      } catch (error) {
        // Falha silenciosa para não quebrar a atualização
      }
    }
    
    // Usar batch para consistência
    const batch = writeBatch(db);
    const appointmentRef = doc(db, "appointments", id);
    
    batch.update(appointmentRef, {
      ...sanitizedData,
      updatedAt: Date.now()
    });
    
    await batch.commit();
  } catch (error) {
    throw error;
  }
}

/**
 * Operações em lote para alta performance
 */
export async function batchUpdateAppointments(
  updates: Array<{ id: string; data: Partial<Appointment> }>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const timestamp = Date.now();
    
    updates.forEach(({ id, data }) => {
      const appointmentRef = doc(db, "appointments", id);
      batch.update(appointmentRef, {
        ...data,
        updatedAt: timestamp
      });
    });
    
    await batch.commit();
  } catch (error) {
    throw error;
  }
}

/**
 * Deleta permanentemente um agendamento
 */
export async function deleteAppointment(id: string): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error("ID do agendamento inválido");
    }

    const appointmentRef = doc(db, "appointments", id);
    await deleteDoc(appointmentRef);
  } catch (error) {
    throw error;
  }
}

/**
 * Limpa agendamentos por status (delete permanente)
 */
export async function clearAppointmentsByStatus(status: AppointmentStatus): Promise<void> {
  try {
    const appointmentsRef = collection(db, "appointments");
    const querySnapshot = await getDocs(query(appointmentsRef, where("status", "==", status)));
    
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    throw error;
  }
}

/**
 * Limpa todos os agendamentos (delete permanente)
 */
export async function clearAllAppointments(): Promise<void> {
  try {
    const appointmentsRef = collection(db, "appointments");
    const querySnapshot = await getDocs(appointmentsRef);
    
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    throw error;
  }
}

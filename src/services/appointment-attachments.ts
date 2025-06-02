
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppointmentStatus } from "@/types";
import { sanitizeString, canManageAttachments } from "./appointment-validation";

/**
 * Anexa arquivo a um agendamento
 */
export async function attachFileToAppointment(
  appointmentId: string,
  fileData: string,
  fileName: string
): Promise<void> {
  try {
    // Validar entradas
    if (!appointmentId || typeof appointmentId !== 'string') {
      throw new Error("Invalid appointment ID");
    }
    if (!fileData || typeof fileData !== 'string') {
      throw new Error("Invalid file data");
    }
    if (!fileName || typeof fileName !== 'string') {
      throw new Error("Invalid file name");
    }

    // Sanitizar nome do arquivo
    const sanitizedFileName = sanitizeString(fileName);
    
    // Verificar tamanho do arquivo (aproximação da string base64)
    if (fileData.length > 5000000) { // ~5MB limite
      throw new Error("File size too large");
    }
    
    // Verificar se o status permite anexos
    const appointmentRef = doc(db, "appointments", appointmentId);
    const appointmentDoc = await getDoc(appointmentRef);
    
    if (!appointmentDoc.exists()) {
      throw new Error("Appointment not found");
    }
    
    const appointmentData = appointmentDoc.data();
    
    if (!canManageAttachments(appointmentData.status)) {
      throw new Error("Cannot attach files to appointments with this status");
    }
    
    // Armazenar arquivo como dados base64
    await updateDoc(appointmentRef, {
      attachmentUrl: fileData,
      attachmentName: sanitizedFileName
    });
  } catch (error) {
    console.error("Error attaching file to appointment:", error);
    throw error;
  }
}

/**
 * Remove anexo de um agendamento
 */
export async function removeFileFromAppointment(appointmentId: string): Promise<void> {
  try {
    // Validar entrada
    if (!appointmentId || typeof appointmentId !== 'string') {
      throw new Error("Invalid appointment ID");
    }

    // Verificar se o agendamento existe
    const appointmentRef = doc(db, "appointments", appointmentId);
    const appointmentDoc = await getDoc(appointmentRef);
    
    if (!appointmentDoc.exists()) {
      throw new Error("Appointment not found");
    }
    
    // Remover dados do anexo
    await updateDoc(appointmentRef, {
      attachmentUrl: null,
      attachmentName: null
    });
  } catch (error) {
    console.error("Error removing file from appointment:", error);
    throw error;
  }
}

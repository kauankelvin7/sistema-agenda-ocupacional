
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Appointment, AppointmentStatus, AppointmentWithDetails, Company, Employee, ExamType } from "@/types";
import { isAppointment, validateAppointmentData, sanitizeString } from "./appointment-validation";

export async function getAppointments(
  companyId?: string, 
  status?: AppointmentStatus
): Promise<Appointment[]> {
  try {
    if (companyId && typeof companyId !== 'string') {
      throw new Error('Invalid company ID format');
    }
    if (status && !Object.values(AppointmentStatus).includes(status)) {
      throw new Error('Invalid appointment status');
    }

    const appointmentsRef = collection(db, "appointments");
    
    let appointmentsQuery = query(appointmentsRef);
    
    if (companyId) {
      appointmentsQuery = query(appointmentsRef, where("companyId", "==", companyId));
    }
    
    if (status) {
      appointmentsQuery = query(appointmentsRef, where("status", "==", status));
    }
    
    const querySnapshot = await getDocs(appointmentsQuery);
    
    const appointments: Appointment[] = [];
    querySnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };
      if (isAppointment(data) && validateAppointmentData(data)) {
        appointments.push(data as Appointment);
      }
    });
    
    return appointments;
  } catch (error) {
    throw error;
  }
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  try {
    const appointmentRef = doc(db, "appointments", id);
    const docSnap = await getDoc(appointmentRef);
    
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      if (isAppointment(data)) {
        return data as Appointment;
      }
    }
    
    return null;
  } catch (error) {
    throw error;
  }
}

async function fetchRelatedData(appointments: Appointment[]) {
  const employeeMap = new Map<string, Employee>();
  const companyMap = new Map<string, Company>();
  const examTypeMap = new Map<string, ExamType>();
  
  const employeeIds = [...new Set(appointments.map(a => a.employeeId).filter(Boolean))];
  const companyIds = [...new Set(appointments.map(a => a.companyId).filter(Boolean))];
  const examTypeIds = [...new Set(appointments.map(a => a.examTypeId).filter(Boolean))];
  
  // Buscar funcionários
  for (const employeeId of employeeIds) {
    try {
      const employeeDoc = await getDoc(doc(db, "employees", employeeId));
      if (employeeDoc.exists()) {
        const employeeData = employeeDoc.data();
        
        let formattedDateOfBirth = employeeData.dateOfBirth || "";
        if (formattedDateOfBirth) {
          try {
            if (formattedDateOfBirth.includes('-') && formattedDateOfBirth.length === 10) {
              const [year, month, day] = formattedDateOfBirth.split('-');
              formattedDateOfBirth = `${day}/${month}/${year}`;
            }
            else if (formattedDateOfBirth.includes('/') && formattedDateOfBirth.length === 10) {
              // Já está no formato correto
            }
            else {
              const date = new Date(formattedDateOfBirth);
              if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                formattedDateOfBirth = `${day}/${month}/${year}`;
              }
            }
          } catch (error) {
            // Manter data original se não conseguir formatar
          }
        }
        
        employeeMap.set(employeeId, { 
          id: employeeId, 
          ...employeeData,
          dateOfBirth: formattedDateOfBirth,
          sector: sanitizeString(employeeData.sector || ''),
          role: sanitizeString(employeeData.role || '')
        } as Employee);
      }
    } catch (error) {
      // Falha silenciosa para não quebrar o carregamento
    }
  }
  
  // Buscar empresas
  for (const companyId of companyIds) {
    try {
      const companyDoc = await getDoc(doc(db, "companies", companyId));
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        
        const company = { 
          id: companyId, 
          ...companyData,
          name: sanitizeString(companyData.name || ''),
          cnpj: sanitizeString(companyData.cnpj || '')
        } as Company;
        
        companyMap.set(companyId, company);
      }
    } catch (error) {
      // Falha silenciosa
    }
  }
  
  // Buscar tipos de exame
  for (const examTypeId of examTypeIds) {
    try {
      const examTypeDoc = await getDoc(doc(db, "examTypes", examTypeId));
      if (examTypeDoc.exists()) {
        const examTypeData = examTypeDoc.data();
        examTypeMap.set(examTypeId, { id: examTypeId, ...examTypeData } as ExamType);
      }
    } catch (error) {
      // Falha silenciosa
    }
  }
  
  return { employeeMap, companyMap, examTypeMap };
}

export async function getAppointmentsWithDetails(
  companyId?: string, 
  status?: AppointmentStatus
): Promise<AppointmentWithDetails[]> {
  try {
    const appointments = await getAppointments(companyId, status);
    
    if (appointments.length === 0) {
      return [];
    }
    
    const { employeeMap, companyMap, examTypeMap } = await fetchRelatedData(appointments);
    
    const appointmentsWithDetails: AppointmentWithDetails[] = appointments.map((appointment) => {
      const employee = employeeMap.get(appointment.employeeId);
      const company = companyMap.get(appointment.companyId);
      const examType = examTypeMap.get(appointment.examTypeId);
      
      let finalSector = "Não informado";
      if (appointment.sector && appointment.sector.trim()) {
        finalSector = sanitizeString(appointment.sector);
      } else if (employee?.sector && employee.sector.trim()) {
        finalSector = sanitizeString(employee.sector);
      }
      
      let formattedPatientBirthdate = appointment.patientBirthdate;
      if (formattedPatientBirthdate) {
        try {
          if (formattedPatientBirthdate.includes('-') && formattedPatientBirthdate.length === 10) {
            const [year, month, day] = formattedPatientBirthdate.split('-');
            formattedPatientBirthdate = `${day}/${month}/${year}`;
          }
        } catch (error) {
          // Manter formato original
        }
      }
      
      return {
        ...appointment,
        patientBirthdate: formattedPatientBirthdate,
        employee: employee,
        company: company,
        examType: examType,
        sector: finalSector
      };
    });
    
    return appointmentsWithDetails;
  } catch (error) {
    throw error;
  }
}

export const getAllAppointments = () => getAppointments();
export const getCompanyAppointments = (companyId: string) => getAppointments(companyId);


export enum UserRole {
  ADMIN = "admin",
  COMPANY = "company",
}

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELED = "canceled",
  NO_SHOW = "no_show",
  ARCHIVED = "archived",
}

export enum ExamShift {
  MORNING = "morning",
  AFTERNOON = "afternoon",
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
  companyId?: string;
}

export interface Employee {
  id: string;
  name: string;
  cpf: string;
  companyId: string;
  role: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  sector: string;
  phone?: string;
  email?: string;
  createdAt: number;
  archivedAt?: number;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  cnpj?: string;
  phone?: string;
  createdAt: number;
  archivedAt?: number;
}

export interface ExamType {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  archivedAt?: number;
}

export interface Appointment {
  id: string;
  companyId: string;
  employeeId: string;
  examTypeId: string;
  date: string;
  status: AppointmentStatus;
  createdAt: number;
  completedAt?: number;
  completedAtISO?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  description?: string;
  hasAdditionalExams?: boolean;
  shift?: ExamShift;
  sector?: string;
  archivedAt?: number;
  originalStatus?: AppointmentStatus;
  patientBirthdate?: string;
  canceledAt?: number;
  canceledBy?: string;
  dateIndex?: string;
  hourIndex?: number;
  companyEmployeeIndex?: string;
  yearMonth?: string;
  isActive?: boolean;
  updatedAt?: number;
}

export interface AppointmentWithDetails extends Appointment {
  employee?: Employee;
  company?: Company;
  examType?: ExamType;
  originalStatus?: AppointmentStatus;
}

export interface ClinicCapacity {
  id: string;
  date: string;
  morningCapacity: number;
  morningBooked: number;
  afternoonCapacity: number;
  afternoonBooked: number;
  createdAt: number;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  createdAt: number;
}

export interface AppointmentLimits {
  id?: string;
  morningEarly: number;
  morningLate: number;
  afternoon: number;
  evening: number;
  morningShiftTotal: number;
  afternoonShiftTotal: number;
  createdAt?: number;
  updatedAt?: number;
}

export type NotificationType = "info" | "warning" | "success" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  recipientId: string;
  createdAt: Date;
  read: boolean;
  type: NotificationType;
}

export interface HourlySlotConfig {
  hour: number;
  limit: number;
  period: 'morning-early' | 'morning-late' | 'afternoon' | 'evening';
}

export interface AppointmentStats {
  date: string;
  morningTotal: number;
  afternoonTotal: number;
  hourlyStats: Array<{
    hour: number;
    current: number;
    limit: number;
    available: boolean;
  }>;
}

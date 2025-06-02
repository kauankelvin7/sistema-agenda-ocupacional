
export interface AppointmentLimits {
  id?: string;
  // Limites por faixa de horário
  morningEarly: number; // 8:00-10:00 (7 pessoas por horário)
  morningLate: number;  // 10:00-12:00 (3 pessoas por horário)
  afternoon: number;    // 12:00-16:00 (3 pessoas por horário)
  evening: number;      // 16:00-16:45 (1 pessoa por horário)
  
  // Limites totais por turno
  morningShiftTotal: number; // 110 agendamentos manhã
  afternoonShiftTotal: number; // 60 agendamentos tarde
  
  createdAt?: number;
  updatedAt?: number;
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

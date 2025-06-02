
export interface SlotLimit {
  id?: string;
  timeSlot: string; // formato "HH:mm" (ex: "08:30")
  limit: number; // quantas pessoas podem agendar neste slot
  createdAt?: number;
  updatedAt?: number;
}

export interface SlotAvailability {
  timeSlot: string;
  limit: number;
  current: number;
  available: boolean;
  occupancyRate: number;
}

export interface DaySlotStats {
  date: string;
  slots: SlotAvailability[];
  totalAvailable: number;
  totalBooked: number;
}

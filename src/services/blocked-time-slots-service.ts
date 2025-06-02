
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  addDoc, 
  deleteDoc, 
  where,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

export interface BlockedTimeSlot {
  id: string;
  date: string; // yyyy-MM-dd format
  timeSlot: string; // HH:mm format
  reason: string;
  createdAt: Timestamp;
}

// Sanitize string inputs
const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Get all blocked time slots for a specific date
export async function getBlockedTimeSlotsForDate(date: string | Date): Promise<BlockedTimeSlot[]> {
  try {
    let formattedDate: string;
    
    if (date instanceof Date) {
      formattedDate = format(date, "yyyy-MM-dd");
    } else {
      formattedDate = format(new Date(date), "yyyy-MM-dd");
    }
    
    console.log(`🔍 Fetching blocked slots for date: ${formattedDate}`);
    
    const blockedTimeSlotsRef = collection(db, "blockedTimeSlots");
    const q = query(
      blockedTimeSlotsRef, 
      where("date", "==", formattedDate),
      orderBy("timeSlot", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📋 Query executed, docs found: ${querySnapshot.size}`);
    
    const blockedTimeSlots: BlockedTimeSlot[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📄 Document found:`, { id: doc.id, data });
      
      blockedTimeSlots.push({
        id: doc.id,
        date: data.date,
        timeSlot: data.timeSlot,
        reason: sanitizeString(data.reason || ''),
        createdAt: data.createdAt || Timestamp.now()
      });
    });
    
    console.log(`🎯 Total blocked slots found: ${blockedTimeSlots.length}`, blockedTimeSlots);
    return blockedTimeSlots;
  } catch (error) {
    console.error("❌ Error getting blocked time slots:", error);
    return [];
  }
}

// Check if a specific time slot is blocked
export async function isTimeSlotBlocked(date: string | Date, timeSlot: string): Promise<boolean> {
  try {
    // Format date consistently for checking
    let formattedDate: string;
    if (date instanceof Date) {
      formattedDate = format(date, "yyyy-MM-dd");
    } else {
      formattedDate = format(new Date(date), "yyyy-MM-dd");
    }
    
    // Get all blocked slots for the date
    const blockedSlots = await getBlockedTimeSlotsForDate(formattedDate);
    
    // Check if the specific time slot is in the blocked slots
    const isBlocked = blockedSlots.some(slot => slot.timeSlot === timeSlot);
    console.log(`🎯 Time slot ${timeSlot} blocked result: ${isBlocked}`);
    
    return isBlocked;
  } catch (error) {
    console.error("❌ Error checking if time slot is blocked:", error);
    return false;
  }
}

// Add a blocked time slot
export async function addBlockedTimeSlot(date: string | Date, timeSlot: string, reason: string): Promise<BlockedTimeSlot> {
  try {
    console.log(`➕ Adding blocked time slot:`, { date, timeSlot, reason });
    
    let formattedDate: string;
    
    if (date instanceof Date) {
      formattedDate = format(date, "yyyy-MM-dd");
    } else {
      formattedDate = format(new Date(date), "yyyy-MM-dd");
    }
    
    if (!timeSlot || typeof timeSlot !== 'string') {
      throw new Error("Horário é obrigatório");
    }
    if (!reason || typeof reason !== 'string') {
      throw new Error("Motivo é obrigatório");
    }

    const sanitizedReason = sanitizeString(reason);
    
    if (!sanitizedReason.trim()) {
      throw new Error("Motivo não pode estar vazio");
    }
    
    // Check if time slot is already blocked
    const isBlocked = await isTimeSlotBlocked(formattedDate, timeSlot);
    if (isBlocked) {
      throw new Error("Este horário já está bloqueado");
    }
    
    const blockedTimeSlotData = {
      date: formattedDate,
      timeSlot: timeSlot,
      reason: sanitizedReason.trim(),
      createdAt: Timestamp.now()
    };
    
    const blockedTimeSlotsRef = collection(db, "blockedTimeSlots");
    const docRef = await addDoc(blockedTimeSlotsRef, blockedTimeSlotData);
    
    console.log(`✅ Successfully added blocked time slot with ID: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...blockedTimeSlotData
    };
  } catch (error) {
    console.error("❌ Error adding blocked time slot:", error);
    throw error;
  }
}

// Remove a blocked time slot
export async function removeBlockedTimeSlot(id: string): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error("ID inválido");
    }

    console.log(`🗑️ Removing blocked time slot with ID: ${id}`);
    
    const blockedTimeSlotRef = doc(db, "blockedTimeSlots", id);
    await deleteDoc(blockedTimeSlotRef);
    
    console.log(`✅ Successfully removed blocked time slot: ${id}`);
  } catch (error) {
    console.error("❌ Error removing blocked time slot:", error);
    throw error;
  }
}

// Get all blocked time slots
export async function getAllBlockedTimeSlots(): Promise<BlockedTimeSlot[]> {
  try {
    console.log("🔍 Fetching all blocked time slots");
    
    const blockedTimeSlotsRef = collection(db, "blockedTimeSlots");
    const q = query(blockedTimeSlotsRef, orderBy("date", "asc"), orderBy("timeSlot", "asc"));
    
    const querySnapshot = await getDocs(q);
    console.log(`📋 Total documents found: ${querySnapshot.size}`);
    
    const blockedTimeSlots: BlockedTimeSlot[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      if (data && data.date && data.timeSlot) {
        blockedTimeSlots.push({
          id: doc.id,
          date: data.date,
          timeSlot: data.timeSlot,
          reason: sanitizeString(data.reason || ''),
          createdAt: data.createdAt || Timestamp.now()
        });
      }
    });
    
    console.log(`🎯 Total blocked time slots: ${blockedTimeSlots.length}`);
    return blockedTimeSlots;
  } catch (error) {
    console.error("❌ Error getting all blocked time slots:", error);
    throw error;
  }
}

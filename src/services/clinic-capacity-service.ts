
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  where,
  runTransaction,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClinicCapacity, ExamShift } from "@/types";
import { format, isValid, parseISO } from "date-fns";

// Helper function to safely format dates
const safeFormatDate = (dateInput: string | Date): string => {
  if (!dateInput) throw new Error("Date is required");
  
  try {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      // Try to parse as ISO date first
      date = parseISO(dateInput);
      
      // If that fails, try to create a new Date object
      if (!isValid(date)) {
        date = new Date(dateInput);
      }
      
      // If still invalid and it's in yyyy-MM-dd format, parse manually
      if (!isValid(date) && dateInput.includes('-')) {
        const [year, month, day] = dateInput.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    } else {
      date = dateInput;
    }
    
    if (!isValid(date)) {
      throw new Error(`Invalid date: ${dateInput}`);
    }
    
    return format(date, "yyyy-MM-dd");
  } catch (error) {
    console.error("Error formatting date:", error, "Input:", dateInput);
    throw new Error(`Unable to format date: ${dateInput}`);
  }
};

// Get capacity for a specific date
export async function getCapacityForDate(date: string | Date): Promise<ClinicCapacity | null> {
  try {
    const formattedDate = safeFormatDate(date);
    const capacityRef = collection(db, "clinicCapacity");
    const q = query(capacityRef, where("date", "==", formattedDate));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as ClinicCapacity;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting capacity:", error);
    throw error;
  }
}

// Set capacity for a date
export async function setCapacityForDate(
  date: string | Date,
  morningCapacity: number,
  afternoonCapacity: number
): Promise<ClinicCapacity> {
  try {
    const formattedDate = safeFormatDate(date);
    
    // Check if capacity already exists for this date
    const existingCapacity = await getCapacityForDate(formattedDate);
    
    if (existingCapacity) {
      // Update existing capacity
      const capacityRef = doc(db, "clinicCapacity", existingCapacity.id);
      await updateDoc(capacityRef, {
        morningCapacity,
        afternoonCapacity,
      });
      
      return {
        ...existingCapacity,
        morningCapacity,
        afternoonCapacity,
      };
    } else {
      // Create new capacity
      const capacityRef = collection(db, "clinicCapacity");
      const newCapacityRef = doc(capacityRef);
      
      const capacityData: Omit<ClinicCapacity, "id"> = {
        date: formattedDate,
        morningCapacity,
        morningBooked: 0,
        afternoonCapacity,
        afternoonBooked: 0,
        createdAt: Date.now()
      };
      
      await setDoc(newCapacityRef, capacityData);
      
      return {
        id: newCapacityRef.id,
        ...capacityData
      };
    }
  } catch (error) {
    console.error("Error setting capacity:", error);
    throw error;
  }
}

// Check if there is available capacity for a given date and shift
export async function isCapacityAvailable(date: string | Date, shift: ExamShift): Promise<boolean> {
  try {
    const formattedDate = safeFormatDate(date);
    const capacity = await getCapacityForDate(formattedDate);
    
    // If no capacity is set, we assume there's no limit
    if (!capacity) return true;
    
    if (shift === ExamShift.MORNING) {
      return capacity.morningBooked < capacity.morningCapacity;
    } else {
      return capacity.afternoonBooked < capacity.afternoonCapacity;
    }
  } catch (error) {
    console.error("Error checking capacity:", error);
    throw error;
  }
}

// Update booking count when creating/canceling appointments
export async function updateCapacityBooking(date: string | Date, shift: ExamShift, increment: boolean): Promise<boolean> {
  try {
    const formattedDate = safeFormatDate(date);
    
    // Use a transaction to ensure proper update
    return await runTransaction(db, async (transaction) => {
      // Get current capacity document
      const capacityRef = collection(db, "clinicCapacity");
      const q = query(capacityRef, where("date", "==", formattedDate));
      const querySnapshot = await getDocs(q);
      
      // If no capacity document, create one with default values
      if (querySnapshot.empty) {
        const newCapacityRef = doc(capacityRef);
        const defaultCapacity = 10;
        
        const capacityData = {
          date: formattedDate,
          morningCapacity: defaultCapacity,
          morningBooked: shift === ExamShift.MORNING ? (increment ? 1 : 0) : 0,
          afternoonCapacity: defaultCapacity,
          afternoonBooked: shift === ExamShift.AFTERNOON ? (increment ? 1 : 0) : 0,
          createdAt: Date.now()
        };
        
        transaction.set(newCapacityRef, capacityData);
        return true;
      }
      
      // Update existing capacity document
      const capacityDoc = querySnapshot.docs[0];
      const capacityData = capacityDoc.data() as Omit<ClinicCapacity, "id">;
      
      if (shift === ExamShift.MORNING) {
        const newBookedCount = capacityData.morningBooked + (increment ? 1 : -1);
        
        // Prevent negative booking count
        if (newBookedCount < 0) {
          transaction.update(capacityDoc.ref, { morningBooked: 0 });
          return true;
        }
        
        // Check if there's capacity available
        if (increment && newBookedCount > capacityData.morningCapacity) {
          return false;
        }
        
        transaction.update(capacityDoc.ref, { morningBooked: newBookedCount });
      } else {
        const newBookedCount = capacityData.afternoonBooked + (increment ? 1 : -1);
        
        // Prevent negative booking count
        if (newBookedCount < 0) {
          transaction.update(capacityDoc.ref, { afternoonBooked: 0 });
          return true;
        }
        
        // Check if there's capacity available
        if (increment && newBookedCount > capacityData.afternoonCapacity) {
          return false;
        }
        
        transaction.update(capacityDoc.ref, { afternoonBooked: newBookedCount });
      }
      
      return true;
    });
  } catch (error) {
    console.error("Error updating capacity booking:", error);
    throw error;
  }
}

// Get all capacity settings
export async function getAllCapacitySettings(): Promise<ClinicCapacity[]> {
  try {
    const capacityRef = collection(db, "clinicCapacity");
    const querySnapshot = await getDocs(capacityRef);
    
    const capacitySettings: ClinicCapacity[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      capacitySettings.push({
        id: doc.id,
        date: data.date || "",
        morningCapacity: data.morningCapacity || 0,
        morningBooked: data.morningBooked || 0,
        afternoonCapacity: data.afternoonCapacity || 0,
        afternoonBooked: data.afternoonBooked || 0,
        createdAt: data.createdAt || Date.now()
      } as ClinicCapacity);
    });
    
    // Sort by date
    capacitySettings.sort((a, b) => {
      try {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        return 0;
      }
    });
    
    return capacitySettings;
  } catch (error) {
    console.error("Error getting all capacity settings:", error);
    throw error;
  }
}

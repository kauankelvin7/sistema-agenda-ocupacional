
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  addDoc, 
  deleteDoc, 
  where,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlockedDate } from "@/types";
import { format, parse, isValid } from "date-fns";

// Sanitize string inputs
const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Validate date format
const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  // Try to parse with Date first
  const date = new Date(dateString + 'T12:00:00');
  if (isValid(date)) return true;
  
  // Try different formats if direct parsing fails
  try {
    // Try yyyy-MM-dd format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return isValid(parse(dateString, 'yyyy-MM-dd', new Date()));
    }
    // Try dd/MM/yyyy format
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return isValid(parse(dateString, 'dd/MM/yyyy', new Date()));
    }
  } catch (error) {
    console.error("Date parsing error:", error);
    return false;
  }
  
  return false;
};

// Get all blocked dates
export async function getBlockedDates(): Promise<BlockedDate[]> {
  try {
    const blockedDatesRef = collection(db, "blockedDates");
    const q = query(blockedDatesRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    
    const blockedDates: BlockedDate[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.date && data.reason) {
        blockedDates.push({
          id: doc.id,
          date: data.date,
          reason: sanitizeString(data.reason),
          createdAt: data.createdAt || Date.now()
        } as BlockedDate);
      }
    });
    
    return blockedDates;
  } catch (error) {
    console.error("Error getting blocked dates:", error);
    throw error;
  }
}

// Check if a date is blocked
export async function isDateBlocked(date: string | Date): Promise<boolean> {
  try {
    // Validate input
    if (!date) {
      console.error("Invalid date input:", date);
      return false;
    }

    // Normalize date input - ensure we're working with the exact date without timezone issues
    let formattedDate: string;
    if (date instanceof Date) {
      formattedDate = format(date, "yyyy-MM-dd");
    } else if (typeof date === 'string') {
      if (!isValidDate(date)) {
        console.error("Invalid date format:", date);
        return false;
      }
      
      // If already in YYYY-MM-DD format, use as is
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedDate = date;
      } else {
        // Parse and format to ensure consistency
        const dateObj = new Date(date + 'T12:00:00');
        formattedDate = format(dateObj, "yyyy-MM-dd");
      }
    } else {
      console.error("Unsupported date type:", typeof date);
      return false;
    }

    console.log(`Checking if date is blocked: ${formattedDate}`);
    
    const blockedDatesRef = collection(db, "blockedDates");
    const q = query(blockedDatesRef, where("date", "==", formattedDate));
    const querySnapshot = await getDocs(q);
    
    const isBlocked = !querySnapshot.empty;
    console.log(`Date ${formattedDate} is blocked: ${isBlocked}`);
    
    return isBlocked;
  } catch (error) {
    console.error("Error checking if date is blocked:", error);
    return false;
  }
}

// Add a blocked date
export async function addBlockedDate(date: string, reason: string): Promise<BlockedDate> {
  try {
    // Validate inputs
    if (!date || typeof date !== 'string') {
      throw new Error("Data inválida");
    }
    if (!reason || typeof reason !== 'string') {
      throw new Error("Motivo é obrigatório");
    }

    if (!isValidDate(date)) {
      throw new Error("Formato de data inválido");
    }

    // Normalize date format - ensure consistent YYYY-MM-DD format
    let formattedDate: string;
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      formattedDate = date;
    } else {
      const dateObj = new Date(date + 'T12:00:00');
      formattedDate = format(dateObj, "yyyy-MM-dd");
    }
    
    const sanitizedReason = sanitizeString(reason);
    
    if (!sanitizedReason.trim()) {
      throw new Error("Motivo não pode estar vazio");
    }
    
    // Check if date is already blocked
    const isBlocked = await isDateBlocked(formattedDate);
    if (isBlocked) {
      throw new Error("Esta data já está bloqueada");
    }
    
    const blockedDateData = {
      date: formattedDate,
      reason: sanitizedReason.trim(),
      createdAt: Date.now()
    };
    
    console.log(`Adding blocked date: ${formattedDate}`);
    
    const blockedDatesRef = collection(db, "blockedDates");
    const docRef = await addDoc(blockedDatesRef, blockedDateData);
    
    return {
      id: docRef.id,
      ...blockedDateData
    };
  } catch (error) {
    console.error("Error adding blocked date:", error);
    throw error;
  }
}

// Remove a blocked date
export async function removeBlockedDate(id: string): Promise<void> {
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error("ID inválido");
    }

    const blockedDateRef = doc(db, "blockedDates", id);
    await deleteDoc(blockedDateRef);
  } catch (error) {
    console.error("Error removing blocked date:", error);
    throw error;
  }
}

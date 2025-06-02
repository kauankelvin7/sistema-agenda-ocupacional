
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppointmentLimits } from "@/types";

const COLLECTION_NAME = "appointmentLimits";
const DOCUMENT_ID = "default"; // Use a fixed document ID for clinic-wide limits

// Get appointment limits from Firebase
export async function getAppointmentLimitsFromFirebase(): Promise<AppointmentLimits> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        morningEarly: data.morningEarly || 7,
        morningLate: data.morningLate || 3,
        afternoon: data.afternoon || 3,
        evening: data.evening || 1,
        morningShiftTotal: data.morningShiftTotal || 110,
        afternoonShiftTotal: data.afternoonShiftTotal || 60,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    } else {
      // Return default values if document doesn't exist
      const defaultLimits: AppointmentLimits = {
        morningEarly: 7,
        morningLate: 3,
        afternoon: 3,
        evening: 1,
        morningShiftTotal: 110,
        afternoonShiftTotal: 60,
      };
      return defaultLimits;
    }
  } catch (error) {
    console.error("Error getting appointment limits from Firebase:", error);
    // Fallback to localStorage or default values
    const savedLimits = localStorage.getItem('appointmentLimits');
    if (savedLimits) {
      try {
        return JSON.parse(savedLimits);
      } catch (parseError) {
        console.error("Error parsing saved limits:", parseError);
      }
    }
    
    // Return default values as final fallback
    return {
      morningEarly: 7,
      morningLate: 3,
      afternoon: 3,
      evening: 1,
      morningShiftTotal: 110,
      afternoonShiftTotal: 60,
    };
  }
}

// Save appointment limits to Firebase
export async function saveAppointmentLimitsToFirebase(limits: AppointmentLimits): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const now = Date.now();
    
    const dataToSave = {
      ...limits,
      updatedAt: now,
      createdAt: limits.createdAt || now
    };
    
    await setDoc(docRef, dataToSave, { merge: true });
    
    // Also save to localStorage as backup
    localStorage.setItem('appointmentLimits', JSON.stringify(dataToSave));
    
    console.log("Appointment limits saved to Firebase successfully");
  } catch (error) {
    console.error("Error saving appointment limits to Firebase:", error);
    
    // Fallback to localStorage if Firebase fails
    localStorage.setItem('appointmentLimits', JSON.stringify(limits));
    throw error;
  }
}


import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ExamType } from "@/types";

const COLLECTION_NAME = "examTypes";

export async function getExamTypes(): Promise<ExamType[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ExamType)
    );
  } catch (error) {
    console.error("Error getting exam types:", error);
    throw error;
  }
}

// Alias for getExamTypes to match imports in components
export const getAllExamTypes = getExamTypes;

export async function getExamType(id: string): Promise<ExamType | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return { id: docSnapshot.id, ...docSnapshot.data() } as ExamType;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting exam type:", error);
    throw error;
  }
}

export async function createExamType(
  examTypeData: Omit<ExamType, "id" | "createdAt">
): Promise<ExamType> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...examTypeData,
      createdAt: Date.now(),
    });
    
    const newExamType = await getExamType(docRef.id);
    return newExamType as ExamType;
  } catch (error) {
    console.error("Error creating exam type:", error);
    throw error;
  }
}

export async function updateExamType(
  id: string,
  examTypeData: Partial<Omit<ExamType, "id" | "createdAt">>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, examTypeData);
  } catch (error) {
    console.error("Error updating exam type:", error);
    throw error;
  }
}

export async function deleteExamType(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting exam type:", error);
    throw error;
  }
}


import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SlotLimit } from "@/types/slot-limits";

/**
 * Serviço para gerenciar limites por slot de 15 minutos
 */

const COLLECTION_NAME = "slotLimits";

/**
 * Gera todos os slots de 15 em 15 minutos (6:30 - 16:45)
 */
export const generateAllTimeSlots = (): string[] => {
  const slots = [];
  for (let hour = 6; hour < 17; hour++) {
    for (let minute of [0, 15, 30, 45]) {
      if (hour === 6 && minute < 30) continue; // Começar às 6:30
      if (hour === 16 && minute > 45) continue; // Terminar às 16:45
      
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeSlot);
    }
  }
  return slots;
};

/**
 * Obtém todos os limites configurados
 */
export const getSlotLimits = async (): Promise<SlotLimit[]> => {
  try {
    const slotLimitsRef = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(slotLimitsRef);
    
    const limits: SlotLimit[] = [];
    querySnapshot.forEach((doc) => {
      limits.push({
        id: doc.id,
        timeSlot: doc.data().timeSlot,
        limit: doc.data().limit,
        ...doc.data()
      } as SlotLimit);
    });
    
    return limits;
  } catch (error) {
    console.error('Erro ao buscar limites de slots:', error);
    return [];
  }
};

/**
 * Salva múltiplos limites de uma vez
 */
export const saveSlotLimits = async (limits: SlotLimit[]): Promise<void> => {
  try {
    const promises = limits.map(({ timeSlot, limit }) => {
      const slotLimitRef = doc(db, COLLECTION_NAME, timeSlot);
      return setDoc(slotLimitRef, {
        timeSlot,
        limit,
        updatedAt: Date.now()
      }, { merge: true });
    });
    
    await Promise.all(promises);
    console.log(`✅ ${limits.length} limites salvos com sucesso`);
  } catch (error) {
    console.error('Erro ao salvar limites em lote:', error);
    throw error;
  }
};

/**
 * Obtém limite para um slot específico
 */
export const getSlotLimit = async (timeSlot: string): Promise<number> => {
  try {
    const limits = await getSlotLimits(); // Fixed function name
    const slotLimit = limits.find(limit => limit.timeSlot === timeSlot);
    
    // Se não há limite configurado, retorna limite padrão baseado no horário
    if (!slotLimit) {
      return getDefaultSlotLimit(timeSlot);
    }
    
    return slotLimit.limit;
  } catch (error) {
    console.error('Erro ao buscar limite do slot:', error);
    return getDefaultSlotLimit(timeSlot);
  }
};

/**
 * Define limite padrão baseado no horário
 */
const getDefaultSlotLimit = (timeSlot: string): number => {
  const hour = parseInt(timeSlot.split(':')[0]);
  
  if (hour >= 6 && hour < 10) return 2; // Manhã inicial: 2 por slot
  if (hour >= 10 && hour < 12) return 1; // Manhã tardia: 1 por slot
  if (hour >= 12 && hour < 16) return 1; // Tarde: 1 por slot
  if (hour >= 16 && hour < 17) return 1; // Final do dia: 1 por slot
  
  return 0; // Fora do horário
};

/**
 * Salva limite para um slot específico
 */
export const saveSlotLimit = async (timeSlot: string, limit: number): Promise<void> => {
  try {
    const slotLimitRef = doc(db, COLLECTION_NAME, timeSlot);
    await setDoc(slotLimitRef, {
      timeSlot,
      limit,
      updatedAt: Date.now()
    }, { merge: true });
    
    console.log(`✅ Limite salvo para ${timeSlot}: ${limit} pessoas`);
  } catch (error) {
    console.error('Erro ao salvar limite do slot:', error);
    throw error;
  }
};

/**
 * Salva múltiplos limites de uma vez
 */
export const saveBulkSlotLimits = async (limits: Array<{ timeSlot: string; limit: number }>): Promise<void> => {
  try {
    const promises = limits.map(({ timeSlot, limit }) => 
      saveSlotLimit(timeSlot, limit)
    );
    
    await Promise.all(promises);
    console.log(`✅ ${limits.length} limites salvos com sucesso`);
  } catch (error) {
    console.error('Erro ao salvar limites em lote:', error);
    throw error;
  }
};

/**
 * Remove limite de um slot (volta para o padrão)
 */
export const removeSlotLimit = async (timeSlot: string): Promise<void> => {
  try {
    const slotLimitRef = doc(db, COLLECTION_NAME, timeSlot);
    await deleteDoc(slotLimitRef);
    
    console.log(`✅ Limite removido para ${timeSlot}, voltando ao padrão`);
  } catch (error) {
    console.error('Erro ao remover limite do slot:', error);
    throw error;
  }
};

/**
 * Inicializa limites padrão para todos os slots
 */
export const initializeDefaultLimits = async (): Promise<void> => {
  try {
    const allSlots = generateAllTimeSlots();
    const limits = allSlots.map(timeSlot => ({
      timeSlot,
      limit: getDefaultSlotLimit(timeSlot)
    }));
    
    await saveBulkSlotLimits(limits);
    console.log('✅ Limites padrão inicializados');
  } catch (error) {
    console.error('Erro ao inicializar limites padrão:', error);
    throw error;
  }
};

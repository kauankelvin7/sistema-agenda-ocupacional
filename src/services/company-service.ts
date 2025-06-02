
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Company } from "@/types";
import { deleteEmployee, getEmployees } from "./employee-service";

const COLLECTION_NAME = "companies";

export async function getCompanies(): Promise<Company[]> {
  try {
    console.log("Buscando todas as empresas");
    const companiesRef = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(companiesRef);
    
    const companies: Company[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        email: data.email || "",
        photoURL: data.photoURL || "",
        cnpj: data.cnpj || "",
        phone: data.phone || "",
        createdAt: data.createdAt || Date.now()
      };
    });
    
    console.log(`Encontradas ${companies.length} empresas`);
    return companies;
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    throw error;
  }
}

export async function getCompany(id: string): Promise<Company | null> {
  try {
    console.log(`Buscando empresa: ${id}`);
    const companyRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(companyRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`Empresa encontrada: ${id}`);
      return {
        id: docSnap.id,
        name: data.name || "",
        email: data.email || "",
        photoURL: data.photoURL || "",
        cnpj: data.cnpj || "",
        phone: data.phone || "",
        createdAt: data.createdAt || Date.now()
      };
    }
    
    console.log(`Empresa não encontrada: ${id}`);
    return null;
  } catch (error) {
    console.error(`Erro ao buscar empresa ${id}:`, error);
    throw error;
  }
}

export async function createCompany(
  companyData: Omit<Company, "id" | "createdAt">
): Promise<Company> {
  try {
    console.log("Criando nova empresa", companyData);
    
    const dataWithTimestamp = {
      ...companyData,
      createdAt: Date.now()
    };
    
    const companiesRef = collection(db, COLLECTION_NAME);
    const docRef = doc(companiesRef);
    await setDoc(docRef, dataWithTimestamp);
    
    const company: Company = {
      id: docRef.id,
      ...dataWithTimestamp
    };
    
    console.log(`Empresa criada com sucesso: ${docRef.id}`);
    return company;
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    throw error;
  }
}

export async function updateCompany(
  id: string, 
  companyData: Partial<Omit<Company, "id" | "createdAt">>
): Promise<void> {
  try {
    console.log(`Atualizando empresa: ${id}`, { 
      ...companyData, 
      photoURL: companyData.photoURL ? `${companyData.photoURL.substring(0, 50)}...` : undefined 
    });
    
    const companyRef = doc(db, COLLECTION_NAME, id);
    const filteredData = Object.fromEntries(
      Object.entries(companyData).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(companyRef, filteredData);
    console.log(`Empresa atualizada com sucesso: ${id}`);
  } catch (error) {
    console.error(`Erro ao atualizar empresa ${id}:`, error);
    throw error;
  }
}

export async function deleteCompany(id: string): Promise<void> {
  try {
    console.log(`Iniciando exclusão da empresa: ${id}`);
    
    // Buscar e excluir todos os funcionários da empresa
    const employees = await getEmployees(id);
    console.log(`Encontrados ${employees.length} funcionários para exclusão`);
    
    // Excluir funcionários em paralelo para melhor performance
    const deletePromises = employees.map(employee => deleteEmployee(employee.id));
    await Promise.all(deletePromises);
    
    // Excluir o documento da empresa
    console.log(`Excluindo documento da empresa: ${id}`);
    const companyRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(companyRef);
    
    console.log(`Empresa excluída com sucesso: ${id}`);
  } catch (error) {
    console.error(`Erro ao excluir empresa ${id}:`, error);
    throw error;
  }
}

import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Employee } from "@/types";
import * as XLSX from "xlsx";
import { formatDateForInput } from "@/lib/date-utils";
import { formatPhone } from "@/utils/format-utils";

/**
 * Get employees for a specific company
 * @param companyId Company ID to filter employees (required)
 * @returns Array of employee objects
 */
export async function getEmployees(companyId: string): Promise<Employee[]> {
  try {
    if (!companyId) {
      console.error("CompanyId is required for getEmployees");
      throw new Error("Company ID is required");
    }

    console.log(`Buscando funcionários para empresa ${companyId}`);
    const employeesRef = collection(db, "employees");
    const employeesQuery = query(employeesRef, where("companyId", "==", companyId));
    
    const querySnapshot = await getDocs(employeesQuery);
    
    const employees: Employee[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Validate required fields
      if (!data.name || !data.cpf || !data.companyId) {
        console.warn(`Skipping invalid employee document ${doc.id}: missing required fields`);
        return;
      }

      // Ensure the employee belongs to the requested company
      if (data.companyId !== companyId) {
        console.warn(`Skipping employee ${doc.id}: companyId mismatch`);
        return;
      }

      employees.push({ 
        id: doc.id, 
        name: data.name,
        cpf: data.cpf,
        companyId: data.companyId,
        role: data.role || "Não informado",
        dateOfBirth: data.dateOfBirth || "",
        gender: data.gender || "other",
        sector: data.sector || "Não informado",
        phone: data.phone || undefined,
        email: data.email || undefined,
        createdAt: data.createdAt || Date.now()
      });
    });
    
    console.log(`Encontrados ${employees.length} funcionários válidos para empresa ${companyId}`);
    return employees;
  } catch (error) {
    console.error("Error getting employees:", error);
    throw error;
  }
}

/**
 * Get all employees (admin only - no company filter)
 * @returns Array of all employee objects
 */
export async function getAllEmployees(): Promise<Employee[]> {
  try {
    console.log("Buscando todos os funcionários (admin)");
    const employeesRef = collection(db, "employees");
    const querySnapshot = await getDocs(employeesRef);
    
    const employees: Employee[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Validate required fields
      if (!data.name || !data.cpf || !data.companyId) {
        console.warn(`Skipping invalid employee document ${doc.id}: missing required fields`);
        return;
      }

      employees.push({ 
        id: doc.id, 
        name: data.name,
        cpf: data.cpf,
        companyId: data.companyId,
        role: data.role || "Não informado",
        dateOfBirth: data.dateOfBirth || "",
        gender: data.gender || "other",
        sector: data.sector || "Não informado",
        createdAt: data.createdAt || Date.now()
      });
    });
    
    console.log(`Encontrados ${employees.length} funcionários no total`);
    return employees;
  } catch (error) {
    console.error("Error getting all employees:", error);
    throw error;
  }
}

// Alias function for backward compatibility with proper company filtering
export const getCompanyEmployees = getEmployees;

/**
 * Create a new employee 
 * @param employeeData Employee data without ID and companyId
 * @param companyId Company ID to associate with the employee
 * @returns The created employee object with ID
 */
export async function createEmployee(
  employeeData: Omit<Employee, "id" | "companyId">,
  companyId: string
): Promise<Employee> {
  try {
    console.log(`Criando novo funcionário para empresa ${companyId}`, employeeData);
    
    // Make sure gender is properly set
    let gender = employeeData.gender;
    if (gender !== 'male' && gender !== 'female' && gender !== 'other') {
      const genderStr = String(gender || '').toLowerCase();
      if (genderStr === 'masculino') {
        gender = 'male';
      } else if (genderStr === 'feminino') {
        gender = 'female';
      } else {
        gender = 'other';
      }
    }

    // Prepare data WITHOUT undefined values
    const dataWithTimestamp: any = {
      name: employeeData.name,
      cpf: employeeData.cpf,
      role: employeeData.role || "Não informado",
      dateOfBirth: employeeData.dateOfBirth || "",
      gender,
      sector: employeeData.sector || "",
      companyId,
      createdAt: employeeData.createdAt || Date.now()
    };

    // Only add phone and email if they have actual values (with formatting)
    if (employeeData.phone && employeeData.phone.trim()) {
      dataWithTimestamp.phone = formatPhone(employeeData.phone.trim());
    }
    
    if (employeeData.email && employeeData.email.trim()) {
      dataWithTimestamp.email = employeeData.email.trim().toLowerCase();
    }

    const employeesRef = collection(db, "employees");
    const docRef = doc(employeesRef);
    await setDoc(docRef, dataWithTimestamp);

    const employee: Employee = {
      id: docRef.id,
      ...dataWithTimestamp,
      phone: dataWithTimestamp.phone || undefined,
      email: dataWithTimestamp.email || undefined
    };

    console.log(`Funcionário criado com sucesso: ${docRef.id}`);
    return employee;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
}

/**
 * Get a single employee by ID
 * @param id Employee ID
 * @returns Employee object or null if not found
 */
export async function getEmployee(id: string): Promise<Employee | null> {
  try {
    console.log(`Buscando funcionário: ${id}`);
    const employeeRef = doc(db, "employees", id);
    const docSnap = await getDoc(employeeRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`Funcionário encontrado: ${id}`);
      return {
        id: docSnap.id,
        name: data.name,
        cpf: data.cpf,
        companyId: data.companyId,
        role: data.role,
        dateOfBirth: data.dateOfBirth || "",
        gender: data.gender || "other",
        sector: data.sector || "",
        phone: data.phone || undefined,
        email: data.email || undefined,
        createdAt: data.createdAt || Date.now()
      };
    }
    
    console.log(`Funcionário não encontrado: ${id}`);
    return null;
  } catch (error) {
    console.error(`Error getting employee ${id}:`, error);
    throw error;
  }
}

/**
 * Update an employee's data
 * @param id Employee ID
 * @param employeeData Partial employee data to update
 * @returns Updated employee object
 */
export async function updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee> {
  try {
    console.log(`Atualizando funcionário: ${id}`, employeeData);
    const employeeRef = doc(db, "employees", id);
    
    // Garantir que o ID da empresa não seja alterado
    const dataToUpdate: any = { ...employeeData };
    delete dataToUpdate.id;
    delete dataToUpdate.companyId;

    // Fix gender if provided
    if (dataToUpdate.gender) {
      if (dataToUpdate.gender !== 'male' && dataToUpdate.gender !== 'female' && dataToUpdate.gender !== 'other') {
        const genderStr = String(dataToUpdate.gender || '').toLowerCase();
        if (genderStr === 'masculino') {
          dataToUpdate.gender = 'male';
        } else if (genderStr === 'feminino') {
          dataToUpdate.gender = 'female';
        } else {
          dataToUpdate.gender = 'other';
        }
      }
    }

    // Handle phone field specifically with formatting
    if ('phone' in dataToUpdate) {
      if (dataToUpdate.phone && dataToUpdate.phone.trim()) {
        dataToUpdate.phone = formatPhone(dataToUpdate.phone.trim());
      } else {
        delete dataToUpdate.phone; // Remove field completely if empty/undefined
      }
    }

    // Handle email field specifically with formatting
    if ('email' in dataToUpdate) {
      if (dataToUpdate.email && dataToUpdate.email.trim()) {
        dataToUpdate.email = dataToUpdate.email.trim().toLowerCase();
      } else {
        delete dataToUpdate.email; // Remove field completely if empty/undefined
      }
    }

    // Remove any remaining undefined values
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    await updateDoc(employeeRef, dataToUpdate);

    // Buscar o funcionário atualizado para retornar
    const updatedEmployee = await getEmployee(id);
    if (!updatedEmployee) {
      throw new Error(`Employee with ID ${id} not found after update`);
    }

    console.log(`Funcionário atualizado com sucesso: ${id}`);
    return updatedEmployee;
  } catch (error) {
    console.error(`Error updating employee ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an employee completely from Firestore
 * @param id Employee ID
 */
export async function deleteEmployee(id: string): Promise<void> {
  try {
    console.log(`Excluindo funcionário completamente: ${id}`);
    
    // First verify the employee exists
    const employeeRef = doc(db, "employees", id);
    const employeeDoc = await getDoc(employeeRef);
    
    if (!employeeDoc.exists()) {
      console.warn(`Funcionário ${id} não encontrado para exclusão`);
      throw new Error(`Funcionário com ID ${id} não encontrado`);
    }
    
    // Delete the document completely from Firestore
    await deleteDoc(employeeRef);
    
    console.log(`Funcionário excluído permanentemente com sucesso: ${id}`);
  } catch (error) {
    console.error(`Error deleting employee ${id}:`, error);
    throw error;
  }
}

/**
 * Import employees from Excel file
 * @param file Excel file
 * @param companyId Company ID to associate with imported employees
 * @returns Array of created employee objects
 */
export async function importEmployees(file: File, companyId: string): Promise<Employee[]> {
  return new Promise((resolve, reject) => {
    console.log(`Iniciando importação de funcionários para empresa ${companyId}`);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log(`Processando ${jsonData.length} registros da planilha`);
        
        const employees: Employee[] = [];
        
        for (const row of jsonData) {
          // Parse and normalize gender from Excel
          let gender: 'male' | 'female' | 'other' = 'other';
          const rawGender = row['Gênero'] || row['gender'] || '';
          
          if (typeof rawGender === 'string') {
            const lowerGender = rawGender.toLowerCase().trim();
            if (lowerGender === 'male' || lowerGender === 'masculino' || lowerGender === 'homem' || lowerGender === 'm') {
              gender = 'male';
            } else if (lowerGender === 'female' || lowerGender === 'feminino' || lowerGender === 'mulher' || lowerGender === 'f') {
              gender = 'female';
            }
          }
          
          // Extract and format date of birth using the proper date utility
          const rawDateOfBirth = row['Data de Nascimento'] || row['dateOfBirth'] || '';
          const formattedDateOfBirth = formatDateForInput(rawDateOfBirth);
          
          // Extract sector information with fallbacks
          const sector = row['Setor'] || row['sector'] || '';
          
          // Extract phone and email if provided - avoid undefined values
          const phone = row['Telefone'] || row['phone'] || '';
          const email = row['Email'] || row['email'] || '';
          
          const employee: Omit<Employee, "id" | "companyId"> = {
            name: row['Nome'] || row['name'] || '',
            cpf: row['CPF'] || row['cpf'] || '',
            role: row['Cargo'] || row['role'] || 'Não informado',
            dateOfBirth: formattedDateOfBirth,
            gender: gender,
            sector: typeof sector === 'string' ? sector.trim() : 'Não informado',
            createdAt: Date.now()
          };

          // Only add phone and email if they have valid values (with formatting)
          if (phone && phone.toString().trim()) {
            employee.phone = formatPhone(phone.toString().trim());
          }
          
          if (email && email.toString().trim()) {
            employee.email = email.toString().trim().toLowerCase();
          }
          
          const createdEmployee = await createEmployee(employee, companyId);
          employees.push(createdEmployee);
        }
        
        console.log(`Importação concluída: ${employees.length} funcionários importados`);
        resolve(employees);
      } catch (error) {
        console.error("Error importing employees:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
}
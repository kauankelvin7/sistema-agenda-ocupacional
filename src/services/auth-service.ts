import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
  User as FirebaseUser,
  sendPasswordResetEmail,
  deleteUser
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, UserRole } from "@/types";

/**
 * Sets up an observer for authentication state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  console.log("Setting up auth state change observer");
  return onAuthStateChanged(auth, callback);
};

/**
 * Signs in a user with email and password
 * @param email User's email
 * @param password User's password
 * @returns User object if successful, null otherwise
 */
export const signIn = async (email: string, password: string): Promise<User | null> => {
  if (!email || !password) {
    console.error("Erro: Email e senha são obrigatórios");
    throw new Error("Email and password are required");
  }
  
  try {
    console.log(`Tentativa de login para: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get additional user data from Firestore
    console.log(`Obtendo dados adicionais do usuário: ${user.uid}`);
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    // Se o documento não existir, vamos criar um com dados básicos
    if (!userDoc.exists()) {
      console.log(`Criando documento de usuário para: ${user.uid}`);
      const userData = {
        displayName: user.displayName || email.split('@')[0],
        email: user.email,
        role: UserRole.COMPANY, // Default role
        createdAt: Date.now(),
      };
      
      await setDoc(doc(db, "users", user.uid), userData);
      
      return {
        id: user.uid,
        email: user.email || "",
        displayName: userData.displayName,
        role: userData.role,
        createdAt: userData.createdAt,
      };
    }
    
    const userData = userDoc.data();
    
    console.log(`Login bem-sucedido: ${user.uid}`);
    return {
      id: user.uid,
      email: user.email || "",
      displayName: user.displayName || userData.displayName || "",
      photoURL: user.photoURL || userData.photoURL,
      role: userData.role as UserRole || UserRole.COMPANY, // Garantir que sempre existe um role
      createdAt: userData.createdAt || Date.now(),
    };
  } catch (error: any) {
    console.error(`Erro de autenticação: ${error.code}`, error);
    
    // Improve security by providing generic error messages
    if (error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-email') {
      throw new Error("Credenciais inválidas. Por favor, verifique seu email e senha.");
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error("Muitas tentativas. Por favor, tente novamente mais tarde.");
    } else {
      throw new Error(`Erro ao fazer login: ${error.message}`);
    }
  }
};

/**
 * Creates a new user account with email and password
 * @param email User's email
 * @param password User's password
 * @param displayName User's display name
 * @param role User's role (default: COMPANY)
 * @param companyName Company name (optional)
 * @param cnpj Company CNPJ (optional)
 * @param phone User's phone number (optional)
 * @returns User object if successful, null otherwise
 */
export const signUp = async (
  email: string, 
  password: string, 
  displayName: string,
  role: UserRole = UserRole.COMPANY,
  companyName?: string,
  cnpj?: string,
  phone?: string
): Promise<User | null> => {
  if (!email || !password || !displayName) {
    console.error("Erro: Email, senha e nome são obrigatórios");
    throw new Error("Email, password, and display name are required");
  }
  
  try {
    console.log(`Criando nova conta para: ${email}, função: ${role}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Set display name
    await updateProfile(user, { displayName });
    
    // Store additional user data in Firestore
    const userData = {
      displayName,
      email,
      role,
      createdAt: Date.now(),
    };
    
    console.log(`Armazenando dados do usuário no Firestore: ${user.uid}`);
    await setDoc(doc(db, "users", user.uid), userData);
    
    // Create company or admin record depending on role
    if (role === UserRole.COMPANY) {
      console.log(`Criando registro de empresa para: ${user.uid}`);
      const companyData = {
        name: companyName || displayName,
        email,
        cnpj: cnpj || "",
        phone: phone || "", // CORREÇÃO: Adicionar campo telefone
        ownerId: user.uid,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "companies", user.uid), companyData);
    }
    
    console.log(`Conta criada com sucesso: ${user.uid}`);
    return {
      id: user.uid,
      email: user.email || "",
      displayName: displayName,
      role: role,
      createdAt: Date.now(),
    };
  } catch (error: any) {
    console.error(`Erro ao criar conta: ${error.code}`, error);
    
    // Improve security by providing generic error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("Este email já está em uso.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("A senha é muito fraca. Use pelo menos 6 caracteres.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Formato de email inválido.");
    } else {
      throw new Error("Erro ao criar conta. Tente novamente mais tarde.");
    }
  }
};

/**
 * Signs out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    console.log("Iniciando o processo de logout");
    await firebaseSignOut(auth);
    console.log("Logout bem-sucedido");
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw new Error("Erro ao sair. Tente novamente mais tarde.");
  }
};

/**
 * Gets the current user's data
 * @returns User object if logged in, null otherwise
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("Nenhum usuário autenticado atualmente");
      return null;
    }
    
    // Get additional user data from Firestore
    console.log(`Obtendo dados do usuário atual: ${currentUser.uid}`);
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.data();
    
    if (!userData) {
      console.error(`Erro: Nenhum dado encontrado para o usuário: ${currentUser.uid}`);
      return null;
    }
    
    return {
      id: currentUser.uid,
      email: currentUser.email || "",
      displayName: currentUser.displayName || userData.displayName || "",
      photoURL: currentUser.photoURL || userData.photoURL,
      role: userData.role as UserRole,
      createdAt: userData.createdAt || Date.now(),
    };
  } catch (error) {
    console.error("Erro ao obter dados do usuário atual:", error);
    throw new Error("Erro ao obter dados do usuário.");
  }
};

/**
 * Updates the current user's password
 * @param newPassword New password
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("Erro: Nenhum usuário conectado");
      throw new Error("Nenhum usuário conectado");
    }
    
    console.log(`Atualizando senha para o usuário: ${currentUser.uid}`);
    await firebaseUpdatePassword(currentUser, newPassword);
    console.log("Senha atualizada com sucesso");
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    throw new Error("Erro ao atualizar senha. Tente novamente mais tarde.");
  }
};

/**
 * Updates the current user's profile
 * @param profileData Object containing displayName and/or photoURL
 */
export const updateUserProfile = async (profileData: { displayName?: string; photoURL?: string }): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("Erro: Nenhum usuário conectado");
      throw new Error("Nenhum usuário conectado");
    }
    
    console.log(`Atualizando perfil do usuário: ${currentUser.uid}`, profileData);
    await updateProfile(currentUser, profileData);
    
    // Also update the user data in Firestore if needed
    console.log(`Atualizando dados do usuário no Firestore: ${currentUser.uid}`);
    const userRef = doc(db, "users", currentUser.uid);
    await setDoc(userRef, profileData, { merge: true });
    console.log("Perfil atualizado com sucesso");
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    throw new Error("Erro ao atualizar perfil. Tente novamente mais tarde.");
  }
};

/**
 * Sends a password reset email to the specified email address
 * @param email Email address to send the reset link to
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  if (!email) {
    console.error("Erro: Email é obrigatório");
    throw new Error("Email é obrigatório");
  }
  
  try {
    console.log(`Enviando email de redefinição de senha para: ${email}`);
    await sendPasswordResetEmail(auth, email);
    console.log("Email de redefinição de senha enviado com sucesso");
  } catch (error: any) {
    console.error(`Erro ao enviar email de redefinição de senha: ${error.code}`, error);
    
    // Generic error message for security
    if (error.code === 'auth/user-not-found') {
      // Security best practice: don't reveal if email exists or not
      // We still log the real error but return a generic message
      console.log('Usuário não encontrado para redefinição de senha');
    }
    
    // Always provide a generic success message, even if email doesn't exist
    // This prevents user enumeration attacks
    throw new Error("Se o email for válido, o link de redefinição de senha será enviado.");
  }
};

/**
 * Deletes the current user's account and all associated data
 * Complete implementation to delete all user data from Firestore
 */
export const deleteUserAccount = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("Erro: Nenhum usuário conectado para excluir");
      throw new Error("Nenhum usuário conectado");
    }
    
    const userId = currentUser.uid;
    console.log(`Iniciando processo de exclusão de conta: ${userId}`);
    
    // First delete associated data in Firestore
    try {
      // 1. Delete user document
      console.log(`Excluindo documento de usuário: ${userId}`);
      await deleteDoc(doc(db, "users", userId));
      
      // 2. Delete company document if exists
      console.log(`Excluindo documento de empresa: ${userId}`);
      await deleteDoc(doc(db, "companies", userId));
      
      // 3. Delete employees associated with this company
      console.log("Buscando e excluindo funcionários associados à empresa");
      const employeesRef = collection(db, "employees");
      const q = query(employeesRef, where("companyId", "==", userId));
      const employeeSnapshot = await getDocs(q);
      
      const deleteEmployeePromises = employeeSnapshot.docs.map(employeeDoc => {
        console.log(`Excluindo funcionário: ${employeeDoc.id}`);
        return deleteDoc(doc(db, "employees", employeeDoc.id));
      });
      
      await Promise.all(deleteEmployeePromises);
      
      // 4. Delete appointments associated with this company
      console.log("Buscando e excluindo agendamentos associados à empresa");
      const appointmentsRef = collection(db, "appointments");
      const appointmentsQuery = query(appointmentsRef, where("companyId", "==", userId));
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      const deleteAppointmentPromises = appointmentsSnapshot.docs.map(appointmentDoc => {
        console.log(`Excluindo agendamento: ${appointmentDoc.id}`);
        return deleteDoc(doc(db, "appointments", appointmentDoc.id));
      });
      
      await Promise.all(deleteAppointmentPromises);
      
      console.log("Documentos do Firestore excluídos com sucesso");
    } catch (firestoreError) {
      console.error("Erro ao excluir dados do Firestore:", firestoreError);
      // Continue to try to delete the auth user even if Firestore deletion fails
    }
    
    // Finally delete the auth user
    console.log("Excluindo conta de autenticação");
    await deleteUser(currentUser);
    console.log("Conta excluída com sucesso");
    
    // Sign out from any remaining sessions
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    throw new Error("Erro ao excluir conta. Tente novamente mais tarde.");
  }
};

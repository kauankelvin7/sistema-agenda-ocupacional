
/**
 * Formata CPF com máscara
 * Remove todos os caracteres não numéricos e aplica a máscara XXX.XXX.XXX-XX
 */
export const formatCPF = (value: string): string => {
  // Remove tudo que não é dígito
  const numericValue = value.replace(/\D/g, '');
  
  // Aplica a máscara do CPF
  if (numericValue.length <= 11) {
    return numericValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  
  return numericValue.slice(0, 11)
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ com máscara
 * Remove todos os caracteres não numéricos e aplica a máscara XX.XXX.XXX/XXXX-XX
 */
export const formatCNPJ = (value: string): string => {
  // Remove tudo que não é dígito
  const numericValue = value.replace(/\D/g, '');
  
  // Aplica a máscara do CNPJ
  if (numericValue.length <= 14) {
    return numericValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  
  return numericValue.slice(0, 14)
    .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata telefone com máscara
 * Aceita formatos (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export const formatPhone = (value: string): string => {
  // Remove tudo que não é dígito
  const numericValue = value.replace(/\D/g, '');
  
  // Aplica a máscara do telefone
  if (numericValue.length <= 10) {
    return numericValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  
  return numericValue
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

/**
 * Sanitiza entrada de texto básica - permite espaços, letras, números e acentos
 * Remove apenas elementos perigosos como scripts e tags HTML
 */
export const sanitizeInput = (value: string): string => {
  if (!value) return '';
  
  // Remove apenas elementos realmente perigosos, mantendo texto normal e espaços
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  // NÃO remove espaços nem faz trim aqui
};

/**
 * Sanitiza entrada de email
 */
export const sanitizeEmail = (value: string): string => {
  if (!value) return '';
  
  return value
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '') // Mantém apenas caracteres válidos para email
    .trim();
};

/**
 * Valida se um CPF é válido (apenas formato)
 */
export const isValidCPFFormat = (cpf: string): boolean => {
  if (!cpf) return false;
  const numericCPF = cpf.replace(/\D/g, '');
  return numericCPF.length === 11;
};

/**
 * Valida se um email tem formato válido
 */
export const isValidEmailFormat = (email: string): boolean => {
  // Se email está vazio ou é apenas espaços, é válido (campo opcional)
  if (!email || !email.trim()) return true;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Valida se um telefone tem formato válido
 */
export const isValidPhoneFormat = (phone: string): boolean => {
  // Se telefone está vazio ou é apenas espaços, é válido (campo opcional)
  if (!phone || !phone.trim()) return true;
  
  const numericPhone = phone.replace(/\D/g, '');
  return numericPhone.length >= 10 && numericPhone.length <= 11;
};

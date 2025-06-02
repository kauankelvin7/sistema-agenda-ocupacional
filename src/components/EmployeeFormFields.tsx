
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCPF, formatPhone, sanitizeEmail } from "@/utils/format-utils";

interface EmployeeFormData {
  name: string;
  cpf: string;
  dateOfBirth: string;
  gender: string;
  role: string;
  sector: string;
  phone?: string;
  email?: string;
}

interface EmployeeFormFieldsProps {
  formData: EmployeeFormData;
  onChange: (field: keyof EmployeeFormData, value: string) => void;
  isMobile?: boolean;
}

/**
 * Reusable component for employee form fields with validation and formatting
 * Handles CPF, phone formatting and input sanitization automatically
 */
export const EmployeeFormFields: React.FC<EmployeeFormFieldsProps> = ({
  formData,
  onChange,
  isMobile = false
}) => {
  
  /**
   * Handles CPF input with automatic formatting and validation
   */
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    onChange('cpf', formattedCPF);
  };

  /**
   * Handles phone input with automatic formatting
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    onChange('phone', formattedPhone);
  };

  /**
   * Handles text input - sem sanitização para permitir espaços livres
   */
  const handleTextChange = (field: keyof EmployeeFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // Usa valor direto sem sanitização para permitir espaços
    onChange(field, e.target.value);
  };

  /**
   * Handles email input with proper sanitization
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedEmail = sanitizeEmail(e.target.value);
    onChange('email', sanitizedEmail);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {/* Nome completo - Required field */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={handleTextChange('name')}
          placeholder="Digite o nome completo"
          className="text-sm sm:text-base"
          maxLength={100}
          required
        />
      </div>
      
      {/* CPF - Required field with auto-formatting */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          CPF <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.cpf}
          onChange={handleCPFChange}
          placeholder="000.000.000-00"
          maxLength={14}
          className="text-sm sm:text-base"
          required
        />
      </div>
      
      {/* Data de nascimento - Optional field */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Data de nascimento</label>
        <Input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => onChange('dateOfBirth', e.target.value)}
          className="text-sm sm:text-base"
          max={new Date().toISOString().split('T')[0]} // Prevent future dates
        />
      </div>
      
      {/* Gênero - Optional field */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Gênero</label>
        <Select 
          value={formData.gender} 
          onValueChange={(value) => onChange('gender', value)}
        >
          <SelectTrigger className="text-sm sm:text-base">
            <SelectValue placeholder="Selecione o gênero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Masculino</SelectItem>
            <SelectItem value="female">Feminino</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Telefone - Optional field with auto-formatting */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Telefone</label>
        <Input
          value={formData.phone || ""}
          onChange={handlePhoneChange}
          placeholder="(11) 99999-9999"
          maxLength={15}
          className="text-sm sm:text-base"
        />
        <p className="text-xs text-muted-foreground">
          Campo opcional
        </p>
      </div>
      
      {/* Email - Optional field */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          value={formData.email || ""}
          onChange={handleEmailChange}
          placeholder="funcionario@email.com"
          className="text-sm sm:text-base"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Campo opcional
        </p>
      </div>
      
      {/* Cargo - Required field */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Cargo <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.role}
          onChange={handleTextChange('role')}
          placeholder="Digite o cargo"
          className="text-sm sm:text-base"
          maxLength={50}
          required
        />
      </div>
      
      {/* Setor - Required field */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Setor <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.sector}
          onChange={handleTextChange('sector')}
          placeholder="Digite o setor"
          className="text-sm sm:text-base"
          maxLength={50}
          required
        />
      </div>
    </div>
  );
};


import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployeeFormFields } from "./EmployeeFormFields";
import { isValidCPFFormat, isValidEmailFormat, isValidPhoneFormat } from "@/utils/format-utils";
import { useToast } from "@/hooks/use-toast";

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

interface EmployeeAddFormProps {
  formData: EmployeeFormData;
  onChange: (field: keyof EmployeeFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isMobile?: boolean;
}

/**
 * Componente para formulário de adição de funcionários
 */
export const EmployeeAddForm: React.FC<EmployeeAddFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isLoading,
  isMobile = false
}) => {
  const { toast } = useToast();

  /**
   * Valida o formulário antes de enviar
   */
  const validateForm = (): boolean => {
    console.log("Validando formulário:", formData);

    // Validar campos obrigatórios
    if (!formData.name?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome completo do funcionário",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.cpf?.trim()) {
      toast({
        title: "CPF obrigatório", 
        description: "Por favor, informe o CPF do funcionário",
        variant: "destructive"
      });
      return false;
    }

    if (!isValidCPFFormat(formData.cpf)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, informe um CPF com formato válido",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.role?.trim()) {
      toast({
        title: "Cargo obrigatório",
        description: "Por favor, informe o cargo do funcionário", 
        variant: "destructive"
      });
      return false;
    }

    if (!formData.sector?.trim()) {
      toast({
        title: "Setor obrigatório",
        description: "Por favor, informe o setor do funcionário",
        variant: "destructive"
      });
      return false;
    }

    // Validar campos opcionais APENAS se preenchidos e não vazios
    const emailValue = formData.email?.trim();
    if (emailValue && !isValidEmailFormat(emailValue)) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe um email com formato válido",
        variant: "destructive"
      });
      return false;
    }

    const phoneValue = formData.phone?.trim();
    if (phoneValue && !isValidPhoneFormat(phoneValue)) {
      toast({
        title: "Telefone inválido", 
        description: "Por favor, informe um telefone com formato válido",
        variant: "destructive"
      });
      return false;
    }

    console.log("Formulário válido, prosseguindo...");
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit();
    }
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Adicionar Novo Funcionário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        <EmployeeFormFields 
          formData={formData}
          onChange={onChange}
          isMobile={isMobile}
        />
        
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            size={isMobile ? "mobile-friendly" : "default"}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Adicionando..." : "Adicionar Funcionário"}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            size={isMobile ? "mobile-friendly" : "default"}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

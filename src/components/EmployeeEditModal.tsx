
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Employee } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { EmployeeFormFields } from "./EmployeeFormFields";
import { isValidCPFFormat, isValidEmailFormat, isValidPhoneFormat } from "@/utils/format-utils";

interface EmployeeEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  employee: Employee | null;
}

const EmployeeEditModal = ({ open, onClose, onSave, employee }: EmployeeEditModalProps) => {
  const [form, setForm] = useState<Employee | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      // Ensure all required fields are present
      setForm({
        ...employee,
        sector: employee.sector || "",
        role: employee.role || "",
        gender: employee.gender || "other",
        phone: employee.phone || "",
        email: employee.email || ""
      });
    }
  }, [employee]);

  const validateForm = (): boolean => {
    if (!form) return false;

    console.log("Validando formulário de edição:", form);

    // Validar campos obrigatórios
    if (!form.name?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome completo do funcionário",
        variant: "destructive"
      });
      return false;
    }

    if (!form.cpf?.trim()) {
      toast({
        title: "CPF obrigatório", 
        description: "Por favor, informe o CPF do funcionário",
        variant: "destructive"
      });
      return false;
    }

    if (!isValidCPFFormat(form.cpf)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, informe um CPF com formato válido",
        variant: "destructive"
      });
      return false;
    }

    if (!form.role?.trim()) {
      toast({
        title: "Cargo obrigatório",
        description: "Por favor, informe o cargo do funcionário", 
        variant: "destructive"
      });
      return false;
    }

    if (!form.sector?.trim()) {
      toast({
        title: "Setor obrigatório",
        description: "Por favor, informe o setor do funcionário",
        variant: "destructive"
      });
      return false;
    }

    // Validar campos opcionais APENAS se preenchidos e não vazios
    const emailValue = form.email?.trim();
    if (emailValue && !isValidEmailFormat(emailValue)) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe um email com formato válido",
        variant: "destructive"
      });
      return false;
    }

    const phoneValue = form.phone?.trim();
    if (phoneValue && !isValidPhoneFormat(phoneValue)) {
      toast({
        title: "Telefone inválido", 
        description: "Por favor, informe um telefone com formato válido",
        variant: "destructive"
      });
      return false;
    }

    console.log("Formulário de edição válido, prosseguindo...");
    return true;
  };

  const handleSave = () => {
    if (validateForm() && form) {
      onSave(form);
    }
  };

  const handleFormChange = (field: keyof Employee, value: string) => {
    if (form) {
      setForm({ ...form, [field]: value });
    }
  };

  if (!employee || !form) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          <EmployeeFormFields 
            formData={form}
            onChange={handleFormChange}
            isMobile={false}
          />
        </div>
        <DialogFooter className="pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeEditModal;

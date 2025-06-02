
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Employee } from "@/types";
import { formatDateToDisplay } from "@/lib/date-utils";

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  onScheduleAppointment: (employee: Employee) => void;
}

/**
 * Componente para exibir informações do funcionário em formato de card (mobile)
 */
export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onEdit,
  onDelete,
  onScheduleAppointment
}) => {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{employee.name}</h3>
            <p className="text-xs text-muted-foreground">{employee.cpf}</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreHorizontal size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-32">
              <div className="flex flex-col gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="justify-start text-xs" 
                  onClick={() => onEdit(employee)}
                >
                  <Edit size={14} className="mr-2" /> 
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="justify-start text-xs" 
                  onClick={() => onDelete(employee.id)}
                >
                  <Trash2 size={14} className="mr-2" /> 
                  Excluir
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Nascimento:</span>
            <p>{formatDateToDisplay(employee.dateOfBirth)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Gênero:</span>
            <p>{employee.gender === 'male' ? 'Masculino' : 
               employee.gender === 'female' ? 'Feminino' : 'Outro'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Cargo:</span>
            <p>{employee.role || "Não informado"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Setor:</span>
            <p>{employee.sector || "Não informado"}</p>
          </div>
        </div>
        
        <Button 
          size="mobile-sm"
          variant="outline"
          onClick={() => onScheduleAppointment(employee)}
          className="w-full gap-1"
        >
          <Calendar size={14} />
          Agendar Consulta
        </Button>
      </div>
    </Card>
  );
};

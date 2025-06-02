
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentWithDetails } from "@/types";
import { Calendar, Clock, User, Building, FileText } from "lucide-react";

interface AppointmentDetailsModalProps {
  appointment: AppointmentWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  isOpen,
  onClose,
}) => {
  if (!appointment) return null;

  const formatBirthdate = (birthdate?: string): string => {
    if (!birthdate) return "-";
    
    try {
      if (birthdate.includes('/') && birthdate.length === 10) {
        return birthdate;
      }
      
      if (birthdate.includes('-') && birthdate.length === 10) {
        const [year, month, day] = birthdate.split('-');
        return `${day}/${month}/${year}`;
      }
      
      const date = new Date(birthdate);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return birthdate;
    } catch (error) {
      return birthdate;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-blue-600" />
            Informações Detalhadas do Agendamento
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Detalhes completos e informações adicionais fornecidas pela empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Funcionário */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Funcionário
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Nome:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.employee?.name || "Não informado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">CPF:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.employee?.cpf || "Não informado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Data de Nascimento:</span>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatBirthdate(appointment.patientBirthdate || appointment.employee?.dateOfBirth)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Telefone:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.employee?.phone || "Não informado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.employee?.email || "Não informado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Cargo:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.employee?.role || "Não informado"}</p>
              </div>
            </div>
          </div>

          {/* Informações da Empresa */}
          <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Informações da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Razão Social:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.company?.name || "Não informado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">CNPJ:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.company?.cnpj || "Não informado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Telefone:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.company?.phone || "Não informado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.company?.email || "Não informado"}</p>
              </div>
            </div>
          </div>

          {/* Informações do Agendamento */}
          <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Detalhes do Agendamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Data e Hora:</span>
                <p className="text-gray-900 dark:text-gray-100">
                  {appointment.date 
                    ? new Date(appointment.date).toLocaleString("pt-BR") 
                    : "Não informado"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Tipo de Exame:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.examType?.name || "Não informado"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Setor:</span>
                <p className="text-gray-900 dark:text-gray-100">
                  {appointment.employee?.sector || appointment.sector || "Não informado"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Exames Complementares:</span>
                <p className="text-gray-900 dark:text-gray-100">{appointment.hasAdditionalExams ? "Sim" : "Não"}</p>
              </div>
            </div>

            {appointment.description && (
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">Observações da Empresa:</span>
                <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{appointment.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status e Timestamps */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Histórico
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Criado em:</span>
                <p className="text-gray-900 dark:text-gray-100">
                  {appointment.createdAt 
                    ? new Date(appointment.createdAt).toLocaleString("pt-BR")
                    : "Não informado"}
                </p>
              </div>
              {appointment.completedAt && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Concluído em:</span>
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    {new Date(appointment.completedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {appointment.canceledAt && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Cancelado em:</span>
                  <p className="text-red-600 dark:text-red-400 font-medium">
                    {new Date(appointment.canceledAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

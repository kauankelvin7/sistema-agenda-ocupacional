
import React, { useState } from "react";
import { AppointmentWithDetails, AppointmentStatus } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { FileDownload } from "@/components/FileAttachment";
import { StatusDropdown } from "@/components/StatusDropdown";
import { Button } from "@/components/ui/button";
import { RotateCcw, XCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { AppointmentDetailsModal } from "@/components/AppointmentDetailsModal";

interface AppointmentsTableProps {
  appointments: AppointmentWithDetails[];
  isMobile: boolean;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onRemoveFile: (appointmentId: string) => void;
  canManageAttachments: (status: AppointmentStatus) => boolean;
  onRestore?: (id: string, status: AppointmentStatus) => void;
  isArchived?: boolean;
  isCompanyView?: boolean;
}

const formatCompletionTime = (completedAt?: number): string => {
  if (!completedAt) return "-";
  
  try {
    const date = new Date(completedAt);
    return format(date, "dd/MM/yyyy HH:mm");
  } catch (error) {
    return "-";
  }
};

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

export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  appointments,
  isMobile,
  onStatusChange,
  onRemoveFile,
  canManageAttachments,
  onRestore,
  isArchived = false,
  isCompanyView = false,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleViewDetails = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Funcionário</TableHead>
              {!isMobile && <TableHead>CPF</TableHead>}
              {!isMobile && <TableHead>CNPJ</TableHead>}
              <TableHead>Data Nascimento</TableHead>
              <TableHead>Setor / Cargo</TableHead>
              {!isMobile && <TableHead>Tipo de Exame</TableHead>}
              <TableHead>Data/Hora</TableHead>
              {!isMobile && <TableHead>Exames Comp.</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Concluído em</TableHead>
              <TableHead>Anexo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => {
              return (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {appointment.company?.name || 
                         <span className="text-red-500 font-medium">Empresa não encontrada</span>}
                      </div>
                      {appointment.company?.phone && (
                        <div className="text-xs text-muted-foreground">
                          {appointment.company.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {appointment.employee?.name || 
                         <span className="text-red-500 font-medium">Funcionário não encontrado</span>}
                      </div>
                      {appointment.employee?.phone && (
                        <div className="text-xs text-muted-foreground">
                          {appointment.employee.phone}
                        </div>
                      )}
                      {appointment.employee?.email && (
                        <div className="text-xs text-muted-foreground">
                          {appointment.employee.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      {appointment.employee?.cpf || 
                       <span className="text-muted-foreground">-</span>}
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell>
                      {appointment.company?.cnpj || 
                       <span className="text-muted-foreground">-</span>}
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="text-sm">
                      {formatBirthdate(appointment.patientBirthdate || appointment.employee?.dateOfBirth)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {appointment.employee?.sector || appointment.sector || "Não informado"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.employee?.role || "Não informado"}
                      </div>
                    </div>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      {appointment.examType?.name || 
                       <span className="text-muted-foreground">Tipo não encontrado</span>}
                    </TableCell>
                  )}
                  <TableCell>
                    {appointment.date 
                      ? new Date(appointment.date).toLocaleString("pt-BR") 
                      : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      {appointment.hasAdditionalExams ? "Sim" : "Não"}
                    </TableCell>
                  )}
                  <TableCell>
                    {isArchived ? (
                      <StatusBadge status={appointment.status} originalStatus={appointment.originalStatus} />
                    ) : isCompanyView ? (
                      // EMPRESA: só pode cancelar se status for SCHEDULED
                      appointment.status === AppointmentStatus.SCHEDULED ? (
                        <div className="flex items-center gap-2">
                          <StatusBadge status={appointment.status} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStatusChange(appointment.id, AppointmentStatus.CANCELED)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <StatusBadge status={appointment.status} originalStatus={appointment.originalStatus} />
                      )
                    ) : (
                      // CLÍNICA: pode alterar todos os status
                      appointment.status === AppointmentStatus.SCHEDULED ? (
                        <StatusDropdown 
                          value={appointment.status}
                          onChange={(status) => onStatusChange(appointment.id, status)} 
                          showArchive={false}
                          originalStatus={appointment.originalStatus}
                        />
                      ) : (
                        <StatusBadge status={appointment.status} originalStatus={appointment.originalStatus} />
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${appointment.status === AppointmentStatus.COMPLETED ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      {formatCompletionTime(appointment.completedAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {appointment.attachmentUrl ? (
                      <FileDownload 
                        fileData={appointment.attachmentUrl} 
                        fileName={appointment.attachmentName || "documento.pdf"}
                        onDelete={canManageAttachments(appointment.status) && !isCompanyView ? 
                          () => onRemoveFile(appointment.id) : undefined}
                        showDelete={canManageAttachments(appointment.status) && !isCompanyView}
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {canManageAttachments(appointment.status) ? "Nenhum" : "Não disponível"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* Botão de informações adicionais (apenas para clínica) */}
                      {!isCompanyView && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(appointment)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver informações detalhadas"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Botão de restaurar (se aplicável) */}
                      {isArchived && onRestore && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRestore(appointment.id, AppointmentStatus.SCHEDULED)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modal de detalhes */}
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />
    </>
  );
};

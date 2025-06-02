
import React, { useState, useMemo } from "react";
import { AppointmentWithDetails, AppointmentStatus } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { FileDownload } from "@/components/FileAttachment";
import { StatusDropdown } from "@/components/StatusDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Search, ChevronLeft, ChevronRight, XCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { ScrollableTableContainer } from "@/components/ScrollableTableContainer";
import { AppointmentDetailsModal } from "@/components/AppointmentDetailsModal";

interface AppointmentsScrollableTableProps {
  appointments: AppointmentWithDetails[];
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onRemoveFile: (appointmentId: string) => void;
  canManageAttachments: (status: AppointmentStatus) => boolean;
  onRestore?: (id: string, status: AppointmentStatus) => void;
  isArchived?: boolean;
  isCompanyView?: boolean;
}

const ITEMS_PER_PAGE = 20;

export const AppointmentsScrollableTable: React.FC<AppointmentsScrollableTableProps> = ({
  appointments,
  onStatusChange,
  onRemoveFile,
  canManageAttachments,
  onRestore,
  isArchived = false,
  isCompanyView = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filter appointments based on search and status
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const matchesSearch = searchTerm === "" || 
        appointment.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.employee?.sector?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  // Paginate filtered appointments
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAppointments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAppointments, currentPage]);

  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleViewDetails = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedAppointment(null);
  };

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

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por funcionário, empresa ou setor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value={AppointmentStatus.SCHEDULED}>Agendado</SelectItem>
                <SelectItem value={AppointmentStatus.COMPLETED}>Concluído</SelectItem>
                <SelectItem value={AppointmentStatus.CANCELED}>Cancelado</SelectItem>
                <SelectItem value={AppointmentStatus.NO_SHOW}>Não Compareceu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredAppointments.length} de {appointments.length} agendamentos
          </div>
        </div>

        {/* Table */}
        <ScrollableTableContainer maxHeight="600px" showScrollbar={true}>
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead className="hidden md:table-cell">CPF</TableHead>
                <TableHead className="hidden lg:table-cell">CNPJ</TableHead>
                <TableHead>Data Nascimento</TableHead>
                <TableHead>Setor / Cargo</TableHead>
                <TableHead className="hidden md:table-cell">Tipo de Exame</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead className="hidden md:table-cell">Exames Comp.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Concluído em</TableHead>
                <TableHead>Anexo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    {appointment.company?.name || 
                     <span className="text-red-500 font-medium">Empresa não encontrada</span>}
                  </TableCell>
                  <TableCell>
                    {appointment.employee?.name || 
                     <span className="text-red-500 font-medium">Funcionário não encontrado</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {appointment.employee?.cpf || 
                     <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {appointment.company?.cnpj || 
                     <span className="text-muted-foreground">-</span>}
                  </TableCell>
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
                  <TableCell className="hidden md:table-cell">
                    {appointment.examType?.name || 
                     <span className="text-muted-foreground">Tipo não encontrado</span>}
                  </TableCell>
                  <TableCell>
                    {appointment.date 
                      ? new Date(appointment.date).toLocaleString("pt-BR") 
                      : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {appointment.hasAdditionalExams ? "Sim" : "Não"}
                  </TableCell>
                  <TableCell>
                    {isCompanyView ? (
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
                          originalStatus={appointment.originalStatus}
                        />
                      ) : (
                        <StatusBadge status={appointment.status} originalStatus={appointment.originalStatus} />
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${
                      appointment.status === AppointmentStatus.COMPLETED 
                        ? 'text-green-600 font-medium' 
                        : 'text-muted-foreground'
                    }`}>
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
              ))}
            </TableBody>
          </Table>
        </ScrollableTableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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

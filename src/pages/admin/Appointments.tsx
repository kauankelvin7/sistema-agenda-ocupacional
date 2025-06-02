
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, FileSpreadsheet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentStatus } from "@/types";
import { AppointmentsScrollableTable } from "@/components/AppointmentsScrollableTable";
import { updateAppointment } from "@/services/appointment-service";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAppointmentsWithDetails } from "@/services/appointment-queries";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { AppointmentDateFilter } from "@/components/AppointmentDateFilter";
import { isSameDay, format } from "date-fns";
import { exportAppointmentsToExcel } from "@/utils/excel-export";

const Appointments = () => {
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: allAppointments = [], isLoading, refetch } = useQuery({
    queryKey: ["appointments", statusFilter],
    queryFn: () => getAppointmentsWithDetails(undefined, statusFilter === "all" ? undefined : statusFilter),
    refetchOnWindowFocus: false,
  });

  // Auto refresh every 5 seconds
  useAutoRefresh({
    queryKeys: [["appointments", statusFilter]],
    enabled: true
  });

  // Filter appointments by date locally
  const filteredAppointments = React.useMemo(() => {
    let filtered = allAppointments;

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(appointment => {
        if (!appointment.date) return false;
        const appointmentDate = new Date(appointment.date);
        return isSameDay(appointmentDate, dateFilter);
      });
    }

    return filtered;
  }, [allAppointments, dateFilter]);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointment(id, { status });
      toast({
        title: "Agendamento atualizado",
        description: "O status do agendamento foi atualizado com sucesso"
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do agendamento",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFile = async (appointmentId: string) => {
    try {
      toast({
        title: "Arquivo removido",
        description: "O arquivo foi removido com sucesso"
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o arquivo",
        variant: "destructive"
      });
    }
  };

  const canManageAttachments = (status: AppointmentStatus) => {
    return status === AppointmentStatus.SCHEDULED || status === AppointmentStatus.COMPLETED;
  };

  const handleRestoreAppointment = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointment(id, { status });
      toast({
        title: "Agendamento restaurado",
        description: "O agendamento foi restaurado com sucesso"
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível restaurar o agendamento",
        variant: "destructive"
      });
    }
  };

  const handleExportToExcel = () => {
    try {
      const monthFilter = dateFilter ? format(dateFilter, 'yyyy-MM') : undefined;
      const exportData = dateFilter ? filteredAppointments : allAppointments;
      
      if (exportData.length === 0) {
        toast({
          title: "Aviso",
          description: "Não há agendamentos para exportar com os filtros selecionados",
          variant: "destructive"
        });
        return;
      }

      exportAppointmentsToExcel({
        appointments: exportData,
        month: monthFilter
      });

      toast({
        title: "✅ Exportação concluída",
        description: `${exportData.length} agendamentos exportados para Excel com sucesso`,
      });
    } catch (error) {
      toast({
        title: "❌ Erro na exportação",
        description: "Não foi possível exportar os dados para Excel",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agendamentos</h2>
          <p className="text-muted-foreground">
            Gerencie os agendamentos da clínica
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Filtros de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Filtrar por Data</label>
                <AppointmentDateFilter
                  selectedDate={dateFilter}
                  onDateSelect={setDateFilter}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Filtrar por Status</label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "all")}>
                  <SelectTrigger className="w-full">
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
            </div>

            {/* Results summary and export button */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  "Carregando agendamentos..."
                ) : (
                  <>
                    Exibindo <span className="font-medium text-blue-600">{filteredAppointments.length}</span> de{" "}
                    <span className="font-medium">{allAppointments.length}</span> agendamentos
                    {dateFilter && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        Data: {dateFilter.toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {statusFilter !== "all" && (
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        Status: {statusFilter}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExportToExcel}
                disabled={isLoading || (dateFilter ? filteredAppointments.length === 0 : allAppointments.length === 0)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                size="sm"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AppointmentsScrollableTable
        appointments={filteredAppointments}
        onStatusChange={handleStatusChange}
        onRemoveFile={handleRemoveFile}
        canManageAttachments={canManageAttachments}
        onRestore={handleRestoreAppointment}
        isCompanyView={false}
      />
    </div>
  );
};

export default Appointments;

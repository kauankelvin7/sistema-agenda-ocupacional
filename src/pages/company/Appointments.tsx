
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, CheckCircle, Clock, ArrowLeft, XCircle, Filter } from "lucide-react";
import { AppointmentsScrollableTable } from "@/components/AppointmentsScrollableTable";
import { CompanyAppointmentForm } from "@/components/CompanyAppointmentForm";
import { AppointmentStatus } from "@/types";
import { getAppointmentsWithDetails } from "@/services/appointment-queries";
import { updateAppointment } from "@/services/appointment-service";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useLocation } from "react-router-dom";
import { AppointmentDateFilter } from "@/components/AppointmentDateFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isSameDay } from "date-fns";

const CompanyAppointments = () => {
  const { user } = useAuth();
  const location = useLocation();
  const selectedEmployee = location.state?.selectedEmployee;
  const [showForm, setShowForm] = useState(!!selectedEmployee);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Determinar companyId correto
  const effectiveCompanyId = user?.role === 'company' ? user.id : user?.companyId;

  const { data: allCompanyAppointments = [], isLoading, refetch } = useQuery({
    queryKey: ["company-appointments", effectiveCompanyId],
    queryFn: () => getAppointmentsWithDetails(effectiveCompanyId),
    enabled: !!effectiveCompanyId,
    refetchOnWindowFocus: false,
  });

  useAutoRefresh({
    queryKeys: [["company-appointments", effectiveCompanyId || ""]],
    intervalMs: 5000,
    enabled: !!effectiveCompanyId && !showForm
  });

  // Filter appointments by date and status locally
  const filteredAppointments = React.useMemo(() => {
    let filtered = allCompanyAppointments;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(appointment => {
        if (!appointment.date) return false;
        const appointmentDate = new Date(appointment.date);
        return isSameDay(appointmentDate, dateFilter);
      });
    }

    return filtered;
  }, [allCompanyAppointments, dateFilter, statusFilter]);

  // CORRIGIDO: Empresa só pode cancelar agendamentos
  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    // Empresa só pode cancelar agendamentos
    if (status !== AppointmentStatus.CANCELED) {
      toast({
        title: "⚠️ Ação não permitida",
        description: "Empresas só podem cancelar agendamentos. Outras alterações devem ser feitas pela clínica.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateAppointment(id, { 
        status,
        canceledAt: Date.now(),
        canceledBy: user?.id || 'company'
      });
      toast({
        title: "✅ Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso"
      });
      refetch();
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível cancelar o agendamento",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFile = async (appointmentId: string) => {
    try {
      toast({
        title: "📎 Arquivo removido",
        description: "O arquivo foi removido com sucesso"
      });
      refetch();
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível remover o arquivo",
        variant: "destructive"
      });
    }
  };

  const canManageAttachments = (status: AppointmentStatus) => {
    return status === AppointmentStatus.SCHEDULED;
  };

  // Calculate stats based on all appointments (not filtered)
  const scheduledCount = allCompanyAppointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length;
  const completedCount = allCompanyAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
  const canceledCount = allCompanyAppointments.filter(a => a.status === AppointmentStatus.CANCELED).length;
  const totalCount = allCompanyAppointments.length;

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowForm(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <CompanyAppointmentForm
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
          selectedEmployeeId={selectedEmployee?.id}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
            <p className="text-muted-foreground">
              Gerencie os agendamentos da sua empresa de forma eficiente
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 h-12 px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalCount}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Agendamentos criados
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/50 dark:to-amber-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{scheduledCount}</div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Aguardando atendimento
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{completedCount}</div>
              <p className="text-xs text-green-600 dark:text-green-400">
                Finalizados com sucesso
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Cancelados</CardTitle>
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">{canceledCount}</div>
              <p className="text-xs text-red-600 dark:text-red-400">
                Agendamentos cancelados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-600" />
            Filtros de Pesquisa
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

          {/* Results summary */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                "Carregando agendamentos..."
              ) : (
                <>
                  Exibindo <span className="font-medium text-blue-600">{filteredAppointments.length}</span> de{" "}
                  <span className="font-medium">{allCompanyAppointments.length}</span> agendamentos
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Lista de Agendamentos
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoading ? "Carregando..." : `${filteredAppointments.length} agendamentos encontrados`}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                💡 Você pode apenas cancelar agendamentos. Outras alterações devem ser solicitadas à clínica.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Carregando agendamentos...</span>
              </div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {allCompanyAppointments.length === 0 
                  ? "Nenhum agendamento encontrado" 
                  : "Nenhum agendamento corresponde aos filtros"
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {allCompanyAppointments.length === 0 
                  ? "Você ainda não possui agendamentos. Crie o primeiro agendamento para começar."
                  : "Tente ajustar os filtros ou limpar as seleções para ver mais resultados."
                }
              </p>
              {allCompanyAppointments.length === 0 && (
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Agendamento
                </Button>
              )}
            </div>
          ) : (
            <AppointmentsScrollableTable
              appointments={filteredAppointments}
              onStatusChange={handleStatusChange}
              onRemoveFile={handleRemoveFile}
              canManageAttachments={canManageAttachments}
              isCompanyView={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyAppointments;

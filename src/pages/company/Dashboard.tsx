
import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Users,
  CheckSquare,
  XSquare,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Activity,
  Briefcase
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointmentsWithDetails } from "@/services/appointment-service";
import { getEmployees } from "@/services/employee-service";
import { AppointmentStatus, Employee } from "@/types";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const CompanyDashboard = () => {
  const { user } = useAuth();
  const companyId = user?.id;
  const queryClient = useQueryClient();

  // Force refresh data when component mounts
  useEffect(() => {
    if (companyId) {
      queryClient.invalidateQueries({ queryKey: ["companyAppointments", companyId] });
      queryClient.invalidateQueries({ queryKey: ["companyEmployees", companyId] });
    }
  }, [companyId, queryClient]);

  const { data: appointments = [], isLoading: isLoadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ["companyAppointments", companyId],
    queryFn: () => getAppointmentsWithDetails(companyId as string),
    enabled: !!companyId,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: allEmployees = [] as Employee[], isLoading: isLoadingEmployees, refetch: refetchEmployees } = useQuery({
    queryKey: ["companyEmployees", companyId],
    queryFn: () => getEmployees(companyId as string),
    enabled: !!companyId,
    staleTime: 0,
    gcTime: 0,
  });

  // Filtrar funcionários ativos (não arquivados)
  const activeEmployees = useMemo(() => {
    return allEmployees.filter(employee => !employee.archivedAt);
  }, [allEmployees]);

  // Force refetch every time the component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && companyId) {
        refetchAppointments();
        refetchEmployees();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [companyId, refetchAppointments, refetchEmployees]);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate.getTime() === today.getTime();
    });

    const yesterday = subDays(today, 1);
    const yesterdayAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate.getTime() === yesterday.getTime();
    });

    // Only count unique employees who have COMPLETED appointments
    const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
    const uniqueEmployeesWithCompletedExams = new Set(completedAppointments.map(a => a.employeeId));

    const scheduled = appointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length;
    const completed = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const canceled = appointments.filter(a => a.status === AppointmentStatus.CANCELED).length;
    const noShow = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;

    // Calculate trends
    const todayScheduled = todayAppointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length;
    const yesterdayScheduled = yesterdayAppointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length;
    const scheduledTrend = yesterdayScheduled > 0 ? ((todayScheduled - yesterdayScheduled) / yesterdayScheduled) * 100 : 0;

    // Calculate completion trend
    const todayCompleted = todayAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const yesterdayCompleted = yesterdayAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const completedTrend = yesterdayCompleted > 0 ? ((todayCompleted - yesterdayCompleted) / yesterdayCompleted) * 100 : 0;

    return {
      totalActiveEmployees: activeEmployees.length,
      totalAllEmployees: allEmployees.length,
      archivedEmployees: allEmployees.length - activeEmployees.length,
      totalAppointments: appointments.length,
      scheduled,
      completed,
      canceled,
      noShow,
      today: todayAppointments.length,
      employeesServed: uniqueEmployeesWithCompletedExams.size,
      completionRate: appointments.length > 0 ? Math.round((completed / appointments.length) * 100) : 0,
      scheduledTrend: Math.round(scheduledTrend),
      completedTrend: Math.round(completedTrend),
      pendingExams: activeEmployees.length - uniqueEmployeesWithCompletedExams.size
    };
  }, [appointments, activeEmployees, allEmployees]);

  const isLoading = isLoadingAppointments || isLoadingEmployees;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <Clock className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Briefcase className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Dashboard da Empresa</h1>
              <p className="text-blue-100 text-lg">
                Acompanhe o progresso dos exames ocupacionais da sua equipe
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
                <Target className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Funcionários Ativos</p>
                  <p className="text-2xl font-bold">{stats.totalActiveEmployees}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Exames Realizados</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Colaboradores Atendidos"
            value={stats.employeesServed}
            icon={<CheckSquare className="h-6 w-6" />}
            description="Com exames concluídos"
            iconClassName="text-emerald-500"
            trend={stats.completedTrend !== 0 ? {
              value: Math.abs(stats.completedTrend),
              label: "vs ontem",
              isPositive: stats.completedTrend > 0
            } : undefined}
          />
          
          <StatsCard
            title="Exames Pendentes"
            value={stats.pendingExams}
            icon={<Clock className="h-6 w-6" />}
            description="Funcionários sem exames agendados"
            iconClassName="text-amber-500"
          />
          
          <StatsCard
            title="Agendados Hoje"
            value={stats.today}
            icon={<Calendar className="h-6 w-6" />}
            description="Para o dia atual"
            iconClassName="text-blue-500"
            trend={stats.scheduledTrend !== 0 ? {
              value: Math.abs(stats.scheduledTrend),
              label: "vs ontem",
              isPositive: stats.scheduledTrend > 0
            } : undefined}
          />
          
          <StatsCard
            title="Não Compareceram"
            value={stats.noShow}
            icon={<AlertTriangle className="h-6 w-6" />}
            description="Pacientes ausentes"
            iconClassName="text-red-500"
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total de Agendamentos"
            value={stats.totalAppointments}
            icon={<Activity className="h-6 w-6" />}
            description="Todos os registros"
            iconClassName="text-purple-500"
          />
          
          <StatsCard
            title="Agendados"
            value={stats.scheduled}
            icon={<Calendar className="h-6 w-6" />}
            description="Pendentes de realização"
            iconClassName="text-blue-500"
          />
          
          <StatsCard
            title="Cancelados"
            value={stats.canceled}
            icon={<XSquare className="h-6 w-6" />}
            description="Agendamentos cancelados"
            iconClassName="text-gray-500"
          />
        </div>

        {/* Executive Summary */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-900">
          <CardHeader className="border-b border-blue-100 dark:border-blue-800">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Status dos Funcionários</h3>
                </div>
                <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  <span className="font-bold text-lg">{stats.employeesServed}</span> de <span className="font-bold">{stats.totalActiveEmployees}</span> funcionários ativos já realizaram exames
                  {stats.pendingExams > 0 && (
                    <span className="block mt-2 text-emerald-600 dark:text-emerald-400">
                      <span className="font-semibold">{stats.pendingExams}</span> funcionários ainda precisam realizar exames
                    </span>
                  )}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Agendamentos</h3>
                </div>
                <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                  <span className="font-bold text-lg">{stats.totalAppointments}</span> agendamentos no total com{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">{stats.completionRate}%</span> de taxa de conclusão
                  <span className="block mt-2 text-sm text-blue-600 dark:text-blue-400">
                    {stats.scheduled} agendamentos pendentes
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDashboard;

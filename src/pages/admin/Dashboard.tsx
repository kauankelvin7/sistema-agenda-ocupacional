import React, { useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Users,
  Building2,
  CheckSquare,
  XSquare,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Stethoscope
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { getAppointmentsWithDetails } from "@/services/appointment-service";
import { getCompanies } from "@/services/company-service";
import { getExamTypes } from "@/services/exam-type-service";
import { AppointmentStatus, AppointmentWithDetails, Company, ExamType } from "@/types";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DataTable } from "@/components/ui/data-table";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

/**
 * Admin Dashboard component that shows appointment statistics
 * @returns Dashboard UI with appointment stats
 */
const AdminDashboard = () => {
  const queryClient = useQueryClient();

  // Force refresh data when component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["appointmentsWithDetails"] });
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    queryClient.invalidateQueries({ queryKey: ["examTypes"] });
  }, [queryClient]);

  const { data: appointments = [], isLoading: isLoadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ["appointmentsWithDetails"],
    queryFn: () => getAppointmentsWithDetails(),
    staleTime: 0,
    gcTime: 0,
  });

  const { data: companies = [], isLoading: isLoadingCompanies, refetch: refetchCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => getCompanies(),
    staleTime: 0,
    gcTime: 0,
  });
  
  const { data: examTypes = [], isLoading: isLoadingExamTypes, refetch: refetchExamTypes } = useQuery({
    queryKey: ["examTypes"],
    queryFn: () => getExamTypes(),
    staleTime: 0,
    gcTime: 0,
  });

  // Force refetch every time the component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetchAppointments();
        refetchCompanies();
        refetchExamTypes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchAppointments, refetchCompanies, refetchExamTypes]);

  // Calculate consistent trends based on actual data comparison between current and previous month
  const stats = useMemo(() => {
    if (appointments.length === 0) {
      return {
        total: 0,
        scheduled: 0,
        completed: 0,
        canceled: 0,
        noShow: 0,
        today: 0,
        companiesServed: 0,
        employeesServed: 0,
        trends: {
          completed: { value: 0, label: "vs mês anterior", isPositive: true },
          companiesServed: { value: 0, label: "vs mês anterior", isPositive: true },
          employeesServed: { value: 0, label: "vs mês anterior", isPositive: true },
        }
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate.getTime() === today.getTime();
    });

    // Calculate current month data
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    
    const currentMonthAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= currentMonthStart && appointmentDate <= currentMonthEnd;
    });
    
    // Calculate previous month data
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(subMonths(today, 1));
    
    const previousMonthAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= previousMonthStart && appointmentDate <= previousMonthEnd;
    });

    // Current month stats - only count COMPLETED appointments for trends
    const currentCompletedExams = currentMonthAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const currentCompaniesServed = new Set(currentMonthAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).map(a => a.companyId)).size;
    const currentEmployeesServed = new Set(currentMonthAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).map(a => a.employeeId)).size;
    
    // Previous month stats - only count COMPLETED appointments for trends
    const previousCompletedExams = previousMonthAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const previousCompaniesServed = new Set(previousMonthAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).map(a => a.companyId)).size;
    const previousEmployeesServed = new Set(previousMonthAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).map(a => a.employeeId)).size;
    
    // Calculate percentage changes
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { value: current > 0 ? 100 : 0, label: "vs mês anterior", isPositive: current >= 0 };
      const percentageChange = ((current - previous) / previous) * 100;
      return {
        value: Math.abs(Math.round(percentageChange)),
        label: "vs mês anterior",
        isPositive: percentageChange >= 0
      };
    };

    // Overall stats (all time) - only count unique employees/companies with COMPLETED appointments
    const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
    const uniqueCompanies = new Set(completedAppointments.map(a => a.companyId));
    const uniqueEmployees = new Set(completedAppointments.map(a => a.employeeId));

    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length,
      completed: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
      canceled: appointments.filter(a => a.status === AppointmentStatus.CANCELED).length,
      noShow: appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length,
      today: todayAppointments.length,
      companiesServed: uniqueCompanies.size,
      employeesServed: uniqueEmployees.size,
      trends: {
        completed: calculateTrend(currentCompletedExams, previousCompletedExams),
        companiesServed: calculateTrend(currentCompaniesServed, previousCompaniesServed),
        employeesServed: calculateTrend(currentEmployeesServed, previousEmployeesServed),
      }
    };
  }, [appointments]);

  // Generate monthly exam data for the bar chart
  const getMonthlyData = () => {
    const monthlyData = [];
    const today = new Date();
    
    // Generate data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(subMonths(today, i));
      const monthName = format(monthStart, 'MMM');
      
      const completedCount = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= monthStart && 
               appointmentDate <= monthEnd && 
               appointment.status === AppointmentStatus.COMPLETED;
      }).length;
      
      const scheduledCount = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= monthStart && 
               appointmentDate <= monthEnd && 
               appointment.status === AppointmentStatus.SCHEDULED;
      }).length;
      
      monthlyData.push({
        month: monthName,
        completed: completedCount,
        scheduled: scheduledCount
      });
    }
    
    return monthlyData;
  };

  // Generate exam type distribution data for pie chart
  const getExamTypeDistribution = () => {
    // Initialize counters for each exam type
    const examTypeCounters: Record<string, number> = {};
    
    // First, try to categorize based on examTypeId if available
    appointments.forEach(appointment => {
      if (appointment.examTypeId) {
        const examType = examTypes.find(et => et.id === appointment.examTypeId);
        if (examType) {
          const typeName = examType.name;
          examTypeCounters[typeName] = (examTypeCounters[typeName] || 0) + 1;
          return;
        }
      }
      
      // Fallback to description-based categorization
      const description = appointment.description?.toLowerCase() || '';
      
      if (description.includes('admissional')) {
        examTypeCounters['Admissional'] = (examTypeCounters['Admissional'] || 0) + 1;
      } else if (description.includes('periódico') || description.includes('periodico')) {
        examTypeCounters['Periódico'] = (examTypeCounters['Periódico'] || 0) + 1;
      } else if (description.includes('retorno')) {
        examTypeCounters['Retorno'] = (examTypeCounters['Retorno'] || 0) + 1;
      } else if (description.includes('demissional')) {
        examTypeCounters['Demissional'] = (examTypeCounters['Demissional'] || 0) + 1;
      } else {
        examTypeCounters['Outros'] = (examTypeCounters['Outros'] || 0) + 1;
      }
    });
    
    // Convert to data array for chart
    const colors = {
      'Admissional': '#2563eb',
      'Periódico': '#10b981',
      'Retorno': '#f59e0b',
      'Demissional': '#ef4444',
      'Outros': '#8b5cf6'
    };
    
    return Object.entries(examTypeCounters).map(([name, value]) => ({
      name,
      value,
      color: colors[name as keyof typeof colors] || '#9ca3af'
    }));
  };

  // Generate company exam count data for the table
  const getCompanyExamCounts = () => {
    const companyExams = new Map();
    
    appointments.forEach(appointment => {
      const companyId = appointment.companyId;
      companyExams.set(companyId, (companyExams.get(companyId) || 0) + 1);
    });
    
    return Array.from(companyExams.entries()).map(([companyId, count]) => {
      const company = companies.find(c => c.id === companyId);
      return {
        id: companyId,
        name: company?.name || 'Desconhecido',
        examCount: count,
      };
    }).sort((a, b) => b.examCount - a.examCount);
  };

  // Columns for the company exams table
  const columns = [
    {
      accessorKey: "name",
      header: "Empresa",
    },
    {
      accessorKey: "examCount",
      header: "Quantidade de Exames",
    },
  ];
  
  // Get data for alerts (exams due soon)
  const getAlerts = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointment.status === AppointmentStatus.SCHEDULED &&
             appointmentDate >= today && appointmentDate <= nextWeek;
    });
  };

  const isLoading = isLoadingAppointments || isLoadingCompanies || isLoadingExamTypes;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <Stethoscope className="h-8 w-8 animate-pulse text-blue-600" />
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando dashboard da clínica...</span>
        </div>
      </div>
    );
  }

  const monthlyData = getMonthlyData();
  const examTypeDistribution = getExamTypeDistribution();
  const companyExamCounts = getCompanyExamCounts();
  const alerts = getAlerts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Stethoscope className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Dashboard da Clínica</h1>
              <p className="text-blue-100 text-lg">
                Gestão completa dos exames ocupacionais - Visão administrativa
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total de Exames</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-green-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Empresas Atendidas</p>
                  <p className="text-2xl font-bold">{stats.companiesServed}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Colaboradores</p>
                  <p className="text-2xl font-bold">{stats.employeesServed}</p>
                </div>
                <Users className="h-8 w-8 text-teal-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Agendados Hoje</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-200" />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Exames"
            value={stats.completed}
            icon={<CheckSquare className="h-6 w-6" />}
            description="Exames realizados"
            iconClassName="text-emerald-500"
            trend={stats.trends.completed}
          />
          <StatsCard
            title="Exames Pendentes"
            value={stats.scheduled}
            icon={<Calendar className="h-6 w-6" />}
            description="Agendamentos pendentes"
            iconClassName="text-blue-500"
          />
          <StatsCard
            title="Empresas Atendidas"
            value={stats.companiesServed}
            icon={<Building2 className="h-6 w-6" />}
            description="Empresas com exames"
            iconClassName="text-purple-500"
            trend={stats.trends.companiesServed}
          />
          <StatsCard
            title="Colaboradores Atendidos"
            value={stats.employeesServed}
            icon={<Users className="h-6 w-6" />}
            description="Funcionários com exames"
            iconClassName="text-teal-500"
            trend={stats.trends.employeesServed}
          />
        </div>

        {/* Secondary Stats Cards */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Cancelados"
            value={stats.canceled}
            icon={<XSquare className="h-6 w-6" />}
            description="Agendamentos cancelados"
            iconClassName="text-red-500"
          />
          <StatsCard
            title="Não Compareceram"
            value={stats.noShow}
            icon={<AlertTriangle className="h-6 w-6" />}
            description="Pacientes ausentes"
            iconClassName="text-amber-500"
          />
          <StatsCard
            title="Total de Agendamentos"
            value={stats.total}
            icon={<FileText className="h-6 w-6" />}
            description="Todos os agendamentos"
            iconClassName="text-indigo-500"
          />
          <StatsCard
            title="Taxa de Conclusão"
            value={`${Math.round((stats.completed / Math.max(stats.total, 1)) * 100)}%`}
            icon={<Activity className="h-6 w-6" />}
            description="Eficiência dos atendimentos"
            iconClassName="text-green-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Bar Chart - Exams by Month */}
          <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                <BarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Exames por Mês
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="completed" name="Realizados" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="scheduled" name="Agendados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          {/* Pie Chart - Distribution by Exam Type */}
          <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg">
                <PieChart className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Distribuição por Tipo de Exame
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={examTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={renderCustomizedLabel}
                  >
                    {examTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Alerts Section */}
        <Card className="border-l-4 border-l-amber-500 shadow-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100">
                Alertas - Exames Próximos (7 dias)
              </h3>
            </div>
            
            <div className="overflow-auto max-h-48 mt-4">
              {alerts.length > 0 ? (
                <ul className="space-y-3">
                  {alerts.map((alert, index) => {
                    return (
                      <li key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-amber-900 dark:text-amber-100">
                              {format(new Date(alert.date), 'dd/MM/yyyy')}
                            </span>
                            <span className="text-amber-700 dark:text-amber-300 ml-2">
                              {alert.employee?.name || 'Funcionário não identificado'}
                            </span>
                          </div>
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            {alert.description || 'Exame'}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    Nenhum exame agendado para os próximos 7 dias
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Companies Table */}
        <Card className="shadow-lg border-0">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              Quantidade de Exames por Empresa
            </h3>
            <DataTable 
              columns={columns}
              data={companyExamCounts}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-card p-2 border rounded shadow-md">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom label for pie chart
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs"
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default AdminDashboard;


import React from "react";
import { AppointmentStatus, AppointmentWithDetails } from "@/types";
import { Archive, Calendar } from "lucide-react";

interface AppointmentsStatsDashboardProps {
  appointments: AppointmentWithDetails[];
  archivedAppointments: AppointmentWithDetails[];
  isMobile: boolean;
}

/**
 * Dashboard de estatísticas de agendamentos otimizado
 */
export const AppointmentsStatsDashboard: React.FC<AppointmentsStatsDashboardProps> = ({
  appointments,
  archivedAppointments,
  isMobile,
}) => {
  /**
   * Conta agendamentos por status considerando originalStatus para arquivados
   */
  const countByStatusIncluiArquivado = (status: AppointmentStatus) => {
    const getEffectiveStatus = (appointment: AppointmentWithDetails) => {
      if (appointment.status === AppointmentStatus.ARCHIVED && appointment.originalStatus) {
        return appointment.originalStatus;
      }
      return appointment.status;
    };
    
    return appointments.filter(appointment => 
      getEffectiveStatus(appointment) === status
    ).length;
  };

  const stats = [
    {
      label: "Agendados",
      count: countByStatusIncluiArquivado(AppointmentStatus.SCHEDULED),
      className: "rounded bg-blue-100 text-blue-800 px-2 py-1 text-xs"
    },
    {
      label: "Concluídos",
      count: countByStatusIncluiArquivado(AppointmentStatus.COMPLETED),
      className: "rounded bg-green-100 text-green-800 px-2 py-1 text-xs"
    },
    {
      label: "Cancelados",
      count: countByStatusIncluiArquivado(AppointmentStatus.CANCELED),
      className: "rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 text-xs"
    },
    {
      label: "Não Compareceram",
      count: countByStatusIncluiArquivado(AppointmentStatus.NO_SHOW),
      className: "rounded bg-yellow-100 text-yellow-700 px-2 py-1 text-xs"
    }
  ];

  return (
    <div className="px-4 pt-2 overflow-x-auto">
      <div className="flex gap-2 flex-wrap mb-2">
        {stats.map((stat) => (
          <div key={stat.label} className={stat.className}>
            {stat.label}: {stat.count}
          </div>
        ))}
        
        <div className="rounded bg-gray-100 text-gray-700 px-2 py-1 text-xs flex items-center gap-1">
          <Archive size={14} /> 
          Arquivados: {archivedAppointments.length}
        </div>
        
        <div className="rounded bg-slate-200 text-slate-600 px-2 py-1 text-xs flex items-center gap-1">
          <Calendar size={14} /> 
          Total: {appointments.length}
        </div>
      </div>
    </div>
  );
};

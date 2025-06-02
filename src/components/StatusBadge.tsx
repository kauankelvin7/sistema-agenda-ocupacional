
import { AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
  originalStatus?: AppointmentStatus;
}

const statusConfig = {
  [AppointmentStatus.SCHEDULED]: {
    label: "Agendado",
    className: "bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium",
  },
  [AppointmentStatus.COMPLETED]: {
    label: "Concluído",
    className: "bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium",
  },
  [AppointmentStatus.CANCELED]: {
    label: "Cancelado",
    className: "bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium",
  },
  [AppointmentStatus.NO_SHOW]: {
    label: "Não Compareceu",
    className: "bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
  },
  [AppointmentStatus.ARCHIVED]: {
    label: "Arquivado",
    className: "bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium",
  },
};

const originalStatusLabel = {
  [AppointmentStatus.SCHEDULED]: "Agendado",
  [AppointmentStatus.COMPLETED]: "Concluído",
  [AppointmentStatus.CANCELED]: "Cancelado",
  [AppointmentStatus.NO_SHOW]: "Não Compareceu",
};

export const StatusBadge = ({ status, className, originalStatus }: StatusBadgeProps) => {
  const config = statusConfig[status] || {
    label: "Desconhecido",
    className: "bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium"
  };

  return (
    <span className={cn(config.className, className)}>
      {config.label}
      {status === AppointmentStatus.ARCHIVED && originalStatus && (
        <span className="ml-2 px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs border border-gray-300">
          ({originalStatusLabel[originalStatus] || "Original"})
        </span>
      )}
    </span>
  );
};

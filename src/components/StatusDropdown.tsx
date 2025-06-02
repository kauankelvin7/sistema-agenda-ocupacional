
import React from "react";
import { AppointmentStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoreHorizontal, Check } from "lucide-react";

interface Props {
  value?: AppointmentStatus;
  currentStatus?: AppointmentStatus;
  onChange?: (status: AppointmentStatus) => void;
  onStatusChange?: (status: AppointmentStatus) => void;
  disabled?: boolean;
  showArchive?: boolean;
  originalStatus?: AppointmentStatus;
}

const statuses: { label: string; value: AppointmentStatus; color: string }[] = [
  { label: "Agendado", value: AppointmentStatus.SCHEDULED, color: "bg-blue-500" },
  { label: "Concluído", value: AppointmentStatus.COMPLETED, color: "bg-green-500" },
  { label: "Cancelado", value: AppointmentStatus.CANCELED, color: "bg-destructive" },
  { label: "Não Compareceu", value: AppointmentStatus.NO_SHOW, color: "bg-yellow-500" },
];

export const StatusDropdown = ({ 
  value, 
  currentStatus, 
  onChange, 
  onStatusChange, 
  disabled = false,
  showArchive = false,
  originalStatus
}: Props) => {
  const status = value || currentStatus;
  const handleChange = onChange || onStatusChange;
  
  if (!status || !handleChange) {
    return null;
  }

  // Sempre usar lista sem arquivar - opção removida
  const availableStatuses = statuses;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="ml-1" disabled={disabled}>
          <MoreHorizontal size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[160px] space-y-1 z-50 bg-background">
        {availableStatuses.map((s) => (
          <Button
            key={s.value}
            className={`w-full justify-start mb-1 ${
              status === s.value ? s.color + " text-white" : ""
            }`}
            variant={status === s.value ? "default" : "ghost"}
            onClick={() => handleChange(s.value)}
          >
            {status === s.value ? 
              <Check size={14} className="mr-2" /> : 
              <span className="w-4 mr-2 inline-block" />
            }
            {s.label}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

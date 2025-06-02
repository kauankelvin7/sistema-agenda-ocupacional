
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AppointmentDateFilterProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  className?: string;
}

/**
 * Componente para filtrar agendamentos por data específica
 * Permite selecionar uma data e limpar o filtro
 */
export const AppointmentDateFilter: React.FC<AppointmentDateFilterProps> = ({
  selectedDate,
  onDateSelect,
  className
}) => {
  const handleClearFilter = () => {
    onDateSelect(undefined);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Filtrar por data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      
      {selectedDate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilter}
          className="h-8 px-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Limpar filtro de data</span>
        </Button>
      )}
    </div>
  );
};

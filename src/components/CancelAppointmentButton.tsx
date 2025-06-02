
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { AppointmentStatus } from "@/types";

interface CancelAppointmentButtonProps {
  appointmentId: string;
  employeeName: string;
  appointmentDate: string;
  onCancel: (appointmentId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const CancelAppointmentButton: React.FC<CancelAppointmentButtonProps> = ({
  appointmentId,
  employeeName,
  appointmentDate,
  onCancel,
  isLoading = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCancel = () => {
    onCancel(appointmentId);
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isLoading}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Cancelar Agendamento
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-gray-600 mt-3">
            Tem certeza que deseja cancelar o agendamento de{" "}
            <span className="font-medium text-gray-900">{employeeName}</span>{" "}
            para {appointmentDate}?
            <br />
            <br />
            <span className="text-sm text-amber-600 bg-amber-50 p-2 rounded block">
              Esta ação não pode ser desfeita e liberará o horário para outros agendamentos.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="border-gray-300">
            Não, manter agendamento
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Sim, cancelar agendamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

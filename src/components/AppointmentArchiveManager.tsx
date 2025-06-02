
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Archive, Trash2, RotateCcw } from "lucide-react";
import { AppointmentStatus } from "@/types";

interface AppointmentArchiveManagerProps {
  onArchiveByStatus: (status: AppointmentStatus) => void;
  onPermanentDelete: (status: AppointmentStatus) => void;
  onRestoreAll?: () => void;
  counts: {
    completed: number;
    canceled: number;
    noShow: number;
    archived: number;
  };
  isLoading?: boolean;
}

/**
 * Componente para gerenciar operações de arquivamento em lote
 * Permite arquivar, deletar permanentemente e restaurar agendamentos
 */
export const AppointmentArchiveManager: React.FC<AppointmentArchiveManagerProps> = ({
  onArchiveByStatus,
  onPermanentDelete,
  onRestoreAll,
  counts,
  isLoading = false
}) => {
  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
          Gerenciamento de Arquivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seção de Arquivamento */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Arquivar por Status</h4>
          <div className="flex flex-wrap gap-2">
            <ConfirmDeleteDialog
              title="Arquivar agendamentos concluídos"
              description={`Arquivar ${counts.completed} agendamentos concluídos? Eles podem ser restaurados depois.`}
              onConfirm={() => onArchiveByStatus(AppointmentStatus.COMPLETED)}
              mode="archive"
              triggerButton={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={counts.completed === 0 || isLoading}
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-100"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Concluídos ({counts.completed})
                </Button>
              }
            />
            
            <ConfirmDeleteDialog
              title="Arquivar agendamentos cancelados"
              description={`Arquivar ${counts.canceled} agendamentos cancelados? Eles podem ser restaurados depois.`}
              onConfirm={() => onArchiveByStatus(AppointmentStatus.CANCELED)}
              mode="archive"
              triggerButton={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={counts.canceled === 0 || isLoading}
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-100"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Cancelados ({counts.canceled})
                </Button>
              }
            />
            
            <ConfirmDeleteDialog
              title="Arquivar não comparecimentos"
              description={`Arquivar ${counts.noShow} registros de não comparecimento? Eles podem ser restaurados depois.`}
              onConfirm={() => onArchiveByStatus(AppointmentStatus.NO_SHOW)}
              mode="archive"
              triggerButton={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={counts.noShow === 0 || isLoading}
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-100"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Não Compareceram ({counts.noShow})
                </Button>
              }
            />
          </div>
        </div>

        {/* Seção de Exclusão Permanente */}
        <div className="space-y-2 border-t pt-4">
          <h4 className="text-sm font-medium text-destructive">Exclusão Permanente</h4>
          <div className="flex flex-wrap gap-2">
            <ConfirmDeleteDialog
              title="Deletar permanentemente arquivados"
              description={`ATENÇÃO: Esta ação deletará PERMANENTEMENTE ${counts.archived} agendamentos arquivados. Esta ação NÃO pode ser desfeita!`}
              onConfirm={() => onPermanentDelete(AppointmentStatus.ARCHIVED)}
              triggerButton={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={counts.archived === 0 || isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Deletar Arquivados ({counts.archived})
                </Button>
              }
            />
          </div>
        </div>

        {/* Seção de Restauração */}
        {onRestoreAll && counts.archived > 0 && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-400">Restauração</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={onRestoreAll}
              disabled={isLoading}
              className="border-green-500 text-green-600 hover:bg-green-100"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restaurar Todos Arquivados
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

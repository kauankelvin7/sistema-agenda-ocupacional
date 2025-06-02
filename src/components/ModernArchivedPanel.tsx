
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Archive, 
  Search, 
  RotateCcw, 
  Trash2, 
  FileText, 
  Calendar,
  User,
  Building,
  Filter,
  Download,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { AppointmentStatus, AppointmentWithDetails } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { FileDownload } from "@/components/FileAttachment";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ModernArchivedPanelProps {
  archivedAppointments: AppointmentWithDetails[];
  onRestore: (id: string, status: AppointmentStatus) => void;
  onRemoveFile: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  canManageAttachments: (status: AppointmentStatus) => boolean;
}

export const ModernArchivedPanel: React.FC<ModernArchivedPanelProps> = ({
  archivedAppointments,
  onRestore,
  onRemoveFile,
  onPermanentDelete,
  canManageAttachments
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Filtrar agendamentos
  const filteredAppointments = archivedAppointments.filter(appointment => {
    const matchesSearch = searchTerm === "" || [
      appointment.employee?.name,
      appointment.company?.name,
      appointment.employee?.cpf,
      appointment.company?.cnpj
    ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = selectedFilter === "all" || 
      appointment.originalStatus === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // Agrupar por data
  const groupedByDate = filteredAppointments.reduce((groups, appointment) => {
    const date = appointment.date ? new Date(appointment.date).toDateString() : 'Sem data';
    if (!groups[date]) groups[date] = [];
    groups[date].push(appointment);
    return groups;
  }, {} as Record<string, AppointmentWithDetails[]>);

  // Estatísticas
  const stats = {
    total: archivedAppointments.length,
    completed: archivedAppointments.filter(a => a.originalStatus === AppointmentStatus.COMPLETED).length,
    canceled: archivedAppointments.filter(a => a.originalStatus === AppointmentStatus.CANCELED).length,
    noShow: archivedAppointments.filter(a => a.originalStatus === AppointmentStatus.NO_SHOW).length
  };

  const AppointmentCard = ({ appointment }: { appointment: AppointmentWithDetails }) => (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <StatusBadge 
                status={appointment.status} 
                originalStatus={appointment.originalStatus} 
              />
              <span className="text-xs text-gray-500">
                {appointment.date ? new Date(appointment.date).toLocaleString("pt-BR") : "Sem data"}
              </span>
            </div>
            
            {/* Informações principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-sm">{appointment.employee?.name || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{appointment.company?.name || "N/A"}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-gray-500">
                  CPF: {appointment.employee?.cpf || "N/A"}
                </div>
                <div className="text-xs text-gray-500">
                  Setor: {appointment.employee?.sector || appointment.sector || "N/A"}
                </div>
              </div>
            </div>

            {/* Exames complementares */}
            {appointment.hasAdditionalExams && (
              <Badge variant="secondary" className="text-xs">
                Exames Complementares
              </Badge>
            )}

            {/* Anexo */}
            {appointment.attachmentUrl && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <FileDownload 
                  fileData={appointment.attachmentUrl} 
                  fileName={appointment.attachmentName || "documento.pdf"}
                  onDelete={canManageAttachments(appointment.status) ? 
                    () => onRemoveFile(appointment.id) : undefined}
                  showDelete={false}
                />
              </div>
            )}
          </div>

          {/* Ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRestore(appointment.id, AppointmentStatus.SCHEDULED)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar
              </DropdownMenuItem>
              {appointment.attachmentUrl && (
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Anexo
                </DropdownMenuItem>
              )}
              {onPermanentDelete && (
                <DropdownMenuItem 
                  onClick={() => onPermanentDelete(appointment.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Permanentemente
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Archive className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Itens Arquivados</h2>
            <p className="text-gray-600">Gerencie agendamentos arquivados</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Concluídos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.canceled}</div>
              <div className="text-sm text-gray-600">Cancelados</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.noShow}</div>
              <div className="text-sm text-gray-600">Faltaram</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome, empresa, CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value={AppointmentStatus.COMPLETED}>Concluídos</TabsTrigger>
                <TabsTrigger value={AppointmentStatus.CANCELED}>Cancelados</TabsTrigger>
                <TabsTrigger value={AppointmentStatus.NO_SHOW}>Faltaram</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Lista de agendamentos */}
      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Archive className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedFilter !== "all" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Não há itens arquivados no momento"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, appointments]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium">
                    {new Date(date).toLocaleDateString("pt-BR", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <Badge variant="secondary">{appointments.length}</Badge>
                </div>
                
                <div className="grid gap-4">
                  {appointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

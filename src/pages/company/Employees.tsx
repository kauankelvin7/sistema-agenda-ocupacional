import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Users, Search, PlusCircle, Upload, Download, Edit, Trash2, MoreHorizontal, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  getEmployees as getCompanyEmployees, 
  createEmployee as createEmployeeService, 
  importEmployees as importEmployeesService,
  updateEmployee,
  deleteEmployee
} from "@/services/employee-service";
import { Employee } from "@/types";
import * as XLSX from "xlsx";
import EmployeeEditModal from "@/components/EmployeeEditModal";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { EmployeeCard } from "@/components/EmployeeCard";
import { EmployeeAddForm } from "@/components/EmployeeAddForm";
import { useNavigate } from "react-router-dom";
import { formatDateToDisplay, formatDateForInput, formatDateToISO } from "@/lib/date-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";

const CompanyEmployees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // For company users, use their own ID as companyId
  const effectiveCompanyId = user?.role === 'company' ? user.id : user?.companyId;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [fileInputRef] = useState<React.RefObject<HTMLInputElement>>(React.createRef());
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    cpf: "",
    dateOfBirth: "",
    gender: "other",
    role: "",
    sector: "",
    phone: "",
    email: ""
  });
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditEmployee, setCurrentEditEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  const { data: employees = [] as Employee[], isLoading } = useQuery({
    queryKey: ["companyEmployees", effectiveCompanyId],
    queryFn: () => {
      if (!effectiveCompanyId) {
        throw new Error("Company ID is required");
      }
      return getCompanyEmployees(effectiveCompanyId);
    },
    enabled: !!effectiveCompanyId,
    refetchOnWindowFocus: false
  });

  // Auto refresh every 7 seconds
  useAutoRefresh({
    queryKeys: [["companyEmployees", effectiveCompanyId]],
    enabled: !!effectiveCompanyId
  });

  const createMutation = useMutation({
    mutationFn: (employeeData: any) => {
      if (!effectiveCompanyId) {
        throw new Error("Company ID is required");
      }
      return createEmployeeService({
        name: employeeData.name,
        cpf: employeeData.cpf,
        dateOfBirth: formatDateToISO(employeeData.dateOfBirth),
        gender: employeeData.gender,
        role: employeeData.role,
        sector: employeeData.sector,
        phone: employeeData.phone || undefined,
        email: employeeData.email || undefined,
        createdAt: Date.now()
      }, effectiveCompanyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyEmployees", effectiveCompanyId] });
      setNewEmployee({
        name: "",
        cpf: "",
        dateOfBirth: "",
        gender: "other",
        role: "",
        sector: "",
        phone: "",
        email: ""
      });
      setIsAddingEmployee(false);
      toast({
        title: "Funcionário adicionado",
        description: "O funcionário foi cadastrado com sucesso"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o funcionário",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({id, data}: {id: string, data: Partial<Employee>}) => updateEmployee(id, {
      ...data,
      dateOfBirth: formatDateToISO(data.dateOfBirth || ""),
      phone: data.phone || undefined,
      email: data.email || undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyEmployees", effectiveCompanyId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["companyAppointments"] });
      toast({ title: "Funcionário atualizado", description: "Dados do funcionário atualizados com sucesso" });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o funcionário",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyEmployees", effectiveCompanyId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["companyAppointments"] });
      toast({ title: "Funcionário excluído", description: "Funcionário foi removido com sucesso" });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o funcionário",
        variant: "destructive"
      });
    }
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!effectiveCompanyId) {
        throw new Error("Company ID is required");
      }
      
      setIsImporting(true);
      setImportProgress(10);
      
      // Simulate progress updates during import
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      try {
        const result = await importEmployeesService(file, effectiveCompanyId);
        setImportProgress(100);
        clearInterval(progressInterval);
        
        setTimeout(() => {
          setIsImporting(false);
          setImportProgress(0);
        }, 500);
        
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setIsImporting(false);
        setImportProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["companyEmployees", effectiveCompanyId] });
      toast({
        title: "Importação concluída",
        description: `${data.length} funcionários importados com sucesso`
      });
    },
    onError: () => {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os funcionários",
        variant: "destructive"
      });
    }
  });

  // Filtrar funcionários de forma segura
  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.name?.toLowerCase().includes(searchLower) ||
      employee.cpf?.includes(searchTerm) ||
      employee.role?.toLowerCase().includes(searchLower) ||
      employee.sector?.toLowerCase().includes(searchLower) ||
      employee.phone?.includes(searchTerm) ||
      employee.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.cpf) {
      toast({
        title: "Dados incompletos",
        description: "Nome e CPF são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    createMutation.mutate(newEmployee);
  };

  const handleEmployeeFormChange = (field: keyof typeof newEmployee, value: string) => {
    setNewEmployee(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Arquivo inválido",
          description: "Apenas arquivos Excel são permitidos",
          variant: "destructive"
        });
        return;
      }
      importMutation.mutate(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 
        Nome: "Nome Completo", 
        CPF: "123.456.789-00", 
        "Data de Nascimento": "DD/MM/AAAA", 
        Gênero: "Masculino/Feminino/Outro", 
        Telefone: "(11) 99999-9999",
        Email: "funcionario@email.com",
        Cargo: "Cargo do Funcionário",
        Setor: "Setor do Funcionário" 
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Funcionários");
    XLSX.writeFile(wb, "modelo_funcionarios.xlsx");
  };

  const handleScheduleAppointment = (employee: Employee) => {
    navigate('/company/appointments', { 
      state: { 
        selectedEmployee: {
          id: employee.id,
          name: employee.name,
          cpf: employee.cpf
        }
      }
    });
  };

  const handleEditEmployee = (employee: Employee) => {
    setCurrentEditEmployee(employee);
    setEditModalOpen(true);
  };

  const handleSaveEditEmployee = async (form: Employee) => {
    updateMutation.mutate({
      id: form.id,
      data: {
        name: form.name,
        cpf: form.cpf,
        dateOfBirth: form.dateOfBirth,
        role: form.role,
        gender: form.gender,
        sector: form.sector,
        phone: form.phone || undefined,
        email: form.email || undefined
      }
    });
    setEditModalOpen(false);
    setCurrentEditEmployee(null);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployeeToDelete(employeeId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = () => {
    if (employeeToDelete) {
      deleteMutation.mutate(employeeToDelete);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header e busca */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie os funcionários da sua empresa
          </p>
        </div>
        
        {/* Botões de ação */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              size={isMobile ? "mobile-sm" : "default"}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Download size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Baixar</span> Modelo
            </Button>
            <Button
              onClick={handleImportClick}
              variant="outline"
              size={isMobile ? "mobile-sm" : "default"}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
              disabled={isImporting}
            >
              <Upload size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">
                {isImporting ? "Importando..." : "Importar"}
              </span> Planilha
            </Button>
          </div>
          <Button
            onClick={() => setIsAddingEmployee(true)}
            size={isMobile ? "mobile-friendly" : "default"}
            className="gap-1 sm:gap-2 w-full sm:w-auto"
          >
            <PlusCircle size={16} />
            <span className="text-xs sm:text-sm">Adicionar Funcionário</span>
          </Button>
        </div>
      </div>

      {/* Barra de progresso da importação */}
      {isImporting && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importando funcionários...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar funcionários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário de adição */}
      {isAddingEmployee && (
        <EmployeeAddForm
          formData={newEmployee}
          onChange={handleEmployeeFormChange}
          onSubmit={handleAddEmployee}
          onCancel={() => setIsAddingEmployee(false)}
          isLoading={createMutation.isPending}
          isMobile={isMobile}
        />
      )}

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Lista de funcionários */}
      <Card>
        <CardHeader className="bg-muted/50 p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-medium">
            <Users size={18} className="sm:w-5 sm:h-5" />
            <span>Funcionários ({filteredEmployees.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 sm:h-64 items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm sm:text-base">Carregando funcionários...</p>
              </div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex h-48 sm:h-64 flex-col items-center justify-center gap-2 text-center p-4">
              <Users size={40} className="sm:w-12 sm:h-12 text-muted-foreground/50" />
              <p className="text-base sm:text-lg font-medium">Nenhum funcionário encontrado</p>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                {searchTerm ? "Tente outro termo de busca" : "Adicione um novo funcionário ou importe uma planilha"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {isMobile ? (
                // Layout de cards para mobile
                <div className="space-y-2 p-3">
                  {filteredEmployees.map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      onEdit={handleEditEmployee}
                      onDelete={handleDeleteEmployee}
                      onScheduleAppointment={handleScheduleAppointment}
                    />
                  ))}
                </div>
              ) : (
                // Layout de tabela para desktop
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Data de Nascimento</TableHead>
                      <TableHead>Gênero</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.cpf}</TableCell>
                        <TableCell>{formatDateToDisplay(employee.dateOfBirth)}</TableCell>
                        <TableCell>
                          {employee.gender === 'male' ? 'Masculino' : 
                           employee.gender === 'female' ? 'Feminino' : 'Outro'}
                        </TableCell>
                        <TableCell>{employee.role || "Não informado"}</TableCell>
                        <TableCell>{employee.sector || "Não informado"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleScheduleAppointment(employee)}
                              className="gap-1"
                            >
                              <Calendar size={16} />
                              Agendar
                            </Button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal size={18} />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-2 w-32">
                                <div className="flex flex-col gap-1">
                                  <Button 
                                    variant="ghost" 
                                    className="justify-start" 
                                    onClick={() => handleEditEmployee(employee)}
                                  >
                                    <Edit size={16} className="mr-2" /> 
                                    Editar
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    className="justify-start" 
                                    onClick={() => handleDeleteEmployee(employee.id)}
                                  >
                                    <Trash2 size={16} className="mr-2" /> 
                                    Excluir
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <EmployeeEditModal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEditEmployee}
        employee={currentEditEmployee} 
      />
      
      <ConfirmDeleteDialog 
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteEmployee}
        title="Excluir funcionário?"
        description="Deseja realmente excluir este funcionário? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default CompanyEmployees;

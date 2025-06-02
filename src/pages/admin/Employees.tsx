
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Users, Search, Edit, Trash } from "lucide-react";
import { getAllEmployees } from "@/services/employee-service";
import { getCompanies } from "@/services/company-service";
import { Employee, Company } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import EmployeeEditModal from "@/components/EmployeeEditModal";
import { updateEmployee, deleteEmployee } from "@/services/employee-service";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";

/**
 * Admin page to manage employees from all companies
 * @returns Employees management UI
 */
const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Get employees with proper error handling
  const { 
    data: employees = [] as Employee[], 
    isLoading: isLoadingEmployees,
    refetch: refetchEmployees,
    error: employeesError
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getAllEmployees(),
    refetchOnWindowFocus: false
  });

  // Auto refresh every 7 seconds
  useAutoRefresh({
    queryKeys: [["employees"], ["companies"]],
    enabled: true
  });

  // Handle employees error
  React.useEffect(() => {
    if (employeesError) {
      console.error("Failed to load employees:", employeesError);
      toast({
        title: "Erro",
        description: "Falha ao carregar funcionários. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [employeesError, toast]);
  
  // Get companies with proper error handling
  const { 
    data: companies = [] as Company[],
    isLoading: isLoadingCompanies,
    error: companiesError
  } = useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies
  });

  // Handle companies error
  React.useEffect(() => {
    if (companiesError) {
      console.error("Failed to load companies:", companiesError);
      toast({
        title: "Erro",
        description: "Falha ao carregar empresas. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [companiesError, toast]);
  
  // Function to get company name safely
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || "N/A";
  };

  // Handle employee edit
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  // Handle employee update
  const handleSaveEmployee = async (updatedEmployee: Employee) => {
    try {
      await updateEmployee(updatedEmployee.id, updatedEmployee);
      refetchEmployees();
      setIsModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar funcionário. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handle employee delete
  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este funcionário? Esta ação é irreversível.")) {
      try {
        await deleteEmployee(id);
        refetchEmployees();
        toast({
          title: "Sucesso",
          description: "Funcionário excluído permanentemente.",
        });
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast({
          title: "Erro",
          description: "Falha ao excluir funcionário. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  // Filtered employees based on search term
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.cpf.includes(searchTerm) ||
    (employee.sector?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (employee.phone || "").includes(searchTerm) ||
    (employee.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    getCompanyName(employee.companyId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine loading state for UI
  const isLoading = isLoadingEmployees || isLoadingCompanies;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Funcionários</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerenciamento de funcionários de todas as empresas
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome, CPF, setor, telefone, email ou empresa..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/50 px-4 py-3 md:px-6 md:py-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg font-medium">
            <Users size={18} className="md:size-5" />
            <span>Funcionários cadastrados</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              Carregando funcionários...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center p-4">
              <Users size={48} className="text-muted-foreground/50" />
              <p>Nenhum funcionário encontrado</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Tente outro termo de busca" : "Aguardando cadastro de funcionários"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>CPF</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>Telefone</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>Email</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>Cargo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>{employee.cpf}</TableCell>
                      <TableCell>{getCompanyName(employee.companyId)}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>{employee.phone || "N/A"}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>{employee.email || "N/A"}</TableCell>
                      <TableCell>{employee.sector || "Não informado"}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>{employee.role || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmployee && (
        <EmployeeEditModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEmployee}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
};

export default Employees;


import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
import { Building2, Eye, Search } from "lucide-react";
import { getCompanies } from "@/services/company-service";
import { getAllEmployees } from "@/services/employee-service"; 
import { Company } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: companies = [] as Company[], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies
  });
  
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["all-employees"],
    queryFn: getAllEmployees
  });
  
  const companiesWithCounts = companies.map(company => ({
    ...company,
    employeeCount: employees.filter(e => e.companyId === company.id).length
  }));

  const filteredCompanies = companiesWithCounts.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isLoadingCompanies || isLoadingEmployees;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex h-64 items-center justify-center">
          Carregando empresas...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Empresas</h2>
          <p className="text-muted-foreground">
            Gerenciamento de empresas cadastradas
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar empresas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Building2 size={20} />
            <span>Empresas cadastradas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCompanies.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
              <Building2 size={48} className="text-muted-foreground/50" />
              <p>Nenhuma empresa encontrada</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Tente outro termo de busca" : "Cadastre uma empresa para começar"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Nome da Empresa</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Qtd. Funcionários</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={company.photoURL || ""} alt={company.name} />
                        <AvatarFallback>
                          {company.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.phone || "Não informado"}</TableCell>
                    <TableCell>{company.employeeCount || 0}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/admin/companies/${company.id}`}>
                          <Eye size={16} />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Companies;

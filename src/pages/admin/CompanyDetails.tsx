
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Building2, 
  Mail, 
  Users,
  Calendar,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCompany } from "@/services/company-service";
import { getEmployees } from "@/services/employee-service";
import { getAppointments } from "@/services/appointment-service";
import { Employee } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/**
 * Component to display detailed information about a company
 * @returns Company details page component
 */
const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();

  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["company", id],
    queryFn: () => getCompany(id as string),
    enabled: !!id
  });

  const { data: employees = [] as Employee[], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["companyEmployees", id],
    queryFn: () => getEmployees(id as string),
    enabled: !!id
  });

  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["companyAppointments", id],
    queryFn: () => getAppointments(id as string),
    enabled: !!id
  });

  const isLoading = isLoadingCompany || isLoadingEmployees || isLoadingAppointments;

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Carregando...</div>;
  }

  if (!company) {
    return <div className="text-center">Empresa não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" asChild className="p-0 h-8 w-8">
              <Link to="/admin/companies">
                <ArrowLeft size={18} />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{company.name}</h2>
          </div>
          <p className="text-muted-foreground">
            Detalhes da empresa
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg font-medium">
              <Building2 size={20} />
              <span>Informações</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-4">
                <AvatarImage src={company.photoURL || ""} alt={company.name} />
                <AvatarFallback className="text-xl">
                  {company.name?.charAt(0) || "E"}
                </AvatarFallback>
              </Avatar>
            </div>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Empresa</dt>
                <dd className="text-base md:text-lg font-semibold">{company.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="flex items-center gap-2 text-sm md:text-base">
                  <Mail size={16} className="text-muted-foreground" />
                  {company.email}
                </dd>
              </div>
              {company.cnpj && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">CNPJ</dt>
                  <dd className="text-sm md:text-base">{company.cnpj}</dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Funcionários</dt>
                  <dd className="flex items-center gap-2">
                    <Users size={16} className="text-muted-foreground" />
                    {employees.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Agendamentos</dt>
                  <dd className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    {appointments.length}
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDetails;

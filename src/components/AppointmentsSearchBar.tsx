
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AppointmentsSearchBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export const AppointmentsSearchBar: React.FC<AppointmentsSearchBarProps> = ({
  searchTerm,
  setSearchTerm
}) => (
  <div className="flex items-center space-x-2">
    <div className="relative flex-1">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar por empresa, funcionário, CPF, CNPJ, setor, cargo ou tipo de exame..."
        className="pl-8"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  </div>
);

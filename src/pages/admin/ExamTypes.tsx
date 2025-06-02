
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { FileText, Search, PlusCircle, Edit, Trash2 } from "lucide-react";
import { getExamTypes, createExamType, updateExamType, deleteExamType } from "@/services/exam-type-service";
import { toast } from "@/hooks/use-toast";
import { ExamType } from "@/types";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

const ExamTypes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newExamName, setNewExamName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExamType, setCurrentExamType] = useState<ExamType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data: examTypes = [] as ExamType[], isLoading } = useQuery({
    queryKey: ["examTypes"],
    queryFn: getExamTypes
  });

  const createMutation = useMutation({
    mutationFn: createExamType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examTypes"] });
      setNewExamName("");
      setIsAdding(false);
      toast({
        title: "Tipo de exame criado",
        description: "O tipo de exame foi adicionado com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o tipo de exame",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => 
      updateExamType(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examTypes"] });
      setCurrentExamType(null);
      setIsEditing(false);
      toast({
        title: "Tipo de exame atualizado",
        description: "O tipo de exame foi atualizado com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o tipo de exame",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExamType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examTypes"] });
      setIsDeleteDialogOpen(false);
      setCurrentExamType(null);
      toast({
        title: "Tipo de exame excluído",
        description: "O tipo de exame foi excluído com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o tipo de exame",
        variant: "destructive"
      });
    }
  });

  const filteredExamTypes = examTypes.filter(examType => 
    examType.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddExamType = () => {
    if (!newExamName.trim()) return;
    createMutation.mutate({ name: newExamName });
  };

  const handleEditClick = (examType: ExamType) => {
    setCurrentExamType(examType);
    setNewExamName(examType.name);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleUpdateExamType = () => {
    if (!currentExamType || !newExamName.trim()) return;
    updateMutation.mutate({ id: currentExamType.id, name: newExamName });
  };

  const handleDeleteClick = (examType: ExamType) => {
    setCurrentExamType(examType);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (currentExamType) {
      deleteMutation.mutate(currentExamType.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tipos de Exame</h2>
          <p className="text-muted-foreground">
            Gerenciamento de tipos de exames disponíveis
          </p>
        </div>
        <Button onClick={() => {
          setIsAdding(!isAdding);
          setIsEditing(false);
          setNewExamName("");
          setCurrentExamType(null);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Tipo de Exame
        </Button>
      </div>

      {(isAdding || isEditing) && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nome do tipo de exame"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
              />
              {isAdding ? (
                <Button onClick={handleAddExamType} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adicionando..." : "Adicionar"}
                </Button>
              ) : (
                <Button onClick={handleUpdateExamType} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Atualizando..." : "Atualizar"}
                </Button>
              )}
              <Button variant="ghost" onClick={() => {
                setIsAdding(false);
                setIsEditing(false);
                setCurrentExamType(null);
              }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar tipos de exame..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <FileText size={20} />
            <span>Tipos de exame cadastrados</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              Carregando tipos de exame...
            </div>
          ) : filteredExamTypes.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
              <FileText size={48} className="text-muted-foreground/50" />
              <p>Nenhum tipo de exame encontrado</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Tente outro termo de busca" : "Adicione um novo tipo de exame"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExamTypes.map((examType) => (
                  <TableRow key={examType.id}>
                    <TableCell className="font-medium">{examType.name}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditClick(examType)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteClick(examType)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog 
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir tipo de exame"
        description={`Tem certeza que deseja excluir o tipo de exame "${currentExamType?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default ExamTypes;

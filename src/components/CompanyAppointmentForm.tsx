import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isBefore, startOfDay } from "date-fns";
import { Calendar, Clock, CheckCircle, AlertCircle, Users, Building2, FileText, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModernTimeSlotSelector } from "@/components/ModernTimeSlotSelector";
import { AppointmentAttachmentSection } from "@/components/AppointmentAttachmentSection";
import { getEmployees } from "@/services/employee-service";
import { getExamTypes } from "@/services/exam-type-service";
import { getBlockedDates } from "@/services/blocked-dates-service";
import { createAppointment } from "@/services/appointment-service";
import { useToast } from "@/hooks/use-toast";
import { AppointmentStatus, ExamShift } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompanyAppointmentFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  selectedEmployeeId?: String;
}

export const CompanyAppointmentForm: React.FC<CompanyAppointmentFormProps> = ({
  onCancel,
  onSuccess,
  selectedEmployeeId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState<string>(selectedEmployeeId ? String(selectedEmployeeId) : "");
  const [examTypeId, setExamTypeId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [hasAdditionalExams, setHasAdditionalExams] = useState(false);
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [effectiveCompanyId, setEffectiveCompanyId] = useState<string>("");

  // Determinar o CompanyId correto - CORRIGIDO
  useEffect(() => {
    if (user) {
      let companyId = "";
      
      if (user.role === 'company') {
        // Para usuários empresa, usar o próprio ID como companyId
        companyId = user.id;
      } else if (user.companyId) {
        // Para outros usuários com companyId
        companyId = user.companyId;
      }
      
      setEffectiveCompanyId(companyId);
    }
  }, [user]);

  // Fetch employees com melhor tratamento de erro
  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ["company-employees", effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) {
        throw new Error("Company ID não encontrado para este usuário");
      }
      return await getEmployees(effectiveCompanyId);
    },
    enabled: !!effectiveCompanyId && !!user,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch exam types
  const { data: examTypes = [], isLoading: examTypesLoading } = useQuery({
    queryKey: ["examTypes"],
    queryFn: getExamTypes,
  });

  // Fetch blocked dates
  const { data: blockedDates = [] } = useQuery({
    queryKey: ["blockedDates"],
    queryFn: getBlockedDates,
  });

  const blockedDateStrings = blockedDates.map(bd => bd.date);

  const isFormValid = !!(employeeId && examTypeId && selectedDate && selectedTime);

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    const isBeforeToday = isBefore(date, today);
    const dateStr = format(date, "yyyy-MM-dd");
    const isBlocked = blockedDateStrings.includes(dateStr);
    return isBeforeToday || isBlocked;
  };

  const handleFileAttach = (fileBase64: string, fileName: string) => {
    setAttachmentUrl(fileBase64);
    setAttachmentName(fileName);
    toast({
      title: "📎 Arquivo anexado",
      description: `O arquivo ${fileName} foi anexado com sucesso`,
    });
  };

  const handleCreateAppointment = async () => {
    if (!isFormValid || !selectedDate || !effectiveCompanyId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      const shift = hours < 12 ? ExamShift.MORNING : ExamShift.AFTERNOON;

      const appointmentData = {
        companyId: effectiveCompanyId,
        employeeId: String(employeeId),
        examTypeId: examTypeId,
        date: appointmentDateTime.toISOString(),
        status: AppointmentStatus.SCHEDULED,
        createdAt: Date.now(),
        hasAdditionalExams: hasAdditionalExams,
        description: description.trim(),
        shift,
        employeeName: employees.find(e => e.id === employeeId)?.name || '',
        employeeCpf: employees.find(e => e.id === employeeId)?.cpf || '',
        employeeSector: employees.find(e => e.id === employeeId)?.sector || '',
        employeeRole: employees.find(e => e.id === employeeId)?.role || '',
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachmentName || undefined
      };

      await createAppointment(appointmentData);

      toast({
        title: "✅ Agendamento criado",
        description: "O agendamento foi criado com sucesso",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o agendamento",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (selectedTime) {
      setSelectedTime("");
    }
  };

  if (employeesError) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Erro ao carregar funcionários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os funcionários da empresa. 
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700 mb-2">
              <strong>Possíveis causas:</strong>
            </p>
            <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
              <li>Usuário não possui vinculação com empresa</li>
              <li>Problemas de permissão no banco de dados</li>
              <li>Empresa não possui funcionários cadastrados</li>
            </ul>
          </div>
          <Button onClick={onCancel} variant="outline">
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CalendarDays className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Novo Agendamento</h1>
            <p className="text-muted-foreground">
              Crie um novo agendamento para seus funcionários
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Seleção do Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee" className="text-base font-medium">Funcionário *</Label>
                {employeesLoading && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-blue-700">Carregando funcionários...</span>
                    </div>
                  </div>
                )}
                {!employeesLoading && employees.length === 0 && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <div>
                        <span className="text-amber-700 block font-medium">
                          Nenhum funcionário encontrado
                        </span>
                        <span className="text-sm text-amber-600">
                          Cadastre funcionários na aba "Funcionários" antes de criar agendamentos.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {!employeesLoading && employees.length > 0 && (
                  <Select 
                    value={employeeId} 
                    onValueChange={setEmployeeId}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{employee.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {employee.sector} • {employee.role}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="examType" className="text-base font-medium">Tipo de Exame *</Label>
                <Select 
                  value={examTypeId} 
                  onValueChange={setExamTypeId}
                  disabled={examTypesLoading || examTypes.length === 0}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={
                      examTypesLoading 
                        ? "Carregando tipos de exame..." 
                        : examTypes.length === 0 
                          ? "Nenhum tipo de exame encontrado" 
                          : "Selecione o tipo de exame"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((examType) => (
                      <SelectItem key={examType.id} value={examType.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{examType.name}</span>
                          {examType.description && (
                            <span className="text-sm text-muted-foreground">
                              {examType.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <Checkbox 
                  id="additionalExams" 
                  checked={hasAdditionalExams}
                  onCheckedChange={(checked) => setHasAdditionalExams(checked === true)}
                />
                <Label htmlFor="additionalExams" className="text-sm font-medium text-amber-800">
                  Funcionário fará exames complementares (apenas manhã - até 12:00)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Date and Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Data e Horário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-medium">Data do Agendamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={isDateDisabled}
                      initialFocus
                      className="border-0"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <ModernTimeSlotSelector
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                hasAdditionalExams={hasAdditionalExams}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">Observações</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Observações adicionais sobre o agendamento..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Attachment Section */}
          <AppointmentAttachmentSection
            onFileAttach={handleFileAttach}
            attachmentUrl={attachmentUrl}
            attachmentName={attachmentName}
            disabled={isSubmitting}
          />
        </div>

        {/* Status Sidebar */}
        <div className="space-y-6">
          {/* Form Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status do Formulário</CardTitle>
            </CardHeader>
            <CardContent>
              {isFormValid ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Formulário completo!</p>
                      <p className="text-sm text-green-600">Pronto para criar o agendamento</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleCreateAppointment}
                    disabled={isSubmitting}
                    className="w-full h-12 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Criar Agendamento
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 mb-2">Campos obrigatórios:</p>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {!employeeId && <li>• Funcionário</li>}
                        {!examTypeId && <li>• Tipo de exame</li>}
                        {!selectedDate && <li>• Data</li>}
                        {!selectedTime && <li>• Horário</li>}
                      </ul>
                    </div>
                  </div>
                  
                  <Button 
                    disabled
                    className="w-full h-12 bg-gray-300 text-gray-500 cursor-not-allowed"
                  >
                    Complete os campos obrigatórios
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full h-12"
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Funcionários disponíveis:</span>
                <span className="font-medium">{employees.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipos de exame:</span>
                <span className="font-medium">{examTypes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Datas bloqueadas:</span>
                <span className="font-medium">{blockedDates.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

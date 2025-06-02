
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, RotateCcw, Clock, Users, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AppointmentLimits } from "@/types";
import { getClinicLimits, saveClinicLimits } from "@/services/appointment-limits-new";

export const ClinicLimitsManager: React.FC = () => {
  const [limits, setLimits] = useState<AppointmentLimits>({
    morningEarly: 7,
    morningLate: 3,
    afternoon: 3,
    evening: 1,
    morningShiftTotal: 110,
    afternoonShiftTotal: 60
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadCurrentLimits();
  }, []);

  const loadCurrentLimits = async () => {
    setIsLoadingData(true);
    try {
      const currentLimits = await getClinicLimits();
      setLimits(currentLimits);
    } catch (error) {
      console.error("Erro ao carregar limites:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações atuais",
        variant: "destructive"
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validações básicas
      if (limits.morningEarly < 1 || limits.morningLate < 1 || 
          limits.afternoon < 1 || limits.evening < 1 ||
          limits.morningShiftTotal < 1 || limits.afternoonShiftTotal < 1) {
        toast({
          title: "Erro de validação",
          description: "Todos os limites devem ser números positivos",
          variant: "destructive"
        });
        return;
      }

      await saveClinicLimits(limits);
      
      toast({
        title: "Configurações salvas",
        description: "Os limites de agendamento foram atualizados com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao salvar limites:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setLimits({
      morningEarly: 7,
      morningLate: 3,
      afternoon: 3,
      evening: 1,
      morningShiftTotal: 110,
      afternoonShiftTotal: 60
    });
    toast({
      title: "Valores restaurados",
      description: "As configurações foram resetadas para os valores padrão",
      variant: "default"
    });
  };

  const updateLimit = (field: keyof AppointmentLimits, value: string) => {
    const numValue = parseInt(value) || 0;
    setLimits(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Configuração de Limites de Agendamento</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Como funcionam os limites</h3>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Limites por horário:</strong> Controlam quantos agendamentos podem ser feitos em cada horário específico</p>
          <p>• <strong>Limites por turno:</strong> Controlam o total geral de agendamentos em todo o período (manhã ou tarde)</p>
          <p>• <strong>Validação dupla:</strong> Ambos os limites são verificados - o mais restritivo sempre prevalece</p>
        </div>
      </div>

      {/* Limites por Horário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Limites por Faixa de Horário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Manhã Inicial (8:00 - 10:00)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={limits.morningEarly}
                  onChange={(e) => updateLimit('morningEarly', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">pessoas por horário</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Exemplo: às 8:00, às 9:00 (máximo {limits.morningEarly} pessoas em cada horário)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Manhã Tardia (10:00 - 12:00)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={limits.morningLate}
                  onChange={(e) => updateLimit('morningLate', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">pessoas por horário</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Exemplo: às 10:00, às 11:00 (máximo {limits.morningLate} pessoas em cada horário)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tarde (12:00 - 16:00)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={limits.afternoon}
                  onChange={(e) => updateLimit('afternoon', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">pessoas por horário</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Exemplo: às 13:00, às 14:00, às 15:00 (máximo {limits.afternoon} pessoas em cada horário)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Final do Dia (16:00 - 16:45)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={limits.evening}
                  onChange={(e) => updateLimit('evening', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">pessoas por horário</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Apenas às 16:00 (máximo {limits.evening} pessoa no horário)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limites por Turno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Limites Totais por Turno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Manhã (8:00 - 12:00)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={limits.morningShiftTotal}
                  onChange={(e) => updateLimit('morningShiftTotal', e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">agendamentos no turno</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Limite geral para todo o período da manhã
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Tarde (12:00 - 16:45)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={limits.afternoonShiftTotal}
                  onChange={(e) => updateLimit('afternoonShiftTotal', e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">agendamentos no turno</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Limite geral para todo o período da tarde
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
        <Button variant="outline" onClick={resetToDefaults} disabled={isLoading}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrão
        </Button>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { getDayAppointmentStats } from "@/services/appointment-limits-new";
import { AppointmentStats } from "@/types";

interface AppointmentStatsDisplayProps {
  selectedDate: Date;
}

export const AppointmentStatsDisplay: React.FC<AppointmentStatsDisplayProps> = ({
  selectedDate
}) => {
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const dayStats = await getDayAppointmentStats(dateStr);
        setStats(dayStats);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedDate]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Clock className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando estatísticas...</span>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const getOccupancyColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Estatísticas para {format(selectedDate, "dd/MM/yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.morningTotal}</div>
              <div className="text-sm text-muted-foreground">Agendamentos Manhã</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.afternoonTotal}</div>
              <div className="text-sm text-muted-foreground">Agendamentos Tarde</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ocupação por Horário
            </h4>
            <div className="grid gap-2">
              {stats.hourlyStats.map((hourStat) => (
                <div key={hourStat.hour} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{hourStat.hour}:00</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {hourStat.current}/{hourStat.limit}
                    </span>
                    <Badge 
                      variant={hourStat.available ? "secondary" : "destructive"}
                      className={`${getOccupancyColor(hourStat.current, hourStat.limit)} text-white`}
                    >
                      {hourStat.available ? "Disponível" : "Esgotado"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

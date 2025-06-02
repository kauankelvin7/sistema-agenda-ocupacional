
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Ban, Clock } from "lucide-react";
import ClinicCapacityManager from "@/components/ClinicCapacityManager";
import BlockedDatesManager from "@/components/BlockedDatesManager";
import BlockedTimeSlotsManager from "@/components/BlockedTimeSlotsManager";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações da Clínica</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações e capacidades da clínica
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="capacity" className="w-full">
            <div className="px-4 pt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="capacity" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Capacidade
                </TabsTrigger>
                <TabsTrigger value="blocked-dates" className="flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  Datas Bloqueadas
                </TabsTrigger>
                <TabsTrigger value="blocked-times" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horários Bloqueados
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="capacity" className="p-4">
              <ClinicCapacityManager />
            </TabsContent>
            
            <TabsContent value="blocked-dates" className="p-4">
              <BlockedDatesManager />
            </TabsContent>
            
            <TabsContent value="blocked-times" className="p-4">
              <BlockedTimeSlotsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

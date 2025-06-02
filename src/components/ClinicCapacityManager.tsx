
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, Ban, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import SlotLimitsManager from "@/components/SlotLimitsManager";

const ClinicCapacityManager = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("slotLimits");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="slotLimits" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          {isMobile ? (
            <>
              <TabsTrigger value="slotLimits" className="flex-1">
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Limites por Slot</span>
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="slotLimits">
                <Settings className="h-4 w-4 mr-2" />
                Limites por Slot
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="slotLimits" className="mt-4">
          <SlotLimitsManager />
        </TabsContent>
        
        <TabsContent value="blockedDates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gerenciar Datas Bloqueadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                O componente BlockedDatesManager será renderizado aqui pelo componente pai.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="blockedTimeSlots" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Gerenciar Horários Bloqueados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                O componente BlockedTimeSlotsManager será renderizado aqui pelo componente pai.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClinicCapacityManager;

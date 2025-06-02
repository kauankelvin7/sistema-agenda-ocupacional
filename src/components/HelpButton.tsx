
import { useState } from "react";
import { CircleHelp, Mail, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  const helpContacts = [
    {
      type: "E-mail Suporte",
      value: "suporte@novaagenda.com.br",
      icon: <Mail className="h-4 w-4" />,
      action: () => window.open("mailto:suporte@novaagenda.com.br", "_blank")
    },
    {
      type: "E-mail Comercial",
      value: "atendimento@novamedicinadf.com.br", 
      icon: <Mail className="h-4 w-4" />,
      action: () => window.open("mailto:atendimento@novamedicinadf.com.br", "_blank")
    },
    {
      type: "Telefone",
      value: "(61) 9 8596-4960",
      icon: <Phone className="h-4 w-4" />,
      action: () => window.open("tel:+5561985964960", "_blank")
    },
    {
      type: "WhatsApp",
      value: "(61) 9 8596-4960",
      icon: <MessageSquare className="h-4 w-4" />,
      action: () => window.open("https://wa.me/5561985964960", "_blank")
    }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full"
          aria-label="Ajuda e Suporte"
        >
          <CircleHelp className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Central de Ajuda</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Entre em contato conosco para tirar suas dúvidas
          </p>
        </div>
        <div className="p-4 space-y-3">
          {helpContacts.map((contact, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={contact.action}
            >
              <div className="flex-shrink-0 text-primary">
                {contact.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{contact.type}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {contact.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-muted-foreground text-center">
            Horário de atendimento: Segunda à Sexta, 6:30h às 16:45h
          </p>
          <p className="text-xs text-red-500 text-center mt-1">
            Exames complementares são realizados de segunda a sexta-feira, das 6:30h às 12h.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

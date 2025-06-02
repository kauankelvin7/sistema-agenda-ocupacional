
import React from "react";
import { cn } from "@/lib/utils";

interface ScrollableTableContainerProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
  showScrollbar?: boolean;
}

/**
 * Container com scroll otimizado para tabelas e listas grandes
 * Proporciona uma navegação suave e controle da altura máxima
 */
export const ScrollableTableContainer: React.FC<ScrollableTableContainerProps> = ({
  children,
  maxHeight = "600px",
  className,
  showScrollbar = true
}) => {
  return (
    <div
      className={cn(
        "relative overflow-auto border rounded-md",
        showScrollbar ? "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" : "",
        className
      )}
      style={{ maxHeight }}
    >
      {/* Indicador visual de scroll disponível */}
      <div className="absolute top-0 right-0 z-10 pointer-events-none">
        <div className="h-4 w-4 bg-gradient-to-bl from-background/80 to-transparent" />
      </div>
      
      {children}
      
      {/* Sombra inferior para indicar mais conteúdo */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
    </div>
  );
};

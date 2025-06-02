
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const featuredApps = [
  { title: "Image to Video", subtitle: "By OpenArt", isNew: true },
  { title: "Ultimate Upscale", subtitle: "By OpenArt" },
  { title: "AI Filters", subtitle: "By OpenArt" },
  { title: "Sketch to image", subtitle: "By OpenArt" },
  { title: "Blend Board", subtitle: "By OpenArt" },
  { title: "Change Facial Expression", subtitle: "By OpenArt" },
  { title: "Expand", subtitle: "By OpenArt" },
  { title: "Remove background", subtitle: "By OpenArt" }
];

export const FeaturedAppsSection: React.FC = () => {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">
        Aplicativos em Destaque
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {featuredApps.slice(0, 4).map((app, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <div className="aspect-square bg-gray-600 rounded-lg mb-3 flex items-center justify-center">
              <img src="/uploads/logo.png" alt={app.title} className="w-12 h-12 object-contain" />
            </div>
            <h3 className="text-white font-medium text-sm mb-1">{app.title}</h3>
            <p className="text-gray-400 text-xs">{app.subtitle}</p>
            {app.isNew && (
              <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded mt-2">
                Novo
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {featuredApps.slice(4, 8).map((app, index) => (
          <div key={index + 4} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <div className="aspect-square bg-gray-600 rounded-lg mb-3 flex items-center justify-center">
              <img src="/uploads/logo.png" alt={app.title} className="w-12 h-12 object-contain" />
            </div>
            <h3 className="text-white font-medium text-sm mb-1">{app.title}</h3>
            <p className="text-gray-400 text-xs">{app.subtitle}</p>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          className="border-gray-700 hover:bg-gray-800 transition-all text-white flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium hover:scale-105"
        >
          Ver Todos os Aplicativos
          <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
};

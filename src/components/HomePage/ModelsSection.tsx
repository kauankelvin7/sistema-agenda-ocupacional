
import React from "react";
import { ModelCard } from "../ModelCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const ModelsSection: React.FC = () => {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">
        Start from a model
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ModelCard 
          title="Train your own model"
          subtitle="Customize your creativity"
          imageSrc=""
          isTrainYourOwn={true}
        />
        <ModelCard 
          title="OpenArt SDXL"
          subtitle="OpenArt"
          imageSrc="/uploads/logo.png"
          tags={[
            { label: 'SDXL', variant: 'blue' },
            { label: 'Standard', variant: 'green' }
          ]}
        />
        <ModelCard 
          title="Flux (dev)"
          subtitle="Flux_dev"
          imageSrc="/uploads/logo.png"
          tags={[
            { label: 'Flux', variant: 'orange' },
            { label: 'Standard', variant: 'green' }
          ]}
        />
        <ModelCard 
          title="Flux Realism"
          subtitle="Flux_Realism"
          imageSrc="/uploads/logo.png"
          tags={[
            { label: 'Flux', variant: 'orange' },
            { label: 'Photorealistic', variant: 'yellow' }
          ]}
        />
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          className="border-gray-700 hover:bg-gray-800 transition-all text-white flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium hover:scale-105"
        >
          View All Models
          <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
};

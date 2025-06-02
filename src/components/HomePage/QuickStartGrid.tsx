
import React from "react";
import { Video, Paintbrush, Grid, FileText, Search } from "lucide-react";

const quickStartItems = [
  {
    icon: Video,
    title: "Image to Video",
    description: "Bring your image to life",
    bgColor: "bg-[#3A3600]",
    iconColor: "text-[#FFD426]",
    isNew: true
  },
  {
    icon: Paintbrush,
    title: "Choose a Style",
    description: "Start with a style you like",
    bgColor: "bg-[#00361F]",
    iconColor: "text-[#00A67E]"
  },
  {
    icon: Grid,
    title: "Explore Models",
    description: "See 100+ Fine-tuned models",
    bgColor: "bg-[#360036]",
    iconColor: "text-[#FF3EA5]"
  },
  {
    icon: FileText,
    title: "Train Model",
    description: "Customize your creativity",
    bgColor: "bg-[#36003B]",
    iconColor: "text-[#FF3EA5]"
  },
  {
    icon: Search,
    title: "Ultimate Upscale",
    description: "Upscale your images",
    bgColor: "bg-[#3A3600]",
    iconColor: "text-[#FFD426]"
  },
  {
    icon: FileText,
    title: "Image to Prompt",
    description: "Convert image to text prompt",
    bgColor: "bg-[#003619]",
    iconColor: "text-[#00A67E]"
  }
];

export const QuickStartGrid: React.FC = () => {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">
        Quick starts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickStartItems.map((item, index) => (
          <div key={index} className="bg-[#1A1A1A] hover:bg-[#222222] transition-colors rounded-lg p-4 flex items-start cursor-pointer group">
            <div className={`p-3 rounded-lg ${item.bgColor} mr-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <item.icon size={24} className={item.iconColor} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white group-hover:text-gray-200 transition-colors">{item.title}</h3>
                {item.isNew && (
                  <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                    New
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

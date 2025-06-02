
import { useEffect } from "react";
import { PromoBar } from "../components/PromoBar";
import { Sidebar } from "../components/Sidebar";
import Header from "../components/Header";
import { QuickStartGrid } from "../components/HomePage/QuickStartGrid";
import { FeaturedAppsSection } from "../components/HomePage/FeaturedAppsSection";
import { ModelsSection } from "../components/HomePage/ModelsSection";
import { Link } from "react-router-dom";
import Logo from "/uploads/logo.png";

const Index = () => {
  // Add a handler to add the logo.svg file if it's missing
  useEffect(() => {
    // Check if the logo exists, if not create a simple one
    const checkLogo = async () => {
      try {
        const response = await fetch('/logo.svg');
        if (response.status === 404) {
          console.log('Logo not found, would create one in a real app');
        }
      } catch (error) {
        console.log('Error checking logo:', error);
      }
    };
    
    checkLogo();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <PromoBar />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 overflow-auto">
            <main className="py-8 px-12">
              <h1 className="text-3xl font-bold text-white mb-8">
                Sistema de Agendamentos
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
                  <h2 className="text-xl font-semibold text-white mb-4">Agendamentos</h2>
                  <p className="text-gray-300 mb-4">Gerencie os agendamentos da sua empresa</p>
                  <Link 
                    to="/company/appointments" 
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Acessar Agendamentos
                  </Link>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
                  <h2 className="text-xl font-semibold text-white mb-4">Funcionários</h2>
                  <p className="text-gray-300 mb-4">Gerencie os funcionários da sua empresa</p>
                  <Link 
                    to="/company/employees" 
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Acessar Funcionários
                  </Link>
                </div>
              </div>
              
              <QuickStartGrid />
              <FeaturedAppsSection />
              <ModelsSection />
            </main>
          </div>
        </div>
      </div>
      <footer className="p-4 flex flex-col md:flex-row items-center justify-between gap-2 bg-muted/50 rounded animate-fade-in mt-8">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="Logo" className="w-7 h-7" />
          <span className="font-bold text-primary">NovaAgenda</span>
        </div>
        <Link
          to="/privacy-policy"
          className="underline text-muted-foreground hover:text-primary"
        >
          Política de Privacidade
        </Link>
      </footer>
    </div>
  );
};

export default Index;

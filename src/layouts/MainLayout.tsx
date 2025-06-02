
import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoonIcon, SunIcon, FileText, Menu, X } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { HelpButton } from "@/components/HelpButton";
import { getInitials } from "@/utils/image-utils";

/**
 * Main layout component for the application
 * Provides navigation, theme switching, and account management
 * @returns Main layout component with header, navigation, and content area
 */
const MainLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const isAdmin = user?.role === UserRole.ADMIN;

  // Navigation items based on user role
  const navItems = isAdmin
    ? [
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Empresas", path: "/admin/companies" },
        { label: "Tipos de Exame", path: "/admin/exam-types" },
        { label: "Agendamentos", path: "/admin/appointments" },
        { label: "Notificações", path: "/admin/notifications" },
      ]
    : [
        { label: "Dashboard", path: "/company/dashboard" },
        { label: "Funcionários", path: "/company/employees" },
        { label: "Agendamentos", path: "/company/appointments" },
      ];

  const currentName = user?.displayName || "Usuário";
  const currentPhotoURL = user?.photoURL;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center px-4 py-2 bg-white dark:bg-card border-b shadow-sm">
        <div className="flex items-center">
          <img src="/uploads/logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
          <span className="ml-2 text-base md:text-lg font-semibold">
            {isAdmin ? "Clínica" : "Empresa"}
          </span>
        </div>

        {/* Mobile menu button */}
        <button
          className="ml-auto md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex ml-8 space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === item.path
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden md:flex items-center space-x-2">
          <NotificationBell />
          
          <HelpButton />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-full"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>

          {/* Privacy policy button */}
          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            aria-label="Privacy Policy"
            className="rounded-full"
          >
            <Link to="/privacy-policy">
              <FileText className="h-5 w-5" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {/* Usa a logo atualizada da empresa */}
                  {currentPhotoURL ? (
                    <img src={currentPhotoURL} alt={currentName} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <AvatarFallback>
                      {getInitials(currentName)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {currentName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to={isAdmin ? "/admin/settings" : "/company/settings"}
                  className="cursor-pointer"
                >
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/privacy-policy" className="cursor-pointer">
                  Política de Privacidade
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => signOut()}
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-card border-b shadow-inner overflow-hidden animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2.5 rounded-md text-base font-medium ${
                  location.pathname === item.path
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-base font-medium">Notificações</span>
              <NotificationBell />
            </div>
            
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-base font-medium">Ajuda</span>
              <HelpButton />
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            <Link
              to={isAdmin ? "/admin/settings" : "/company/settings"}
              className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Configurações
            </Link>
            <Link
              to="/privacy-policy"
              className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Política de Privacidade
            </Link>
            <button
              onClick={toggleTheme}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {isDarkMode ? (
                <>
                  <SunIcon size={16} />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <MoonIcon size={16} />
                  <span>Modo Escuro</span>
                </>
              )}
            </button>
            <button
              onClick={() => signOut()}
              className="w-full text-left block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Sair
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 p-3 md:p-6 bg-gray-50 dark:bg-background">
        <Outlet />
      </main>

      <footer className="py-4 px-4 md:px-6 border-t text-xs md:text-sm text-center text-muted-foreground">
        <div className="max-w-7xl mx-auto">
          <p>© {new Date().getFullYear()} NovaAgenda - Todos os direitos reservados</p>
          <p>SDS, Bloco D, Ed. Eldorado, Entrada B, 1º. Subsolo Sala 01 Conic - Plano Piloto, Brasília - DF, 70391-901</p>
          <div className="mt-2">
            <Link to="/privacy-policy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

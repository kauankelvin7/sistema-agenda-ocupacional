
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { signUp } from "@/services/auth-service";
import { UserRole } from "@/types";
import { formatCNPJ, formatPhone } from "@/utils/format-utils";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCNPJ(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !companyName || !cnpj) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Passa o CNPJ, nome da empresa e telefone para a função de registro
      const user = await signUp(
        email, 
        password, 
        name, 
        UserRole.COMPANY, 
        companyName, 
        cnpj,
        phone || undefined // Telefone é opcional
      );

      if (user) {
        // Registration successful, now log the user in
        await signIn(email, password);
        
        toast({
          title: "Sucesso",
          description: "Registro realizado com sucesso!",
        });
        
        // Redirect to dashboard without requiring a separate login
        navigate("/company/dashboard");
      } else {
        toast({
          title: "Erro",
          description: "Falha ao registrar o usuário.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao registrar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background">
      <div className="w-full max-w-md shadow-lg rounded-xl bg-white dark:bg-card px-6 py-8 space-y-6">
        <div className="flex justify-center mb-4">
          <img src="/uploads/logo.png" alt="Logo" className="h-16 w-16 rounded-full" />
        </div>
        <h2 className="text-2xl font-semibold text-center">Criar sua conta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome *</label>
            <Input
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Empresa *</label>
            <Input
              type="text"
              placeholder="Nome da sua empresa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CNPJ *</label>
            <Input
              type="text"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={handleCNPJChange}
              required
              className="mt-1"
              maxLength={18}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <Input
              type="text"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={handlePhoneChange}
              className="mt-1"
              maxLength={15}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Campo opcional, pode ser preenchido depois</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <Input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha *</label>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar Senha *</label>
            <Input
              type="password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
        <div className="text-center">
          Já tem uma conta?{" "}
          <a href="/login" className="text-primary">
            Entrar
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;

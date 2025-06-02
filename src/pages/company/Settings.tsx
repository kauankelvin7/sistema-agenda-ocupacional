import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { updateCompany, getCompany } from "@/services/company-service";
import { Company } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Trash2, Upload, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { resizeImage, validateImageFile, getInitials } from "@/utils/image-utils";
import { formatPhone } from "@/utils/format-utils";

export default function CompanySettings() {
  const { user, deleteAccount, updateCompanyLogo } = useAuth();
  const [companyData, setCompanyData] = useState<Partial<Company>>({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    photoURL: user?.photoURL || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.photoURL || null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CORREÇÃO: Carregar dados da empresa ao montar o componente
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log("Carregando dados da empresa para configurações:", user.id);
        
        const company = await getCompany(user.id);
        if (company) {
          console.log("Dados da empresa carregados:", { 
            hasPhone: !!company.phone, 
            hasLogo: !!company.photoURL,
            logoPreview: company.photoURL ? company.photoURL.substring(0, 50) + "..." : "none"
          });
          
          setCompanyData({
            name: company.name || user.displayName || '',
            email: company.email || user.email || '',
            phone: company.phone || '',
            photoURL: company.photoURL || user.photoURL || ''
          });
          setLogoPreview(company.photoURL || user.photoURL || null);
        } else {
          // Fallback para dados do usuário se empresa não encontrada
          setCompanyData({
            name: user.displayName || '',
            email: user.email || '',
            phone: '',
            photoURL: user.photoURL || ''
          });
          setLogoPreview(user.photoURL || null);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da empresa:", error);
        toast({
          title: "Aviso",
          description: "Alguns dados podem não estar atualizados",
          variant: "default"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Aplicar formatação no telefone
      const formattedPhone = formatPhone(value);
      setCompanyData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setCompanyData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);

      if (!validateImageFile(file)) {
        toast({
          title: "Erro",
          description: "Arquivo inválido. Use apenas imagens JPG, PNG, GIF ou WebP até 10MB",
          variant: "destructive"
        });
        return;
      }

      console.log("Processando upload de logo", { fileName: file.name, fileSize: file.size });

      const resizedImageUrl = await resizeImage(file, {
        maxWidth: 80,
        maxHeight: 80,
        quality: 0.8
      });

      console.log("Imagem redimensionada com sucesso");

      setLogoPreview(resizedImageUrl);
      await updateCompanyLogo(resizedImageUrl);

      setCompanyData(prev => ({
        ...prev,
        photoURL: resizedImageUrl
      }));

      toast({
        title: "Logo atualizada",
        description: "A logo da empresa foi atualizada com sucesso"
      });

      console.log("Logo atualizada com sucesso em todos os componentes");
    } catch (error) {
      console.error("Erro ao fazer upload da logo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a logo",
        variant: "destructive"
      });
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      console.error("Erro: Usuário não encontrado");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await updateCompany(user.id, {
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone
      });
      
      toast({
        title: "Configurações atualizadas",
        description: "Suas informações foram atualizadas com sucesso"
      });
      console.log("Configurações atualizadas com sucesso", { userId: user.id, updatedData: companyData });
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar suas informações",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, digite sua senha para confirmar",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log("Iniciando processo de exclusão de conta", { userId: user?.id });
      
      await deleteAccount();
      
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso"
      });
      
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir sua conta",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">
            Carregando suas informações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações e preferências
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo Upload Section */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Logo da Empresa</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={logoPreview || user?.photoURL || ""} alt="Logo da empresa" />
                    <AvatarFallback>
                      {user?.displayName ? getInitials(user.displayName) : <User className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="w-fit"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploadingLogo ? "Processando..." : "Alterar Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, GIF ou WebP. Será redimensionada automaticamente para 80x80px
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nome da sua empresa"
                  value={companyData.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contato@empresa.com"
                  value={companyData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={companyData.phone || ''}
                  onChange={handleInputChange}
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground">
                  Campo opcional, pode ser deixado em branco
                </p>
              </div>
            </div>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Privacy Policy Link */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Documentos importantes relacionados ao uso do sistema
          </p>
          <div className="flex flex-col space-y-2">
            <Button variant="outline" asChild>
              <Link to="/privacy-policy">Política de Privacidade</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Card */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Ações irreversíveis. Tenha certeza antes de prosseguir.
          </p>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir Conta
            </DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Todos os dados da sua empresa, funcionários e agendamentos serão excluídos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-password">Digite sua senha para confirmar</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2"
              placeholder="Sua senha"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button 
              variant="destructive" 
              disabled={!confirmPassword || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Logo from "/uploads/logo.png";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-3xl w-full animate-fade-in">
        <CardHeader className="flex flex-col items-center">
          <img src={Logo} alt="Logo" className="w-12 h-12 rounded-full mb-2" />
          <CardTitle className="text-2xl font-bold text-center mb-2">
            Política de Privacidade
          </CardTitle>
          <Button variant="ghost" className="absolute left-6 top-6" onClick={() => navigate(-1)}>
            <span className="mr-2">⟵</span> Voltar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[65vh] overflow-y-auto">
          <p>
            Esta Política de Privacidade descreve como as informações pessoais dos usuários são coletadas, utilizadas e protegidas pelo nosso sistema NovaAgenda.
          </p>
          <h3 className="text-lg font-semibold">1. Coleta de Informações</h3>
          <p>
            Coletamos dados necessários para o funcionamento do sistema, como nome da empresa, e-mail, CNPJ, funcionários, agendamentos e informações relacionadas.
          </p>
          <h3 className="text-lg font-semibold">2. Uso das Informações</h3>
          <p>
            Utilizamos as informações para fornecer os serviços previstos, permitir gestão de agendamentos, identificação de usuários e comunicação entre as partes cadastradas.
          </p>
          <h3 className="text-lg font-semibold">3. Compartilhamento de Dados</h3>
          <p>
            Não compartilhamos dados pessoais com terceiros, exceto quando exigido por lei ou regulamento aplicável, ou mediante autorização expressa.
          </p>
          <h3 className="text-lg font-semibold">4. Segurança</h3>
          <p>
            Adotamos medidas de segurança para proteger os dados dos usuários, utilizando protocolos de segurança e armazenamento adequados para evitar acesso não autorizado.
          </p>
          <h3 className="text-lg font-semibold">5. Direitos dos Usuários</h3>
          <p>
            Os usuários podem solicitar acesso, correção ou exclusão de seus dados a qualquer momento, mediante requisição formal e comprovação de identidade.
          </p>
          <h3 className="text-lg font-semibold">6. Cookies</h3>
          <p>
            O sistema pode utilizar cookies para melhorar a experiência do usuário, coletando dados anônimos relacionados à navegação.
          </p>
          <h3 className="text-lg font-semibold">7. Alterações nesta Política</h3>
          <p>
            Reservamo-nos o direito de alterar esta Política de Privacidade a qualquer momento. Notificações serão feitas dentro do próprio sistema.
          </p>
          <h3 className="text-lg font-semibold">8. Contato</h3>
          <p>
            Em caso de dúvidas, entre em contato via e-mail: suporte@novaagenda.com.br
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;

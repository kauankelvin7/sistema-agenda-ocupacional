# Sistema de Agendamento de Exames Médicos Ocupacionais

## 📋 Visão Geral

Sistema de gestão de agendamentos de exames médicos ocupacionais, desenvolvido para clínicas de medicina do trabalho. A aplicação oferece uma solução robusta para o gerenciamento de empresas, funcionários, tipos de exames e agendamentos, com foco em segurança, performance e experiência do usuário.

## ✨ Principais Funcionalidades

### 🗓️ Gestão de Agendamentos
- Sistema completo com controle de capacidade por turno
- Bloqueio flexível de datas e horários
- Dashboard analytics com métricas em tempo real
- Auto-refresh com atualização automática a cada 5 segundos

### 👥 Controle de Usuários
- **Múltiplos Perfis de Acesso**: Administradores, Empresas e Funcionários com permissões distintas
- **Controle de Capacidade**: Gerenciamento de lotação por turno (manhã/tarde)
- **Sistema de Notificações** para comunicação eficiente entre clínica e empresas

### 📄 Gestão de Documentos
- Upload e gestão de arquivos relacionados aos exames
- Controle de tipos e tamanhos de arquivo
- Armazenamento seguro com Firebase Storage

## 🛠️ Tecnologias Utilizadas

### Stack Principal
- **React 18** - Framework frontend moderno
- **TypeScript** - Linguagem principal com type safety
- **Tailwind CSS** - Framework CSS utilitário
- **Vite** - Build tool otimizado

### Bibliotecas e Ferramentas
- **Shadcn/UI** - Componentes acessíveis e profissionais
- **TanStack Query** - Gerenciamento de estado e cache
- **Lucide React** - Biblioteca de ícones
- **Zod** - Validação de dados
- **Date-fns** - Manipulação de datas

### Backend e Infraestrutura
- **Firebase Firestore** - Banco de dados NoSQL
- **Firebase Authentication** - Sistema de autenticação
- **Firebase Storage** - Armazenamento de arquivos

## 🔒 Segurança

- **Autenticação e Autorização**: Firebase Auth com tokens JWT seguros, persistência de sessão, proteção de rotas e timeout automático
- **Proteção de Dados**: Validação rigorosa com Zod, sanitização de dados e regras de segurança granulares no Firestore
- **Controle de Acesso**: Separação de responsabilidades por perfis (admin, company, employee) com auditoria de ações

## ⚡ Performance e Escalabilidade

### Capacidade do Sistema
- Suporte para **+50.000 agendamentos/mês**
- Suporte para **+200 usuários simultâneos**

### Otimizações Implementadas
- Cache inteligente com TanStack Query
- Code splitting e lazy loading
- Consultas otimizadas no Firestore
- Arquitetura serverless com auto-scaling
- Distribuição global de assets via CDN do Firebase

## 🎨 Design e UX/UI

- **Design System**: Componentes consistentes com Shadcn/UI
- **Experiência do Usuário**: Navegação intuitiva com feedback visual para todas as ações
- **Responsividade**: Design mobile-first e interface amigável ao toque
- **Acessibilidade**: Conformidade com as diretrizes WCAG

## 📁 Estrutura do Projeto

```
/
├── public/               # Arquivos estáticos (ícones, imagens)
│   └── uploads/
├── src/                  # Código-fonte da aplicação
│   ├── components/       # Componentes reutilizáveis
│   │   ├── Homepage/     # Componentes específicos da página inicial
│   │   └── ui/           # Componentes de UI genéricos (botões, inputs)
│   ├── constants/        # Constantes globais
│   ├── hooks/            # Hooks customizados
│   ├── lib/              # Configuração de bibliotecas
│   ├── pages/            # Páginas da aplicação (rotas)
│   ├── services/         # Lógica de negócio e chamadas de API
│   ├── types/            # Definições de tipos TypeScript
│   └── utils/            # Funções utilitárias
├── .env.example          # Exemplo de variáveis de ambiente
├── package.json
└── tsconfig.json
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- NPM ou Yarn
- Conta Firebase configurada

### Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/kauankelvin7/sistema-agenda-ocupacional.git
cd sistema-agenda-ocupacional
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Preencha as variáveis de ambiente com suas credenciais do Firebase no arquivo `.env`

### Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build para produção
npm run build

# Pré-visualizar o build de produção
npm run preview

# Executar verificação de tipos do TypeScript
npm run type-check
```

## 🌐 Deploy e Produção

### Checklist de Pré-deploy
- [ ] Execute `npm run build` para gerar a versão otimizada
- [ ] Configure as regras de segurança do Firestore e Storage para produção
- [ ] Configure as variáveis de ambiente de produção no serviço de hospedagem

### Hospedagem Recomendada
- **Firebase Hosting** - Integração nativa e otimizada
- **Vercel / Netlify** - Alternativas robustas com excelente suporte a frameworks frontend

## 🤝 Contribuição

Este é um projeto proprietário. Para mais informações sobre contribuições, entre em contato com o desenvolvedor.

## 📄 Licença

**Licença de Uso - Direitos Reservados**

Copyright © 2025 Kauan Kelvin. Todos os direitos reservados.

Este software é licenciado sob uma licença proprietária. A sua utilização é estritamente limitada aos termos definidos pelo detentor dos direitos autorais.

- **Permissão de Visualização**: O código-fonte está disponível exclusivamente para fins de avaliação técnica e demonstração de portfólio
- **Restrições**: É estritamente proibida a cópia, modificação, distribuição, sublicenciamento ou uso comercial deste software, no todo ou em parte, sem a autorização prévia e por escrito do detentor dos direitos autorais

### Isenção de Responsabilidade
O SOFTWARE É FORNECIDO "COMO ESTÁ", SEM GARANTIA DE QUALQUER TIPO, EXPRESSA OU IMPLÍCITA. EM NENHUMA HIPÓTESE O AUTOR SERÁ RESPONSÁVEL POR QUALQUER REIVINDICAÇÃO, DANOS OU OUTRA RESPONSABILIDADE DECORRENTE DO USO DO SOFTWARE.

---

**Desenvolvido por [Kauan Kelvin](LINK_DO_SEU_PERFIL) | Versão 1.0**

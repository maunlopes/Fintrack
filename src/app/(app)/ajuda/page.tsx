"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, BookOpen, HelpCircle, LayoutDashboard, ListOrdered,
  CreditCard, TrendingDown, TrendingUp, Landmark, BarChart3,
  Tag, Calendar, Settings, LogIn, Monitor, Lightbulb, CheckCircle2,
  ArrowLeftRight, Target, Sparkles,
} from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Feature  { text: string; detail?: string }
interface Screenshot { label: string; description: string; src?: string }
interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  features: Feature[];
  tips?: string[];
  connections?: string[];
  screenshots: Screenshot[];
}
interface FaqItem { q: string; a: string }
interface FaqCategory { category: string; icon: React.ElementType; color: string; items: FaqItem[] }

// ---------------------------------------------------------------------------
// Screenshot placeholder
// To replace with a real image, set src="/docs/<filename>.png" on each entry
// ---------------------------------------------------------------------------
function Screenshot({ label, description, src }: Screenshot) {
  return (
    <figure className="my-4">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="w-full rounded-xl border shadow-sm" />
      ) : (
        <div className="w-full aspect-video rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-3 text-muted-foreground select-none">
          <Monitor className="w-10 h-10 opacity-20" />
          <div className="text-center px-6">
            <p className="text-sm font-medium opacity-60">{label}</p>
            <p className="text-xs opacity-40 mt-0.5">Captura de tela — adicione a imagem em /public/docs/</p>
          </div>
        </div>
      )}
      <figcaption className="text-xs text-center text-muted-foreground mt-1.5 italic">{description}</figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Manual content
// ---------------------------------------------------------------------------
const SECTIONS: Section[] = [
  {
    id: "acesso",
    icon: LogIn,
    title: "Acesso ao Sistema",
    description: "A porta de entrada do PQGASTEI?. Crie sua conta ou entre com suas credenciais para acessar suas finanças com segurança.",
    features: [
      { text: "Entrar com e-mail e senha", detail: "Use o e-mail e a senha que você cadastrou para acessar o sistema." },
      { text: "Criar uma conta nova", detail: "Preencha nome, e-mail e senha. Um e-mail de verificação é enviado — clique no link para ativar sua conta." },
      { text: "Verificação de e-mail", detail: "Após o cadastro, você recebe um link de confirmação por e-mail (válido por 24 horas). Verifique também a pasta de spam." },
      { text: "Entrar com Google", detail: "Opção rápida — sem precisar criar senha. Basta selecionar sua conta Google." },
      { text: "Mostrar/ocultar senha", detail: "Clique no ícone de olho ao lado do campo de senha para alternar a visibilidade." },
    ],
    tips: [
      "Cada conta tem seus próprios dados — ninguém mais acessa as suas informações.",
      "Prefira entrar com Google para não precisar lembrar de mais uma senha.",
      "Se não recebeu o e-mail de verificação, verifique a pasta de spam ou crie a conta novamente.",
    ],
    screenshots: [
      { label: "Tela de Login", description: "Formulário de acesso com opção de e-mail/senha e Google." },
      { label: "Formulário de Cadastro", description: "Campos nome, e-mail, senha e confirmação de senha." },
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "A tela principal do PQGASTEI? — um painel de controle com visão completa da sua vida financeira no mês selecionado.",
    features: [
      { text: "Navegar entre meses", detail: "Use o seletor de mês/ano no canto superior direito para ver qualquer período." },
      { text: "Resultado do mês", detail: "Card principal mostrando o balanço líquido (receitas - despesas), barra de comprometimento da renda e a despesa mais cara do mês." },
      { text: "4 indicadores (KPIs)", detail: "Saldo em Contas, Receita do Mês, Total Investido e Patrimônio Total — exibidos em grade 2x2." },
      { text: "Gráfico Receita vs Despesas", detail: "Barras comparando os últimos 6 meses de entradas e saídas." },
      { text: "Gráfico Gastos por Categoria", detail: "Pizza mostrando para onde foi o dinheiro no mês selecionado." },
      { text: "Próximas Despesas", detail: "Lista das 5 próximas contas a pagar, com indicadores de atraso e vencimento." },
      { text: "Alertas de faturas e despesas", detail: "Banners separados avisando sobre faturas de cartão e despesas em atraso ou vencendo hoje." },
    ],
    tips: [
      "Comece sempre pelo Dashboard para ter uma fotografia rápida do mês.",
      "Se a pizza mostrar uma categoria dominando os gastos, investigue em Despesas.",
      "Patrimônio Total = soma de todas as contas bancárias + todos os investimentos.",
    ],
    connections: ["Extrato", "Despesas", "Receitas"],
    screenshots: [
      { label: "Dashboard completo", description: "KPIs, gráficos e lista de próximas despesas." },
    ],
  },
  {
    id: "extrato",
    icon: ListOrdered,
    title: "Extrato",
    description: "A visão mais completa de todas as suas movimentações — despesas, receitas e transferências juntas, organizadas por dia.",
    features: [
      { text: "Navegação por mês", detail: "Seletor no topo para navegar entre qualquer mês e ano." },
      { text: "5 cards de resumo", detail: "Recebido, A Receber, Pago, A Pagar/Previsto e Saldo Final Projetado." },
      { text: "Filtro por status", detail: "Tudo / Realizado / Previsto." },
      { text: "Filtro por período", detail: "Mês inteiro, 1ª quinzena, 2ª quinzena ou semanas 1 a 4." },
      { text: "Filtro por categoria", detail: "Com indicador colorido para identificação visual rápida." },
      { text: "Busca por descrição", detail: "Digite qualquer palavra para encontrar um lançamento específico." },
      { text: "Agrupamento por data", detail: "Transações organizadas por dia com totais de entradas e saídas diários." },
      { text: "Transferências incluídas", detail: "Transferências entre contas também aparecem no extrato, identificadas com ícone próprio." },
    ],
    tips: [
      "Use o filtro de quinzena para entender se seus gastos se concentram no início ou no final do mês.",
      "O Extrato também pode ser acessado pelo Resumo Anual clicando em 'Extrato do Mês' em qualquer mês.",
      "Despesas recorrentes geradas automaticamente também aparecem no extrato.",
    ],
    connections: ["Resumo Anual", "Transferências"],
    screenshots: [
      { label: "Extrato do mês", description: "Transações agrupadas por dia com cards de resumo no topo." },
    ],
  },
  {
    id: "despesas",
    icon: TrendingDown,
    title: "Despesas",
    description: "O lugar para registrar e acompanhar tudo que você paga ou precisa pagar — contas fixas, variáveis, parceladas, recorrentes e compras no cartão.",
    features: [
      { text: "Adicionar nova despesa", detail: "Escolha entre Via Conta (débito direto) ou Via Cartão (lançamento na fatura)." },
      { text: "Editar despesa", detail: "Ícone de lápis ao lado de qualquer lançamento. Para recorrentes, opção de editar esta ou todas as ocorrências." },
      { text: "Confirmar pagamento", detail: "Abre um dialog onde você escolhe a data de pagamento e confirma. O saldo da conta vinculada é debitado automaticamente." },
      { text: "Reverter pagamento", detail: "Desfaz a confirmação e estorna o valor de volta na conta bancária." },
      { text: "Excluir despesa", detail: "Opção de restaurar o saldo bancário ao excluir uma despesa já paga. Para recorrentes, opção de excluir esta ou todas as ocorrências." },
      { text: "Despesas recorrentes", detail: "Ao marcar como recorrente e definir uma data final, o sistema gera automaticamente um registro para cada mês no período." },
      { text: "Compras no cartão", detail: "Transações individuais de cartão de crédito aparecem na lista de despesas com a origem identificada." },
      { text: "Filtros avançados", detail: "Status, categoria, origem (conta ou cartão específico) e busca por nome." },
      { text: "Cards de resumo", detail: "Total do mês com barra de progresso, maior categoria e maior gasto do mês." },
      { text: "Visualização lista ou grade", detail: "Alterne entre os modos de visualização pelo botão no topo." },
    ],
    tips: [
      "Para contas fixas mensais (aluguel, academia), use o tipo Fixo Recorrente com data final para gerar todos os meses de uma vez.",
      "Use Parcelado para compras divididas fora do cartão de crédito.",
      "Despesas Via Cartão também aparecem automaticamente na fatura do cartão correspondente.",
      "Ao excluir uma despesa paga, ative a opção 'Restaurar saldo' para devolver o valor à conta.",
    ],
    connections: ["Cartões", "Contas Bancárias", "Extrato", "Dashboard", "Orçamentos"],
    screenshots: [
      { label: "Lista de Despesas", description: "Despesas do mês com cards de resumo e barra de filtros." },
      { label: "Formulário Nova Despesa", description: "Modal com abas Via Conta e Via Cartão." },
    ],
  },
  {
    id: "receitas",
    icon: TrendingUp,
    title: "Receitas",
    description: "O registro de tudo que entra no seu bolso — salário, freelances, aluguéis recebidos e outras fontes de renda.",
    features: [
      { text: "Adicionar nova receita", detail: "Botão Nova Receita no topo da página." },
      { text: "Editar receita", detail: "Ícone de lápis ao lado de cada lançamento." },
      { text: "Confirmar recebimento", detail: "Abre um dialog onde você pode editar o valor recebido, escolher a conta de destino e a data antes de confirmar. O saldo da conta é creditado automaticamente." },
      { text: "Reverter recebimento", detail: "Desfaz a confirmação e desconta o valor da conta bancária." },
      { text: "Excluir receita", detail: "Ícone de lixeira com confirmação. Para recorrentes, opção de excluir esta ou todas as ocorrências." },
      { text: "Receitas recorrentes", detail: "Ao marcar como recorrente e definir uma data final, o sistema gera automaticamente um registro para cada mês no período." },
      { text: "Filtros", detail: "Status (Tudo / Recebido / A Receber), categoria e busca por nome." },
      { text: "Cards de resumo", detail: "Total do mês com barra de progresso, maior categoria e maior receita do mês." },
      { text: "Visualização lista ou grade", detail: "Alterne entre os modos de visualização pelo botão no topo." },
    ],
    tips: [
      "Marque seu salário como Recorrente Mensal com data final para gerar todos os meses automaticamente.",
      "Ao confirmar o recebimento, você pode ajustar o valor caso tenha sido diferente do previsto.",
      "Use a opção de mudar a conta de destino na confirmação caso o dinheiro tenha caído em outra conta.",
    ],
    connections: ["Contas Bancárias", "Extrato", "Dashboard"],
    screenshots: [
      { label: "Lista de Receitas", description: "Receitas do mês com filtros e cards de resumo no topo." },
    ],
  },
  {
    id: "transferencias",
    icon: ArrowLeftRight,
    title: "Transferências",
    description: "Movimente dinheiro entre suas contas bancárias. O saldo de origem é debitado e o de destino é creditado automaticamente.",
    features: [
      { text: "Nova transferência", detail: "Selecione a conta de origem, a conta de destino, o valor, a data e uma descrição opcional." },
      { text: "Histórico por mês", detail: "Veja todas as transferências realizadas no mês selecionado." },
      { text: "Excluir transferência", detail: "Ao excluir, os saldos das contas de origem e destino são revertidos automaticamente." },
      { text: "Atualização atômica", detail: "Os saldos das duas contas são atualizados juntos em uma única operação, sem risco de inconsistência." },
    ],
    tips: [
      "Use transferências para registrar movimentações entre contas (ex: da corrente para a poupança).",
      "Transferências também aparecem no Extrato com ícone próprio.",
      "Ao excluir uma transferência, os saldos são revertidos — como se nunca tivesse sido feita.",
    ],
    connections: ["Contas Bancárias", "Extrato"],
    screenshots: [
      { label: "Transferências", description: "Formulário de nova transferência e histórico do mês." },
    ],
  },
  {
    id: "contas",
    icon: Landmark,
    title: "Contas Bancárias",
    description: "O cadastro de todas as suas contas — corrente, poupança ou investimento. O saldo é atualizado automaticamente conforme você registra movimentações.",
    features: [
      { text: "Adicionar nova conta", detail: "Escolha o banco, dê um apelido, defina o tipo e informe o saldo atual." },
      { text: "Editar conta", detail: "Altere qualquer informação, incluindo o saldo caso esteja desatualizado." },
      { text: "Remover conta", detail: "Com confirmação. O saldo total é recalculado automaticamente." },
      { text: "Ver Extrato da conta", detail: "Botão Ver Extrato leva ao extrato filtrado por aquela conta específica." },
      { text: "Saldo total", detail: "Exibido no topo — é a soma de todas as contas cadastradas." },
      { text: "Cor personalizada", detail: "Cada conta pode ter uma cor distinta para fácil identificação visual." },
    ],
    tips: [
      "Ao cadastrar, informe o saldo real atual. O PQGASTEI? cuida dos cálculos a partir daí.",
      "Se o saldo ficar incorreto, edite a conta e corrija o valor para o real.",
      "Use transferências para mover dinheiro entre contas em vez de editar saldos manualmente.",
    ],
    connections: ["Despesas", "Receitas", "Transferências", "Cartões", "Investimentos", "Dashboard"],
    screenshots: [
      { label: "Lista de Contas Bancárias", description: "Cards das contas com saldo, tipo de conta e botões de ação." },
    ],
  },
  {
    id: "cartoes",
    icon: CreditCard,
    title: "Cartões de Crédito",
    description: "O gerenciador dos seus cartões. Acompanhe limite, transações e faturas de cada cartão de crédito.",
    features: [
      { text: "Adicionar novo cartão", detail: "Nome, bandeira, últimos 4 dígitos, limite, dias de fechamento e vencimento, cor e conta vinculada." },
      { text: "Editar cartão", detail: "Ícone de lápis no card do cartão na lista principal." },
      { text: "Remover cartão", detail: "Ícone de lixeira com confirmação." },
      { text: "Acessar Fatura", detail: "Botão Fatura leva para a página de detalhe com transações e histórico de faturas." },
      { text: "Lançar transação", detail: "Registre compras com descrição, valor, data, categoria e parcelamento." },
      { text: "Editar e excluir transações", detail: "Edite ou remova transações individuais diretamente na fatura. Parcelamentos podem ser excluídos em cascata." },
      { text: "Navegar entre faturas", detail: "Setas de mês com indicadores de ponto para meses com lançamentos." },
      { text: "Pagar fatura", detail: "Selecione a conta bancária — o valor é debitado do saldo automaticamente." },
      { text: "Desfazer pagamento", detail: "Cancela o pagamento e estorna o valor de volta na conta." },
      { text: "Cards de resumo por cartão", detail: "Total do mês atual, comparação com mês anterior e maior compra do período." },
    ],
    tips: [
      "Ponto verde = fatura paga, Ponto amarelo = pendente, Ponto vermelho = em atraso.",
      "Use Ir para o mês atual se navegar para longe e quiser voltar rapidamente.",
      "Compras parceladas são distribuídas automaticamente nos meses corretos.",
      "As transações do cartão também aparecem na tela de Despesas com a origem identificada.",
    ],
    connections: ["Despesas", "Contas Bancárias", "Dashboard"],
    screenshots: [
      { label: "Lista de Cartões", description: "Cards no estilo cartão físico com limite, bandeira e botões de ação." },
      { label: "Fatura do Cartão", description: "Resumo com barra de limite, status e lista de compras do mês." },
    ],
  },
  {
    id: "orcamentos",
    icon: Target,
    title: "Orçamentos",
    description: "Defina limites de gastos por categoria e acompanhe em tempo real quanto já foi consumido.",
    features: [
      { text: "Definir limite por categoria", detail: "Escolha uma categoria de despesa e defina um valor máximo mensal." },
      { text: "Acompanhar progresso", detail: "Barra de progresso mostra quanto do orçamento já foi utilizado no mês." },
      { text: "Editar orçamento", detail: "Altere o limite de qualquer categoria a qualquer momento." },
      { text: "Remover orçamento", detail: "Exclua o limite — a categoria continua funcionando normalmente, apenas sem o teto." },
    ],
    tips: [
      "Comece definindo orçamentos para suas 3 maiores categorias de gasto.",
      "Quando a barra ficar vermelha, significa que você ultrapassou o limite definido.",
      "Categorias sem orçamento definido não aparecem na tela de orçamentos.",
    ],
    connections: ["Despesas", "Categorias", "Dashboard"],
    screenshots: [
      { label: "Página de Orçamentos", description: "Categorias com limite, valor gasto e barra de progresso." },
    ],
  },
  {
    id: "investimentos",
    icon: BarChart3,
    title: "Investimentos",
    description: "O painel dos seus investimentos. Acompanhe saldo, rentabilidade e registre cada movimentação de forma detalhada.",
    features: [
      { text: "Adicionar novo investimento", detail: "Nome, instituição, tipo (Renda Fixa, Ações, Fundos, Cripto, Previdência), saldo inicial e cor." },
      { text: "Filtrar por tipo", detail: "Abas para Renda Fixa, Renda Variável, Ações, Fundos, Criptomoedas e Previdência." },
      { text: "Buscar investimento", detail: "Por nome do ativo ou da instituição." },
      { text: "Acessar Detalhes", detail: "Botão Detalhes leva para o histórico completo de movimentações." },
      { text: "Registrar movimentação", detail: "Aporte, Resgate, Rendimento ou Dividendo — o saldo é atualizado automaticamente." },
      { text: "Vincular conta bancária", detail: "Aportes debitam e resgates creditam a conta bancária selecionada automaticamente." },
      { text: "Editar movimentação", detail: "Ícone de lápis em cada item do histórico — o saldo é revertido e recalculado." },
      { text: "Remover movimentação", detail: "O efeito no saldo é desfeito automaticamente ao excluir." },
    ],
    tips: [
      "Separe cada produto financeiro como um investimento diferente para acompanhar individualmente.",
      "Aportes vinculados a uma conta debitam o saldo bancário automaticamente.",
      "Resgates vinculados a uma conta creditam o saldo bancário automaticamente.",
    ],
    connections: ["Contas Bancárias", "Dashboard"],
    screenshots: [
      { label: "Lista de Investimentos", description: "Cards com saldo, rentabilidade e filtros por tipo." },
      { label: "Histórico de Movimentações", description: "Lista de aportes, resgates, rendimentos e dividendos com edição e exclusão." },
    ],
  },
  {
    id: "categorias",
    icon: Tag,
    title: "Categorias",
    description: "O sistema de rótulos das suas finanças. Categorias organizam despesas e receitas e aparecem nos gráficos do Dashboard.",
    features: [
      { text: "Criar nova categoria", detail: "Defina nome, tipo (Despesa ou Receita), ícone e cor personalizada." },
      { text: "Editar categoria", detail: "Disponível para todas, inclusive as categorias padrão do sistema." },
      { text: "Remover categoria", detail: "Se houver registros vinculados, o sistema avisa quantos serão afetados e oferece mover tudo para Sem Categoria." },
      { text: "Filtrar por tipo", detail: "Abas Despesas / Receitas para ver cada grupo separadamente." },
      { text: "Buscar", detail: "Campo de busca por nome da categoria." },
      { text: "Ícones personalizados", detail: "Escolha entre dezenas de ícones para identificar visualmente cada categoria." },
    ],
    tips: [
      "Crie categorias com cores distintas — elas aparecem nos gráficos, facilitando a identificação visual.",
      "Categorias com ícone de cadeado são padrão do sistema, mas podem ser editadas e removidas normalmente.",
      "Ao excluir uma categoria com registros, eles são movidos automaticamente para Sem Categoria.",
    ],
    connections: ["Despesas", "Receitas", "Orçamentos", "Dashboard"],
    screenshots: [
      { label: "Lista de Categorias", description: "Categorias com ícone, cor personalizada e botões de editar/remover." },
    ],
  },
  {
    id: "resumo-anual",
    icon: Calendar,
    title: "Resumo Anual",
    description: "Uma visão panorâmica do ano inteiro — 12 meses em uma tela, com todos os números consolidados.",
    features: [
      { text: "Navegar entre anos", detail: "Setas no topo para ir ao ano anterior ou próximo." },
      { text: "5 cards de resumo do ano", detail: "Entradas totais, maior mês de entrada, saídas totais, maior mês de saída e balanço anual." },
      { text: "Grade dos 12 meses", detail: "Cada mês mostra receitas, despesas, investimentos e categorias mais representativas." },
      { text: "Ir para o Extrato do mês", detail: "Botão em cada card de mês para acessar o extrato detalhado daquele período." },
    ],
    tips: [
      "Use no final do ano para fazer um balanço: compare os meses e identifique padrões de gasto.",
      "Planeje o próximo ano com base nos dados reais exibidos aqui.",
      "Meses futuros mostram dados reais já cadastrados (despesas/receitas recorrentes geradas).",
    ],
    connections: ["Extrato"],
    screenshots: [
      { label: "Resumo Anual completo", description: "Grade com os 12 meses e cards de totais do ano no topo da página." },
    ],
  },
  {
    id: "finbot",
    icon: Sparkles,
    title: "FinBot (Assistente IA)",
    description: "Um assistente financeiro inteligente que analisa seus dados e responde perguntas sobre suas finanças em linguagem natural.",
    features: [
      { text: "Perguntar sobre finanças", detail: "Faça perguntas como 'Quanto gastei em alimentação?' ou 'Qual meu saldo total?' e receba respostas instantâneas." },
      { text: "Análise de gastos", detail: "O FinBot acessa seus dados reais para dar respostas contextualizadas." },
      { text: "Dicas personalizadas", detail: "Receba sugestões baseadas no seu perfil de gastos e receitas." },
      { text: "Acessar pelo cabeçalho", detail: "Clique no botão FinBot no topo da página para abrir o chat." },
    ],
    tips: [
      "Quanto mais dados você tiver cadastrado, mais preciso o FinBot será nas respostas.",
      "Faça perguntas específicas para respostas mais úteis (ex: 'Qual foi meu maior gasto em março?').",
      "O FinBot abre como modal no desktop e como sheet no mobile.",
    ],
    connections: ["Dashboard", "Despesas", "Receitas"],
    screenshots: [
      { label: "FinBot", description: "Chat com assistente IA no modal de conversa." },
    ],
  },
  {
    id: "configuracoes",
    icon: Settings,
    title: "Configurações",
    description: "Gerencie seu perfil, segurança e preferências do PQGASTEI?.",
    features: [
      { text: "Editar perfil", detail: "Altere nome e foto de perfil. Clique na foto para fazer upload de uma nova imagem." },
      { text: "Alterar senha", detail: "Defina uma nova senha informando a senha atual. Disponível para contas com e-mail/senha." },
      { text: "Criar senha", detail: "Se você entrou com Google e quer ter uma senha, defina uma na seção de segurança." },
      { text: "Alternar tema", detail: "Mude entre tema claro e escuro. O botão também fica disponível no cabeçalho." },
      { text: "Rever tour de boas-vindas", detail: "Reexiba o guia de apresentação do sistema a qualquer momento." },
      { text: "Carregar dados de demonstração", detail: "Preencha o sistema com dados fictícios para explorar as funcionalidades sem cadastrar manualmente." },
      { text: "Sair da conta", detail: "Encerra a sessão com segurança e redireciona para a tela de login." },
    ],
    tips: [
      "Use os dados de demonstração se quiser ver como o sistema fica com informações preenchidas.",
      "A foto de perfil aceita upload direto — clique na imagem para trocar.",
    ],
    screenshots: [
      { label: "Página de Configurações", description: "Perfil, segurança, preferências e gerenciamento de dados." },
    ],
  },
];

// ---------------------------------------------------------------------------
// FAQ content
// ---------------------------------------------------------------------------
const FAQ: FaqCategory[] = [
  {
    category: "Acesso e Conta",
    icon: LogIn,
    color: "text-primary",
    items: [
      {
        q: "Como crio minha conta no PQGASTEI??",
        a: "Na tela inicial, clique na aba Criar conta, preencha seu nome, e-mail e uma senha. Você receberá um e-mail de verificação — clique no link para ativar a conta e depois faça login. Se preferir, pode entrar diretamente com sua conta do Google.",
      },
      {
        q: "Não recebi o e-mail de verificação. O que fazer?",
        a: "Verifique sua pasta de spam/lixo eletrônico. O link expira em 24 horas. Se não encontrar, crie a conta novamente com o mesmo e-mail — um novo link será enviado.",
      },
      {
        q: "Esqueci minha senha. Como recupero?",
        a: "Se você entrou com Google, basta usar a opção Entrar com Google novamente. Para contas com e-mail e senha, entre em contato com o suporte.",
      },
      {
        q: "Meus dados ficam salvos se eu fechar o navegador?",
        a: "Sim! Todos os dados são salvos automaticamente assim que você os registra. Não há botão de salvar manual.",
      },
      {
        q: "Posso usar o PQGASTEI? no celular?",
        a: "Sim. O sistema é responsivo e funciona em qualquer dispositivo com navegador — celular, tablet ou computador.",
      },
      {
        q: "Como altero minha senha ou foto de perfil?",
        a: "Acesse Configurações pelo menu lateral. Na seção Perfil você altera nome e foto, e na seção Segurança você define ou altera a senha.",
      },
    ],
  },
  {
    category: "Despesas e Receitas",
    icon: TrendingDown,
    color: "text-destructive",
    items: [
      {
        q: "Qual a diferença entre 'Pago' e 'A Pagar'?",
        a: "A Pagar é uma despesa prevista, que ainda não saiu do bolso. Pago é quando você confirma que o dinheiro já foi debitado. Marcar como pago debita o valor da conta bancária vinculada.",
      },
      {
        q: "Como registro uma conta fixa que se repete todo mês?",
        a: "Ao criar a despesa, selecione o tipo Fixo Recorrente e defina a data final. O sistema gera automaticamente um registro para cada mês no período. Cada ocorrência pode ser editada individualmente.",
      },
      {
        q: "Posso registrar uma compra parcelada fora do cartão?",
        a: "Sim! Ao criar uma despesa, selecione o tipo Parcelado e informe o número total de parcelas. O sistema divide o valor e distribui as parcelas nos meses corretos automaticamente.",
      },
      {
        q: "Lançamento no cartão também aparece em Despesas?",
        a: "Sim. Cada transação individual registrada na fatura do cartão aparece na lista de Despesas com a origem identificada. Você pode ver e filtrar por cartão.",
      },
      {
        q: "Como pago uma fatura de cartão?",
        a: "Na tela de fatura do cartão, clique em Pagar fatura e selecione a conta bancária. O valor é debitado automaticamente. Na tela de Despesas, também há opção de confirmar pagamento de faturas.",
      },
      {
        q: "O que acontece quando excluo uma despesa já paga?",
        a: "O sistema oferece a opção de 'Restaurar saldo', que devolve o valor à conta bancária vinculada. Se não ativar, a despesa é removida sem alterar o saldo.",
      },
      {
        q: "Posso editar ou excluir todas as ocorrências de uma despesa recorrente?",
        a: "Sim! Ao editar ou excluir uma despesa recorrente, o sistema pergunta se você quer aplicar a ação apenas nesta ocorrência ou em todas.",
      },
      {
        q: "Ao confirmar recebimento de uma receita, posso alterar o valor?",
        a: "Sim! O dialog de confirmação permite editar o valor recebido, a conta de destino e a data antes de confirmar. Útil quando o valor real foi diferente do previsto.",
      },
    ],
  },
  {
    category: "Contas e Transferências",
    icon: Landmark,
    color: "text-info",
    items: [
      {
        q: "Por que o saldo da minha conta está errado?",
        a: "O saldo é calculado com base no valor informado ao cadastrar, mais tudo registrado depois (pagamentos, recebimentos, transferências). Se estiver incorreto, vá em Contas, clique em Editar e corrija o saldo.",
      },
      {
        q: "Posso ter mais de uma conta bancária?",
        a: "Sim! Cadastre quantas contas quiser. Cada uma tem seu saldo individual e o PQGASTEI? mostra o saldo total somado no topo.",
      },
      {
        q: "Como transfiro dinheiro entre contas?",
        a: "Acesse a página de Contas e use o botão de Transferência. Selecione origem, destino, valor e data. Os saldos das duas contas são atualizados automaticamente.",
      },
      {
        q: "O que acontece se eu excluir uma transferência?",
        a: "Os saldos das contas de origem e destino são revertidos automaticamente — como se a transferência nunca tivesse sido feita.",
      },
    ],
  },
  {
    category: "Investimentos",
    icon: BarChart3,
    color: "text-chart-1",
    items: [
      {
        q: "Como funciona o saldo do investimento?",
        a: "O saldo é atualizado a cada movimentação: Aportes e Rendimentos aumentam o saldo, Resgates diminuem. Ao excluir ou editar uma movimentação, o saldo é revertido automaticamente.",
      },
      {
        q: "O PQGASTEI? conecta com corretoras ou bancos automaticamente?",
        a: "Não no momento. Todos os lançamentos são manuais — você insere os dados do seu extrato ou informe mensal.",
      },
      {
        q: "Qual a diferença entre Rendimento e Dividendo?",
        a: "Rendimento é o juro ou valorização do ativo (comum em renda fixa e fundos). Dividendo são proventos distribuídos por empresas ou FIIs. Ambos aumentam o saldo do investimento.",
      },
      {
        q: "Se eu vincular uma conta bancária no aporte, o saldo da conta diminui?",
        a: "Sim! Aportes vinculados a uma conta debitam o saldo bancário automaticamente. Resgates fazem o contrário — creditam a conta.",
      },
    ],
  },
  {
    category: "Categorias e Orçamentos",
    icon: Tag,
    color: "text-warning",
    items: [
      {
        q: "Posso excluir uma categoria que já tem despesas registradas?",
        a: "Sim. O PQGASTEI? avisa quantos registros serão afetados e pergunta se deseja continuar. Se confirmar, tudo é movido automaticamente para Sem Categoria.",
      },
      {
        q: "Posso editar as categorias padrão do sistema?",
        a: "Sim! As categorias padrão identificadas com o ícone de cadeado podem ser editadas ou removidas normalmente.",
      },
      {
        q: "Como defino um orçamento mensal para uma categoria?",
        a: "Acesse Orçamentos pelo menu lateral. Selecione uma categoria e defina o valor máximo mensal. A barra de progresso mostra quanto já foi gasto.",
      },
      {
        q: "O que acontece quando ultrapasso o orçamento?",
        a: "A barra fica vermelha indicando que o limite foi ultrapassado. O sistema não bloqueia gastos — é apenas um indicador visual para ajudar no controle.",
      },
    ],
  },
  {
    category: "Geral",
    icon: HelpCircle,
    color: "text-muted-foreground",
    items: [
      {
        q: "Por que o Dashboard muda dependendo do mês selecionado?",
        a: "O Dashboard é sensível ao mês ativo no seletor do topo. Receitas, despesas e gráficos mostram sempre os dados do mês selecionado. Use as setas para navegar.",
      },
      {
        q: "Como vejo meu desempenho financeiro ao longo do ano inteiro?",
        a: "Acesse Resumo Anual pelo menu lateral. Você vê os 12 meses lado a lado com receitas, despesas, balanço e categorias mais representativas.",
      },
      {
        q: "Posso mudar o tema visual do sistema?",
        a: "Sim! Alterne entre tema claro e escuro pelo botão no cabeçalho ou em Configurações.",
      },
      {
        q: "O que significam os pontos coloridos na fatura do cartão?",
        a: "Indicam que aquele mês tem lançamentos. Verde = pago, Amarelo = pendente, Vermelho = em atraso.",
      },
      {
        q: "O que é o FinBot?",
        a: "É um assistente de IA que analisa seus dados financeiros e responde perguntas em linguagem natural. Acesse pelo botão FinBot no cabeçalho do sistema.",
      },
      {
        q: "Posso rever o tour de boas-vindas?",
        a: "Sim! Acesse Configurações, seção Ajuda e Tour, e clique em 'Ver tour'. Você será redirecionado ao Dashboard com o guia.",
      },
      {
        q: "Existe um modo de testar o sistema com dados fictícios?",
        a: "Sim! Em Configurações, seção Gerenciamento de Dados, clique em 'Carregar dados de demonstração'. O sistema será preenchido com contas, despesas, receitas e investimentos de exemplo.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AjudaPage() {
  const [tab, setTab] = useState<"manual" | "faq">("manual");
  const [search, setSearch] = useState("");
  const [dbScreenshots, setDbScreenshots] = useState<Record<string, Screenshot[]>>({});

  useEffect(() => {
    fetch("/api/ajuda/screenshots")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") {
          const mapped: Record<string, Screenshot[]> = {};
          for (const [sectionId, items] of Object.entries(data)) {
            mapped[sectionId] = (items as { label: string; description: string; imageUrl?: string | null }[]).map((s) => ({
              label: s.label,
              description: s.description,
              src: s.imageUrl || undefined,
            }));
          }
          setDbScreenshots(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Merge DB screenshots into sections, falling back to hardcoded ones
  const sectionsWithScreenshots = useMemo(() => {
    return SECTIONS.map((s) => ({
      ...s,
      screenshots: dbScreenshots[s.id]?.length ? dbScreenshots[s.id] : s.screenshots,
    }));
  }, [dbScreenshots]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sectionsWithScreenshots;
    const q = search.toLowerCase();
    return sectionsWithScreenshots.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.features.some((f) => f.text.toLowerCase().includes(q))
    );
  }, [search, sectionsWithScreenshots]);

  const filteredFaq = useMemo(() => {
    if (!search.trim()) return FAQ;
    const q = search.toLowerCase();
    return FAQ.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [search]);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">Manual de uso e perguntas frequentes do PQGASTEI?</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar no manual ou nas perguntas frequentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "manual" | "faq")} className="mb-6">
          <TabsList>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Manual de Uso
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5" /> Perguntas Frequentes
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ---------------------------------------------------------------- */}
        {/* MANUAL TAB                                                        */}
        {/* ---------------------------------------------------------------- */}
        {tab === "manual" && (
          filteredSections.length === 0 ? (
            <EmptySearch query={search} />
          ) : (
            <Accordion multiple className="gap-2 flex flex-col">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                return (
                  <AccordionItem
                    key={section.id}
                    value={section.id}
                    className="border rounded-xl bg-card overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                      <div className="flex items-center gap-3 min-w-0 mr-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-tight">{section.title}</p>
                          <p className="text-xs text-muted-foreground font-normal truncate mt-0.5">{section.description}</p>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4">
                      <div className="space-y-5 pb-2">

                        {/* Screenshots */}
                        {section.screenshots.length > 0 && (
                          <div className={cn(
                            "grid gap-4",
                            section.screenshots.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                          )}>
                            {section.screenshots.map((ss, i) => (
                              <Screenshot key={i} {...ss} />
                            ))}
                          </div>
                        )}

                        {/* Features */}
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                            O que você pode fazer
                          </p>
                          <ul className="space-y-2">
                            {section.features.map((feat, i) => (
                              <li key={i} className="flex gap-2.5 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-medium">{feat.text}</span>
                                  {feat.detail && (
                                    <span className="text-muted-foreground"> — {feat.detail}</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Tips */}
                        {section.tips && section.tips.length > 0 && (
                          <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5" /> Dicas
                            </p>
                            <ul className="space-y-1.5">
                              {section.tips.map((tip, i) => (
                                <li key={i} className="text-sm text-foreground/80 flex gap-2">
                                  <span className="text-primary/50 shrink-0 mt-0.5">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Connections */}
                        {section.connections && section.connections.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-muted-foreground font-medium">Conectado com:</span>
                            {section.connections.map((conn) => (
                              <Badge key={conn} variant="secondary" className="text-xs">{conn}</Badge>
                            ))}
                          </div>
                        )}

                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )
        )}

        {/* ---------------------------------------------------------------- */}
        {/* FAQ TAB                                                           */}
        {/* ---------------------------------------------------------------- */}
        {tab === "faq" && (
          filteredFaq.length === 0 ? (
            <EmptySearch query={search} />
          ) : (
            <div className="space-y-7">
              {filteredFaq.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center gap-2 mb-3">
                      <CatIcon className={cn("w-4 h-4 shrink-0", cat.color)} />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {cat.category}
                      </h2>
                    </div>
                    <Accordion multiple className="gap-1.5 flex flex-col">
                      {cat.items.map((item, i) => (
                        <AccordionItem
                          key={i}
                          value={`${cat.category}-${i}`}
                          className="border rounded-xl bg-card"
                        >
                          <AccordionTrigger className="px-4 py-3.5 hover:no-underline text-sm font-medium text-left mr-3">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent className="px-4">
                            <p className="text-sm text-muted-foreground leading-relaxed pb-2">{item.a}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>
    </PageTransition>
  );
}

function EmptySearch({ query }: { query: string }) {
  return (
    <div className="text-center py-14 text-muted-foreground">
      <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
      <p className="text-sm">Nenhum resultado para <span className="font-medium text-foreground">"{query}"</span></p>
    </div>
  );
}

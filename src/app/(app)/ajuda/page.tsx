"use client";

import { useState, useMemo } from "react";
import {
  Search, BookOpen, HelpCircle, LayoutDashboard, ListOrdered,
  CreditCard, TrendingDown, TrendingUp, Landmark, BarChart3,
  Tag, Calendar, Settings, LogIn, Monitor, Lightbulb, CheckCircle2,
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
    description: "A porta de entrada do FinTrack. Aqui você cria sua conta ou entra com suas credenciais para acessar suas finanças com segurança.",
    features: [
      { text: "Entrar com e-mail e senha", detail: "Use o e-mail e a senha que você cadastrou para acessar o sistema." },
      { text: "Criar uma conta nova", detail: "Preencha nome, e-mail e uma senha. Após criar, você é redirecionado ao login automaticamente." },
      { text: "Entrar com Google", detail: "Opção rápida — sem precisar criar senha. Basta selecionar sua conta Google." },
      { text: "Mostrar/ocultar senha", detail: "Clique no ícone de olho ao lado do campo de senha para alternar a visibilidade." },
    ],
    tips: [
      "Cada conta tem seus próprios dados — ninguém mais acessa as suas informações.",
      "Prefira entrar com Google para não precisar lembrar de mais uma senha.",
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
    description: "A tela principal do FinTrack — um painel de controle com visão completa da sua vida financeira no mês selecionado.",
    features: [
      { text: "Navegar entre meses", detail: "Use o seletor de mês/ano no topo para ver qualquer período." },
      { text: "5 indicadores principais", detail: "Patrimônio Total, Saldo das Contas, Total Investido, Receita do Mês e Despesas do Mês." },
      { text: "Gráfico Receita vs Despesas", detail: "Barras comparando os últimos 6 meses de entradas e saídas." },
      { text: "Gráfico Gastos por Categoria", detail: "Pizza mostrando para onde foi o dinheiro no mês selecionado." },
      { text: "Previsão de Saldo", detail: "Gráfico de área com projeção dos próximos 6 meses baseada no histórico." },
      { text: "Balanço do Mês", detail: "Resultado líquido, barra de comprometimento da renda e a despesa mais cara do mês." },
      { text: "Próximas Despesas", detail: "Lista das contas a pagar, com filtro entre Todas e Pendentes." },
    ],
    tips: [
      "Comece sempre pelo Dashboard para ter uma fotografia rápida do mês.",
      "Se a pizza mostrar uma categoria dominando os gastos, investigue em Despesas.",
      "Patrimônio Total = soma de todas as contas bancárias + todos os investimentos.",
    ],
    connections: ["Extrato", "Despesas"],
    screenshots: [
      { label: "Dashboard completo", description: "KPIs, gráficos e tabela de próximas despesas." },
    ],
  },
  {
    id: "extrato",
    icon: ListOrdered,
    title: "Extrato",
    description: "A visão mais completa de todas as suas movimentações — despesas e receitas juntas, organizadas por dia.",
    features: [
      { text: "Navegação por mês", detail: "Seletor no topo para navegar entre qualquer mês e ano." },
      { text: "5 cards de resumo", detail: "Recebido, A Receber, Pago, A Pagar/Previsto e Saldo Final Projetado." },
      { text: "Filtro por status", detail: "Tudo / Realizado / Previsto." },
      { text: "Filtro por período", detail: "Mês inteiro, 1ª quinzena, 2ª quinzena ou semanas 1 a 4." },
      { text: "Filtro por categoria", detail: "Com indicador colorido para identificação visual rápida." },
      { text: "Busca por descrição", detail: "Digite qualquer palavra para encontrar um lançamento específico." },
      { text: "Agrupamento por data", detail: "Transações organizadas por dia com totais de entradas e saídas diários." },
    ],
    tips: [
      "Use o filtro de quinzena para entender se seus gastos se concentram no início ou no final do mês.",
      "O Extrato também pode ser acessado pelo Resumo Anual clicando em 'Extrato do Mês' em qualquer mês.",
    ],
    connections: ["Resumo Anual"],
    screenshots: [
      { label: "Extrato do mês", description: "Transações agrupadas por dia com cards de resumo no topo." },
    ],
  },
  {
    id: "despesas",
    icon: TrendingDown,
    title: "Despesas",
    description: "O lugar para registrar e acompanhar tudo que você paga ou precisa pagar — contas fixas, variáveis, parceladas e compras no cartão.",
    features: [
      { text: "Adicionar nova despesa", detail: "Escolha entre Via Conta (débito direto) ou Via Cartão (lançamento na fatura)." },
      { text: "Editar despesa", detail: "Ícone de lápis ao lado de qualquer lançamento." },
      { text: "Marcar como paga", detail: "Registra o pagamento e debita o saldo da conta bancária vinculada." },
      { text: "Excluir despesa", detail: "Ícone de lixeira com confirmação de segurança." },
      { text: "Filtros avançados", detail: "Status, categoria, origem (conta ou cartão específico) e busca por nome." },
      { text: "Cards de resumo", detail: "Total pago, total pendente e maior categoria de gasto do mês." },
    ],
    tips: [
      "Para contas fixas mensais (aluguel, academia), use o tipo Fixo Recorrente — não precisa relançar todo mês.",
      "Use Parcelado para compras divididas fora do cartão de crédito.",
      "Despesas Via Cartão também aparecem automaticamente na fatura do cartão correspondente.",
    ],
    connections: ["Cartões", "Contas Bancárias", "Extrato", "Dashboard"],
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
      { text: "Excluir receita", detail: "Ícone de lixeira com confirmação." },
      { text: "Filtros", detail: "Status (Tudo / Recebido / A Receber), categoria e busca por nome." },
      { text: "Cards de resumo", detail: "Total recebido, total a receber e maior categoria de entrada no mês." },
      { text: "Recorrência", detail: "Configure receitas automáticas semanais, quinzenais ou mensais." },
    ],
    tips: [
      "Marque seu salário como Recorrente Mensal para aparecer automaticamente todo mês.",
      "Quando o dinheiro cair na conta, marque a receita como Recebido para atualizar o saldo.",
    ],
    connections: ["Contas Bancárias", "Extrato", "Dashboard"],
    screenshots: [
      { label: "Lista de Receitas", description: "Receitas do mês com filtros e cards de resumo no topo." },
    ],
  },
  {
    id: "contas",
    icon: Landmark,
    title: "Contas Bancárias",
    description: "O cadastro de todas as suas contas — corrente, poupança ou carteira de investimento. O saldo é atualizado automaticamente conforme você registra movimentações.",
    features: [
      { text: "Adicionar nova conta", detail: "Escolha o banco, dê um apelido, defina o tipo e informe o saldo atual." },
      { text: "Editar conta", detail: "Altere qualquer informação, incluindo o saldo caso esteja desatualizado." },
      { text: "Remover conta", detail: "Com confirmação. O saldo total é recalculado automaticamente." },
      { text: "Ver Extrato da conta", detail: "Botão Ver Extrato leva ao extrato filtrado por aquela conta específica." },
      { text: "Saldo total", detail: "Exibido no topo — é a soma de todas as contas cadastradas." },
    ],
    tips: [
      "Ao cadastrar, informe o saldo real atual. O FinTrack cuida dos cálculos a partir daí.",
      "Se o saldo ficar incorreto, edite a conta e corrija o valor para o real.",
    ],
    connections: ["Despesas", "Receitas", "Cartões", "Investimentos", "Dashboard"],
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
      { text: "Navegar entre faturas", detail: "Setas de mês com indicadores de ponto para meses com lançamentos." },
      { text: "Pagar fatura", detail: "Selecione a conta bancária — o valor é debitado do saldo automaticamente." },
      { text: "Desfazer pagamento", detail: "Cancela o pagamento e estorna o valor de volta na conta." },
    ],
    tips: [
      "Ponto verde = fatura paga · Ponto amarelo = pendente · Ponto vermelho = em atraso.",
      "Use Ir para o mês atual se navegar para longe e quiser voltar rapidamente.",
      "Compras parceladas são distribuídas automaticamente nos meses corretos.",
    ],
    connections: ["Despesas", "Contas Bancárias", "Dashboard"],
    screenshots: [
      { label: "Lista de Cartões", description: "Cards no estilo cartão físico com limite, bandeira e botões de ação." },
      { label: "Fatura do Cartão", description: "Resumo com barra de limite, status e lista de compras do mês." },
    ],
  },
  {
    id: "investimentos",
    icon: BarChart3,
    title: "Investimentos",
    description: "O painel dos seus investimentos. Acompanhe saldo, rentabilidade e registre cada movimentação de forma detalhada.",
    features: [
      { text: "Adicionar novo investimento", detail: "Nome, instituição, tipo (Renda Fixa, Ações, Fundos, etc.), saldo inicial e cor." },
      { text: "Filtrar por tipo", detail: "Abas para Renda Fixa, Renda Variável, Ações, Fundos, Criptomoedas e Previdência." },
      { text: "Buscar investimento", detail: "Por nome do ativo ou da instituição." },
      { text: "Acessar Detalhes", detail: "Botão Detalhes leva para o histórico completo de movimentações." },
      { text: "Registrar movimentação", detail: "Aporte, Resgate, Rendimento ou Dividendo — o saldo é atualizado automaticamente." },
      { text: "Editar movimentação", detail: "Ícone de lápis em cada item do histórico — o saldo é revertido e recalculado." },
      { text: "Remover movimentação", detail: "O efeito no saldo é desfeito automaticamente ao excluir." },
    ],
    tips: [
      "Separe cada produto financeiro como um investimento diferente para acompanhar a rentabilidade individualmente.",
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
      { text: "Remover categoria", detail: "Se houver registros vinculados, o sistema avisa e oferece mover tudo para Sem Categoria." },
      { text: "Filtrar por tipo", detail: "Abas Despesas / Receitas para ver cada grupo separadamente." },
      { text: "Buscar", detail: "Campo de busca por nome da categoria." },
    ],
    tips: [
      "Crie categorias com cores distintas — elas aparecem nos gráficos, facilitando a identificação visual.",
      "Categorias com ícone de cadeado são padrão do sistema, mas podem ser editadas e removidas normalmente.",
      "Ao excluir uma categoria com registros, eles são movidos automaticamente para Sem Categoria.",
    ],
    connections: ["Despesas", "Receitas", "Dashboard"],
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
    ],
    connections: ["Extrato"],
    screenshots: [
      { label: "Resumo Anual completo", description: "Grade com os 12 meses e cards de totais do ano no topo da página." },
    ],
  },
  {
    id: "configuracoes",
    icon: Settings,
    title: "Configurações",
    description: "Suas preferências pessoais no FinTrack.",
    features: [
      { text: "Alternar tema", detail: "Mude entre tema claro e escuro. O botão de tema também fica disponível no cabeçalho." },
      { text: "Ver perfil", detail: "Nome, e-mail e foto de perfil da sua conta." },
      { text: "Sair da conta", detail: "Encerra a sessão com segurança e redireciona para a tela de login." },
    ],
    screenshots: [
      { label: "Página de Configurações", description: "Perfil do usuário, preferência de tema e botão de sair." },
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
        q: "Como crio minha conta no FinTrack?",
        a: "Na tela inicial, clique na aba Criar conta, preencha seu nome, e-mail e uma senha. Clique em Criar conta. Se preferir, pode entrar diretamente com sua conta do Google — sem precisar criar senha.",
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
        q: "Posso usar o FinTrack no celular?",
        a: "Sim. O sistema é responsivo e funciona em qualquer dispositivo com navegador — celular, tablet ou computador.",
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
        q: "Como registro uma conta fixa que se repete todo mês, como aluguel?",
        a: "Ao criar a despesa, selecione o tipo Fixo Recorrente. Ela reaparecerá automaticamente nos meses seguintes sem que você precise relançar.",
      },
      {
        q: "Posso registrar uma compra parcelada fora do cartão?",
        a: "Sim! Ao criar uma despesa, selecione o tipo Parcelado e informe o número total de parcelas. O sistema divide o valor e distribui as parcelas nos meses corretos automaticamente.",
      },
      {
        q: "Lançamento no cartão também aparece em Despesas?",
        a: "Sim. Quando você registra uma transação na fatura do cartão, ela também aparece em Despesas com a origem identificada como o cartão.",
      },
      {
        q: "Como pago uma fatura de cartão?",
        a: "Dentro do cartão, vá na aba Faturas, navegue até o mês desejado e clique em Pagar fatura. Selecione a conta bancária — o valor é debitado automaticamente.",
      },
    ],
  },
  {
    category: "Contas Bancárias",
    icon: Landmark,
    color: "text-info",
    items: [
      {
        q: "Por que o saldo da minha conta está errado?",
        a: "O saldo é calculado com base no valor informado ao cadastrar, mais tudo registrado depois. Se estiver incorreto, vá em Contas Bancárias, clique em Editar e corrija o saldo para o valor real.",
      },
      {
        q: "Posso ter mais de uma conta bancária?",
        a: "Sim! Cadastre quantas contas quiser. Cada uma tem seu saldo individual e o FinTrack mostra o saldo total de todas somadas no topo da página.",
      },
      {
        q: "O que acontece com o saldo quando pago uma despesa?",
        a: "Se a despesa tiver uma conta bancária vinculada e você marcá-la como paga, o valor é descontado automaticamente do saldo daquela conta.",
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
        q: "O FinTrack conecta com corretoras ou bancos automaticamente?",
        a: "Não. O FinTrack não faz integração automática com instituições financeiras. Todos os lançamentos são manuais — você insere os dados do seu extrato ou informe mensal.",
      },
      {
        q: "Qual a diferença entre Rendimento e Dividendo?",
        a: "Rendimento é o juro ou valorização do ativo (comum em renda fixa e fundos). Dividendo são proventos distribuídos por empresas ou FIIs. Ambos aumentam o saldo do investimento.",
      },
    ],
  },
  {
    category: "Categorias",
    icon: Tag,
    color: "text-warning",
    items: [
      {
        q: "Posso excluir uma categoria que já tem despesas registradas?",
        a: "Sim. O FinTrack avisa quantos registros serão afetados (despesas, receitas, transações de cartão) e pergunta se deseja continuar. Se confirmar, tudo é movido automaticamente para Sem Categoria.",
      },
      {
        q: "Posso editar as categorias padrão do sistema?",
        a: "Sim! As categorias padrão identificadas com o ícone de cadeado podem ser editadas ou removidas normalmente, como qualquer outra.",
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
        a: "O Dashboard é sensível ao mês ativo no seletor do topo. Receitas, despesas e gráficos mostram sempre os dados do mês selecionado. Use as setas para navegar entre meses.",
      },
      {
        q: "Como vejo meu desempenho financeiro ao longo do ano inteiro?",
        a: "Acesse Resumo Anual pelo menu lateral. Você vê os 12 meses lado a lado com receitas, despesas, balanço e categorias mais representativas de cada período.",
      },
      {
        q: "Posso mudar o tema visual do sistema?",
        a: "Sim! Acesse Configurações pelo menu lateral e alterne entre tema claro e escuro. O botão de tema também fica disponível no cabeçalho do sistema para acesso rápido.",
      },
      {
        q: "O que significam os pontos coloridos abaixo das setas na fatura do cartão?",
        a: "Indicam que aquele mês tem lançamentos registrados. Verde = pago, Amarelo = pendente, Vermelho = em atraso.",
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

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.features.some((f) => f.text.toLowerCase().includes(q))
    );
  }, [search]);

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
            <p className="text-sm text-muted-foreground">Manual de uso e perguntas frequentes do FinTrack</p>
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
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="manual" className="flex items-center gap-2 flex-1 sm:flex-none">
              <BookOpen className="w-3.5 h-3.5" /> Manual de Uso
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2 flex-1 sm:flex-none">
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

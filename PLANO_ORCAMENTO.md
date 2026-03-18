# Plano: Orçamento por Categoria

**Feature:** Definir teto mensal por categoria de despesa + barra de progresso + alertas a 80% e 100%.

---

## Visão Geral

O usuário poderá definir um limite mensal de gastos para cada categoria de despesa (ex: Alimentação = R$ 1.000/mês). O sistema calculará automaticamente o gasto atual do mês naquela categoria (somando `Expense` + `CardTransaction`) e exibirá uma barra de progresso com alertas visuais.

---

## 1. Banco de Dados — Prisma

### Novo modelo `CategoryBudget`

```prisma
model CategoryBudget {
  id           String   @id @default(cuid())
  userId       String
  categoryId   String
  monthlyLimit Decimal  @db.Decimal(12, 2)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([userId, categoryId])
}
```

### Alterações nos modelos existentes

**`User`** — adicionar relação:
```prisma
categoryBudgets CategoryBudget[]
```

**`Category`** — adicionar relação:
```prisma
budget CategoryBudget?
```

### Migration

```bash
npx prisma migrate dev --name add_category_budget
npx prisma generate
```

---

## 2. API Routes

### `GET /api/orcamentos?month=M&year=Y`

Retorna todas as categorias de EXPENSE do usuário com:
- dados da categoria (id, name, icon, color)
- limite do orçamento (`monthlyLimit`) — null se não configurado
- gasto real do mês (`spent`) — soma de `Expense.amount` (status PAID ou PENDING) + `CardTransaction.installmentAmount` com `purchaseDate` no mês
- `percentage` = spent / monthlyLimit * 100
- `status`: `"ok"` | `"warning"` (≥80%) | `"danger"` (≥100%)

**Lógica de `spent` por categoria:**
```ts
// Expenses diretas no mês
const expenseTotal = await prisma.expense.aggregate({
  where: { userId, categoryId, dueDate: { gte: startOfMonth, lte: endOfMonth } },
  _sum: { amount: true }
});

// CardTransactions no mês (usa installmentAmount se parcelado)
const cardTotal = await prisma.cardTransaction.aggregate({
  where: {
    category: { userId },
    categoryId,
    purchaseDate: { gte: startOfMonth, lte: endOfMonth }
  },
  _sum: { installmentAmount: true, totalAmount: true }
});
// usar installmentAmount quando não nulo, senão totalAmount
```

Rodar tudo em `Promise.all` para paralelizar.

---

### `PUT /api/orcamentos/[categoryId]`

Upsert do orçamento para uma categoria.

```ts
// Body: { monthlyLimit: number }
await prisma.categoryBudget.upsert({
  where: { userId_categoryId: { userId, categoryId } },
  create: { userId, categoryId, monthlyLimit },
  update: { monthlyLimit }
});
```

Validações:
- `monthlyLimit` deve ser > 0
- `categoryId` deve pertencer ao usuário e ser do tipo EXPENSE
- Se a categoria for isDefault (sistema), ainda permite criar budget

---

### `DELETE /api/orcamentos/[categoryId]`

Remove o orçamento da categoria (não remove a categoria em si).

---

## 3. Componentes

### `BudgetProgressBar` — `src/components/shared/budget-progress-bar.tsx`

Componente reutilizável de barra de progresso com status visual.

```tsx
interface BudgetProgressBarProps {
  spent: number;       // valor gasto no mês
  limit: number;       // teto mensal
  showValues?: boolean; // exibe "R$ X de R$ Y" abaixo da barra
  showPercent?: boolean;
  size?: "sm" | "md";
}
```

**Lógica de cor:**
- `percentage < 80%` → `bg-success` (verde)
- `80% ≤ percentage < 100%` → `bg-warning` (âmbar)
- `percentage ≥ 100%` → `bg-destructive` (vermelho), barra não ultrapassa 100% visualmente

**Tooltip** ao hover: "R$ X gastos de R$ Y (ZZ%)"

---

### `BudgetAlertBanner` — `src/components/shared/budget-alert-banner.tsx`

Card compacto para o Dashboard (aba Resumo) listando categorias em alerta.

```tsx
// Mostra somente categorias com percentage >= 80%
// Cada linha: ícone da categoria + nome + barra compacta + "X% do limite"
// Se nenhum alerta: não renderiza (return null)
```

---

## 4. Página de Orçamentos

### `src/app/(app)/orcamentos/page.tsx`

Rota: `/orcamentos`

**Layout da página:**

```
┌─────────────────────────────────────────────────────┐
│  Orçamentos                    [Mês ▼]              │
│  Defina limites mensais por categoria                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Resumo do Mês                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ X categorias │ │ Y em alerta  │ │ Z estouradas│ │
│  │ com orçamento│ │ (≥80%)       │ │ (≥100%)     │ │
│  └──────────────┘ └──────────────┘ └─────────────┘ │
│                                                     │
│  Categorias de Despesa                              │
│  ┌───────────────────────────────────────────────┐ │
│  │ [●] Alimentação                     [Editar]  │ │
│  │ R$ 650 gastos de R$ 1.000           65%       │ │
│  │ ████████████████░░░░░░░░ (verde)              │ │
│  ├───────────────────────────────────────────────┤ │
│  │ [●] Transporte                      [Editar]  │ │
│  │ R$ 420 gastos de R$ 500             84% ⚠️    │ │
│  │ █████████████████████░░░ (âmbar)              │ │
│  ├───────────────────────────────────────────────┤ │
│  │ [○] Lazer                  [Definir limite]   │ │
│  │ R$ 280 gastos · sem limite definido           │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Interações:**

- **[Definir limite]** → abre inline form ou sheet com campo de valor + botão Salvar
- **[Editar]** → mesmo form pré-preenchido + botão Remover limite
- Ao salvar: otimistic update → `PUT /api/orcamentos/[categoryId]`
- Ao remover: `DELETE /api/orcamentos/[categoryId]`
- Filtro inline: "Todas" | "Com orçamento" | "Em alerta"

---

## 5. Integração no Dashboard

### Aba **Resumo** — inserir bloco `BudgetAlertBanner`

Posição: entre os KPI cards e o "Balanço do Mês". Só aparece se houver categorias com `percentage >= 80%`.

```
┌──────────────────────────────────────────────────┐
│ ⚠️  Alertas de Orçamento                          │
│  Alimentação  ████████████████████░ 94%          │
│  Lazer        ██████████████████████ 102% 🔴     │
│                              [Ver Orçamentos →]  │
└──────────────────────────────────────────────────┘
```

**Dados:** o endpoint `/api/dashboard` já existente pode incluir `budgetAlerts` no payload, ou o componente faz um fetch separado e leve para `/api/orcamentos`.

Opção recomendada: **fetch separado** — evita sobrecarregar o dashboard e permite o banner renderizar independentemente após o carregamento principal.

---

## 6. Sidebar — novo item de menu

Adicionar em `src/components/layout/sidebar.tsx`:

```tsx
{ href: "/orcamentos", label: "Orçamentos", icon: Target }
```

Posição: após "Categorias" na lista de `navItems`.

---

## 7. Ordem de Implementação

```
Etapa 1 — Backend
  [1.1] Adicionar modelo CategoryBudget ao schema.prisma
  [1.2] Rodar migration: prisma migrate dev
  [1.3] Criar GET /api/orcamentos/route.ts
  [1.4] Criar PUT /api/orcamentos/[categoryId]/route.ts
  [1.5] Criar DELETE /api/orcamentos/[categoryId]/route.ts

Etapa 2 — Componentes base
  [2.1] Criar BudgetProgressBar
  [2.2] Criar BudgetAlertBanner

Etapa 3 — Página /orcamentos
  [3.1] Criar page.tsx com listagem + KPI cards de resumo
  [3.2] Implementar inline form de edição (sheet ou inline)
  [3.3] Adicionar filtro "Todas / Com orçamento / Em alerta"

Etapa 4 — Dashboard
  [4.1] Buscar dados de budget no dashboard (fetch separado)
  [4.2] Inserir BudgetAlertBanner na aba Resumo

Etapa 5 — Navegação
  [5.1] Adicionar item "Orçamentos" no sidebar
```

---

## 8. Decisões Técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Budget por mês específico vs mensal fixo | **Mensal fixo (sem mês/ano)** | Simples, editável a qualquer momento. Adicionar por mês é evolução futura. |
| Cálculo de gasto | Soma de `Expense.dueDate` no mês + `CardTransaction.purchaseDate` | Inclui todas as despesas independente de status (PENDING + PAID = tudo que foi comprometido) |
| Formulário de edição | **Inline no card** (não abre dialog) | Menos fricção para editar rapidamente |
| Dados no dashboard | **Fetch separado leve** | Não bloqueia o carregamento principal do dashboard |
| Validação de limite | Só categorias EXPENSE | Não faz sentido orçamento em categorias de receita |

---

## 9. Estados Visuais da Barra

```
0%   ──────────────────────────────── 100%+

[verde]  < 80%     "Dentro do limite"
[âmbar]  80–99%    "Atenção: próximo do limite"
[verm]   ≥ 100%    "Limite excedido"

Badge lateral:
  < 80%  →  "65%"  (texto muted)
  80–99% →  "⚠ 84%" (texto warning)
  ≥ 100% →  "🔴 102%" (texto destructive)
```

---

## 10. Arquivos a Criar/Modificar

| Arquivo | Ação |
|---|---|
| `prisma/schema.prisma` | Modificar — adicionar `CategoryBudget`, relações em `User` e `Category` |
| `prisma/migrations/...` | Criar via `prisma migrate dev` |
| `src/app/api/orcamentos/route.ts` | Criar |
| `src/app/api/orcamentos/[categoryId]/route.ts` | Criar |
| `src/components/shared/budget-progress-bar.tsx` | Criar |
| `src/components/shared/budget-alert-banner.tsx` | Criar |
| `src/app/(app)/orcamentos/page.tsx` | Criar |
| `src/components/layout/sidebar.tsx` | Modificar — adicionar item "Orçamentos" |
| `src/app/(app)/dashboard/page.tsx` | Modificar — inserir `BudgetAlertBanner` na aba Resumo |

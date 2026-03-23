"use client";

import { motion } from "framer-motion";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Ilustrações SVG inline ───────────────────────────────────────────────────
// Usam currentColor e as variáveis CSS do sistema para adaptar ao tema.

function IllustrationEmpty() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      {/* Fundo suave */}
      <ellipse cx="100" cy="140" rx="70" ry="12" fill="var(--muted)" opacity="0.5" />
      {/* Caixa principal */}
      <rect x="45" y="50" width="110" height="80" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      {/* Linhas de conteúdo vazio */}
      <rect x="62" y="72" width="76" height="8" rx="4" fill="var(--muted)" />
      <rect x="62" y="88" width="52" height="8" rx="4" fill="var(--muted)" />
      <rect x="62" y="104" width="64" height="8" rx="4" fill="var(--muted)" />
      {/* Ícone de pasta vazia no topo */}
      <rect x="78" y="28" width="44" height="32" rx="5" fill="var(--muted)" />
      <rect x="78" y="36" width="44" height="26" rx="5" fill="var(--border)" />
      <path d="M78 36 Q100 28 122 36" stroke="var(--muted-foreground)" strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  );
}

function IllustrationNoResults() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="12" fill="var(--muted)" opacity="0.5" />
      {/* Lupa */}
      <circle cx="88" cy="76" r="34" fill="var(--muted)" stroke="var(--border)" strokeWidth="2" />
      <circle cx="88" cy="76" r="24" fill="var(--card)" />
      {/* X dentro da lupa */}
      <path d="M80 68 L96 84 M96 68 L80 84" stroke="var(--muted-foreground)" strokeWidth="3" strokeLinecap="round" />
      {/* Cabo da lupa */}
      <line x1="107" y1="95" x2="126" y2="114" stroke="var(--muted-foreground)" strokeWidth="5" strokeLinecap="round" />
      {/* Linhas de busca */}
      <rect x="116" y="48" width="44" height="7" rx="3.5" fill="var(--muted)" />
      <rect x="116" y="62" width="32" height="7" rx="3.5" fill="var(--muted)" />
    </svg>
  );
}

function IllustrationTransactions() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="12" fill="var(--muted)" opacity="0.5" />
      {/* Card de transação */}
      <rect x="30" y="60" width="140" height="52" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      <circle cx="58" cy="86" r="14" fill="var(--muted)" />
      <rect x="80" y="78" width="60" height="8" rx="4" fill="var(--muted)" />
      <rect x="80" y="92" width="40" height="7" rx="3.5" fill="var(--muted)" opacity="0.6" />
      <rect x="148" y="80" width="16" height="12" rx="3" fill="var(--success)" opacity="0.4" />
      {/* Card de trás */}
      <rect x="38" y="44" width="130" height="48" rx="10" fill="var(--muted)" opacity="0.3" />
      {/* Seta de transferência */}
      <path d="M92 24 L100 14 L108 24" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
      <path d="M92 34 L100 44 L108 34" stroke="var(--destructive)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
    </svg>
  );
}

function IllustrationInvestments() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="12" fill="var(--muted)" opacity="0.5" />
      {/* Barras do gráfico */}
      <rect x="44" y="100" width="20" height="32" rx="4" fill="var(--chart-1)" opacity="0.3" />
      <rect x="72" y="80" width="20" height="52" rx="4" fill="var(--chart-1)" opacity="0.5" />
      <rect x="100" y="64" width="20" height="68" rx="4" fill="var(--chart-1)" opacity="0.7" />
      <rect x="128" y="44" width="20" height="88" rx="4" fill="var(--chart-1)" />
      {/* Linha de tendência */}
      <path d="M54 100 L82 80 L110 64 L138 44" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="54" cy="100" r="4" fill="var(--success)" />
      <circle cx="82" cy="80" r="4" fill="var(--success)" />
      <circle cx="110" cy="64" r="4" fill="var(--success)" />
      <circle cx="138" cy="44" r="4" fill="var(--success)" />
      {/* Linha de base */}
      <line x1="36" y1="132" x2="164" y2="132" stroke="var(--border)" strokeWidth="1.5" />
    </svg>
  );
}

function IllustrationCards() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="12" fill="var(--muted)" opacity="0.5" />
      {/* Cartão de trás */}
      <rect x="36" y="54" width="128" height="76" rx="10" fill="var(--muted)" />
      {/* Cartão da frente */}
      <rect x="28" y="44" width="128" height="76" rx="10" fill="var(--chart-1)" opacity="0.15" stroke="var(--border)" strokeWidth="1.5" />
      {/* Chip */}
      <rect x="46" y="60" width="22" height="16" rx="3" fill="var(--warning)" opacity="0.6" />
      <line x1="46" y1="68" x2="68" y2="68" stroke="var(--warning)" strokeWidth="1" opacity="0.8" />
      <line x1="57" y1="60" x2="57" y2="76" stroke="var(--warning)" strokeWidth="1" opacity="0.8" />
      {/* Números */}
      <rect x="46" y="88" width="88" height="6" rx="3" fill="var(--muted-foreground)" opacity="0.3" />
      {/* Bandeira */}
      <circle cx="124" cy="68" r="9" fill="var(--chart-5)" opacity="0.4" />
      <circle cx="134" cy="68" r="9" fill="var(--warning)" opacity="0.5" />
    </svg>
  );
}

function IllustrationAccounts() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="12" fill="var(--muted)" opacity="0.5" />
      {/* Coluna do banco */}
      <rect x="74" y="96" width="52" height="40" rx="2" fill="var(--muted)" />
      {/* Pilares */}
      <rect x="80" y="72" width="10" height="64" rx="2" fill="var(--border)" />
      <rect x="95" y="72" width="10" height="64" rx="2" fill="var(--border)" />
      <rect x="110" y="72" width="10" height="64" rx="2" fill="var(--border)" />
      {/* Telhado triangular */}
      <path d="M62 72 L100 38 L138 72 Z" fill="var(--chart-1)" opacity="0.2" stroke="var(--chart-1)" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Base */}
      <rect x="68" y="110" width="64" height="6" rx="2" fill="var(--muted-foreground)" opacity="0.3" />
      {/* Símbolo de moeda */}
      <text x="96" y="60" fontSize="16" fill="var(--chart-1)" opacity="0.6" fontWeight="bold">$</text>
    </svg>
  );
}

function IllustrationBudget() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="12" fill="var(--muted)" opacity="0.5" />
      {/* Alvo */}
      <circle cx="100" cy="80" r="48" fill="var(--muted)" opacity="0.15" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="100" cy="80" r="33" fill="var(--muted)" opacity="0.2" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="100" cy="80" r="18" fill="var(--muted)" opacity="0.3" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="100" cy="80" r="6" fill="var(--success)" opacity="0.7" />
      {/* Seta */}
      <line x1="150" y1="30" x2="106" y2="74" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" />
      <path d="M144 26 L154 36 L140 38 Z" fill="var(--success)" />
    </svg>
  );
}

// ─── Mapa de variantes de ilustração ─────────────────────────────────────────

const illustrations = {
  empty:        IllustrationEmpty,
  "no-results": IllustrationNoResults,
  transactions: IllustrationTransactions,
  investments:  IllustrationInvestments,
  cards:        IllustrationCards,
  accounts:     IllustrationAccounts,
  budget:       IllustrationBudget,
} as const;

export type EmptyStateIllustration = keyof typeof illustrations;

// ─── Componente ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  /** Ilustração temática. Usa "empty" por padrão, "no-results" para filtros. */
  illustration?: EmptyStateIllustration;
  /** Ícone Phosphor opcional — substitui a ilustração quando fornecido */
  icon?: PhosphorIcon;
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "empty" | "no-results";
  className?: string;
}

export function EmptyState({
  illustration,
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "empty",
  className,
}: EmptyStateProps) {
  const isNoResults = variant === "no-results";

  // Resolução da ilustração a usar
  const resolvedIllustration = illustration ?? (isNoResults ? "no-results" : "empty");
  const Illustration = illustrations[resolvedIllustration];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center py-16 text-center", className)}
    >
      {Icon ? (
        // Fallback: ícone Phosphor dentro do círculo (para casos específicos)
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4",
          isNoResults ? "bg-info/10" : "bg-muted"
        )}>
          <Icon
            weight="duotone"
            className={cn("w-8 h-8", isNoResults ? "text-info" : "text-muted-foreground")}
          />
        </div>
      ) : (
        // Ilustração SVG temática
        <div className="mb-2 opacity-90">
          <Illustration />
        </div>
      )}

      <h3 className="text-base font-semibold tracking-tight mb-1">
        {title ?? (isNoResults ? "Nenhum resultado encontrado" : "Nenhum item ainda")}
      </h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </motion.div>
  );
}

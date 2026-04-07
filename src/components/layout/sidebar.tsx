"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFour,
  CreditCard,
  TrendDown,
  TrendUp,
  Bank,
  Tag,
  GearSix,
  ListNumbers,
  ChartBar,
  BookOpen,
  Wallet,
  Target,
  LinkSimple,
  CalendarCheck,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";

// Helper: wraps a Phosphor icon with a fixed weight, returning a Lucide-compatible component
function ph(
  Icon: PhosphorIcon,
  weight: "duotone" | "fill" | "bold" | "regular" = "duotone"
): React.ComponentType<{ className?: string }> {
  const Wrapped = ({ className }: { className?: string }) => (
    <Icon weight={weight} className={className} />
  );
  Wrapped.displayName = (Icon as { displayName?: string }).displayName ?? "PhosphorIcon";
  return Wrapped;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  groupLabel?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: ph(SquaresFour) },
    ],
  },
  {
    groupLabel: "Transações",
    items: [
      { href: "/despesas",   label: "Despesas",   icon: ph(TrendDown) },
      { href: "/receitas",   label: "Receitas",   icon: ph(TrendUp) },
      { href: "/extrato",    label: "Extrato",    icon: ph(ListNumbers) },
      { href: "/cartoes",    label: "Cartões",    icon: ph(CreditCard) },
      { href: "/orcamentos", label: "Orçamentos", icon: ph(Target) },
    ],
  },
  {
    groupLabel: "Patrimônio",
    items: [
      { href: "/investimentos", label: "Investimentos", icon: ph(ChartBar) },
      { href: "/contas",        label: "Contas",        icon: ph(Bank) },
      { href: "/resumo-anual",  label: "Resumo Anual",  icon: ph(CalendarCheck) },
    ],
  },
];

const footerItems = [
  { href: "/categorias", label: "Categorias",    icon: ph(Tag) },
  { href: "/ajuda",      label: "Ajuda",          icon: ph(BookOpen) },
  { href: "/config",     label: "Configurações",  icon: ph(GearSix) },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

export function Sidebar({ isOpen = true, onClose, collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full w-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden">
      {/* Logo */}
      <div className={cn("flex items-center h-14", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/dashboard" title="PQGASTEI?" className={cn("flex items-center cursor-pointer", !collapsed && "flex-1")}>
          {collapsed ? (
            <>
              <img src="/logos/logo-light-mobile.svg" alt="PG?" className="h-[30px] dark:hidden" />
              <img src="/logos/logo-dark-mobile.svg" alt="PG?" className="h-[30px] hidden dark:block" />
            </>
          ) : (
            <>
              <img src="/logos/logo-light.svg" alt="PQGASTEI?" className="h-[30px] dark:hidden" />
              <img src="/logos/logo-dark.svg" alt="PQGASTEI?" className="h-[30px] hidden dark:block" />
            </>
          )}
        </Link>

        {onClose ? (
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            } />
            <TooltipContent>Fechar menu</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Nav Items */}
      <div className={cn("flex-1 py-4 overflow-y-auto", collapsed ? "px-1.5" : "px-2")}>
        {navGroups.map((group, gIdx) => {
          let itemIndex = navGroups.slice(0, gIdx).reduce((s, g) => s + g.items.length, 0);
          return (
            <div key={gIdx}>
              {gIdx > 0 && (
                <>
                  <Separator className="bg-sidebar-border my-2" />
                  {group.groupLabel && (
                    collapsed ? (
                      <p className="text-center text-[9px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 select-none mb-0.5" title={group.groupLabel}>
                        ···
                      </p>
                    ) : (
                      <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none">
                        {group.groupLabel}
                      </p>
                    )
                  )}
                </>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const delay = itemIndex++ * 0.04;

                  const linkClass = cn(
                    "flex items-center rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 h-10 px-3",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  );

                  return (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay }}
                    >
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger render={
                            <Link
                              href={item.href}
                              title={item.label}
                              onClick={onClose}
                                                            className={linkClass}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                            </Link>
                          } />
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                          href={item.href}
                          title={item.label}
                          onClick={onClose}
                                                    className={linkClass}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {item.label}
                        </Link>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Footer — Ajuda + Configurações */}
      <div className={cn("py-4 pb-20 lg:pb-4 space-y-1", collapsed ? "px-1.5" : "px-2")}>
        {footerItems.map(({ href, label, icon: Icon }) =>
          collapsed ? (
            <Tooltip key={href}>
              <TooltipTrigger render={
                <Link
                  href={href}
                  title={label}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 mx-auto rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                    pathname === href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              } />
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                pathname === href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        )}
      </div>
    </nav>
  );
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -208 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[175px] lg:hidden"
          >
            <Sidebar isOpen={isOpen} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

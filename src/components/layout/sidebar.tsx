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
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/components/ia/chat-store";
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
  tourId?: string;
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
      { href: "/despesas",   label: "Despesas",   icon: ph(TrendDown), tourId: "nav-despesas" },
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
      { href: "/contas",        label: "Contas",        icon: ph(Bank), tourId: "nav-contas" },
      { href: "/categorias",    label: "Categorias",    icon: ph(Tag) },
      { href: "/open-finance",  label: "Open Finance",  icon: ph(LinkSimple) },
      { href: "/resumo-anual",  label: "Resumo Anual",  icon: ph(CalendarCheck) },
    ],
  },
];

const footerItems = [
  { href: "/ajuda",  label: "Ajuda",          icon: ph(BookOpen) },
  { href: "/config", label: "Configurações",  icon: ph(GearSix) },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

export function Sidebar({ isOpen = true, onClose, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { toggle: toggleChat, isOpen: chatOpen } = useChatStore();

  return (
    <nav className="flex flex-col h-full w-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden">
      {/* Logo */}
      <div className={cn("flex items-center h-14", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/dashboard" title="Dashboard Home" className={cn("flex items-center gap-2.5 cursor-pointer", !collapsed && "flex-1")}>
          <span className="inline-flex items-center justify-center rounded-md bg-primary/10 p-1 shrink-0">
            <Wallet weight="duotone" className="w-4 h-4 text-primary" />
          </span>
          {!collapsed && (
            <span className="text-xl text-sidebar-foreground">
              <span className="font-normal tracking-normal mr-[0.3em]">Fin</span>
              <span className="font-bold tracking-[0.3em]">Track</span>
            </span>
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
      <div data-tour="sidebar-nav" className={cn("flex-1 py-4 overflow-y-auto", collapsed ? "px-1.5" : "px-2")}>
        {navGroups.map((group, gIdx) => {
          let itemIndex = navGroups.slice(0, gIdx).reduce((s, g) => s + g.items.length, 0);
          return (
            <div key={gIdx}>
              {gIdx > 0 && (
                <>
                  <Separator className="bg-sidebar-border my-2" />
                  {!collapsed && group.groupLabel && (
                    <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none">
                      {group.groupLabel}
                    </p>
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
                              {...(item.tourId ? { "data-tour": item.tourId } : {})}
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
                          {...(item.tourId ? { "data-tour": item.tourId } : {})}
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

      {/* Footer — FinBot + Ajuda + Configurações */}
      <div className={cn("py-4 pb-20 lg:pb-4 space-y-1", collapsed ? "px-1.5" : "px-2")}>
        {/* FinBot button — distinct highlight */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={
              <button
                onClick={toggleChat}
                className={cn(
                  "flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all duration-150 cursor-pointer",
                  chatOpen
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            } />
            <TooltipContent side="right">FinBot</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={toggleChat}
            className={cn(
              "flex items-center gap-3 h-10 px-3 w-full rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer",
              chatOpen
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            FinBot
          </button>
        )}

        <Separator className="bg-sidebar-border my-2" />

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
            className="fixed left-0 top-0 bottom-0 z-50 w-60 lg:hidden"
          >
            <Sidebar isOpen={isOpen} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

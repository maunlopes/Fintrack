"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Landmark,
  Tag,
  Settings,
  X,
  ListOrdered,
  BarChart3,
  BookOpen,
  Wallet,
  Target,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

import React from "react";

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    groupLabel: "Transações",
    items: [
      { href: "/despesas", label: "Despesas", icon: TrendingDown, tourId: "nav-despesas" },
      { href: "/receitas", label: "Receitas", icon: TrendingUp },
      { href: "/extrato", label: "Extrato", icon: ListOrdered },
      { href: "/cartoes", label: "Cartões", icon: CreditCard },
      { href: "/orcamentos", label: "Orçamentos", icon: Target },
    ],
  },
  {
    groupLabel: "Patrimônio",
    items: [
      { href: "/investimentos", label: "Investimentos", icon: BarChart3 },
      { href: "/contas", label: "Contas", icon: Landmark, tourId: "nav-contas" },
      { href: "/categorias", label: "Categorias", icon: Tag },
      { href: "/open-finance", label: "Open Finance", icon: Link2 },
      { href: "/resumo-anual", label: "Resumo Anual", icon: TrendingUp },
    ],
  },
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
        <Link href="/dashboard" title="Dashboard Home" className={cn("flex items-center gap-2.5 cursor-pointer", !collapsed && "flex-1")}>
          <span className="inline-flex items-center justify-center rounded-md bg-primary/10 p-1 shrink-0">
            <Wallet className="w-4 h-4 text-primary" />
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
                              <Icon className="w-4 h-4 flex-shrink-0" />
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
                          <Icon className="w-4 h-4 flex-shrink-0" />
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
        {[
          { href: "/ajuda", label: "Ajuda", icon: BookOpen },
          { href: "/config", label: "Configurações", icon: Settings },
        ].map(({ href, label, icon: Icon }) =>
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
                  <Icon className="w-4 h-4" />
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
              <Icon className="w-4 h-4" />
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

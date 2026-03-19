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
  Target,
  Link2,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/extrato", label: "Extrato", icon: ListOrdered },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/despesas", label: "Despesas", icon: TrendingDown, tourId: "nav-despesas" },
  { href: "/receitas", label: "Receitas", icon: TrendingUp },
  { href: "/contas", label: "Contas", icon: Landmark, tourId: "nav-contas" },
  { href: "/open-finance", label: "Open Finance", icon: Link2 },
  { href: "/investimentos", label: "Investimentos", icon: BarChart3 },
  { href: "/categorias", label: "Categorias", icon: Tag },
  { href: "/orcamentos", label: "Orçamentos", icon: Target },
  { href: "/resumo-anual", label: "Resumo Anual", icon: TrendingUp },
];

const footerItems = [
  { href: "/ajuda", label: "Ajuda", icon: BookOpen },
  { href: "/config", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

export function Sidebar({ isOpen = true, onClose, collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ background: "var(--brand-900)" }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-14 shrink-0",
          collapsed ? "justify-center px-2" : "px-4"
        )}
      >
        <Link
          href="/dashboard"
          title="Dashboard"
          className={cn("flex items-center gap-2.5 cursor-pointer", !collapsed && "flex-1")}
        >
          <span
            className="inline-flex items-center justify-center rounded-lg shrink-0"
            style={{
              width: 32,
              height: 32,
              background: "var(--accent-dim)",
            }}
          >
            <Wallet className="w-4 h-4" style={{ color: "var(--brand-accent)" }} />
          </span>
          {!collapsed && (
            <span
              className="text-xl"
              style={{ fontFamily: "var(--font-syne)", color: "white" }}
            >
              <span style={{ fontWeight: 400 }}>Fin</span>
              <span style={{ fontWeight: 800 }}>Track</span>
            </span>
          )}
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px" }} />

      {/* Nav Items */}
      <ul
        data-tour="sidebar-nav"
        className={cn("flex-1 py-3 space-y-0.5 overflow-y-auto", collapsed ? "px-2" : "px-2")}
      >
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          const itemContent = (
            <Link
              href={item.href}
              title={item.label}
              onClick={onClose}
              {...(item.tourId ? { "data-tour": item.tourId } : {})}
              className={cn(
                "flex items-center text-sm font-medium transition-all duration-150 cursor-pointer",
                collapsed
                  ? "justify-center h-10 w-10 mx-auto rounded-xl"
                  : "gap-3 h-10 px-3 rounded-xl"
              )}
              style={
                isActive
                  ? {
                      background: "var(--accent-dim)",
                      color: "var(--brand-accent)",
                    }
                  : {
                      color: "rgba(255,255,255,0.55)",
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                }
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && item.label}
            </Link>
          );

          return (
            <motion.li
              key={item.href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger render={itemContent} />
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                itemContent
              )}
            </motion.li>
          );
        })}
      </ul>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px" }} />

      {/* Footer */}
      <div className={cn("py-3 space-y-0.5", collapsed ? "px-2" : "px-2")}>
        {footerItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          const linkEl = (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center text-sm font-medium transition-all duration-150 cursor-pointer",
                collapsed
                  ? "justify-center h-10 w-10 mx-auto rounded-xl"
                  : "gap-3 h-10 px-3 rounded-xl"
              )}
              style={
                isActive
                  ? { background: "var(--accent-dim)", color: "var(--brand-accent)" }
                  : { color: "rgba(255,255,255,0.45)" }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                }
              }}
            >
              <Icon className="w-4 h-4" />
              {!collapsed && label}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={href}>
              <TooltipTrigger render={linkEl} />
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : (
            linkEl
          );
        })}
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
            initial={{ x: -220 }}
            animate={{ x: 0 }}
            exit={{ x: -220 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-56 lg:hidden"
          >
            <Sidebar isOpen={isOpen} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

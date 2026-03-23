"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  TrendDown,
  CreditCard,
  ChartBar,
  DotsThreeOutline,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MoreSheet } from "./more-sheet";

const navItems = [
  { href: "/dashboard",     label: "Dashboard", icon: SquaresFour },
  { href: "/despesas",      label: "Despesas",  icon: TrendDown   },
  { href: "/cartoes",       label: "Cartões",   icon: CreditCard  },
  { href: "/investimentos", label: "Invest.",   icon: ChartBar    },
];

// Routes that live inside the "Mais" sheet
const MAIS_ROUTES = ["/receitas", "/contas", "/orcamentos", "/extrato", "/categorias", "/config"];

export function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const maisActive = MAIS_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-30 lg:hidden">
        <ul className="flex pb-[env(safe-area-inset-bottom,0px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href} className="flex-1 relative">
                <Link
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "relative flex flex-col items-center gap-1 py-2.5 text-xs transition-colors cursor-pointer",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Pill background */}
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-x-2 top-1 bottom-1 rounded-2xl bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    weight={isActive ? "fill" : "duotone"}
                    className={cn(
                      "relative z-10 transition-all duration-150",
                      isActive ? "w-6 h-6" : "w-5 h-5"
                    )}
                  />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              </li>
            );
          })}

          {/* "Mais" item */}
          <li className="flex-1 relative">
            <button
              onClick={() => setSheetOpen(true)}
              className={cn(
                "relative w-full flex flex-col items-center gap-1 py-2.5 text-xs transition-colors cursor-pointer",
                maisActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {maisActive && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-x-2 top-1 bottom-1 rounded-2xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <DotsThreeOutline
                weight={maisActive ? "fill" : "duotone"}
                className={cn(
                  "relative z-10 transition-all duration-150",
                  maisActive ? "w-6 h-6" : "w-5 h-5"
                )}
              />
              <span className="relative z-10">Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      <MoreSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

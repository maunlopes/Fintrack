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
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MoreSheet } from "./more-sheet";
import { useChatStore } from "@/components/ia/chat-store";

const LEFT_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/despesas",  label: "Despesas",  icon: TrendDown   },
];

const RIGHT_ITEMS = [
  { href: "/cartoes",       label: "Cartões",  icon: CreditCard },
  { href: "/investimentos", label: "Invest.",  icon: ChartBar   },
];

// Routes that live inside the "Mais" sheet
const MAIS_ROUTES = ["/receitas", "/contas", "/orcamentos", "/extrato", "/categorias", "/config"];

function NavLink({ href, label, icon: Icon, isActive }: {
  href: string; label: string; icon: React.ElementType; isActive: boolean;
}) {
  return (
    <li className="flex-1 relative">
      <Link
        href={href}
        title={label}
        className={cn(
          "relative flex flex-col items-center gap-1 py-2.5 text-xs transition-colors cursor-pointer",
          isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isActive && (
          <motion.span
            layoutId="tab-pill"
            className="absolute inset-x-2 top-1 bottom-1 rounded-2xl bg-primary/10"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon
          weight={isActive ? "fill" : "duotone"}
          className={cn("relative z-10 transition-all duration-150", isActive ? "w-6 h-6" : "w-5 h-5")}
        />
        <span className="relative z-10">{label}</span>
      </Link>
    </li>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toggle: toggleChat, isOpen: chatOpen } = useChatStore();

  const maisActive = MAIS_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-30 lg:hidden">
        <ul className="flex items-end pb-[env(safe-area-inset-bottom,0px)]">
          {/* Left items */}
          {LEFT_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}

          {/* Center — FinBot raised button */}
          <li className="flex-1 flex justify-center">
            <div className="relative -top-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleChat}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center shadow-lg ring-4 transition-all",
                  chatOpen
                    ? "bg-primary/90 text-primary-foreground ring-primary/20"
                    : "bg-primary text-primary-foreground ring-primary/20"
                )}
                aria-label="Abrir FinBot"
              >
                <motion.div
                  animate={{ rotate: chatOpen ? 15 : 0, scale: chatOpen ? 0.9 : 1 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
              </motion.button>
            </div>
          </li>

          {/* Right items */}
          {RIGHT_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}

          {/* Mais */}
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
                className={cn("relative z-10 transition-all duration-150", maisActive ? "w-6 h-6" : "w-5 h-5")}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  TrendDown,
  TrendUp,
  DotsThreeOutline,
} from "@phosphor-icons/react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MoreSheet } from "./more-sheet";
import { useChatStore } from "@/components/ia/chat-store";

// Routes that live inside the "Mais" sheet
const MAIS_ROUTES = [
  "/cartoes", "/investimentos", "/contas",
  "/orcamentos", "/extrato", "/categorias", "/config",
];

const LEFT_ITEMS = [
  { href: "/dashboard", label: "Início",   icon: SquaresFour },
  { href: "/despesas",  label: "Despesas", icon: TrendDown   },
];

const RIGHT_ITEMS = [
  { href: "/receitas", label: "Receitas", icon: TrendUp         },
  { label: "Mais",     icon: DotsThreeOutline, isSheet: true },
];

function NavItem({ href, label, icon: Icon, isActive }: {
  href: string; label: string; icon: React.ElementType; isActive: boolean;
}) {
  return (
    <li className="flex-1 relative">
      <Link
        href={href}
        title={label}
        className={cn(
          "relative flex flex-col items-center gap-1 py-2.5 text-xs transition-colors",
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
          {/* Left: Início + Despesas */}
          {LEFT_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}

          {/* Center: FinBot raised button */}
          <li className="flex-1 flex justify-center">
            <div className="relative -top-4">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  onClick={toggleChat}
                  className="w-14 h-14 rounded-full shadow-lg ring-4 ring-primary/20"
                  aria-label="Abrir FinBot"
                >
                <motion.div
                  animate={{ rotate: chatOpen ? 15 : 0, scale: chatOpen ? 0.88 : 1 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                </Button>
              </motion.div>
            </div>
          </li>

          {/* Right: Receitas + Mais */}
          {RIGHT_ITEMS.map((item) => {
            if (item.isSheet) {
              const Icon = item.icon;
              return (
                <li key="mais" className="flex-1 relative">
                  <Button
                    variant="ghost"
                    onClick={() => setSheetOpen(true)}
                    className={cn(
                      "relative w-full flex flex-col items-center gap-1 py-2.5 h-auto rounded-none text-xs transition-colors",
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
                    <Icon
                      weight={maisActive ? "fill" : "duotone"}
                      className={cn("relative z-10 transition-all duration-150", maisActive ? "w-6 h-6" : "w-5 h-5")}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </Button>
                </li>
              );
            }
            return (
              <NavItem
                key={item.href}
                href={item.href!}
                label={item.label}
                icon={item.icon}
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              />
            );
          })}
        </ul>
      </nav>

      <MoreSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

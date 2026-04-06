"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendUp,
  Bank,
  Target,
  Receipt,
  Tag,
  Gear,
  CreditCard,
  ChartBar,
  LinkSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const sheetItems = [
  { href: "/cartoes",      label: "Cartões",        icon: CreditCard },
  { href: "/investimentos",label: "Investimentos",  icon: ChartBar   },
  { href: "/contas",       label: "Contas",         icon: Bank       },
  { href: "/orcamentos",   label: "Orçamentos",     icon: Target     },
  { href: "/extrato",      label: "Extrato",        icon: Receipt    },
  { href: "/categorias",   label: "Categorias",     icon: Tag        },
  // { href: "/open-finance",  label: "Conectar contas", icon: LinkSimple },
  { href: "/config",       label: "Configurações",  icon: Gear       },
];

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreSheet({ isOpen, onClose }: MoreSheetProps) {
  const router = useRouter();

  const handleNav = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            <div className="px-4 pt-2 pb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
                Mais opções
              </p>

              <div className="grid grid-cols-3 gap-2">
                {sheetItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      onClick={() => handleNav(item.href)}
                      className="flex flex-col items-center gap-2 py-4 px-2 h-auto rounded-2xl active:scale-95 transition-all"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                        <Icon weight="duotone" className="w-6 h-6 text-foreground" />
                      </div>
                      <span className="text-xs font-medium text-foreground">{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Safe area spacer */}
            <div className="pb-safe" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  {
    label: "Nova Despesa",
    icon: ArrowDownRight,
    className: "bg-destructive hover:bg-destructive/90 text-white",
    href: "/despesas?new=true",
  },
  {
    label: "Nova Receita",
    icon: ArrowUpRight,
    className: "bg-success hover:bg-success/90 text-white",
    href: "/receitas?new=true",
  },
];

export function QuickAddFAB() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 z-50 lg:bottom-6 flex flex-col items-end gap-2.5">
        {/* Action buttons — appear ABOVE the FAB */}
        <AnimatePresence>
          {open &&
            actions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.6, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: 20 }}
                transition={{ duration: 0.2, delay: (actions.length - 1 - i) * 0.06 }}
              >
                <Button
                  className={`rounded-full pl-3 pr-4 py-2.5 h-auto text-sm font-semibold shadow-lg ${action.className}`}
                  onClick={() => {
                    setOpen(false);
                    router.push(action.href);
                  }}
                >
                  <action.icon className="w-4 h-4 mr-1.5" />
                  {action.label}
                </Button>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          <Button
            onClick={() => setOpen((o) => !o)}
            className="w-14 h-14 rounded-full shadow-xl ring-4 ring-primary/20 hover:shadow-2xl"
            size="icon"
            aria-label="Lançar transação"
          >
            <motion.div
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </>
  );
}

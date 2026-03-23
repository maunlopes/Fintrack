"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowDownRight, ArrowUpRight } from "lucide-react";

const actions = [
  {
    label: "Nova Receita",
    icon: ArrowUpRight,
    className: "bg-success hover:bg-success/90 text-white",
    href: "/receitas?new=true",
  },
  {
    label: "Nova Despesa",
    icon: ArrowDownRight,
    className: "bg-destructive hover:bg-destructive/90 text-white",
    href: "/despesas?new=true",
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
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 z-50 lg:bottom-6 flex flex-col-reverse items-end gap-2.5">
        {/* Action buttons */}
        <AnimatePresence>
          {open &&
            actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.6, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: 8 }}
                transition={{ duration: 0.18, delay: i * 0.06 }}
                className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-sm font-semibold shadow-lg transition-colors ${action.className}`}
                onClick={() => {
                  setOpen(false);
                  router.push(action.href);
                }}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </motion.button>
            ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setOpen((o) => !o)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center ring-4 ring-primary/20 transition-shadow hover:shadow-2xl"
          aria-label="Lançar transação"
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Plus className="w-6 h-6" />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}

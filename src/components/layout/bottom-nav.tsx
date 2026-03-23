"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  TrendDown,
  CreditCard,
  ChartBar,
  Bank,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { href: "/dashboard",    label: "Dashboard", icon: SquaresFour },
  { href: "/despesas",     label: "Despesas",  icon: TrendDown },
  { href: "/cartoes",      label: "Cartões",   icon: CreditCard },
  { href: "/investimentos",label: "Invest.",   icon: ChartBar },
  { href: "/contas",       label: "Contas",    icon: Bank },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-30 lg:hidden">
      <ul className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="flex-1 relative">
              <Link
                href={item.href}
                title={item.label}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs transition-colors cursor-pointer",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  weight={isActive ? "fill" : "duotone"}
                  className="w-5 h-5"
                />
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

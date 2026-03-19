"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, TrendingDown, BarChart3, Landmark } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/despesas", label: "Despesas", icon: TrendingDown },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/investimentos", label: "Investimentos", icon: BarChart3 },
  { href: "/contas", label: "Contas", icon: Landmark },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
      style={{
        background: "var(--brand-900)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <ul className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                title={item.label}
                className="flex flex-col items-center gap-1 py-2 text-xs transition-colors cursor-pointer"
                style={{
                  color: isActive ? "var(--brand-accent)" : "rgba(255,255,255,0.45)",
                }}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

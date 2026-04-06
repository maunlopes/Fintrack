"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, Link2, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useChatStore } from "@/components/ia/chat-store";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/despesas": "Despesas",
  "/receitas": "Receitas",
  "/cartoes": "Cartões",
  "/contas": "Contas",
  "/investimentos": "Investimentos",
  "/orcamentos": "Orçamentos",
  "/extrato": "Extrato",
  "/categorias": "Categorias",
  "/config": "Configurações",
};

interface HeaderProps {
  session: Session | null;
}

export function Header({ session }: HeaderProps) {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);
  const { toggle: toggleChat } = useChatStore();
  const user = session?.user;

  // Resolve page title — match by longest prefix
  const pageTitle = Object.entries(PAGE_TITLES)
    .filter(([route]) => pathname === route || pathname.startsWith(route + "/"))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "PQGASTEI?";

  useEffect(() => {
    fetch("/api/orcamentos")
      .then((r) => r.json())
      .then((data: { status: string }[]) => {
        const count = data.filter((c) => c.status === "warning" || c.status === "danger").length;
        setAlertCount(count);
      })
      .catch(() => {});
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="h-14 border-b bg-card flex items-center px-4 gap-3 sticky top-0 z-30">
      {/* Mobile: page title | Desktop: spacer */}
      <span className="text-base font-bold tracking-tight lg:hidden">{pageTitle}</span>
      <div className="flex-1" />

      <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 text-xs" onClick={toggleChat}>
        <Sparkles className="w-4 h-4" />
        FinBot
      </Button>

      {/* <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 text-xs" onClick={() => window.location.href = "/open-finance"}>
        <Link2 className="w-4 h-4" />
        Conectar contas
      </Button> */}

      <ThemeToggle />

      <Tooltip>
        <TooltipTrigger render={
          <Button variant="ghost" size="icon" className="relative" onClick={() => window.location.href = "/orcamentos"}>
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
            )}
          </Button>
        } />
        <TooltipContent>
          {alertCount > 0 ? `${alertCount} alerta${alertCount > 1 ? "s" : ""} de orçamento` : "Notificações"}
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger render={
            <DropdownMenuTrigger className="rounded-full w-9 h-9 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="w-9 h-9">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs cursor-pointer">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
          } />
          <TooltipContent>Perfil e configurações</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.location.href = "/config"}>
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => signOut({ callbackUrl: "/auth" })}
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

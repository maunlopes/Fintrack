"use client";

import { useState } from "react";
import { Menu, Bell } from "lucide-react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MobileSidebar } from "./sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface HeaderProps {
  session: Session | null;
}

export function Header({ session }: HeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <>
      <header
        className="h-14 flex items-center px-6 gap-4 sticky top-0 z-30"
        style={{ background: "var(--bg-base)" }}
      >
        {/* Mobile menu button */}
        <button
          className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--bg-raised)", color: "var(--text-secondary)" }}
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Greeting */}
        <div className="hidden sm:flex flex-col">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {greeting}{firstName ? `, ${firstName}` : ""}
          </span>
        </div>

        <div className="flex-1" />

        <ThemeToggle />

        <Tooltip>
          <TooltipTrigger render={
            <button
              className="relative h-9 w-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: "var(--bg-raised)", color: "var(--text-secondary)" }}
            >
              <Bell className="w-4 h-4" />
            </button>
          } />
          <TooltipContent>Notificações</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger render={
              <DropdownMenuTrigger className="rounded-full w-9 h-9 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user?.image ?? undefined} />
                  <AvatarFallback
                    className="text-xs font-semibold text-white cursor-pointer"
                    style={{ background: "var(--brand-900)" }}
                  >
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

      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}

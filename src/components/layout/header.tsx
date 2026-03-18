"use client";

import { useState } from "react";
import { Menu, Bell } from "lucide-react";
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

  return (
    <>
      <header className="h-14 border-b bg-card flex items-center px-4 gap-4 sticky top-0 z-30">
        <Tooltip>
          <TooltipTrigger render={
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          } />
          <TooltipContent>Abrir menu</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <ThemeToggle />

        <Tooltip>
          <TooltipTrigger render={
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
          } />
          <TooltipContent>Notificações</TooltipContent>
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

      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}

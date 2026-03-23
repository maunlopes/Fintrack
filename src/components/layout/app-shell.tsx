"use client";

import { useState } from "react";
import { Session } from "next-auth";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
  session: Session | null;
}

export function AppShell({ children, session }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "relative hidden lg:flex flex-shrink-0 transition-[width] duration-300 ease-in-out z-40",
          collapsed ? "w-14" : "w-[240px]"
        )}
      >
        <Sidebar collapsed={collapsed} />

        {/* Toggle button — centered on the right border of the header line */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute right-0 top-7 -translate-y-1/2 translate-x-1/2 z-20 h-5 w-5 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-125 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft className="w-3 h-3" />
          }
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header session={session} />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MonthSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current date from URL or default to today
  const currentMonthParam = searchParams.get("month");
  const currentYearParam = searchParams.get("year");
  
  const today = new Date();
  
  let currentDate = today;
  if (currentMonthParam && currentYearParam) {
    const month = parseInt(currentMonthParam) - 1; // 0-indexed in JS
    const year = parseInt(currentYearParam);
    if (!isNaN(month) && !isNaN(year)) {
      currentDate = new Date(year, month, 1);
    }
  }

  const handlePreviousMonth = () => {
    const newDate = subMonths(currentDate, 1);
    updateParams(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    updateParams(newDate);
  };

  const handleCurrentMonth = () => {
    updateParams(today);
  };

  const updateParams = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", (date.getMonth() + 1).toString());
    params.set("year", date.getFullYear().toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Capitalize first letter of month
  const formattedDate = format(currentDate, "MMMM yyyy", { locale: ptBR });
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const isCurrentMonth = 
    currentDate.getMonth() === today.getMonth() && 
    currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="icon" 
        className="w-8 h-8" 
        onClick={handlePreviousMonth}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex items-center gap-2 min-w-[140px] justify-center">
        <span className="text-sm font-semibold whitespace-nowrap">
          {displayDate}
        </span>
      </div>

      <Button 
        variant="outline" 
        size="icon" 
        className="w-8 h-8" 
        onClick={handleNextMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
      
      {!isCurrentMonth && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-8 ml-2 text-muted-foreground"
          onClick={handleCurrentMonth}
        >
          Mês atual
        </Button>
      )}
    </div>
  );
}

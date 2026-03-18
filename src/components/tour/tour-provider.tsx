"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isTourDone, startTour } from "@/lib/tour";
import "driver.js/dist/driver.css";

export function TourProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    if (isTourDone()) return;

    const timer = setTimeout(() => {
      startTour();
    }, 900);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

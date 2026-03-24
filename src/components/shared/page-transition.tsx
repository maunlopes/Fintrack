"use client";

import { motion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 pb-24 md:p-6 lg:p-8 lg:pb-8 2xl:max-w-[1440px] 2xl:mx-auto"
    >
      {children}
    </motion.div>
  );
}

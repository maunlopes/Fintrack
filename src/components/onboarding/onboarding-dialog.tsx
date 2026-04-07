"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  ChevronRight,
  ChevronLeft,
  ImageIcon,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isOnboardingDone, markOnboardingDone } from "@/lib/onboarding";

interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  imageUrl: string | null;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const GRADIENT_COLORS = [
  "from-primary/20 to-primary/5",
  "from-blue-500/20 to-blue-500/5",
  "from-green-500/20 to-green-500/5",
  "from-violet-500/20 to-violet-500/5",
  "from-orange-500/20 to-orange-500/5",
];

export function OnboardingDialog() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    if (isOnboardingDone()) return;

    fetch("/api/onboarding/steps")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSteps(data);
          setTimeout(() => setOpen(true), 600);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  const finish = useCallback(() => {
    markOnboardingDone();
    setOpen(false);
    setStep(0);
  }, []);

  const next = useCallback(() => {
    if (step === steps.length - 1) {
      finish();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  }, [step, steps.length, finish]);

  const prev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  if (loading || steps.length === 0) return null;

  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) finish();
      }}
    >
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden [&>button]:hidden">
        <div className="flex flex-col">
          {/* Illustration area */}
          <div className="relative flex items-center justify-center pt-6 pb-6 bg-muted/40 min-h-[180px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex flex-col items-center gap-3"
              >
                {current.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.imageUrl}
                    alt={current.title}
                    className="max-h-[140px] w-auto rounded-xl object-contain"
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${GRADIENT_COLORS[step % GRADIENT_COLORS.length]} flex items-center justify-center`}
                  >
                    <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > step ? 1 : -1);
                    setStep(i);
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-6 h-2 bg-primary"
                      : "w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="px-6 pt-5 pb-2 min-h-[140px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <h2 className="text-lg font-bold tracking-tight mb-2">
                  {current.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {current.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 pb-6 pt-2">
            {isFirst ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={skip}
                className="text-muted-foreground"
              >
                Pular
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={prev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}

            <Button size="sm" onClick={next}>
              {isLast ? (
                <>
                  Começar
                  <Rocket className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

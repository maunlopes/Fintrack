import { driver, type DriveStep } from "driver.js";

const TOUR_KEY = "pqgastei_tour_v1";

export function isTourDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TOUR_KEY) === "done";
}

export function markTourDone(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOUR_KEY, "done");
  }
}

export function resetTour(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOUR_KEY);
  }
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
const STEPS: DriveStep[] = [
  {
    popover: {
      title: "Bem-vindo ao PQGASTEI?! 🎉",
      description:
        "Vamos te mostrar o essencial em 6 passos rápidos. Você pode pular a qualquer momento clicando em <strong>Pular tour</strong>.",
      align: "center",
    },
  },
  {
    element: '[data-tour="sidebar-nav"]',
    popover: {
      title: "Menu de navegação",
      description:
        "Acesse qualquer área do sistema por aqui — Dashboard, Despesas, Receitas, Cartões, Investimentos e mais.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="dashboard-kpis"]',
    popover: {
      title: "Seu painel financeiro",
      description:
        "Estes cards mostram seu patrimônio total, saldo nas contas, total investido e o resultado do mês. Tudo atualizado automaticamente.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="month-selector"]',
    popover: {
      title: "Navegue pelo tempo",
      description:
        "Use as setas para ver qualquer mês. Todos os dados e gráficos se atualizam na hora.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="nav-contas"]',
    popover: {
      title: "Primeiro passo: suas contas",
      description:
        "Comece cadastrando suas contas bancárias aqui. O saldo é atualizado automaticamente conforme você lança despesas e receitas.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-despesas"]',
    popover: {
      title: "Lance despesas e receitas",
      description:
        "Registre aqui tudo que você paga e recebe. O sistema calcula o saldo e atualiza o Dashboard em tempo real. Tudo pronto — explore à vontade!",
      side: "right",
      align: "center",
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
}

/** Remove `element` from any step whose target isn't visible (e.g. hidden sidebar on mobile) */
function resolveSteps(): DriveStep[] {
  return STEPS.map((step) => {
    if (!step.element) return step;
    const el = document.querySelector(step.element as string);
    if (!el || !isElementVisible(el)) {
      const { element: _el, ...rest } = step;
      return rest;
    }
    return step;
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function startTour(): void {
  const steps = resolveSteps();
  let driverObj: ReturnType<typeof driver>;

  driverObj = driver({
    showProgress: true,
    progressText: "{{current}} de {{total}}",
    nextBtnText: "Próximo →",
    prevBtnText: "← Anterior",
    doneBtnText: "Começar! 🚀",
    allowClose: true,
    overlayOpacity: 0.55,
    stagePadding: 10,
    stageRadius: 12,
    popoverClass: "pqgastei-tour",
    onDestroyStarted: () => {
      markTourDone();
      driverObj.destroy();
    },
    steps,
  });

  driverObj.drive();
}

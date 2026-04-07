const ONBOARDING_KEY = "pqgastei_onboarding_v2";

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "done";
}

export function markOnboardingDone(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ONBOARDING_KEY, "done");
  }
}

export function resetOnboarding(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ONBOARDING_KEY);
  }
}

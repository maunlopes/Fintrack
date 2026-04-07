import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { SetupGate } from "@/components/setup/setup-gate";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { setupCompleted: true, name: true, image: true },
  });

  return (
    <Providers>
      <SetupGate
        setupCompleted={user?.setupCompleted ?? false}
        userName={user?.name ?? undefined}
        userImage={user?.image ?? undefined}
      >
        <OnboardingDialog />
        <AppShell session={session}>
          {children}
        </AppShell>
      </SetupGate>
    </Providers>
  );
}

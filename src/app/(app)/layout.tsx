import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { TourProvider } from "@/components/tour/tour-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth");

  return (
    <Providers>
      <TourProvider />
      <AppShell session={session}>
        {children}
      </AppShell>
    </Providers>
  );
}

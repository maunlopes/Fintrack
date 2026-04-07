"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SetupWizard } from "./setup-wizard";

interface SetupGateProps {
  children: React.ReactNode;
  setupCompleted: boolean;
  userName?: string;
  userImage?: string;
}

export function SetupGate({ children, setupCompleted: initialCompleted, userName, userImage }: SetupGateProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);

  if (!completed) {
    return (
      <SetupWizard
        userName={userName ?? undefined}
        userImage={userImage ?? undefined}
        onComplete={() => {
          setCompleted(true);
          router.refresh();
        }}
      />
    );
  }

  return <>{children}</>;
}

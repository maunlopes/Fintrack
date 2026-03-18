"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

// Lazy-load to avoid SSR errors (react-pluggy-connect uses window)
const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((m) => m.PluggyConnect),
  { ssr: false }
);
import { Link2 } from "lucide-react";
import { toast } from "sonner";

interface PluggyConnectButtonProps {
  onSuccess?: () => void;
  itemId?: string; // pass to re-authenticate existing connection
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function PluggyConnectButton({
  onSuccess,
  itemId,
  label = "Conectar banco",
  variant = "default",
  size = "default",
}: PluggyConnectButtonProps) {
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function openWidget() {
    setLoading(true);
    try {
      const res = await fetch("/api/open-finance/connect-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar token");
      setConnectToken(data.accessToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuccess(data: { item: { id: string } }) {
    setConnectToken(null);
    try {
      const res = await fetch("/api/open-finance/items/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: data.item.id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Banco conectado com sucesso!");
      onSuccess?.();
    } catch {
      toast.error("Erro ao salvar conexão");
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={openWidget}
        disabled={loading}
      >
        <Link2 className="w-4 h-4 mr-2" />
        {label}
      </Button>

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={process.env.NODE_ENV !== "production"}
          onSuccess={handleSuccess}
          onError={(err) => {
            toast.error(err.message ?? "Erro na conexão");
            setConnectToken(null);
          }}
          onClose={() => setConnectToken(null)}
        />
      )}
    </>
  );
}

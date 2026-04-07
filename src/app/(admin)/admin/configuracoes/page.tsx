"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

interface AppSettings {
  onboarding_enabled: boolean;
}

export default function ConfiguracoesAdminPage() {
  const [settings, setSettings] = useState<AppSettings>({
    onboarding_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSettings(data);
    } catch {
      toast.error("Erro ao carregar configuracoes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuracoes salvas com sucesso");
    } catch {
      toast.error("Erro ao salvar configuracoes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="size-6" />
          Configuracoes do Sistema
        </h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="size-6" />
        Configuracoes do Sistema
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="onboarding-switch">Onboarding habilitado</Label>
              <p className="text-sm text-muted-foreground">
                Exibir fluxo de onboarding para novos usuarios ao fazer login
                pela primeira vez.
              </p>
            </div>
            <Switch
              id="onboarding-switch"
              checked={settings.onboarding_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  onboarding_enabled: checked,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Salvando..." : "Salvar configuracoes"}
        </Button>
      </div>
    </div>
  );
}

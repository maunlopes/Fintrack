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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, Palette, ImageIcon } from "lucide-react";
import Image from "next/image";

interface Branding {
  logoLight: string | null;
  logoDark: string | null;
  tagline: string;
  loginBackground: string | null;
}

export default function PersonalizacaoAdminPage() {
  const [branding, setBranding] = useState<Branding>({
    logoLight: null,
    logoDark: null,
    tagline: "Gestao financeira pessoal",
    loginBackground: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchBranding = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/branding");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBranding(data);
    } catch {
      toast.error("Erro ao carregar configuracoes de marca");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  async function handleUpload(field: keyof Branding, file: File) {
    setUploading(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "branding");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setBranding((prev) => ({ ...prev, [field]: data.url }));
      toast.success("Imagem enviada com sucesso");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuracoes salvas com sucesso");
    } catch {
      toast.error("Erro ao salvar configuracoes");
    } finally {
      setSaving(false);
    }
  }

  function ImageUploadField({
    label,
    field,
    currentUrl,
  }: {
    label: string;
    field: keyof Branding;
    currentUrl: string | null;
  }) {
    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        {currentUrl ? (
          <div className="relative w-48 h-24 rounded-md border bg-muted/50 overflow-hidden">
            <Image
              src={currentUrl}
              alt={label}
              fill
              className="object-contain p-2"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-48 h-24 rounded-md border border-dashed bg-muted/30">
            <ImageIcon className="size-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <Label
            htmlFor={`upload-${field}`}
            className="cursor-pointer inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Upload className="size-4" />
            {uploading === field ? "Enviando..." : "Enviar imagem"}
          </Label>
          <input
            id={`upload-${field}`}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading === field}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(field, file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="size-6" />
          Personalizacao
        </h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Palette className="size-6" />
        Personalizacao
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Logotipos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <ImageUploadField
              label="Logo (Tema Claro)"
              field="logoLight"
              currentUrl={branding.logoLight}
            />
            <ImageUploadField
              label="Logo (Tema Escuro)"
              field="logoDark"
              currentUrl={branding.logoDark}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Textos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={branding.tagline}
              onChange={(e) =>
                setBranding((prev) => ({ ...prev, tagline: e.target.value }))
              }
              placeholder="Gestao financeira pessoal"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tela de Login</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploadField
            label="Imagem de fundo (opcional)"
            field="loginBackground"
            currentUrl={branding.loginBackground}
          />
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </div>
    </div>
  );
}

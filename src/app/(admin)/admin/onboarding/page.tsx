"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  ImageIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
}

export default function OnboardingPage() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStep, setEditStep] = useState<OnboardingStep | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSteps = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/onboarding");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSteps(data);
    } catch {
      toast.error("Erro ao carregar steps de onboarding.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  function openNew() {
    setEditStep(null);
    setTitle("");
    setDescription("");
    setImageUrl(null);
    setDialogOpen(true);
  }

  function openEdit(step: OnboardingStep) {
    setEditStep(step);
    setTitle(step.title);
    setDescription(step.description);
    setImageUrl(step.imageUrl);
    setDialogOpen(true);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "onboarding");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setImageUrl(data.url);
      toast.success("Imagem enviada com sucesso.");
    } catch {
      toast.error("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || !description.trim()) {
      toast.error("Preencha o titulo e a descricao.");
      return;
    }

    setSaving(true);
    try {
      if (editStep) {
        const res = await fetch(`/api/admin/onboarding/${editStep.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, imageUrl }),
        });
        if (!res.ok) throw new Error();
        toast.success("Step atualizado com sucesso.");
      } else {
        const res = await fetch("/api/admin/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, imageUrl }),
        });
        if (!res.ok) throw new Error();
        toast.success("Step criado com sucesso.");
      }
      setDialogOpen(false);
      fetchSteps();
    } catch {
      toast.error("Erro ao salvar step.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/onboarding/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Step removido com sucesso.");
      setDeleteId(null);
      fetchSteps();
    } catch {
      toast.error("Erro ao remover step.");
    }
  }

  async function handleReorder(index: number, direction: "up" | "down") {
    const newSteps = [...steps];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSteps.length) return;

    [newSteps[index], newSteps[swapIndex]] = [
      newSteps[swapIndex],
      newSteps[index],
    ];

    const reorderPayload = newSteps.map((s, i) => ({ id: s.id, order: i }));

    setSteps(newSteps);
    try {
      const res = await fetch("/api/admin/onboarding/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reorderPayload),
      });
      if (!res.ok) throw new Error();
      toast.success("Ordem atualizada.");
    } catch {
      toast.error("Erro ao reordenar.");
      fetchSteps();
    }
  }

  async function handleToggleActive(step: OnboardingStep) {
    try {
      const res = await fetch(`/api/admin/onboarding/${step.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !step.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        step.isActive ? "Step desativado." : "Step ativado."
      );
      fetchSteps();
    } catch {
      toast.error("Erro ao alterar status.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciar Onboarding</h1>
        <Button onClick={openNew}>
          <Plus />
          Novo Step
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : steps.length === 0 ? (
        <p className="text-muted-foreground">
          Nenhum step de onboarding cadastrado.
        </p>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <Card key={step.id} className="py-4">
              <CardContent className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {step.imageUrl ? (
                    <Image
                      src={step.imageUrl}
                      alt={step.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{step.title}</span>
                    <Badge
                      variant={step.isActive ? "default" : "secondary"}
                    >
                      {step.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      #{step.order}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {step.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={step.isActive}
                    onCheckedChange={() => handleToggleActive(step)}
                    size="sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleReorder(index, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleReorder(index, "down")}
                    disabled={index === steps.length - 1}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(step)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => setDeleteId(step.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editStep ? "Editar Step" : "Novo Step"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Titulo
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Bem-vindo ao PQGASTEI?"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Descricao
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o passo do onboarding..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Imagem
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload />
                  {uploading ? "Enviando..." : "Enviar imagem"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover step?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. O step sera removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

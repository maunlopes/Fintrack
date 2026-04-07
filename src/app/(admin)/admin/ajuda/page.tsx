"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  ImageIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
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

const SECTION_IDS = [
  "acesso",
  "dashboard",
  "extrato",
  "despesas",
  "receitas",
  "transferencias",
  "contas",
  "cartoes",
  "orcamentos",
  "investimentos",
  "categorias",
  "resumo-anual",
  "finbot",
  "configuracoes",
] as const;

const SECTION_LABELS: Record<string, string> = {
  acesso: "Acesso",
  dashboard: "Dashboard",
  extrato: "Extrato",
  despesas: "Despesas",
  receitas: "Receitas",
  transferencias: "Transferencias",
  contas: "Contas",
  cartoes: "Cartoes",
  orcamentos: "Orcamentos",
  investimentos: "Investimentos",
  categorias: "Categorias",
  "resumo-anual": "Resumo Anual",
  finbot: "FinBot",
  configuracoes: "Configuracoes",
};

interface HelpScreenshot {
  id: string;
  sectionId: string;
  label: string;
  description: string;
  imageUrl: string | null;
  order: number;
}

export default function AjudaPage() {
  const [screenshots, setScreenshots] = useState<HelpScreenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<HelpScreenshot | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [sectionId, setSectionId] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchScreenshots = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ajuda");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setScreenshots(data);
    } catch {
      toast.error("Erro ao carregar screenshots de ajuda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScreenshots();
  }, [fetchScreenshots]);

  // Group screenshots by sectionId
  const grouped = SECTION_IDS.reduce(
    (acc, sid) => {
      const items = screenshots.filter((s) => s.sectionId === sid);
      if (items.length > 0) acc[sid] = items;
      return acc;
    },
    {} as Record<string, HelpScreenshot[]>
  );

  // Sections that have screenshots + all known sections for new entries
  const sectionsWithData = SECTION_IDS.filter((sid) => grouped[sid]);

  function openNew(prefillSection: string) {
    setEditItem(null);
    setSectionId(prefillSection);
    setLabel("");
    setDescription("");
    setImageUrl(null);
    setDialogOpen(true);
  }

  function openEdit(item: HelpScreenshot) {
    setEditItem(item);
    setSectionId(item.sectionId);
    setLabel(item.label);
    setDescription(item.description);
    setImageUrl(item.imageUrl);
    setDialogOpen(true);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ajuda");
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
    if (!sectionId.trim() || !label.trim() || !description.trim()) {
      toast.error("Preencha todos os campos obrigatorios.");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        const res = await fetch(`/api/admin/ajuda/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, description, imageUrl }),
        });
        if (!res.ok) throw new Error();
        toast.success("Screenshot atualizado com sucesso.");
      } else {
        const res = await fetch("/api/admin/ajuda", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId, label, description, imageUrl }),
        });
        if (!res.ok) throw new Error();
        toast.success("Screenshot criado com sucesso.");
      }
      setDialogOpen(false);
      fetchScreenshots();
    } catch {
      toast.error("Erro ao salvar screenshot.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/ajuda/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Screenshot removido com sucesso.");
      setDeleteId(null);
      fetchScreenshots();
    } catch {
      toast.error("Erro ao remover screenshot.");
    }
  }

  async function handleUploadForItem(itemId: string, file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ajuda");
      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error();
      const { url } = await uploadRes.json();

      const updateRes = await fetch(`/api/admin/ajuda/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!updateRes.ok) throw new Error();

      toast.success("Imagem atualizada com sucesso.");
      fetchScreenshots();
    } catch {
      toast.error("Erro ao enviar imagem.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciar Screenshots de Ajuda</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Accordion>
          {SECTION_IDS.map((sid) => {
            const items = grouped[sid] || [];
            return (
              <AccordionItem key={sid} value={sid}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    {SECTION_LABELS[sid] || sid}
                    <span className="text-xs text-muted-foreground">
                      ({items.length})
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum screenshot nesta secao.
                      </p>
                    ) : (
                      items.map((item) => (
                        <Card key={item.id} className="py-4">
                          <CardContent className="flex items-center gap-4">
                            {/* Thumbnail */}
                            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.label}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <ImageIcon className="size-6 text-muted-foreground" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {item.label}
                              </p>
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {item.description}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept = "image/*";
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement)
                                      .files?.[0];
                                    if (file) handleUploadForItem(item.id, file);
                                  };
                                  input.click();
                                }}
                              >
                                <Upload />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEdit(item)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon-sm"
                                onClick={() => setDeleteId(item.id)}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openNew(sid)}
                    >
                      <Plus />
                      Novo Screenshot
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Editar Screenshot" : "Novo Screenshot"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Secao</label>
              <Input
                value={SECTION_LABELS[sectionId] || sectionId}
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Label</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Tela inicial do dashboard"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Descricao
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o screenshot..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Imagem</label>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
            <AlertDialogTitle>Remover screenshot?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. O screenshot sera removido
              permanentemente.
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

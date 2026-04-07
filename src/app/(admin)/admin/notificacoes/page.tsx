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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Trash2,
  Bell,
  Info,
  AlertTriangle,
  Wrench,
  Sparkles,
} from "lucide-react";

type NotificationType = "INFO" | "WARNING" | "MAINTENANCE" | "NEW_FEATURE";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; color: string; borderColor: string; icon: React.ReactNode }
> = {
  INFO: {
    label: "Info",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    borderColor: "border-l-blue-500",
    icon: <Info className="size-4" />,
  },
  WARNING: {
    label: "Aviso",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    borderColor: "border-l-yellow-500",
    icon: <AlertTriangle className="size-4" />,
  },
  MAINTENANCE: {
    label: "Manutencao",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    borderColor: "border-l-red-500",
    icon: <Wrench className="size-4" />,
  },
  NEW_FEATURE: {
    label: "Novidade",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    borderColor: "border-l-green-500",
    icon: <Sparkles className="size-4" />,
  },
};

const emptyForm = {
  title: "",
  message: "",
  type: "INFO" as NotificationType,
  startsAt: "",
  endsAt: "",
};

export default function NotificacoesAdminPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewNotification, setPreviewNotification] = useState<typeof emptyForm | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotifications(data);
    } catch {
      toast.error("Erro ao carregar notificacoes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(n: Notification) {
    setEditingId(n.id);
    setForm({
      title: n.title,
      message: n.message,
      type: n.type,
      startsAt: n.startsAt ? n.startsAt.slice(0, 10) : "",
      endsAt: n.endsAt ? n.endsAt.slice(0, 10) : "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title || !form.message || !form.startsAt) {
      toast.error("Preencha os campos obrigatorios");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: form.title,
        message: form.message,
        type: form.type,
        startsAt: form.startsAt,
        endsAt: form.endsAt || null,
      };

      const url = editingId
        ? `/api/admin/notifications/${editingId}`
        : "/api/admin/notifications";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      toast.success(editingId ? "Notificacao atualizada" : "Notificacao criada");
      setDialogOpen(false);
      fetchNotifications();
    } catch {
      toast.error("Erro ao salvar notificacao");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/notifications/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Notificacao excluida");
      setDeleteId(null);
      fetchNotifications();
    } catch {
      toast.error("Erro ao excluir notificacao");
    }
  }

  async function toggleActive(n: Notification) {
    try {
      const res = await fetch(`/api/admin/notifications/${n.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !n.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(n.isActive ? "Notificacao desativada" : "Notificacao ativada");
      fetchNotifications();
    } catch {
      toast.error("Erro ao alterar status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="size-6" />
          Notificacoes
        </h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nova Notificacao
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma notificacao cadastrada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type];
            return (
              <Card key={n.id}>
                <CardContent className="flex items-start justify-between gap-4 py-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{n.title}</span>
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                      <Badge variant={n.isActive ? "default" : "secondary"}>
                        {n.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Inicio: {n.startsAt?.slice(0, 10) ?? "—"}
                      {n.endsAt && ` | Fim: ${n.endsAt.slice(0, 10)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={n.isActive}
                      onCheckedChange={() => toggleActive(n)}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setPreviewNotification({
                          title: n.title,
                          message: n.message,
                          type: n.type,
                          startsAt: n.startsAt?.slice(0, 10) ?? "",
                          endsAt: n.endsAt?.slice(0, 10) ?? "",
                        });
                      }}
                    >
                      <Info className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(n)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => setDeleteId(n.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview */}
      {previewNotification && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview do Banner</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-l-4 ${TYPE_CONFIG[previewNotification.type].borderColor} rounded-md bg-muted/50 p-4 flex items-start gap-3`}
            >
              {TYPE_CONFIG[previewNotification.type].icon}
              <div>
                <p className="font-semibold text-sm">{previewNotification.title}</p>
                <p className="text-sm text-muted-foreground">
                  {previewNotification.message}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setPreviewNotification(null)}
            >
              Fechar preview
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Notificacao" : "Nova Notificacao"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notif-title">Titulo *</Label>
              <Input
                id="notif-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Titulo da notificacao"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-message">Mensagem *</Label>
              <Textarea
                id="notif-message"
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder="Mensagem da notificacao"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: (v ?? f.type) as NotificationType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Aviso</SelectItem>
                  <SelectItem value="MAINTENANCE">Manutencao</SelectItem>
                  <SelectItem value="NEW_FEATURE">Novidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notif-starts">Inicio *</Label>
                <Input
                  id="notif-starts"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startsAt: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-ends">Fim (opcional)</Label>
                <Input
                  id="notif-ends"
                  type="date"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endsAt: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Inline preview */}
            <div>
              <Label className="mb-2">Preview</Label>
              <div
                className={`border-l-4 ${TYPE_CONFIG[form.type].borderColor} rounded-md bg-muted/50 p-3 flex items-start gap-3`}
              >
                {TYPE_CONFIG[form.type].icon}
                <div>
                  <p className="font-semibold text-sm">
                    {form.title || "Titulo"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {form.message || "Mensagem"}
                  </p>
                </div>
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

      {/* AlertDialog Excluir */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir notificacao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta notificacao? Esta acao nao pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

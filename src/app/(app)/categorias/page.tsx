"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Tag, Pencil, Trash2, Lock, Search, AlertTriangle } from "lucide-react";
import { CATEGORY_ICONS, getCategoryIcon, getDefaultIconForCategory } from "@/lib/category-icons";
import { CategoryType } from "@prisma/client";
import { z } from "zod";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { listVariants, listItemVariants } from "@/components/shared/animated-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.nativeEnum(CategoryType),
  icon: z.string().default("circle"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#075056"),
});
type CategoryInput = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
}

interface LinkedInfo {
  total: number;
  expenses: number;
  incomes: number;
  cardTransactions: number;
}

function CategoryForm({
  onSuccess,
  defaultValues,
}: {
  onSuccess: () => void;
  defaultValues?: Partial<CategoryInput & { id: string }>;
}) {
  const form = useForm<CategoryInput, any, CategoryInput>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "EXPENSE",
      icon: defaultValues?.icon ?? "circle",
      color: defaultValues?.color ?? "#075056",
    },
  });

  async function onSubmit(data: CategoryInput) {
    const url = defaultValues?.id ? `/api/categorias/${defaultValues.id}` : "/api/categorias";
    const method = defaultValues?.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Erro ao salvar categoria"); return; }
    toast.success(defaultValues?.id ? "Categoria atualizada!" : "Categoria criada!");
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl><Input placeholder="Nome da categoria" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue>{field.value === "EXPENSE" ? "Despesa" : field.value === "INCOME" ? "Receita" : "Selecione..."}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="icon" render={({ field }) => (
          <FormItem>
            <FormLabel>Ícone</FormLabel>
            <FormControl>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto rounded-lg border border-input p-2">
                {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.onChange(key)}
                    className={`w-9 h-9 rounded-lg transition-all ${
                      field.value === key
                        ? "bg-primary text-primary-foreground shadow-sm scale-110 hover:bg-primary hover:text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="color" render={({ field }) => (
          <FormItem>
            <FormLabel>Cor</FormLabel>
            <FormControl>
              <div className="flex gap-2 items-center">
                <Input type="color" className="w-12 h-10 p-1 cursor-pointer" {...field} />
                <Input {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);

  // Delete state machine: null → "confirm" → "force" (if linked items)
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<"confirm" | "force" | null>(null);
  const [linkedInfo, setLinkedInfo] = useState<LinkedInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categorias");
      if (res.ok) setCategories(await res.json());
      else setCategories([]);
    } catch {
      setCategories([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  function openDelete(id: string) {
    setDeleteId(id);
    setLinkedInfo(null);
    setDeleteStep("confirm");
  }

  function closeDelete() {
    setDeleteId(null);
    setDeleteStep(null);
    setLinkedInfo(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/categorias/${deleteId}`, { method: "DELETE" });
    setDeleting(false);

    if (res.ok) {
      toast.success("Categoria removida");
      fetchCategories();
      closeDelete();
      return;
    }

    if (res.status === 409) {
      const data = await res.json();
      setLinkedInfo(data);
      setDeleteStep("force");
      return;
    }

    toast.error("Erro ao remover categoria");
    closeDelete();
  }

  async function handleForceDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/categorias/${deleteId}?force=true`, { method: "DELETE" });
    setDeleting(false);

    if (res.ok) {
      toast.success("Categoria removida. Registros movidos para 'Sem Categoria'.");
      fetchCategories();
    } else {
      toast.error("Erro ao remover categoria");
    }
    closeDelete();
  }

  const filtered = categories.filter(
    (c) => c.type === tab && (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageTransition>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={() => { setEditCat(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Categoria
            </Button>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "EXPENSE" | "INCOME")}>
            <TabsList>
              <TabsTrigger value="EXPENSE">Despesas</TabsTrigger>
              <TabsTrigger value="INCOME">Receitas</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Nenhuma categoria"
            description="Crie categorias para organizar suas finanças."
            actionLabel="Nova Categoria"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
            {filtered.map((cat) => (
              <motion.div key={cat.id} variants={listItemVariants}>
                <Card>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComp = getCategoryIcon(cat.icon || getDefaultIconForCategory(cat.name));
                        return (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: cat.color + "20" }}
                          >
                            <IconComp className="w-4 h-4" style={{ color: cat.color }} />
                          </div>
                        );
                      })()}
                      <div>
                        <p className="text-sm font-medium">{cat.name}</p>
                        {cat.isDefault && (
                          <Tooltip>
                            <TooltipTrigger>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 w-fit cursor-default">
                                <Lock className="w-2 h-2" /> Padrão do sistema
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              Categoria padrão do sistema. Pode ser editada ou removida.
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7"
                            onClick={() => { setEditCat(cat); setDialogOpen(true); }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar categoria</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openDelete(cat.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remover categoria</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Edit / Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <DialogHeader>
                <DialogTitle>{editCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <CategoryForm
                  defaultValues={editCat ?? undefined}
                  onSuccess={() => { setDialogOpen(false); fetchCategories(); }}
                />
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation — step 1: simple confirm */}
        <AlertDialog open={deleteStep === "confirm"} onOpenChange={(o) => !o && closeDelete()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-white"
              >
                {deleting ? "Verificando..." : "Remover"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete confirmation — step 2: items linked warning */}
        <AlertDialog open={deleteStep === "force"} onOpenChange={(o) => !o && closeDelete()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Categoria em uso
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span className="block">
                  Esta categoria está vinculada a{" "}
                  <span className="font-semibold text-foreground">{linkedInfo?.total} registro{linkedInfo?.total !== 1 ? "s" : ""}</span>:
                </span>
                <ul className="space-y-1 pl-4 list-disc text-foreground">
                  {(linkedInfo?.expenses ?? 0) > 0 && (
                    <li>{linkedInfo!.expenses} despesa{linkedInfo!.expenses !== 1 ? "s" : ""}</li>
                  )}
                  {(linkedInfo?.incomes ?? 0) > 0 && (
                    <li>{linkedInfo!.incomes} receita{linkedInfo!.incomes !== 1 ? "s" : ""}</li>
                  )}
                  {(linkedInfo?.cardTransactions ?? 0) > 0 && (
                    <li>{linkedInfo!.cardTransactions} transação{linkedInfo!.cardTransactions !== 1 ? "ões" : ""} de cartão</li>
                  )}
                </ul>
                <span className="block">
                  Se continuar, esses registros serão movidos para{" "}
                  <span className="font-semibold text-foreground">"Sem Categoria"</span> automaticamente.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleForceDelete}
                disabled={deleting}
                className="bg-destructive text-white"
              >
                {deleting ? "Removendo..." : "Confirmar remoção"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
  );
}

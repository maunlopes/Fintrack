"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogOut, User, Settings, PlayCircle, KeyRound, Eye, EyeOff, Loader2, DatabaseZap, TriangleAlert, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { resetTour } from "@/lib/tour";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { profileSchema, passwordSchema, type ProfileInput, type PasswordInput } from "@/lib/validations/user";
import { cn } from "@/lib/utils";

type Section = "perfil" | "seguranca" | "preferencias" | "dados" | "ajuda";

export default function ConfigPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("perfil");
  const [hasPassword, setHasPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "", image: "" },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    fetch("/api/usuario")
      .then((r) => r.json())
      .then((data) => {
        profileForm.reset({ name: data.name ?? "", email: data.email ?? "", image: data.image ?? "" });
        setAvatarPreview(data.image ?? "");
        setHasPassword(data.hasPassword);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  async function onSaveProfile(data: ProfileInput) {
    const res = await fetch("/api/usuario", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(typeof err.error === "string" ? err.error : "Erro ao salvar perfil");
      return;
    }
    const updated = await res.json();
    await update({ name: updated.name, email: updated.email, image: updated.image });
    setAvatarPreview(updated.image ?? "");
    toast.success("Perfil atualizado com sucesso");
  }

  async function onChangePassword(data: PasswordInput) {
    const res = await fetch("/api/usuario/senha", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(typeof err.error === "string" ? err.error : "Erro ao alterar senha");
      return;
    }
    toast.success("Senha alterada com sucesso");
    passwordForm.reset();
  }

  async function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediate preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    setIsUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
    setIsUploadingAvatar(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao fazer upload da foto");
      setAvatarPreview(profileForm.getValues("image") ?? "");
      return;
    }

    const { url } = await res.json();
    profileForm.setValue("image", url, { shouldDirty: true });
    setAvatarPreview(url);
    URL.revokeObjectURL(objectUrl);
  }

  async function onSeedDemo() {
    setIsSeeding(true);
    const res = await fetch("/api/seed-demo", { method: "POST" });
    setIsSeeding(false);
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao popular dados");
      return;
    }
    toast.success("Dados de demonstração criados! Explorando o sistema...");
    router.push("/dashboard");
  }

  async function onClearData() {
    setIsClearing(true);
    const res = await fetch("/api/usuario/limpar-dados", { method: "POST" });
    setIsClearing(false);
    if (!res.ok) {
      toast.error("Erro ao limpar dados. Tente novamente.");
      return;
    }
    toast.success("Dados apagados com sucesso. Bem-vindo de volta!");
    setClearDialogOpen(false);
    setClearConfirmText("");
    router.push("/dashboard");
  }

  const navItems: { id: Section; label: string; icon: React.ElementType; hidden?: boolean }[] = [
    { id: "perfil",        label: "Perfil",        icon: User },
    { id: "seguranca",     label: "Segurança",     icon: KeyRound, hidden: !hasPassword },
    { id: "preferencias",  label: "Preferências",  icon: Settings },
    { id: "dados",         label: "Dados",         icon: DatabaseZap },
    { id: "ajuda",         label: "Ajuda",         icon: PlayCircle },
  ];

  // ── Section components ──────────────────────────────────────────────────

  const ProfileSection = (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4" /> Informações Pessoais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div className="flex items-center gap-4">
              {/* Clickable avatar — opens file picker */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 shrink-0 rounded-full group"
                title="Trocar foto"
              >
                <Avatar className="w-16 h-16">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">{initials}</AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute inset-0 rounded-full flex items-center justify-center bg-black/50 transition-opacity",
                  isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {isUploadingAvatar
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />
                  }
                </span>
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onAvatarFileChange}
              />

              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Foto de perfil</p>
                <p className="text-xs text-muted-foreground">Clique na foto para trocar. JPG, PNG, WebP ou GIF — máx. 4 MB.</p>
                {/* Hidden form field keeps the URL in sync with react-hook-form */}
                <FormField
                  control={profileForm.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField control={profileForm.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={profileForm.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="seu@email.com" disabled={!hasPassword} {...field} />
                </FormControl>
                {!hasPassword && <p className="text-xs text-muted-foreground">E-mail gerenciado pelo provedor OAuth</p>}
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={profileForm.formState.isSubmitting} className="w-full">
              {profileForm.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar alterações
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const SecuritySection = (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Alterar Senha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            {[
              { name: "currentPassword" as const, label: "Senha atual", show: showCurrent, toggle: () => setShowCurrent(v => !v) },
              { name: "newPassword" as const, label: "Nova senha", show: showNew, toggle: () => setShowNew(v => !v) },
              { name: "confirmPassword" as const, label: "Confirmar nova senha", show: showConfirm, toggle: () => setShowConfirm(v => !v) },
            ].map(({ name, label, show, toggle }) => (
              <FormField key={name} control={passwordForm.control} name={name} render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={show ? "text" : "password"} placeholder="••••••••" className="pr-10" {...field} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={toggle}>
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
            <Button type="submit" variant="outline" disabled={passwordForm.formState.isSubmitting} className="w-full">
              {passwordForm.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Alterar senha
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const PreferencesSection = (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" /> Preferências
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Tema Visual</p>
            <p className="text-xs text-muted-foreground">Alternar entre modo claro e escuro</p>
          </div>
          <ThemeToggle />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Notificações</p>
            <p className="text-xs text-muted-foreground">Gerenciar alertas de sistema</p>
          </div>
          <Button disabled variant="outline" size="sm" className="h-8">Em breve</Button>
        </div>
      </CardContent>
    </Card>
  );

  const HelpSection = (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <PlayCircle className="w-4 h-4" /> Ajuda e Tour
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Tour de apresentação</p>
            <p className="text-xs text-muted-foreground">Reveja o guia de boas-vindas do sistema</p>
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={() => { resetTour(); router.push("/dashboard"); }}>
            <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
            Ver tour
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const DadosSection = (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <DatabaseZap className="w-4 h-4" /> Gerenciamento de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Seed demo data */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">Dados de demonstração</p>
            <p className="text-xs text-muted-foreground">Popula contas, cartões, despesas e investimentos fictícios</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
            onClick={onSeedDemo}
            disabled={isSeeding}
          >
            {isSeeding ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <DatabaseZap className="w-3.5 h-3.5 mr-1.5" />}
            {isSeeding ? "Populando..." : "Popular demo"}
          </Button>
        </div>

        <Separator />

        {/* Clear data */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">Limpar todos os dados</p>
            <p className="text-xs text-muted-foreground">Apaga despesas, receitas, contas, cartões e investimentos</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
            onClick={() => setClearDialogOpen(true)}
          >
            <TriangleAlert className="w-3.5 h-3.5 mr-1.5" />
            Limpar dados
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const sectionContent: Record<Section, React.ReactNode> = {
    perfil: ProfileSection,
    seguranca: SecuritySection,
    preferencias: PreferencesSection,
    dados: DadosSection,
    ajuda: HelpSection,
  };

  return (
    <PageTransition>
      <div className="p-4 lg:p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Configurações</h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
          <div className="flex flex-col lg:flex-row lg:gap-8">

            {/* ── Sidebar nav — desktop only ── */}
            <nav className="hidden lg:flex flex-col w-48 shrink-0 gap-0.5">
              {navItems.filter(i => !i.hidden).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full",
                    activeSection === id
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}

              <div className="mt-auto pt-4">
                <Separator className="mb-4" />
                <button
                  onClick={() => setLogoutDialogOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Sair da conta
                </button>
              </div>
            </nav>

            {/* ── Content ── */}
            <div className="flex-1 min-w-0">
              {/* Desktop: mostra só a seção ativa */}
              <div className="hidden lg:block">
                {sectionContent[activeSection]}
              </div>

              {/* Mobile: todas as seções empilhadas */}
              <div className="flex flex-col gap-4 lg:hidden">
                {ProfileSection}
                {hasPassword && SecuritySection}
                {PreferencesSection}
                {DadosSection}
                {HelpSection}
                <Card>
                  <CardContent className="pt-6">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        variant="outline"
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setLogoutDialogOpen(true)}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair da conta
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
      <AlertDialog open={clearDialogOpen} onOpenChange={(open) => { setClearDialogOpen(open); if (!open) setClearConfirmText(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="w-4 h-4" /> Limpar todos os dados
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>irreversível</strong>. Todas as despesas, receitas, contas bancárias,
              cartões de crédito, investimentos, categorias e orçamentos serão apagados permanentemente.
              Sua conta de acesso será mantida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <p className="text-sm font-medium mb-2">Digite <span className="font-mono font-bold">CONFIRMAR</span> para prosseguir</p>
            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="CONFIRMAR"
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={clearConfirmText !== "CONFIRMAR" || isClearing}
              onClick={onClearData}
            >
              {isClearing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Você precisará fazer login novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => signOut({ callbackUrl: "/auth" })}
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

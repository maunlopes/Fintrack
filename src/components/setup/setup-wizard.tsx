"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import {
  User, Camera, Landmark, CreditCard, Rocket, ChevronRight, ChevronLeft,
  Loader2, Eye, EyeOff, Wallet, PiggyBank, TrendingUp, CheckCircle2, SkipForward,
} from "lucide-react";
import { BankAccountType, CardBrand } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { ColorPicker } from "@/components/shared/color-picker";
import { bankAccountSchema, BankAccountInput } from "@/lib/validations/bank-account";
import { creditCardSchema, CreditCardInput } from "@/lib/validations/credit-card";
import { BANK_NAMES } from "@/lib/format";
import { getBankIcon } from "@/components/ui/brand-icons";

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------
const STEPS = [
  { icon: User, label: "Seu Perfil", color: "text-primary" },
  { icon: Landmark, label: "Conta Bancária", color: "text-blue-500" },
  { icon: CreditCard, label: "Cartão de Crédito", color: "text-violet-500" },
  { icon: Rocket, label: "Pronto!", color: "text-orange-500" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const typeLabels: Record<BankAccountType, string> = { CHECKING: "Conta Corrente", SAVINGS: "Poupança", INVESTMENT: "Investimento" };
const typeIcons: Record<BankAccountType, React.ElementType> = { CHECKING: Wallet, SAVINGS: PiggyBank, INVESTMENT: TrendingUp };
const brandLabels: Record<CardBrand, string> = { VISA: "Visa", MASTERCARD: "Mastercard", ELO: "Elo", AMEX: "American Express", HIPERCARD: "Hipercard", OTHER: "Outro" };

// ---------------------------------------------------------------------------
// Profile schema
// ---------------------------------------------------------------------------
const profileSetupSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  image: z.string().optional(),
  monthlyIncome: z.coerce.number().min(0).optional(),
  birthDate: z.string().optional(),
  occupation: z.string().max(100).optional(),
});
type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SetupWizard({
  userName,
  userImage,
  onComplete,
}: {
  userName?: string;
  userImage?: string;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [accountCreated, setAccountCreated] = useState(false);
  const [cardCreated, setCardCreated] = useState(false);
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);

  const goNext = useCallback(() => { setDirection(1); setStep((s) => Math.min(STEPS.length - 1, s + 1)); }, []);
  const goPrev = useCallback(() => { setDirection(-1); setStep((s) => Math.max(0, s - 1)); }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/logos/logo-light.svg" alt="PQGASTEI?" width={170} height={44} className="dark:hidden h-11 w-auto" priority />
          <Image src="/logos/logo-dark.svg" alt="PQGASTEI?" width={170} height={44} className="hidden dark:block h-11 w-auto" priority />
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <div className={`w-8 h-0.5 rounded-full transition-colors ${done ? "bg-primary" : "bg-muted"}`} />}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs font-bold ${
                    done ? "bg-primary text-primary-foreground" : active ? "bg-primary/15 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step label */}
        <p className="text-center text-sm text-muted-foreground mb-4">
          Passo {step + 1} de {STEPS.length} — <span className="font-medium text-foreground">{STEPS[step].label}</span>
        </p>

        {/* Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {step === 0 && (
                  <ProfileStep
                    userName={userName}
                    userImage={userImage}
                    onNext={goNext}
                  />
                )}
                {step === 1 && (
                  <BankAccountStep
                    onNext={(accountId) => {
                      setAccountCreated(true);
                      setCreatedAccountId(accountId);
                      goNext();
                    }}
                    onPrev={goPrev}
                  />
                )}
                {step === 2 && (
                  <CreditCardStep
                    bankAccountId={createdAccountId}
                    onNext={(created) => { setCardCreated(created); goNext(); }}
                    onPrev={goPrev}
                  />
                )}
                {step === 3 && (
                  <FinishStep
                    userName={userName}
                    accountCreated={accountCreated}
                    cardCreated={cardCreated}
                    onComplete={onComplete}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Profile
// ---------------------------------------------------------------------------
function ProfileStep({ userName, userImage, onNext }: { userName?: string; userImage?: string; onNext: () => void }) {
  const [avatarPreview, setAvatarPreview] = useState(userImage || "");
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProfileSetupInput, any, ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema) as any,
    defaultValues: {
      name: userName || "",
      image: userImage || "",
      monthlyIncome: 0,
      birthDate: "",
      occupation: "",
    },
  });

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, WebP ou GIF.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error || "Erro ao enviar foto");
        setAvatarPreview(form.getValues("image") || "");
        setUploading(false);
        return;
      }

      const { url } = await res.json();
      form.setValue("image", url);
      setAvatarPreview(url);
      toast.success("Foto atualizada!");
      URL.revokeObjectURL(preview);
    } catch {
      toast.error("Não conseguimos enviar a foto. Verifique sua conexão.");
      setAvatarPreview(form.getValues("image") || "");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: ProfileSetupInput) {
    const res = await fetch("/api/setup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        image: data.image || null,
        monthlyIncome: data.monthlyIncome || null,
        birthDate: data.birthDate || null,
        occupation: data.occupation || null,
      }),
    });
    if (!res.ok) { toast.error("Não conseguimos salvar suas informações. Tente novamente."); return; }
    toast.success("Perfil atualizado!");
    onNext();
  }

  const initials = form.watch("name")
    ? form.watch("name").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="text-center space-y-1 mb-2">
          <h2 className="text-xl font-bold">Complete seu perfil</h2>
          <p className="text-sm text-muted-foreground">Informações básicas para personalizar sua experiência.</p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-1.5">
          <label className="relative cursor-pointer group" htmlFor="avatar-upload">
            <Avatar className="w-20 h-20 ring-2 ring-muted group-hover:ring-primary transition-all">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            </div>
            <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onAvatarChange} />
          </label>
          <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP ou GIF. Máx. 2 MB.</p>
        </div>

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel required>Nome</FormLabel>
            <FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="monthlyIncome" render={({ field }) => (
          <FormItem>
            <FormLabel required>Renda mensal estimada</FormLabel>
            <FormControl>
              <CurrencyInput value={field.value || 0} onChange={field.onChange} />
            </FormControl>
            <p className="text-xs text-muted-foreground">Usada para calcular o comprometimento da sua renda.</p>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="birthDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Nascimento <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="occupation" render={({ field }) => (
            <FormItem>
              <FormLabel>Profissão <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
              <FormControl><Input placeholder="Ex: Analista" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Próximo"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Bank Account
// ---------------------------------------------------------------------------
function BankAccountStep({ onNext, onPrev }: { onNext: (accountId: string) => void; onPrev: () => void }) {
  const form = useForm<BankAccountInput, any, BankAccountInput>({
    resolver: zodResolver(bankAccountSchema) as any,
    defaultValues: { name: "", nickname: "", type: "CHECKING", balance: 0, color: "#075056" },
  });

  async function onSubmit(data: BankAccountInput) {
    const res = await fetch("/api/contas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Não conseguimos criar a conta. Verifique os dados."); return; }
    const account = await res.json();
    toast.success("Conta criada!");
    onNext(account.id);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="text-center space-y-1 mb-2">
          <h2 className="text-xl font-bold">Sua primeira conta</h2>
          <p className="text-sm text-muted-foreground">Cadastre sua conta bancária principal. O saldo será atualizado automaticamente.</p>
        </div>

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel required>Banco</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue>{field.value ? <span className="flex items-center gap-2">{getBankIcon(field.value, "w-4 h-4")} {field.value}</span> : "Selecione o banco"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BANK_NAMES.map((b) => (
                    <SelectItem key={b} value={b}><span className="flex items-center gap-2">{getBankIcon(b, "w-4 h-4")} {b}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="nickname" render={({ field }) => (
          <FormItem>
            <FormLabel required>Apelido</FormLabel>
            <FormControl><Input placeholder="Ex: Conta Salário" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel required>Tipo</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue>{(() => { const Icon = typeIcons[field.value as BankAccountType]; return <span className="flex items-center gap-2"><Icon className="w-4 h-4" />{typeLabels[field.value as BankAccountType]}</span>; })()}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(typeLabels) as BankAccountType[]).map((t) => {
                      const Icon = typeIcons[t];
                      return <SelectItem key={t} value={t}><span className="flex items-center gap-2"><Icon className="w-4 h-4" />{typeLabels[t]}</span></SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="color" render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl><ColorPicker value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="balance" render={({ field }) => (
          <FormItem>
            <FormLabel required>Saldo atual</FormLabel>
            <FormControl><CurrencyInput value={field.value} onChange={field.onChange} /></FormControl>
            <p className="text-xs text-muted-foreground">Informe o saldo real de hoje. O sistema atualiza a partir daqui.</p>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Criando..." : "Próximo"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Credit Card (optional)
// ---------------------------------------------------------------------------
function CreditCardStep({ bankAccountId, onNext, onPrev }: { bankAccountId: string | null; onNext: (created: boolean) => void; onPrev: () => void }) {
  const form = useForm<CreditCardInput, any, CreditCardInput>({
    resolver: zodResolver(creditCardSchema) as any,
    defaultValues: {
      name: "",
      brand: "VISA",
      lastFourDigits: "",
      creditLimit: 0,
      closingDay: 25,
      dueDay: 5,
      color: "#FF5B04",
      bankAccountId: bankAccountId || "",
    },
  });

  async function onSubmit(data: CreditCardInput) {
    const res = await fetch("/api/cartoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Não conseguimos criar o cartão. Verifique os dados."); return; }
    toast.success("Cartão criado!");
    onNext(true);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="text-center space-y-1 mb-2">
          <h2 className="text-xl font-bold">Seu cartão de crédito</h2>
          <p className="text-sm text-muted-foreground">Se tiver um cartão, cadastre aqui. Se não, pode pular.</p>
        </div>

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel required>Nome do cartão</FormLabel>
            <FormControl><Input placeholder="Ex: Nubank Roxinho" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem>
              <FormLabel required>Bandeira</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue>{brandLabels[field.value as CardBrand]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(brandLabels) as CardBrand[]).map((b) => (
                      <SelectItem key={b} value={b}>{brandLabels[b]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastFourDigits" render={({ field }) => (
            <FormItem>
              <FormLabel>Últimos 4 dígitos</FormLabel>
              <FormControl><Input placeholder="0000" maxLength={4} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="creditLimit" render={({ field }) => (
          <FormItem>
            <FormLabel required>Limite</FormLabel>
            <FormControl><CurrencyInput value={field.value} onChange={field.onChange} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="closingDay" render={({ field }) => (
            <FormItem>
              <FormLabel required>Dia de fechamento</FormLabel>
              <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dueDay" render={({ field }) => (
            <FormItem>
              <FormLabel required>Dia de vencimento</FormLabel>
              <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="color" render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl><ColorPicker value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Criando..." : "Próximo"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => onNext(false)}
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Não tenho cartão / Adicionar depois
        </Button>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Finish
// ---------------------------------------------------------------------------
function FinishStep({
  userName,
  accountCreated,
  cardCreated,
  onComplete,
}: {
  userName?: string;
  accountCreated: boolean;
  cardCreated: boolean;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);
    await fetch("/api/setup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupCompleted: true }),
    });
    setLoading(false);
    onComplete();
  }

  const items = [
    { label: "Perfil atualizado", done: true },
    { label: "Conta bancária cadastrada", done: accountCreated },
    { label: "Cartão de crédito cadastrado", done: cardCreated },
  ];

  return (
    <div className="text-center space-y-6 py-4">
      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-success" />
          </div>
        </div>
        <h2 className="text-xl font-bold">Tudo pronto, {userName?.split(" ")[0] || ""}!</h2>
        <p className="text-sm text-muted-foreground">Seu sistema está configurado e pronto para usar.</p>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 space-y-2.5 text-left">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-sm">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.done ? "text-success" : "text-muted-foreground/30"}`} />
            <span className={item.done ? "text-foreground" : "text-muted-foreground line-through"}>{item.label}</span>
          </div>
        ))}
      </div>

      <motion.div whileTap={{ scale: 0.97 }}>
        <Button size="lg" className="w-full text-base" onClick={handleFinish} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
          Começar a usar
        </Button>
      </motion.div>
    </div>
  );
}

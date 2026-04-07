"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Eye, EyeOff, MailCheck, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, registerSchema, LoginInput, RegisterInput } from "@/lib/validations/auth";

// ---------------------------------------------------------------------------
// Password strength indicator
// ---------------------------------------------------------------------------
function PasswordCriteria({ password }: { password: string }) {
  const criteria = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Um número", met: /[0-9]/.test(password) },
    { label: "Um caractere especial", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const metCount = criteria.filter((c) => c.met).length;
  const strength = metCount <= 1 ? 0 : metCount <= 3 ? 1 : 2;
  const colors = ["bg-destructive", "bg-yellow-500", "bg-success"];
  const widths = ["w-1/4", "w-2/3", "w-full"];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${colors[strength]} ${widths[strength]}`} />
      </div>
      <ul className="space-y-0.5">
        {criteria.map((c) => (
          <li key={c.label} className={`text-xs flex items-center gap-1.5 ${c.met ? "text-success" : "text-muted-foreground"}`}>
            <CheckCircle2 className={`w-3 h-3 ${c.met ? "opacity-100" : "opacity-30"}`} />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login Form
// ---------------------------------------------------------------------------
function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const form = useForm<LoginInput, any, LoginInput>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      toast.error("E-mail ou senha incorretos. Verifique se seu e-mail foi confirmado.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="seu@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Senha</FormLabel>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs text-primary hover:underline underline-offset-2"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="••••••••"
                    type={showPwd ? "text" : "password"}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPwd(!showPwd)}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </motion.div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
          </div>
        </div>

        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Register Form
// ---------------------------------------------------------------------------
function RegisterForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [showPwd, setShowPwd] = useState(false);
  const form = useForm<RegisterInput, any, RegisterInput>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const passwordValue = form.watch("password");

  async function onSubmit(data: RegisterInput) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      if (typeof err.error === "string" && err.error.includes("já cadastrado")) {
        form.setError("email", { message: "Este e-mail já está cadastrado. Faça login." });
      } else {
        toast.error(typeof err.error === "string" ? err.error : "Erro ao criar conta");
      }
      return;
    }

    onSuccess(data.email);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="seu@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="••••••••"
                    type={showPwd ? "text" : "password"}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPwd(!showPwd)}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </FormControl>
              <PasswordCriteria password={passwordValue || ""} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Criando conta..." : "Criar conta"}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Forgot Password Form
// ---------------------------------------------------------------------------
function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 py-4"
      >
        <div className="flex justify-center">
          <div className="bg-primary/10 rounded-full p-4">
            <MailCheck className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Verifique seu e-mail</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Se o e-mail <span className="font-medium text-foreground">{email}</span> estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          O link expira em 1 hora. Verifique também a pasta de spam.
        </p>
        <button
          className="mt-4 w-full text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          onClick={onBack}
        >
          Voltar ao login
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <div className="bg-primary/10 rounded-full p-3">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h3 className="font-semibold text-lg">Esqueceu a senha?</h3>
        <p className="text-sm text-muted-foreground">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">E-mail</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>
      </form>

      <button
        className="w-full text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        onClick={onBack}
      >
        Voltar ao login
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Verify Email Card
// ---------------------------------------------------------------------------
function VerifyEmailCard({ email, onBack }: { email?: string; onBack: () => void }) {
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!email) return;
    setResending(true);

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      toast.success("E-mail reenviado!");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao reenviar");
    }
    setResending(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4 py-4"
    >
      <div className="flex justify-center">
        <div className="bg-primary/10 rounded-full p-4">
          <MailCheck className="w-10 h-10 text-primary" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Verifique seu e-mail</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enviamos um link de confirmação para{" "}
          {email ? <span className="font-medium text-foreground">{email}</span> : "seu e-mail"}.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        O link expira em 24 horas. Verifique também a pasta de spam.
      </p>

      {email && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resending}
          className="mx-auto"
        >
          {resending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Reenviando...
            </>
          ) : (
            "Reenviar e-mail"
          )}
        </Button>
      )}

      <button
        className="mt-2 w-full text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        onClick={onBack}
      >
        Voltar ao login
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
function AuthPageInner() {
  const [tab, setTab] = useState("login");
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      toast.success("E-mail confirmado! Faça login.");
    }
    if (searchParams.get("reset") === "1") {
      toast.success("Senha redefinida! Faça login com a nova senha.");
    }
    const error = searchParams.get("error");
    if (error === "expired-token") toast.error("Link expirado. Crie a conta novamente.");
    if (error === "invalid-token") toast.error("Link inválido.");
  }, [searchParams]);

  const showTabs = !verifyEmail && !showForgot;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6">
          <Image src="/logos/logo-light.svg" alt="PQGASTEI?" width={213} height={56} className="dark:hidden mb-3 h-14 w-auto" priority />
          <Image src="/logos/logo-dark.svg" alt="PQGASTEI?" width={213} height={56} className="hidden dark:block mb-3 h-14 w-auto" priority />
          <p className="text-muted-foreground text-sm">Gestão financeira pessoal</p>
        </div>

        <Card>
          {showTabs && (
            <CardHeader className="pb-4">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Criar conta</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
          )}
          <CardContent className={!showTabs ? "pt-6" : undefined}>
            <AnimatePresence mode="wait">
              {verifyEmail ? (
                <motion.div key="verify">
                  <VerifyEmailCard
                    email={verifyEmail}
                    onBack={() => { setVerifyEmail(null); setTab("login"); }}
                  />
                </motion.div>
              ) : showForgot ? (
                <motion.div key="forgot">
                  <ForgotPasswordForm onBack={() => setShowForgot(false)} />
                </motion.div>
              ) : tab === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoginForm onForgotPassword={() => setShowForgot(true)} />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <RegisterForm onSuccess={(email) => setVerifyEmail(email)} />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}

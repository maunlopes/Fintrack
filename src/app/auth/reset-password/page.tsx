"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-10">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Link inválido</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Este link de redefinição de senha é inválido ou já foi usado.
            </p>
            <Button onClick={() => router.push("/auth")} variant="outline">
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setSuccess(true);
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => router.push("/auth?reset=1"), 2000);
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao redefinir senha");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-10">
            <div className="bg-success/10 rounded-full p-4 w-fit mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-lg font-bold mb-2">Senha redefinida!</h2>
            <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="w-5 h-5" />
              Redefinir senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <PasswordCriteria password={password} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {confirm && password !== confirm && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !password || !confirm}>
                {loading ? "Redefinindo..." : "Redefinir senha"}
              </Button>

              <button
                type="button"
                className="w-full text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                onClick={() => router.push("/auth")}
              >
                Voltar ao login
              </button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

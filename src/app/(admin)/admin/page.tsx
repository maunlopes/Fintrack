"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, UserPlus, Activity, Landmark, ScrollText } from "lucide-react";
import { formatDate } from "@/lib/format";

interface Stats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  totalBankAccounts: number;
  monthlyRegistrations: { month: string; count: number }[];
}

interface Log {
  id: string;
  action: string;
  createdAt: string;
  user: { name: string | null; email: string } | null;
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atr\u00e1s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atr\u00e1s`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atr\u00e1s`;
  return formatDate(date);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, logsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/logs?page=1"),
        ]);
        const statsData = await statsRes.json();
        const logsData = await logsRes.json();
        setStats(statsData);
        setLogs(logsData.logs?.slice(0, 5) ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = stats
    ? [
        { label: "Total de Usu\u00e1rios", value: stats.totalUsers, icon: Users },
        { label: "Novos este M\u00eas", value: stats.newUsersThisMonth, icon: UserPlus },
        { label: "Usu\u00e1rios Ativos (30d)", value: stats.activeUsers, icon: Activity },
        { label: "Contas Banc\u00e1rias", value: stats.totalBankAccounts, icon: Landmark },
      ]
    : [];

  const maxCount = stats
    ? Math.max(...stats.monthlyRegistrations.map((m) => m.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel Administrativo</h1>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardDescription className="h-4 w-24 animate-pulse rounded bg-muted" />
                <CardTitle className="h-7 w-16 animate-pulse rounded bg-muted" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {statCards.map((card) => (
              <Card key={card.label}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription>{card.label}</CardDescription>
                    <card.icon className="size-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">{card.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Novos cadastros por m\u00eas</CardTitle>
              <CardDescription>\u00daltimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-40">
                {stats.monthlyRegistrations.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {m.count}
                    </span>
                    <div
                      className="w-full rounded-t bg-primary transition-all"
                      style={{
                        height: `${(m.count / maxCount) * 100}%`,
                        minHeight: m.count > 0 ? "4px" : "2px",
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{m.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ScrollText className="size-5 text-muted-foreground" />
                <CardTitle>\u00daltimos Logs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum log encontrado.</p>
              ) : (
                <ul className="space-y-3">
                  {logs.map((log) => (
                    <li key={log.id} className="flex items-center justify-between text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {log.user?.name || log.user?.email || "Sistema"}
                        </span>
                        <span className="text-muted-foreground">{log.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(log.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Erro ao carregar dados.</p>
      )}
    </div>
  );
}

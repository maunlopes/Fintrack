"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MonthSelector } from "@/components/shared/month-selector";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  CreditCard,
  ListOrdered,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { BudgetAlertBanner } from "@/components/shared/budget-alert-banner";
import Link from "next/link";

/* ── Dynamic Chart Imports ──────────────────── */
const ChartSkeleton = ({ height }: { height: number }) => (
  <Skeleton className="w-full rounded-2xl" style={{ height }} />
);

const IncomeExpensesChart = dynamic(
  () => import("@/components/dashboard/income-expenses-chart").then((m) => m.IncomeExpensesChart),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> }
);

const CategoryPieChart = dynamic(
  () => import("@/components/dashboard/category-pie-chart").then((m) => m.CategoryPieChart),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> }
);

const BalanceForecastChart = dynamic(
  () => import("@/components/dashboard/balance-forecast-chart").then((m) => m.BalanceForecastChart),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> }
);

/* ── Helpers ────────────────────────────────── */
function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function fmtShort(v: number) {
  if (Math.abs(v) >= 1_000_000) return `R$\u00a0${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `R$\u00a0${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
}
function getCategoryInitials(cat: string) {
  return cat.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ── Motion ─────────────────────────────────── */
const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

/* ── Skeleton ────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Skeleton className="h-7 w-40 rounded-full" />
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>
      <div className="bento">
        <Skeleton className="rounded-3xl h-44" style={{ gridColumn: "1 / 8" }} />
        <div style={{ gridColumn: "8 / 13", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="rounded-3xl h-20" />)}
        </div>
        <Skeleton className="rounded-3xl h-64" style={{ gridColumn: "1 / 9" }} />
        <Skeleton className="rounded-3xl h-64" style={{ gridColumn: "9 / 13" }} />
        <Skeleton className="rounded-3xl h-48" style={{ gridColumn: "1 / 13" }} />
      </div>
    </div>
  );
}

/* ── Main Content ───────────────────────────── */
function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"resumo" | "analise" | "despesas">(
    (searchParams.get("tab") as any) ?? "resumo"
  );

  useEffect(() => {
    setLoading(true);
    setError(null);

    import("@/components/dashboard/income-expenses-chart");
    import("@/components/dashboard/category-pie-chart");
    import("@/components/dashboard/balance-forecast-chart");

    const apiParams = new URLSearchParams(searchParams.toString());
    apiParams.delete("tab");
    const qs = apiParams.toString();
    const endpoint = `/api/dashboard${qs ? `?${qs}` : ""}`;
    const budgetEndpoint = `/api/orcamentos${qs ? `?${qs}` : ""}`;

    fetch(budgetEndpoint)
      .then(r => r.json())
      .then((json: any[]) => setBudgetAlerts(json.filter(c => c.status === "warning" || c.status === "danger")))
      .catch(() => {});

    fetch(endpoint)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Erro ${res.status}`);
        return json;
      })
      .then(json => {
        const formattedHistory = (json.historicalData ?? []).map((item: any) => ({
          ...item,
          month: (() => {
            const [y, m] = item.month.split("T")[0].split("-").map(Number);
            return new Date(y, m - 1, 1).toLocaleString("pt-BR", { month: "short" });
          })(),
        }));
        setData({ ...json, historicalData: formattedHistory });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Erro ao carregar dashboard");
        setLoading(false);
      });
  }, [searchParams]);

  function changeTab(t: "resumo" | "analise" | "despesas") {
    setActiveTab(t);
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", t);
    router.replace(`${pathname}?${p.toString()}`);
  }

  if (loading) return <DashboardSkeleton />;

  if (error) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h2 style={{ color: "var(--negative)", fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700 }}>
        Erro ao carregar dashboard
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 8 }}>{error}</p>
      <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
        Tentar novamente
      </button>
    </div>
  );

  if (!data) return null;

  const { kpis, historicalData, categoryData, upcomingExpenses } = data;
  const topCategory = categoryData?.length > 0
    ? categoryData.reduce((p: any, c: any) => p.value > c.value ? p : c)
    : null;
  const balance = kpis.totalBalance + (kpis.totalInvested || 0);
  const monthBalance = kpis.balance;
  const spendRatio = kpis.monthIncome > 0
    ? Math.min(Math.round((kpis.monthExpenses / kpis.monthIncome) * 100), 100)
    : 0;

  const kpiCards = [
    { label: "Saldo Contas", value: fmtShort(kpis.totalBalance), icon: Wallet, color: "var(--brand-accent)" },
    { label: "Receita", value: fmtShort(kpis.monthIncome), icon: ArrowUpRight, color: "var(--brand-accent)" },
    { label: "Despesas", value: fmtShort(kpis.monthExpenses), icon: ArrowDownRight, color: "var(--negative)" },
    { label: "Investido", value: fmtShort(kpis.totalInvested || 0), icon: TrendingUp, color: "var(--indigo)" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ─── Topbar ─────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px 16px",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--text-tertiary)", fontSize: 13, marginTop: 2 }}>
            Visão geral das suas finanças
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Suspense fallback={<div style={{ height: 36, width: 140, borderRadius: "var(--r-full)", background: "var(--bg-raised)" }} />}>
            <MonthSelector />
          </Suspense>
          <Link href="/despesas" className="btn-primary" style={{ textDecoration: "none", fontSize: 13, padding: "8px 16px" }}>
            <Plus className="w-3.5 h-3.5" />
            Nova despesa
          </Link>
        </div>
      </div>

      {/* ─── Tab nav ────────────────────────── */}
      <div style={{ padding: "0 32px 16px" }}>
        <div className="tabs-ds" style={{ display: "inline-flex" }}>
          {(["resumo", "analise", "despesas"] as const).map(t => (
            <button
              key={t}
              className={`tab-ds${activeTab === t ? " active" : ""}`}
              onClick={() => changeTab(t)}
            >
              {t === "resumo" ? "Resumo" : t === "analise" ? "Análise" : "Próximas Despesas"}
            </button>
          ))}
        </div>
      </div>

      {/* Budget alerts */}
      {budgetAlerts.length > 0 && (
        <div style={{ padding: "0 32px 12px" }}>
          <BudgetAlertBanner items={budgetAlerts} />
        </div>
      )}

      {/* ─── RESUMO TAB ─────────────────────── */}
      {activeTab === "resumo" && (
        <motion.div variants={fade} className="bento">

          {/* Hero — Patrimônio Total */}
          <motion.div variants={fade} className="card--dark" style={{ gridColumn: "1 / 8" }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
              Patrimônio Total
            </div>
            <div
              className="value-hero"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", color: "white", marginBottom: 12 }}
            >
              {fmt(balance)}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span className="badge--pos">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                Receita {fmtShort(kpis.monthIncome)}
              </span>
              <span className="badge--neg">
                <ArrowDownRight className="w-3 h-3 mr-1" />
                Despesas {fmtShort(kpis.monthExpenses)}
              </span>
              {monthBalance >= 0
                ? <span className="badge--pos">Balanço +{fmtShort(monthBalance)}</span>
                : <span className="badge--neg">Balanço {fmtShort(monthBalance)}</span>
              }
            </div>

            {/* Spend ratio */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Taxa de gasto
                </span>
                <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700 }}>
                  {spendRatio}%
                </span>
              </div>
              <div className="progress-track" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className={`progress-fill${spendRatio > 80 ? "--neg" : spendRatio > 50 ? "--warn" : ""}`}
                  style={{
                    width: `${spendRatio}%`,
                    height: "100%",
                    borderRadius: "var(--r-full)",
                    background: spendRatio > 80
                      ? "linear-gradient(90deg, #FF5F5F, #CC2222)"
                      : spendRatio > 50
                      ? "linear-gradient(90deg, #FFB800, #CC8800)"
                      : "linear-gradient(90deg, #00D68F, #00A870)",
                    transition: "width 1.4s var(--ease-quart)",
                  }}
                />
              </div>
            </div>

            {topCategory && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="eyebrow" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Maior categoria
                </span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: topCategory.color || "var(--brand-accent)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{topCategory.name}</span>
                  </div>
                  <span style={{ color: "var(--negative)", fontWeight: 700, fontSize: 13 }}>
                    {fmtShort(topCategory.value)}
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* KPI 2×2 grid */}
          <div style={{ gridColumn: "8 / 13", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {kpiCards.map(({ label, value, icon: Icon, color }) => (
              <motion.div key={label} variants={fade} className="card" style={{ padding: "18px 20px" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "var(--r-md)",
                  background: `${color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 10,
                }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
                <div className="money" style={{ fontSize: 16, color: "var(--text-primary)" }}>{value}</div>
              </motion.div>
            ))}
          </div>

          {/* Próximas Despesas */}
          <motion.div variants={fade} style={{ gridColumn: "1 / 13" }}>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="eyebrow">Próximas despesas</div>
                  <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                    Contas a pagar
                  </h3>
                </div>
                <button
                  className="pill"
                  onClick={() => changeTab("despesas")}
                  style={{ fontSize: 12 }}
                >
                  Ver todas →
                </button>
              </div>

              {(() => {
                const top5 = upcomingExpenses?.filter((t: any) => t.status === "PENDING").slice(0, 5) ?? [];
                if (top5.length === 0) return (
                  <div style={{ padding: "0 24px 24px" }}>
                    <EmptyState icon={ListOrdered} title="Sem pendências" description="Nenhuma despesa pendente." />
                  </div>
                );
                return (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--bg-raised)" }}>
                          {["Descrição", "Categoria", "Data", "Valor"].map((h, i) => (
                            <th
                              key={h}
                              style={{
                                padding: "8px 24px",
                                textAlign: i === 3 ? "right" : "left",
                                color: "var(--text-tertiary)",
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.07em",
                                textTransform: "uppercase",
                                fontFamily: "var(--font-dm-sans)",
                              }}
                            >{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {top5.map((tx: any, i: number) => (
                          <tr
                            key={tx.id || i}
                            style={{ borderBottom: i < top5.length - 1 ? "1px solid var(--bg-raised)" : "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-raised)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "12px 24px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span
                                  style={{
                                    width: 32, height: 32, borderRadius: "var(--r-sm)",
                                    background: `${tx.category?.color || "var(--brand-accent)"}22`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 10, fontWeight: 700,
                                    color: tx.category?.color || "var(--brand-accent)",
                                    flexShrink: 0,
                                  }}
                                >
                                  {getCategoryInitials(tx.category?.name || "D")}
                                </span>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                                    {tx.description}
                                  </div>
                                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                                    {tx.cardId
                                      ? <><CreditCard className="w-3 h-3" />{tx.cardName}</>
                                      : tx.bankAccount
                                      ? <><Wallet className="w-3 h-3" />{tx.bankAccount.nickname}</>
                                      : null}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 24px" }}>
                              <span className="badge--info">{tx.category?.name || "Despesa"}</span>
                            </td>
                            <td style={{ padding: "12px 24px", color: "var(--text-secondary)", fontSize: 13, whiteSpace: "nowrap" }}>
                              {new Date(tx.dueDate).toLocaleDateString("pt-BR")}
                            </td>
                            <td style={{ padding: "12px 24px", textAlign: "right" }}>
                              <span className="money" style={{ color: "var(--negative)", fontSize: 13 }}>
                                -{fmt(Number(tx.amount))}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ─── ANÁLISE TAB ────────────────────── */}
      {activeTab === "analise" && (
        <motion.div variants={fade} className="bento">

          <motion.div variants={fade} className="card" style={{ gridColumn: "1 / 9" }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Histórico</div>
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
              Receita vs Despesas
            </h3>
            <IncomeExpensesChart data={historicalData} />
          </motion.div>

          <motion.div variants={fade} className="card" style={{ gridColumn: "9 / 13" }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Distribuição</div>
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
              Gastos por Categoria
            </h3>
            <CategoryPieChart data={categoryData} />
          </motion.div>

          <motion.div variants={fade} className="card" style={{ gridColumn: "1 / 13" }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Previsão</div>
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
              Projeção de Saldo — Próximos 6 Meses
            </h3>
            <BalanceForecastChart data={data.forecastData} />
          </motion.div>
        </motion.div>
      )}

      {/* ─── DESPESAS TAB ───────────────────── */}
      {activeTab === "despesas" && (
        <motion.div variants={fade} className="bento">
          <div className="card" style={{ gridColumn: "1 / 13", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px" }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Agenda</div>
              <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Todas as Próximas Despesas
              </h3>
            </div>

            {(() => {
              const all = upcomingExpenses ?? [];
              if (all.length === 0) return (
                <div style={{ padding: "0 24px 24px" }}>
                  <EmptyState icon={ListOrdered} title="Sem despesas" description="Nenhuma despesa agendada." />
                </div>
              );
              return (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--bg-raised)" }}>
                        {["Descrição", "Categoria", "Data", "Status", "Valor"].map((h, i) => (
                          <th
                            key={h}
                            style={{
                              padding: "8px 24px",
                              textAlign: i >= 4 ? "right" : "left",
                              color: "var(--text-tertiary)",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.07em",
                              textTransform: "uppercase",
                              fontFamily: "var(--font-dm-sans)",
                            }}
                          >{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {all.map((tx: any, i: number) => (
                        <tr
                          key={tx.id || i}
                          style={{ borderBottom: "1px solid var(--bg-raised)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-raised)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "12px 24px" }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                              {tx.description}
                            </div>
                          </td>
                          <td style={{ padding: "12px 24px" }}>
                            <span className="badge--info">{tx.category?.name || "—"}</span>
                          </td>
                          <td style={{ padding: "12px 24px", color: "var(--text-secondary)", fontSize: 13, whiteSpace: "nowrap" }}>
                            {new Date(tx.dueDate).toLocaleDateString("pt-BR")}
                          </td>
                          <td style={{ padding: "12px 24px" }}>
                            {tx.status === "PAID"
                              ? <span className="badge--pos">Pago</span>
                              : tx.status === "OVERDUE"
                              ? <span className="badge--neg">Atrasado</span>
                              : <span className="badge--warn">Pendente</span>
                            }
                          </td>
                          <td style={{ padding: "12px 24px", textAlign: "right" }}>
                            <span className="money" style={{ color: "var(--negative)", fontSize: 13 }}>
                              -{fmt(Number(tx.amount))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

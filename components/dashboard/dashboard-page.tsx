"use client";

import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useClientesData } from "@/hooks/use-clientes-data";
import { ClientesDashboardData, EvolucaoMensal, GestorMetric } from "@/lib/types";
import { cn, formatMonths, formatPercent, getChurnColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const navItems = [
  { label: "Visão Geral", icon: LayoutDashboard, active: true },
  { label: "Por Gestor", icon: Users, active: false },
  { label: "Evolução Mensal", icon: TrendingUp, active: false },
  { label: "Registro de Saídas", icon: LogOut, active: false }
];

const statusColors = {
  bons: "#22c55e",
  alerta: "#f59e0b",
  critico: "#ef4444"
};

function MetricCard({
  title,
  value,
  description,
  badge,
  icon: Icon,
  tone
}: {
  title: string;
  value: number;
  description: string;
  badge: string;
  icon: typeof Users;
  tone: "blue" | "green" | "yellow" | "red";
}) {
  const toneClasses = {
    blue: "text-primary",
    green: "text-success",
    yellow: "text-warning",
    red: "text-danger"
  };

  return (
    <Card className="p-5">
      <CardHeader>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{title}</p>
        </div>
        <div className="rounded-full border border-white/5 bg-white/[0.04] p-2">
          <Icon className="h-4 w-4 text-slate-200" />
        </div>
      </CardHeader>
      <CardContent className="mt-6 space-y-3">
        <div className={cn("metric-number font-bold", toneClasses[tone])}>{value}</div>
        <p className="text-sm text-muted">{description}</p>
        <Badge
          tone={tone}
          className="w-fit"
        >
          <ArrowUpRight className="h-3 w-3" />
          {badge}
        </Badge>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-6 h-12 w-24" />
            <Skeleton className="mt-4 h-4 w-36" />
            <Skeleton className="mt-4 h-8 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-6 h-12 w-32" />
            <Skeleton className="mt-4 h-32 w-full" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 2xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-6 h-64 w-full" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-20 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="flex min-h-[320px] flex-col items-center justify-center gap-5 p-10 text-center">
      <div className="rounded-full bg-danger/12 p-4 text-danger">
        <CircleAlert className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-50">Falha ao carregar o dashboard</h2>
        <p className="max-w-xl text-sm text-muted">{message}</p>
      </div>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </Card>
  );
}

function CustomTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-[14px] border border-primary/40 bg-background/95 p-3 shadow-2xl backdrop-blur">
      <p className="mb-2 text-sm font-semibold text-slate-50">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-slate-100">
              {item.name.includes("Churn") ? formatPercent(item.value) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildInsight(evolucaoMensal: EvolucaoMensal[]) {
  const completed = evolucaoMensal.filter((item) => !item.parcial && item.churn !== null);

  if (!completed.length) {
    return "Ainda não há meses fechados suficientes para gerar um insight automático.";
  }

  const worstMonth = completed.reduce((worst, current) =>
    (current.churn ?? 0) > (worst.churn ?? 0) ? current : worst
  );

  const latest = completed[completed.length - 1];
  const previous = completed[completed.length - 2];
  let trend = "Sem variação relevante no último fechamento.";

  if (previous && latest.churn !== null && previous.churn !== null) {
    if (latest.churn < previous.churn) {
      trend = `${latest.mes} mostrou recuperação frente a ${previous.mes}.`;
    } else if (latest.churn > previous.churn) {
      trend = `${latest.mes} pressionou a retenção acima de ${previous.mes}.`;
    }
  }

  return `${worstMonth.mes} foi o mês mais crítico com ${worstMonth.saidas} saídas (${formatPercent(
    worstMonth.churn
  )}). ${trend}`;
}

function buildGestorStatusData(gestores: GestorMetric[]) {
  return gestores.map((gestor) => ({
    nome: gestor.nome,
    bons: gestor.bons,
    alerta: gestor.alerta,
    critico: gestor.critico
  }));
}

function buildGestorPerformanceData(gestores: GestorMetric[]) {
  return [...gestores]
    .sort((a, b) => b.taxa_sucesso - a.taxa_sucesso)
    .map((gestor) => ({
      nome: gestor.nome,
      taxa_sucesso: gestor.taxa_sucesso,
      ltv_medio: gestor.ltv_medio,
      color:
        gestor.taxa_sucesso >= 65 ? statusColors.bons : gestor.taxa_sucesso >= 45 ? statusColors.alerta : statusColors.critico
    }));
}

function TaxaSucessoCard({ data }: { data: ClientesDashboardData }) {
  const pieData = [
    { name: "Bons", value: data.clientes_bons, color: statusColors.bons },
    { name: "Alerta", value: data.clientes_alerta, color: statusColors.alerta },
    { name: "Crítico", value: data.clientes_critico, color: statusColors.critico }
  ];

  return (
    <Card className="flex h-full flex-col justify-between p-5">
      <CardHeader>
        <div>
          <CardTitle>Taxa de Sucesso</CardTitle>
          <p className="mt-1 text-sm text-muted">Proporção entre bom, alerta e crítico</p>
        </div>
      </CardHeader>
      <CardContent className="mt-4 flex items-center justify-between gap-4">
        <div>
          <div className="metric-number font-bold text-slate-50">{formatPercent(data.taxa_sucesso)}</div>
          <p className="mt-2 text-sm text-muted">Clientes em condição saudável na carteira ativa</p>
        </div>
        <div className="h-28 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={42}
                paddingAngle={4}
                stroke="transparent"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function EvolucaoTable({ data }: { data: ClientesDashboardData }) {
  const completed = data.evolucao_mensal.filter((item) => !item.parcial && item.churn !== null);

  return (
    <Card className="h-full p-5">
      <CardHeader>
        <div>
          <CardTitle>Resumo Mensal</CardTitle>
          <p className="mt-1 text-sm text-muted">Movimentação detalhada e leitura automática</p>
        </div>
      </CardHeader>
      <CardContent className="mt-5 space-y-4">
        <div className="overflow-hidden rounded-[14px] border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Mês</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Entradas</TableHead>
                <TableHead>Saídas</TableHead>
                <TableHead className="text-right">Churn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.evolucao_mensal.map((row) => (
                <TableRow key={row.mes}>
                  <TableCell className="font-medium">{row.mes}</TableCell>
                  <TableCell>{row.base_inicio}</TableCell>
                  <TableCell className="text-success">{row.entradas ?? "—"}</TableCell>
                  <TableCell className="text-danger">-{row.saidas}</TableCell>
                  <TableCell className="text-right">
                    {row.parcial ? (
                      <Badge tone="gray">Em aberto</Badge>
                    ) : (
                      <Badge
                        tone={
                          row.churn !== null && row.churn < 8
                            ? "green"
                            : row.churn !== null && row.churn <= 12
                              ? "yellow"
                              : "red"
                        }
                      >
                        {formatPercent(row.churn)}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-white/[0.03] hover:bg-white/[0.03]">
                <TableCell className="font-semibold">Média jan-mar</TableCell>
                <TableCell colSpan={3} className="text-muted">
                  Média dos meses fechados
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-50">
                  {formatPercent(
                    completed.reduce((acc, item) => acc + (item.churn ?? 0), 0) / Math.max(completed.length, 1)
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="rounded-[14px] border border-primary/20 bg-primary/8 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">Insight automático</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">{buildInsight(data.evolucao_mensal)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, loading, error, refetch } = useClientesData();
  const gestorStatusData = data ? buildGestorStatusData(data.por_gestor) : [];
  const gestorPerformanceData = data ? buildGestorPerformanceData(data.por_gestor) : [];

  return (
    <div className="min-h-screen bg-background text-slate-50">
      <div className="mx-auto flex max-w-[1800px] flex-col md:flex-row">
        <aside className="border-b border-white/5 bg-sidebar px-5 py-6 md:sticky md:top-0 md:h-screen md:w-[260px] md:border-b-0 md:border-r">
          <div className="flex h-full flex-col">
            <div className="rounded-[18px] border border-white/5 bg-white/[0.02] px-4 py-4">
              <Image
                src="/logomarcha.png"
                alt="Marcha Ads"
                width={700}
                height={495}
                priority
                className="h-auto w-full max-w-[168px]"
              />
              <p className="mt-3 text-sm text-muted">Saúde de Clientes</p>
            </div>

            <div className="relative mt-8">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                disabled
                placeholder="Pesquisar módulo"
                className="pl-11"
              />
            </div>

            <nav className="mt-8 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-sm font-medium transition",
                      item.active ? "bg-primary text-white shadow-lg shadow-primary/10" : "text-slate-300 hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[18px] border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/14 text-sm font-bold text-primary">
                  MD
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-50">Marcha Digital</p>
                  <p className="text-xs text-muted">Agência de Tráfego Pago</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 rounded-[20px] border border-white/5 bg-white/[0.03] px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">Dashboard / Saúde de Clientes 2026</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-50">
                Saúde de Clientes — Marcha Ads
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[14px] border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm text-muted">
                Última atualização: <span className="font-semibold text-slate-100">{data?.atualizado_em ?? "—"}</span>
              </div>
              <Button onClick={() => void refetch()}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Atualizar
              </Button>
            </div>
          </header>

          {loading ? (
            <DashboardSkeleton />
          ) : error || !data ? (
            <ErrorState message={error ?? "Nenhum dado retornado pela API."} onRetry={() => void refetch()} />
          ) : (
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-4">
                  <MetricCard
                    title="Clientes Ativos"
                    value={data.clientes_ativos}
                    description="Base ativa acompanhada no momento"
                    badge={`${data.variacao_base >= 0 ? "+" : ""}${data.variacao_base} vs. mês anterior`}
                    icon={Users}
                    tone="blue"
                  />
                  <MetricCard
                    title="Clientes Bons"
                    value={data.clientes_bons}
                    description="Operação estável com maior retenção"
                    badge={`${formatPercent(data.perc_bons)} da base`}
                    icon={ShieldCheck}
                    tone="green"
                  />
                  <MetricCard
                    title="Sinal de Alerta"
                    value={data.clientes_alerta}
                    description="Clientes com risco moderado de churn"
                    badge={`${formatPercent(data.perc_alerta)} da base`}
                    icon={AlertTriangle}
                    tone="yellow"
                  />
                  <MetricCard
                    title="Situação Crítica"
                    value={data.clientes_critico}
                    description="Necessita intervenção imediata do time"
                    badge={`${formatPercent(data.perc_critico)} da base`}
                    icon={Activity}
                    tone="red"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <Card className="p-5">
                    <CardHeader>
                      <div>
                        <CardTitle>LTV Médio</CardTitle>
                        <p className="mt-1 text-sm text-muted">Tempo médio de permanência na carteira</p>
                      </div>
                    </CardHeader>
                    <CardContent className="mt-6">
                      <div className="flex items-end gap-3">
                        <div className="metric-number font-bold text-primary">{formatMonths(data.ltv_medio)}</div>
                        <span className="pb-1 text-lg font-medium text-slate-100">meses</span>
                      </div>
                      <p className="mt-4 text-sm text-muted">
                        mediana: <span className="font-semibold text-slate-100">{formatMonths(data.ltv_mediana)} meses</span>
                      </p>
                    </CardContent>
                  </Card>

                  <TaxaSucessoCard data={data} />

                  <Card className="p-5">
                    <CardHeader>
                      <div>
                        <CardTitle>Churn Médio</CardTitle>
                        <p className="mt-1 text-sm text-muted">Média dos meses fechados</p>
                      </div>
                      <div className="rounded-full bg-white/[0.04] p-2">
                        {(data.churn_medio ?? 0) <= 12 ? (
                          <ArrowDownRight className={cn("h-4 w-4", getChurnColor(data.churn_medio))} />
                        ) : (
                          <ArrowUpRight className={cn("h-4 w-4", getChurnColor(data.churn_medio))} />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="mt-6">
                      <div className={cn("metric-number font-bold", getChurnColor(data.churn_medio))}>
                        {formatPercent(data.churn_medio)}
                      </div>
                      <p className="mt-3 text-sm text-muted">média jan–mar</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section className="grid gap-4 2xl:grid-cols-2">
                <Card className="p-5">
                  <CardHeader>
                    <div>
                      <CardTitle>Distribuição de Status</CardTitle>
                      <p className="mt-1 text-sm text-muted">Mix de saúde por gestor e volume de carteira</p>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-6">
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={gestorStatusData}
                          margin={{ top: 0, right: 0, left: 12, bottom: 0 }}
                          barCategoryGap={16}
                        >
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="nome"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#f8fafc", fontSize: 13 }}
                            width={100}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="bons" stackId="status" fill={statusColors.bons} radius={[6, 0, 0, 6]} />
                          <Bar dataKey="alerta" stackId="status" fill={statusColors.alerta} />
                          <Bar dataKey="critico" stackId="status" fill={statusColors.critico} radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="green">Bom</Badge>
                      <Badge tone="yellow">Alerta</Badge>
                      <Badge tone="red">Crítico</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-5">
                  <CardHeader>
                    <div>
                      <CardTitle>Taxa de Sucesso &amp; LTV Médio</CardTitle>
                      <p className="mt-1 text-sm text-muted">Ordenado do maior para o menor sucesso</p>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-6">
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={gestorPerformanceData}
                          layout="vertical"
                          margin={{ top: 0, right: 56, left: 12, bottom: 0 }}
                          barCategoryGap={18}
                        >
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis
                            dataKey="nome"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#f8fafc", fontSize: 13 }}
                            width={100}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="taxa_sucesso" radius={[999, 999, 999, 999]}>
                            {gestorPerformanceData.map((entry) => (
                              <Cell key={entry.nome} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {gestorPerformanceData.map((gestor) => (
                        <div key={gestor.nome} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-100">{gestor.nome}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-50">{formatPercent(gestor.taxa_sucesso)}</span>
                            <span className="text-muted">{formatMonths(gestor.ltv_medio)} meses</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-4 2xl:grid-cols-[1.25fr_0.95fr]">
                <Card className="p-5">
                  <CardHeader>
                    <div>
                      <CardTitle>Evolução Mensal</CardTitle>
                      <p className="mt-1 text-sm text-muted">Base de clientes versus churn por período</p>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-6">
                    <div className="h-[360px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={data.evolucao_mensal}
                          margin={{ top: 16, right: 12, left: 8, bottom: 16 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="mes"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#8b92a5", fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#8b92a5", fontSize: 12 }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#8b92a5", fontSize: 12 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="base_inicio"
                            name="Base de clientes"
                            fill="rgba(59, 130, 246, 0.2)"
                            stroke="#3b82f6"
                            strokeWidth={2}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="churn"
                            name="Churn %"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#ef4444", stroke: "#0d0f14", strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="blue">Base de clientes</Badge>
                      <Badge tone="red">Churn %</Badge>
                    </div>
                  </CardContent>
                </Card>

                <EvolucaoTable data={data} />
              </section>

              <section className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-50">Registro de Saídas</h2>
                    <p className="mt-1 text-sm text-muted">Histórico completo de clientes perdidos por mês</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {data.saidas_por_mes.map((mes) => (
                    <Card key={mes.mes} className="p-5">
                      <CardHeader className="items-center">
                        <div>
                          <CardTitle className="text-lg uppercase tracking-[0.08em]">
                            {mes.mes} · {mes.clientes.length} saídas
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {mes.parcial && <Badge tone="gray">Em aberto</Badge>}
                          <Badge
                            tone={
                              mes.churn !== null && mes.churn < 8
                                ? "green"
                                : mes.churn !== null && mes.churn <= 12
                                  ? "yellow"
                                  : mes.churn === null
                                    ? "gray"
                                    : "red"
                            }
                          >
                            {mes.churn !== null ? formatPercent(mes.churn) : "—"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="mt-5">
                        <div className="flex flex-wrap gap-2">
                          {mes.clientes.map((cliente) => (
                            <span
                              key={`${mes.mes}-${cliente}`}
                              className="rounded-pill bg-stroke px-3 py-2 text-sm text-slate-50"
                            >
                              {cliente}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

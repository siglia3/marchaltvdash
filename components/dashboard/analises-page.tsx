"use client";

import { useMemo } from "react";
import { DashboardDataPage } from "@/components/dashboard/dashboard-shell";
import {
  buildGestorMetricsFromBase,
  ChurnByDimensionChart,
  CohortRetentionHeatmap,
  GestorMatrixChart,
  HealthByOriginChart,
  LtvDistributionChart,
  SummaryCard
} from "@/components/dashboard/dashboard-shared";
import type { BaseClienteDetalhado, ClientesDashboardData } from "@/lib/types";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function parseMonthYear(value: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{2})\/(\d{2,4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const rawYear = Number(match[2]);
  if (!month || month < 1 || month > 12) return null;
  const year = rawYear < 100 ? rawYear + 2000 : rawYear;
  return new Date(year, month - 1, 1);
}

function diffMonths(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return `${monthNames[date.getMonth()]}/${date.getFullYear()}`;
}

function resolveEntry(record: BaseClienteDetalhado) {
  return parseMonthYear(record.ma_entrada) || (record.data_inicio ? new Date(record.data_inicio.split("/").reverse().join("-")) : null);
}

function resolveExit(record: BaseClienteDetalhado) {
  return parseMonthYear(record.ma_saida) || (record.data_saida ? new Date(record.data_saida.split("/").reverse().join("-")) : null);
}

export function AnalisesPage() {
  return (
    <DashboardDataPage
      title="Análises avançadas"
      description="Modelos de retenção, churn e performance derivados da BASE_CLIENTES."
    >
      {(data) => <AnalisesContent data={data} />}
    </DashboardDataPage>
  );
}

function AnalisesContent({ data }: { data: ClientesDashboardData }) {
  const base = data.base_clientes_detalhada ?? [];

  const prepared = useMemo(() => {
    return base
      .map((record) => {
        const entry = resolveEntry(record);
        const exit = resolveExit(record);
        return {
          ...record,
          entry,
          exit
        };
      })
      .filter((record) => record.entry);
  }, [base]);

  const cohortRows = useMemo(() => {
    const groups = new Map<string, typeof prepared>();
    prepared.forEach((record) => {
      if (!record.entry) return;
      const key = monthLabel(record.entry);
      const current = groups.get(key) ?? [];
      current.push(record);
      groups.set(key, current);
    });

    return Array.from(groups.entries())
      .sort((a, b) => {
        const da = resolveEntry(a[1][0])!;
        const db = resolveEntry(b[1][0])!;
        return db.getTime() - da.getTime();
      })
      .slice(0, 8)
      .map(([cohort, records]) => {
        const values = Array.from({ length: 6 }).map((_, index) => {
          const retained = records.filter((record) => {
            if (!record.entry) return false;
            if (!record.exit) return true;
            return diffMonths(record.entry, record.exit) >= index;
          }).length;
          return records.length ? Number(((retained / records.length) * 100).toFixed(1)) : null;
        });
        return { cohort, values };
      });
  }, [prepared]);

  const churnByOrigin = useMemo(() => {
    const exited = prepared.filter((record) => record.exit && record.origem);
    const topOrigins = Array.from(
      exited.reduce((acc, record) => {
        const key = record.origem || "Sem origem";
        acc.set(key, (acc.get(key) ?? 0) + 1);
        return acc;
      }, new Map<string, number>())
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);

    const months = Array.from(new Set(exited.map((record) => monthKey(record.exit!))))
      .sort()
      .slice(-12);

    return months.map((key) => {
      const date = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1);
      const row: Record<string, any> = { mes: monthNames[date.getMonth()], tooltipLabel: monthLabel(date) };
      topOrigins.forEach((origin) => {
        row[origin] = exited.filter((record) => monthKey(record.exit!) === key && (record.origem || "Sem origem") === origin).length;
      });
      return row;
    });
  }, [prepared]);

  const churnByGestor = useMemo(() => {
    const exited = prepared.filter((record) => record.exit && record.gestor);
    const topGestores = Array.from(
      exited.reduce((acc, record) => {
        const key = record.gestor || "Sem gestor";
        acc.set(key, (acc.get(key) ?? 0) + 1);
        return acc;
      }, new Map<string, number>())
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const months = Array.from(new Set(exited.map((record) => monthKey(record.exit!))))
      .sort()
      .slice(-12);

    return months.map((key) => {
      const date = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1);
      const row: Record<string, any> = { mes: monthNames[date.getMonth()], tooltipLabel: monthLabel(date) };
      topGestores.forEach((gestor) => {
        row[gestor] = exited.filter((record) => monthKey(record.exit!) === key && (record.gestor || "Sem gestor") === gestor).length;
      });
      return row;
    });
  }, [prepared]);

  const ltvDistribution = useMemo(() => {
    const bins = [
      { faixa: "0–3", min: 0, max: 3 },
      { faixa: "4–6", min: 4, max: 6 },
      { faixa: "7–12", min: 7, max: 12 },
      { faixa: "13–18", min: 13, max: 18 },
      { faixa: "19+", min: 19, max: Number.POSITIVE_INFINITY }
    ];
    return bins.map((bin) => ({
      faixa: bin.faixa,
      quantidade: prepared.filter((record) => {
        const ltv = record.ltv_meses ?? 0;
        return ltv >= bin.min && ltv <= bin.max;
      }).length
    }));
  }, [prepared]);

  const healthByOrigin = useMemo(() => {
    const grouped = new Map<string, { origem: string; bom: number; alerta: number; critico: number }>();
    prepared
      .filter((record) => record.ativo === "Sim")
      .forEach((record) => {
        const origem = record.origem || "Sem origem";
        if (!grouped.has(origem)) {
          grouped.set(origem, { origem, bom: 0, alerta: 0, critico: 0 });
        }
        const item = grouped.get(origem)!;
        if (record.status === "bom") item.bom += 1;
        if (record.status === "alerta") item.alerta += 1;
        if (record.status === "critico") item.critico += 1;
      });

    return Array.from(grouped.values()).sort((a, b) => b.bom + b.alerta + b.critico - (a.bom + a.alerta + a.critico));
  }, [prepared]);

  const gestorMatrix = useMemo(() => {
    const gestores = buildGestorMetricsFromBase(prepared as BaseClienteDetalhado[]);
    return gestores.map((gestor) => ({
      gestor: gestor.nome,
      carteira: gestor.ativos,
      taxa_sucesso: Number(gestor.taxa_sucesso.toFixed(1)),
      ltv_medio: Number(gestor.ltv_medio.toFixed(1)),
      color:
        gestor.taxa_sucesso >= 65
          ? "var(--success-color)"
          : gestor.taxa_sucesso >= 45
            ? "var(--warning-color)"
            : "var(--danger-color)"
    }));
  }, [prepared]);

  const missingData = !data.base_clientes_detalhada?.length;

  return (
    <div className="space-y-8 pb-10">
      {missingData ? (
        <SummaryCard
          title="Republie o Apps Script"
          description="Para liberar estas análises, publique a versão do Apps Script que inclui base_clientes_detalhada no payload."
        >
          <p className="theme-muted text-sm">
            A página já está pronta no frontend, mas depende do campo `base_clientes_detalhada` para montar cohort, churn por origem/gestor, distribuição de LTV e matriz de performance.
          </p>
        </SummaryCard>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SummaryCard title="Cohort de retenção" description="Mostra retenção real por safra de entrada ao longo dos primeiros meses.">
          <CohortRetentionHeatmap rows={cohortRows} />
        </SummaryCard>
        <SummaryCard title="Distribuição de LTV" description="Mostra como a carteira se distribui entre faixas de permanência.">
          <LtvDistributionChart data={ltvDistribution} />
        </SummaryCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SummaryCard title="Churn por origem de cliente" description="Mostra quais origens concentram mais saídas em cada mês.">
          <ChurnByDimensionChart data={churnByOrigin} dimensionLabel="Origem" />
        </SummaryCard>
        <SummaryCard title="Churn por gestor" description="Mostra quais carteiras concentram mais saídas ao longo do tempo.">
          <ChurnByDimensionChart data={churnByGestor} dimensionLabel="Gestor" />
        </SummaryCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SummaryCard title="Saúde por origem de cliente" description="Cruza qualidade da carteira com a empresa de origem do lead.">
          <HealthByOriginChart data={healthByOrigin} />
        </SummaryCard>
        <SummaryCard title="Matriz de performance por gestor" description="Cruza tamanho da carteira, taxa de sucesso e LTV médio por mês em uma única leitura.">
          <GestorMatrixChart data={gestorMatrix} />
        </SummaryCard>
      </div>
    </div>
  );
}

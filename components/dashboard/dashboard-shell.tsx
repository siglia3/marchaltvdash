"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useClientesData } from "@/hooks/use-clientes-data";
import { ClientesDashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DashboardErrorState, DashboardSkeleton } from "@/components/dashboard/dashboard-shared";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
};

const navItems: NavItem[] = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/gestores", label: "Por Gestor", icon: Users },
  { href: "/evolucao-mensal", label: "Evolução Mensal", icon: TrendingUp },
  { href: "/registro-de-saidas", label: "Registro de Saídas", icon: LogOut }
];

export function DashboardShell({
  title,
  description,
  updatedAt,
  loading,
  onRefresh,
  children
}: {
  title: string;
  description: string;
  updatedAt?: string;
  loading: boolean;
  onRefresh: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="border-b border-slate-200 bg-sidebar md:sticky md:top-0 md:h-screen md:w-[280px] md:border-b-0 md:border-r">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-6 py-6">
              <Image
                src="/logomarcha.png"
                alt="Marcha Ads"
                width={700}
                height={495}
                priority
                className="h-auto w-full max-w-[172px]"
              />
            </div>

            <nav className="space-y-1 px-4 py-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left transition duration-200",
                      isActive
                        ? "bg-blue-50 text-primary"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-full p-2 transition",
                        isActive ? "bg-white text-primary shadow-sm" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-primary">
                  MD
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Marcha Digital</p>
                  <p className="text-xs text-slate-500">Agência de Tráfego Pago</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1380px]">
          <header className="mb-6 rounded-[24px] border border-slate-200 bg-white px-6 py-5 shadow-panel">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Dashboard / Saúde de Clientes</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Última atualização: <span className="font-semibold text-slate-900">{updatedAt ?? "—"}</span>
                </div>
                <Button className="rounded-[16px] bg-primary text-white hover:bg-blue-600" onClick={onRefresh}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
            </div>
          </header>

          <div className="scrollbar-subtle mb-8 flex gap-3 overflow-x-auto pb-2 md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition",
                    isActive
                      ? "border-blue-100 bg-blue-50 text-primary"
                      : "border-slate-200 bg-white text-slate-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardDataPage({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: (data: ClientesDashboardData) => ReactNode;
}) {
  const { data, loading, error, refetch } = useClientesData();

  return (
    <DashboardShell
      title={title}
      description={description}
      updatedAt={data?.atualizado_em}
      loading={loading}
      onRefresh={() => void refetch()}
    >
      {loading ? (
        <DashboardSkeleton />
      ) : error || !data ? (
        <DashboardErrorState
          message={error ?? "Nenhum dado retornado pela API."}
          onRetry={() => void refetch()}
        />
      ) : (
        children(data)
      )}
    </DashboardShell>
  );
}

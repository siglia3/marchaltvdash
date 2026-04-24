import { notFound } from "next/navigation";
import { ClienteFiltro, ClientesPage } from "@/components/dashboard/clientes-page";

const validFilters: ClienteFiltro[] = ["ativos", "bons", "alerta", "critico"];

export default function ClientesFiltroPage({
  params
}: {
  params: { filtro: string };
}) {
  const { filtro } = params;

  if (!validFilters.includes(filtro as ClienteFiltro)) {
    notFound();
  }

  return <ClientesPage filter={filtro as ClienteFiltro} />;
}

import { NextResponse } from "next/server";

function extractAppsScriptError(html: string) {
  const match = html.match(/Error:\s*([^<]+)</i);
  return match?.[1]?.trim() ?? null;
}

export async function GET() {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      {
        error: "Defina API_URL ou NEXT_PUBLIC_API_URL para carregar os dados da planilha."
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `A API externa respondeu com status ${response.status}.`
        },
        { status: response.status }
      );
    }

    const rawPayload = await response.text();
    let payload: unknown;

    try {
      payload = JSON.parse(rawPayload);
    } catch {
      const appsScriptError = extractAppsScriptError(rawPayload);
      return NextResponse.json(
        {
          error: appsScriptError
            ? `A implantação atual do Apps Script está desatualizada: ${appsScriptError}`
            : "A API externa não retornou JSON válido. Revise a implantação atual do Apps Script."
        },
        { status: 502 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao consultar a API externa."
      },
      { status: 502 }
    );
  }
}

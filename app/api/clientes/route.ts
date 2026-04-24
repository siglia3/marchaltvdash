import { NextResponse } from "next/server";

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

    const payload = await response.json();
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

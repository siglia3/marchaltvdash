import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saúde de Clientes — Marcha Ads",
  description: "Dashboard interno para acompanhamento da carteira de clientes da Marcha Ads."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem("marcha-theme");
                  var preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                  var theme = saved === "light" || saved === "dark" ? saved : preferred;
                  document.documentElement.setAttribute("data-theme", theme);
                } catch (e) {
                  document.documentElement.setAttribute("data-theme", "dark");
                }
              })();
            `
          }}
        />
        {children}
      </body>
    </html>
  );
}

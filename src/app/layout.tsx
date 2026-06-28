import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppFooter } from "@/components/app-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HostPro Workspace",
  description:
    "Gestão de alojamentos locais na Costa do Estoril — operações, reservas e proprietários num só hub.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

// Viewport explícito — `viewport-fit=cover` deixa o background levar até às
// margens do notch no iPhone; `user-scalable=yes` deixa o utilizador fazer
// pinch-zoom (vital em tabelas P&L densas).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#142030",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* `flex flex-col min-h-0` dá às páginas um contentor de altura
            definida — a home usa-o para preencher exactamente o ecrã (menos
            o footer) e ficar sem scroll; as outras páginas crescem na mesma
            via o seu próprio `min-h-screen`. */}
        <div className="flex flex-1 flex-col min-h-0">{children}</div>
        <AppFooter />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/500.css";
import "@fontsource/noto-sans-jp/700.css";
import "@fontsource/noto-sans-jp/900.css";
import AuthGuard from "./components/auth-guard";
import { AuthProvider } from "./components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "キズナノート",
  description: "大切なつながりを記録するキュレーションノート",
  icons: {
    icon: "/brand/kizunanote-favicon.svg",
    shortcut: "/brand/kizunanote-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}

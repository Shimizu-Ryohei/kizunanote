import type { Metadata } from "next";
import AuthGuard from "./components/auth-guard";
import { AuthProvider } from "./components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "キズナノート",
  description: "大切なつながりを記録するキュレーションノート",
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

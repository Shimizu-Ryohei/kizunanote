"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./auth-provider";

const PUBLIC_PATH_PREFIXES = ["/sign-in", "/sign-up"];
const UNGUARDED_PATH_PREFIXES = ["/settings/change-login-id/complete"];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    const isUnguardedPath = UNGUARDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (isLoading) {
      return;
    }

    if (isUnguardedPath) {
      return;
    }

    if (!user && !isPublicPath) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user && isPublicPath) {
      router.replace("/home");
    }
  }, [isLoading, pathname, router, user]);

  const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isUnguardedPath = UNGUARDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] text-[14px] font-medium text-[#7a7a7a]">
        読み込み中...
      </div>
    );
  }

  if (isUnguardedPath) {
    return <>{children}</>;
  }

  if (!user && !isPublicPath) {
    return null;
  }

  if (user && isPublicPath) {
    return null;
  }

  return <>{children}</>;
}

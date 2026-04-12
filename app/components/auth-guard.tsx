"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./auth-provider";

const PUBLIC_PATHS = new Set(["/sign-in", "/sign-up"]);

export default function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user && !PUBLIC_PATHS.has(pathname)) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user && PUBLIC_PATHS.has(pathname)) {
      router.replace("/home");
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] text-[14px] font-medium text-[#7a7a7a]">
        読み込み中...
      </div>
    );
  }

  if (!user && !PUBLIC_PATHS.has(pathname)) {
    return null;
  }

  if (user && PUBLIC_PATHS.has(pathname)) {
    return null;
  }

  return <>{children}</>;
}

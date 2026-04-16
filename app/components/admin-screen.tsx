"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import MobileShell from "./mobile-shell";
import {
  getAdminContactInquiries,
  getAdminDashboardStats,
  type AdminContactInquiry,
  getCurrentUserRole,
  type AdminDashboardStats,
} from "@/lib/firebase/admin";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <section className="rounded-[18px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <p className="text-[13px] font-bold text-[#6a6a6a]">{label}</p>
      <p className="mt-3 text-[28px] font-black leading-none text-[#1f1f1f]">{value}</p>
    </section>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [contactInquiries, setContactInquiries] = useState<AdminContactInquiry[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    getCurrentUserRole(user.uid, user.email)
      .then((role) => {
        if (!isMounted) {
          return;
        }

        if (role !== "admin") {
          router.replace("/home");
          return;
        }

        return Promise.all([getAdminDashboardStats(), getAdminContactInquiries()])
          .then(([nextStats, nextInquiries]) => {
            if (!isMounted) {
              return;
            }

            setStats(nextStats);
            setContactInquiries(nextInquiries);
            setErrorMessage("");
          })
          .catch((error) => {
            console.error(error);

            if (!isMounted) {
              return;
            }

            setErrorMessage("管理画面データの取得に失敗しました。");
          })
          .finally(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          });
      })
      .catch((error) => {
        console.error(error);

        if (!isMounted) {
          return;
        }

        router.replace("/home");
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingRole(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router, user]);

  if (isCheckingRole || isLoading) {
    return (
      <MobileShell>
        <main className="px-4 pb-28">
          <p className="mt-6 text-[14px] font-medium text-[#7a7a7a]">管理画面を読み込み中...</p>
        </main>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2">
          <h1 className="text-[22px] font-black text-black">管理画面</h1>
          <p className="mt-2 text-[14px] font-medium leading-6 text-[#7c7c7c]">
            ユーザー数やプラン状況を確認できます。
          </p>
        </section>

        {errorMessage ? (
          <p className="mt-6 text-[13px] font-medium text-[#d64253]">{errorMessage}</p>
        ) : null}

        {stats ? (
          <section className="mt-6 space-y-4">
            <StatCard label="総ユーザー数" value={stats.totalUsers} />
            <section className="rounded-[18px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
              <p className="text-[13px] font-bold text-[#6a6a6a]">プラン別ユーザー数</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-[14px] bg-[#f7f7f7] px-3 py-4 text-center">
                  <p className="text-[11px] font-bold text-[#6a6a6a]">Standard</p>
                  <p className="mt-2 text-[22px] font-black leading-none text-[#1f1f1f]">
                    {stats.planCounts.standard}
                  </p>
                </div>
                <div className="rounded-[14px] bg-[#f7f7f7] px-3 py-4 text-center">
                  <p className="text-[11px] font-bold text-[#6a6a6a]">Plus</p>
                  <p className="mt-2 text-[22px] font-black leading-none text-[#1f1f1f]">
                    {stats.planCounts.plus}
                  </p>
                </div>
                <div className="rounded-[14px] bg-[#f7f7f7] px-3 py-4 text-center">
                  <p className="text-[11px] font-bold text-[#6a6a6a]">Pro</p>
                  <p className="mt-2 text-[22px] font-black leading-none text-[#1f1f1f]">
                    {stats.planCounts.pro}
                  </p>
                </div>
              </div>
            </section>
            <StatCard label="今月の新規登録ユーザー数" value={stats.currentMonthNewUsers} />
            <StatCard label="今月の解約ユーザー数" value={stats.currentMonthCanceledUsers} />
          </section>
        ) : null}

        <section className="mt-6 rounded-[18px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
          <h2 className="text-[16px] font-black text-[#1f1f1f]">お問い合わせ一覧</h2>
          {contactInquiries.length ? (
            <div className="mt-4 space-y-4">
              {contactInquiries.map((inquiry) => (
                <article key={inquiry.id} className="rounded-[14px] bg-[#f7f7f7] px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-black text-[#1f1f1f]">
                        {inquiry.subject}
                      </p>
                      <p className="mt-1 truncate text-[12px] font-medium text-[#6a6a6a]">
                        {inquiry.email}
                      </p>
                    </div>
                    <p className="shrink-0 text-[11px] font-medium text-[#8a8a8a]">
                      {inquiry.createdAtLabel}
                    </p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-[13px] font-medium leading-6 text-[#4a4a4a]">
                    {inquiry.message}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[13px] font-medium text-[#7a7a7a]">
              まだお問い合わせはありません。
            </p>
          )}
        </section>
      </main>
    </MobileShell>
  );
}

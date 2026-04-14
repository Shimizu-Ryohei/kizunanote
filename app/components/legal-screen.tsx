"use client";

import MobileShell from "./mobile-shell";

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <h2 className="text-[15px] font-bold text-[#1f1f1f]">{title}</h2>
      <div className="mt-4 space-y-4 text-[12px] leading-6 font-medium text-[#5d5d5d]">
        {children}
      </div>
    </section>
  );
}

export default function LegalScreen() {
  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2 space-y-4">
          <LegalSection title="利用規約">
            <p>
              本サービス「キズナノート」は、ユーザーが人との関係性や会話内容等を記録し、振り返るためのサービスです。ユーザーは、本規約に同意のうえ本サービスを利用するものとします。
            </p>
            <p>
              ユーザーは、法令または公序良俗に反する目的で本サービスを利用してはならず、第三者の権利を侵害する情報、虚偽情報、または不適切な情報を登録してはなりません。
            </p>
            <p>
              本サービスに登録された内容は、ユーザー自身の責任で管理されるものとします。当社は、ユーザーが登録した情報の正確性、完全性、有用性を保証しません。
            </p>
            <p>
              当社は、必要に応じて本サービスの内容を変更、停止、終了することがあります。また、規約の内容を変更する場合があります。
            </p>
            <p>
              ユーザーは、いつでも所定の方法により退会できます。退会後のデータの取扱いについては、当社所定の方法に従うものとします。
            </p>
          </LegalSection>

          <LegalSection title="プライバシーポリシー">
            <p>
              当社は、ユーザー登録情報、プロフィール情報、連絡先情報、キズナノート、通知設定等、本サービスの提供に必要な情報を取得します。
            </p>
            <p>
              取得した情報は、本サービスの提供、本人確認、通知配信、機能改善、不正利用防止、お問い合わせ対応のために利用します。
            </p>
            <p>
              本サービスでは、キズナノートの要約生成のために外部AIサービスを利用する場合があります。この場合、要約生成に必要な範囲で情報が外部サービスに送信されることがあります。
            </p>
            <p>
              当社は、法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。
            </p>
            <p>
              ユーザーは、当社所定の方法により、自己に関する情報の確認、訂正、削除を求めることができます。
            </p>
          </LegalSection>
        </section>
      </main>
    </MobileShell>
  );
}

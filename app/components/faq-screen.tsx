"use client";

import MobileShell from "./mobile-shell";

function FaqSection({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <h2 className="text-[14px] font-bold leading-6 text-[#1f1f1f]">{question}</h2>
      <div className="mt-3 text-[12px] leading-6 font-medium text-[#5d5d5d]">{answer}</div>
    </section>
  );
}

export default function FaqScreen() {
  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2 space-y-4">
          <FaqSection
            question="Q. キズナノートとは何ですか？"
            answer="A. 会話した内容や相手の特徴、誕生日や勤務先などの情報を記録し、人との関係を継続的に深めるためのサービスです。"
          />
          <FaqSection
            question="Q. キズナノートはSNSですか？他の誰かに情報は共有されますか？"
            answer="A. キズナノートはSNSではなく、ユーザー自身が人との関係を整理するための個人利用サービスです。登録した情報が他のユーザーに公開・共有されることはありません。"
          />
          <FaqSection
            question="Q. キズナノート要約はどのように更新されますか？"
            answer="A. キズナノートを追加・編集すると要約待ち状態になり、通常は毎朝5:00頃に最新内容に更新されます。Proプランでは任意のタイミングで即時に要約を更新することができます。"
          />
          <FaqSection
            question="Q. 通知設定では何を変更できますか？"
            answer="A. プッシュ通知とメール通知の受け取り有無を切り替えられます。誕生日通知などキズナを深めるためのコミュニケーションサポート等が通知されます。"
          />
          <FaqSection
            question="Q. プロフィールは何名まで登録できますか？"
            answer="A. Standardプランでは20名まで登録できます。Plusプラン以上ではプロフィール登録数に上限はありません。"
          />
          <FaqSection
            question="Q. 登録したデータはどこで管理されますか？"
            answer="A. アカウント情報、プロフィール、通知設定などは当サービスが管理するクラウドサーバー上に保存されます。詳細は利用規約等のページをご確認ください。"
          />
        </section>
      </main>
    </MobileShell>
  );
}

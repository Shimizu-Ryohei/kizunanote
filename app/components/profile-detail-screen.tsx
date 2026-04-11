import Image from "next/image";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";

const notes = [
  "Tech Conf 2025で登壇。AI駆動のウェブレイアウト設計について話したのが最初の接点。",
  "コーヒー派（ブラック）。幼馴染のゆみこであることを記憶。",
  "現在はデザイントリオ、ブランディング設計に特化した小規模スタジオを経営。",
  "週末は野球と写真。今年のテーマは\"シンプルな光\"。",
  "次回は新しいプロジェクトのプロトタイプについて相談予定。",
];

const contacts = [
  { icon: "◔", label: "電話番号", value: "090-1234-5678" },
  { icon: "✉", label: "メールアドレス", value: "k.sato@studio.jp" },
  { icon: "X", label: "X(TWITTER)", value: "@kento_sato" },
  { icon: "◎", label: "INSTAGRAM", value: "kento.sato.profile" },
];

function ContactCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-[13px] font-bold text-[#444]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-[#9d9d9d]">{label}</p>
        <p className="truncate text-[12px] font-bold text-[#2a2a2a]">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileDetailScreen() {
  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="flex items-start gap-4">
          <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ededed]">
            <Image
              alt="佐藤健太郎"
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&h=160&q=80"
              width={58}
              height={58}
              className="h-full w-full object-cover grayscale"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-[16px] font-black text-[#222]">佐藤 健太郎</h1>
            <p className="mt-1 text-[9px] font-bold text-[#888]">Tech Conf 2025</p>
            <p className="mt-1 text-[8px] font-medium text-[#aeaeae]">
              Birthday: 1992年11月20日
            </p>
          </div>
        </section>

        <p className="mt-4 text-[8px] font-medium text-[#9f9f9f]">
          最終コンタクト: 2024年11月18日
        </p>

        <section className="mt-4 rounded-lg bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
          <h2 className="text-[10px] font-bold text-[#1f1f1f]">キズナノート要約</h2>
          <ul className="mt-3 space-y-3 text-[10px] font-medium leading-5 text-[#333]">
            {notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-4 ml-auto block text-[8px] font-medium text-[#a8a8a8] underline"
          >
            すべての人物履歴を見る
          </button>
        </section>

        <section className="mt-6">
          <h2 className="text-[11px] font-bold text-[#4b4b4b]">キズナノート</h2>
          <textarea
            placeholder="現在の内容、前回や前後など、このヒトの情報を、なんでもよいので入力してください。"
            className="mt-3 min-h-[140px] w-full resize-none rounded-lg bg-white px-4 py-4 text-[12px] font-medium text-black outline-none placeholder:text-[#c0c0c0]"
          />
          <PrimaryCta className="mt-6">
            保存する
          </PrimaryCta>
        </section>

        <section className="mt-7">
          <h2 className="text-[11px] font-bold text-[#4b4b4b]">連絡先情報</h2>
          <div className="mt-3 rounded-lg bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
          <div className="mt-4 space-y-3">
            {contacts.map((contact) => (
              <ContactCard key={contact.label} {...contact} />
            ))}
          </div>
          <button
            type="button"
            className="mx-auto mt-5 block text-[8px] font-medium text-[#8d8d8d]"
          >
            編集する
          </button>
          </div>
        </section>
      </main>
    </MobileShell>
  );
}

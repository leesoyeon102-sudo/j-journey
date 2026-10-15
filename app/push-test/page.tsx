import type { Metadata } from "next";
import Header from "@/components/Header";
import PushSetup from "@/components/PushSetup";

// 푸시 알림이 오는지 확인하는 임시 화면. 검색에 나오지 않게 한다.
export const metadata: Metadata = { title: "푸시 알림 확인", robots: { index: false, follow: false } };

export default function PushTestPage() {
  return (
    <main className="fade-in">
      <Header title="푸시 알림 확인" sub="알림이 이 기기로 오는지 확인하는 화면이에요." />
      <PushSetup />
    </main>
  );
}

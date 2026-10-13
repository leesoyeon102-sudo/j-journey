import type { Metadata, Viewport } from "next";
import { Hahmlet } from "next/font/google";
import "./globals.css";
import AmplitudeInit from "@/components/AmplitudeInit";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import LeaveConfirm from "@/components/LeaveConfirm";
import TabBar from "@/components/TabBar";
import ThemeColor from "@/components/ThemeColor";

// 함렛(Hahmlet, 구글 글꼴·OFL). 굵기 100~900 가변 글꼴이고, 한글은 조각(unicode-range)으로 나뉘어 필요한 글자만 내려받는다.
const hahmlet = Hahmlet({ preload: false, variable: "--font-hahmlet", display: "swap" });

export const metadata: Metadata = {
  title: "J의 외출",
  description: "약속 시각만 넣으면 몇 시에 집을 나서 어떤 열차를 타야 하는지 알려주는 약속 출발 플래너",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // 상태 표시줄 기본색 = sky-pale. 화면마다 ThemeColor가 맨 위 배경색으로 바꾼다.
  themeColor: "#d6e8fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={hahmlet.variable}>
      <body>
        <AmplitudeInit />
        <ThemeColor />
        <div className="app-shell pb-20">
          {children}
          <TabBar />
          <LeaveConfirm />
          <FeedbackPrompt />
        </div>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import AmplitudeInit from "@/components/AmplitudeInit";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import LeaveConfirm from "@/components/LeaveConfirm";
import TabBar from "@/components/TabBar";
import ThemeColor from "@/components/ThemeColor";

export const metadata: Metadata = {
  title: "J의 외출",
  description: "약속 시각만 넣으면 몇 시에 집을 나서 어떤 열차를 타야 하는지 알려주는 약속 출발 플래너",
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "J의 외출", statusBarStyle: "default" },
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
    <html lang="ko">
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

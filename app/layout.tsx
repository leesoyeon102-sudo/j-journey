import type { Metadata, Viewport } from "next";
import "./globals.css";
import LeaveConfirm from "@/components/LeaveConfirm";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "J의 외출",
  description: "약속 시각만 넣으면 몇 시에 집을 나서 어떤 열차를 타야 하는지 알려주는 약속 출발 플래너",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="app-shell pb-20">
          {children}
          <TabBar />
          <LeaveConfirm />
        </div>
      </body>
    </html>
  );
}

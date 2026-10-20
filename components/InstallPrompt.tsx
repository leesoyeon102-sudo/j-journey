"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import InstallAlert from "@/components/InstallAlert";
import { dismissInstallAlert, readInstallKind } from "@/lib/install";

/**
 * 아이폰에서 홈 화면에 추가하지 않고 들어오면 한 번 안내한다.
 * 닫으면 이번 접속 동안은 다시 띄우지 않는다. 랜딩(/welcome)은 같은 안내가 화면에 이미 있어서 띄우지 않는다.
 */
export default function InstallPrompt() {
  const pathname = usePathname();
  const router = useRouter();
  // 기기·브라우저는 클라이언트에서만 알 수 있어서 서버 렌더에서는 안내 없음(none)으로 둔다.
  const kind = useSyncExternalStore(
    () => () => {},
    readInstallKind,
    () => "none" as const,
  );
  const [closed, setClosed] = useState(false);

  if (kind === "none" || closed || pathname.startsWith("/welcome")) return null;

  const close = () => {
    dismissInstallAlert();
    setClosed(true);
  };

  return (
    <InstallAlert
      inApp={kind === "inapp"}
      onClose={close}
      onGuide={() => {
        close();
        router.push("/welcome#install");
      }}
    />
  );
}

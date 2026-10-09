"use client";

import { useEffect } from "react";
import * as amplitude from "@amplitude/analytics-browser";

let initialized = false;

// 클릭한 요소의 글자·라벨·링크·속성에는 집 주소, 출발지·도착지 이름 같은 민감한 정보가 들어갈 수 있다.
// autocapture가 이런 값을 이벤트에 실어 보내지 못하게 전송 직전에 지운다.
const SENSITIVE_PROPERTIES = [
  "[Amplitude] Element Text",
  "[Amplitude] Element Aria Label",
  "[Amplitude] Element Parent Label",
  "[Amplitude] Element Href",
  "[Amplitude] Element Attributes",
  "[Amplitude] Element Hierarchy",
];

/** Amplitude를 브라우저에서 한 번만 초기화한다. 화면에는 아무것도 그리지 않는다. */
export default function AmplitudeInit() {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
    // 키가 없으면(로컬에서 아직 안 넣었을 때 등) 조용히 건너뛴다.
    if (!apiKey || initialized) return;
    initialized = true;
    // init보다 먼저 등록해서, 처음 이벤트부터 걸러진다.
    amplitude.add({
      name: "strip-sensitive-element-text",
      type: "before",
      setup: async () => undefined,
      execute: async (event) => {
        const props = event.event_properties as Record<string, unknown> | undefined;
        if (props) for (const key of SENSITIVE_PROPERTIES) delete props[key];
        return event;
      },
    });
    amplitude.init(apiKey, {
      autocapture: {
        pageViews: true, // 페이지뷰
        formInteractions: true, // 폼 입력·제출
        elementInteractions: true, // 클릭 (기본은 꺼져 있다)
      },
    });
  }, []);

  return null;
}

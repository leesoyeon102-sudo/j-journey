"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import AlertPanel from "@/components/AlertPanel";
import { Button } from "@/components/ui/button";

interface Props {
  /** 인스타그램 같은 앱 안의 브라우저로 열었는지. 이 경우에는 사파리로 다시 열어야 한다. */
  inApp?: boolean;
  /** 확인을 눌렀을 때 */
  onClose: () => void;
}

const SLIDES = [
  { src: "/landing/install-share.jpeg", alt: "사파리 화면 아래 가운데의 공유 버튼", caption: "1. 사파리 아래의 공유 버튼을 눌러요" },
  { src: "/landing/install-add.jpeg", alt: "공유 메뉴에서 홈 화면에 추가 항목", caption: "2. '홈 화면에 추가'를 눌러요" },
  { src: "/landing/install-open.jpeg", alt: "홈 화면에 생긴 J의 외출 앱 아이콘", caption: "3. 홈 화면의 J의 외출 아이콘으로 열어요" },
];

/** 홈 화면에 추가하는 방법을 옆으로 넘겨 보는 이미지 슬라이드. 손가락으로 밀거나 양옆 화살표로 넘긴다. */
function InstallSlides() {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative w-full">
        <div
          ref={track}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-input bg-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SLIDES.map((s) => (
            <div key={s.src} className="relative h-44 w-full shrink-0 snap-center">
              <Image src={s.src} alt={s.alt} fill sizes="276px" className="object-contain" />
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="이전 방법"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          className="glass-strong absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-pill transition-opacity disabled:opacity-35"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <button
          type="button"
          aria-label="다음 방법"
          disabled={index === SLIDES.length - 1}
          onClick={() => goTo(index + 1)}
          className="glass-strong absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-pill transition-opacity disabled:opacity-35"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>
      <p className="text-caption-lg text-muted-foreground">{SLIDES[index]?.caption}</p>
      <div className="flex gap-1.5" aria-hidden="true">
        {SLIDES.map((s, i) => (
          <span key={s.src} className={`size-1.5 rounded-pill ${i === index ? "bg-primary" : "bg-toggle-off"}`} />
        ))}
      </div>
    </div>
  );
}

/** 아이폰에서 홈 화면에 추가하지 않고 열었을 때 띄우는 안내 얼럿. 홈 화면 앱에서만 도착 푸시가 오기 때문이다. */
export default function InstallAlert({ inApp = false, onClose }: Props) {
  if (inApp) {
    return (
      <AlertPanel
        title="사파리에서 열어 주세요"
        description="지금 보고 있는 화면에서는 홈 화면에 추가할 수 없어요. 메뉴(···)에서 'Safari로 열기'를 누른 뒤 홈 화면에 추가해 주세요."
      >
        <Button size="lg" onClick={onClose}>
          확인
        </Button>
      </AlertPanel>
    );
  }
  return (
    <AlertPanel
      title="홈 화면에 추가하고 써 주세요"
      description="아이폰은 홈 화면에 추가한 앱에서만 도착 알림이 와요. 옆으로 넘겨서 방법을 확인해 주세요."
      content={<InstallSlides />}
    >
      <Button size="lg" onClick={onClose}>
        확인
      </Button>
    </AlertPanel>
  );
}

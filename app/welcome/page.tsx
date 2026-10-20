import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import LandingArt from "@/components/LandingArt";
import SkyBackdrop from "@/components/SkyBackdrop";
import ThemeColor from "@/components/ThemeColor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SURVEY_URL } from "@/lib/survey";

export const metadata: Metadata = {
  title: "하루만 써보세요 · J의 외출",
  description: "약속 시각만 넣으면 몇 시에 나가야 하는지 알려주는 J의 외출을 하루 동안 써보고 설문에 참여해 주세요.",
};

const STEPS = [
  {
    title: "홈 화면에 추가하기 (아이폰 해당)",
    body: "아이폰은 위의 방법대로 꼭 홈 화면에 추가한 뒤 그 아이콘으로 열어 주세요. 추가한 앱에서만 도착 알림이 와요.",
  },
  {
    title: "집 주소와 알림 허용하기",
    body: "처음 열면 집 주소를 등록하고, 출발할 때 알림 허용을 눌러 주세요. 2분이면 끝나요.",
  },
  {
    title: "약속 하나만 넣어보기",
    body: "오늘이나 내일 약속의 도착지와 시각을 넣고, 안내받은 시각에 맞춰 나가 보세요.",
  },
  {
    title: "하루 뒤 설문 참여하기",
    body: "써보신 느낌을 3분 설문으로 알려 주세요. 솔직한 의견이 큰 도움이 돼요.",
  },
];

export default function WelcomePage() {
  return (
    <main className="relative isolate overflow-hidden pb-12">
      <ThemeColor token="sky" />
      <SkyBackdrop />

      <section className="px-5 pt-14">
        <Badge className="bg-glass-strong text-on-surface">하루 체험 참여자 모집</Badge>
        <h1 className="mt-4 text-display font-medium text-on-sky">
          약속 시각만
          <br />
          넣으세요
        </h1>
        <p className="mt-4 text-body-lg text-on-sky-muted">
          몇 시에 나가야 하는지, 어떤 열차를 타야 하는지 바로 알려 드려요. 하루만 써보고 의견을 들려 주세요.
        </p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/">
            지금 써보기
            <ArrowRightIcon />
          </Link>
        </Button>
      </section>

      <section className="mt-10 px-5">
        <div className="glass-strong flex items-center gap-4 rounded-nav p-4">
          <LandingArt variant="clock" />
          <div>
            <p className="text-caption text-muted-foreground">이렇게 알려 드려요</p>
            <p className="mt-1 text-body-md">도착 시각에서 거꾸로 계산해</p>
            <p className="mt-1 text-time font-medium text-brand">나갈 시각</p>
            <p className="mt-1 text-body text-muted-foreground">도보, 열차 대기, 환승 시간까지 자동으로 더해요.</p>
          </div>
        </div>
      </section>

      <section className="mt-2 px-5">
        <div className="glass-strong flex items-center gap-4 rounded-nav p-4">
          <LandingArt variant="gift" />
          <div>
            <p className="text-caption text-muted-foreground">참여 선물</p>
            <p className="mt-1 text-body-md font-medium [-webkit-text-stroke:0.3px]">추첨을 통해 치킨 기프티콘을 드려요</p>
            <p className="mt-1 text-body text-muted-foreground">
              하루 써보고 설문까지 참여해 주신 분 중 추첨해서 10월 26일에 발표해요.
            </p>
          </div>
        </div>
      </section>

      <section id="install" className="mt-10 scroll-mt-6 px-5">
        <Badge variant="destructive">아이폰 필수</Badge>
        <h2 className="mt-2 text-heading font-medium">아이폰이라면 꼭 먼저 해 주세요</h2>
        <p className="mt-2 rounded-nav bg-danger-subtle p-4 text-body font-medium text-on-danger [-webkit-text-stroke:0.3px]">
          홈 화면에 추가한 앱으로 열어야만 도착 알림이 와요. 링크로만 쓰면 알림을 받을 수 없으니 아래 방법을 꼭 따라 해 주세요.
        </p>
        <ol className="mt-4 space-y-2">
          <li className="glass-strong rounded-nav p-4">
            <h3 className="text-body-md font-medium [-webkit-text-stroke:0.3px]">1. 사파리 아래의 공유 버튼 누르기</h3>
            <Image
              src="/landing/install-share.jpeg"
              alt="사파리 화면 아래 가운데의 공유 버튼"
              width={1170}
              height={724}
              className="mt-3 w-full rounded-input border border-border"
            />
          </li>
          <li className="glass-strong rounded-nav p-4">
            <h3 className="text-body-md font-medium [-webkit-text-stroke:0.3px]">2. &apos;홈 화면에 추가&apos; 누르기</h3>
            <Image
              src="/landing/install-add.jpeg"
              alt="공유 메뉴에서 홈 화면에 추가 항목"
              width={1170}
              height={1278}
              className="mt-3 w-full rounded-input border border-border"
            />
          </li>
          <li className="glass-strong rounded-nav p-4">
            <h3 className="text-body-md font-medium [-webkit-text-stroke:0.3px]">3. 홈 화면에 생긴 J의 외출 아이콘으로 열기</h3>
            <Image
              src="/landing/install-open.jpeg"
              alt="홈 화면에 생긴 J의 외출 앱 아이콘"
              width={1169}
              height={350}
              className="mt-3 w-full rounded-input border border-border"
            />
            <p className="mt-3 text-body text-muted-foreground">
              앞으로는 사파리가 아니라 이 아이콘으로 열어 주세요. 인스타그램 안에서 열었다면 메뉴(···)에서 &apos;Safari로
              열기&apos;를 먼저 눌러 주세요.
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-10 px-5">
        <h2 className="text-heading font-medium">참여 방법</h2>
        <ol className="mt-4 space-y-2">
          {STEPS.map((step, i) => (
            <li key={step.title} className="glass-strong flex gap-3 rounded-nav p-4">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-primary text-caption font-medium text-on-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="text-body-md font-medium [-webkit-text-stroke:0.3px]">{step.title}</h3>
                <p className="mt-1 text-body text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 px-5">
        <div className="rounded-nav bg-note-fill p-4">
          <p className="text-body font-medium [-webkit-text-stroke:0.3px]">베타 버전이라 이런 점은 양해해 주세요</p>
          <p className="mt-1 text-body text-muted-foreground">
            지금은 서울·경기권 대중교통(지하철·버스)만 안내해요. 고속버스·시외버스는 아직 지원하지 않아요.
          </p>
        </div>
      </section>

      <section className="mt-10 px-5">
        <Button asChild size="lg" className="w-full">
          <Link href="/">
            J의 외출 시작하기
            <ArrowRightIcon />
          </Link>
        </Button>
        {SURVEY_URL && (
          <Button asChild variant="outline" size="lg" className="mt-2 w-full">
            <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer">
              하루 써본 뒤 설문하기
            </a>
          </Button>
        )}
      </section>
    </main>
  );
}

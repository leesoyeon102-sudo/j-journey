import type { Metadata } from "next";
import { ArrowRightIcon, CheckIcon, LoaderCircleIcon, MailIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "디자인 시스템 · J의 외출" };

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";

const VARIANTS: ButtonVariant[] = ["default", "outline", "secondary", "ghost", "destructive", "link"];

// 호버·포커스는 눈에 보이게 하려고 실제 상태와 같은 클래스를 고정해 보여 준다.
const HOVER: Record<ButtonVariant, string> = {
  default: "bg-graphite",
  outline: "bg-mist",
  secondary: "bg-hairline",
  ghost: "bg-mist",
  destructive: "bg-coral/20",
  link: "underline",
};
const FOCUS = "border-ink ring-3 ring-ink/15";

function Section({ id, title, desc, children }: { id: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 border-t border-hairline px-5 py-8">
      <h2 className="font-heading text-heading-sm font-medium tracking-tight">{title}</h2>
      <p className="mt-1 text-body-sm text-slate">{desc}</p>
      <div className="mt-6 space-y-7">{children}</div>
    </section>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-caption font-medium tracking-wide text-slate uppercase">{label}</p>
      {children}
    </div>
  );
}

function Cell({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      {children}
      <span className="text-caption text-fog">{caption}</span>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main>
      <header className="px-5 pb-8 pt-12">
        <Badge variant="secondary">shadcn/ui · radix-nova</Badge>
        <h1 className="mt-3 font-heading text-heading-sm font-medium tracking-tight">디자인 시스템</h1>
        <p className="mt-1 text-body-sm text-slate">
          button · input · card · badge · dialog 를 variant와 상태별로 모았어요. Contra 스타일 레퍼런스의 색, 둥글기, 그림자를 따릅니다.
        </p>
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="컴포넌트 바로가기">
          {["button", "input", "card", "badge", "dialog"].map((n) => (
            <a key={n} href={`#${n}`} className="rounded-tag bg-mist px-3 py-1 text-caption text-ink hover:bg-hairline">
              {n}
            </a>
          ))}
        </nav>
      </header>

      {/* ───────── Button ───────── */}
      <Section id="button" title="Button" desc="채움 버튼은 Charcoal 하나뿐. 모두 24px 알약 모양이에요.">
        <Group label="variant × 상태">
          <div className="space-y-5">
            {VARIANTS.map((v) => (
              <div key={v}>
                <p className="mb-2 text-body-sm font-medium">{v}</p>
                <div className="grid grid-cols-4 gap-2">
                  <Cell caption="기본">
                    <Button variant={v} size="sm">
                      버튼
                    </Button>
                  </Cell>
                  <Cell caption="호버">
                    <Button variant={v} size="sm" className={HOVER[v]}>
                      버튼
                    </Button>
                  </Cell>
                  <Cell caption="포커스">
                    <Button variant={v} size="sm" className={FOCUS}>
                      버튼
                    </Button>
                  </Cell>
                  <Cell caption="비활성">
                    <Button variant={v} size="sm" disabled>
                      버튼
                    </Button>
                  </Cell>
                </div>
              </div>
            ))}
          </div>
        </Group>

        <Group label="size">
          <div className="flex flex-wrap items-end gap-3">
            <Cell caption="xs">
              <Button size="xs">Button</Button>
            </Cell>
            <Cell caption="sm">
              <Button size="sm">Button</Button>
            </Cell>
            <Cell caption="default">
              <Button>Button</Button>
            </Cell>
            <Cell caption="lg">
              <Button size="lg">Button</Button>
            </Cell>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Cell caption="icon-xs">
              <Button size="icon-xs" aria-label="추가">
                <PlusIcon />
              </Button>
            </Cell>
            <Cell caption="icon-sm">
              <Button size="icon-sm" variant="outline" aria-label="추가">
                <PlusIcon />
              </Button>
            </Cell>
            <Cell caption="icon">
              <Button size="icon" variant="secondary" aria-label="추가">
                <PlusIcon />
              </Button>
            </Cell>
            <Cell caption="icon-lg">
              <Button size="icon-lg" variant="outline" aria-label="추가">
                <PlusIcon />
              </Button>
            </Cell>
          </div>
        </Group>

        <Group label="아이콘 · 로딩 · 전체 너비">
          <div className="flex flex-wrap gap-3">
            <Button>
              <MailIcon data-icon="inline-start" />
              메일 보내기
            </Button>
            <Button variant="outline">
              다음
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button disabled>
              <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
              처리 중
            </Button>
            <Button variant="destructive">
              <Trash2Icon data-icon="inline-start" />
              삭제
            </Button>
          </div>
          <Button size="lg" className="mt-4 w-full">
            전체 너비 버튼
          </Button>
        </Group>
      </Section>

      {/* ───────── Input ───────── */}
      <Section id="input" title="Input" desc="Mist 배경에 10px 둥글기. 포커스하면 테두리가 Ink로 바뀌어요.">
        <Group label="상태">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-caption text-slate">기본</span>
              <Input placeholder="Discover 1.5M+ creatives" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-caption text-slate">값 입력됨</span>
              <Input defaultValue="강동센트럴이비인후과" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-caption text-slate">포커스</span>
              <Input defaultValue="포커스된 모습" className="border-ink ring-3 ring-ink/10" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-caption text-slate">오류 (aria-invalid)</span>
              <Input defaultValue="잘못된 값" aria-invalid />
              <span className="mt-1.5 block text-caption text-wine">올바른 값을 입력해 주세요.</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-caption text-slate">비활성</span>
              <Input defaultValue="수정할 수 없어요" disabled />
            </label>
          </div>
        </Group>
        <Group label="type">
          <div className="space-y-3">
            <Input type="email" placeholder="이메일" />
            <Input type="password" placeholder="비밀번호" />
            <Input type="time" defaultValue="14:00" />
            <Input type="file" />
          </div>
        </Group>
      </Section>

      {/* ───────── Card ───────── */}
      <Section id="card" title="Card" desc="4px 모서리, Hairline 테두리, 12px 안쪽 여백.">
        <Group label="기본 구성 (header · content · footer)">
          <Card>
            <CardHeader>
              <CardTitle>안내 내역</CardTitle>
              <CardDescription>안내받은 경로를 한곳에 모아 봐요.</CardDescription>
              <CardAction>
                <Badge variant="secondary">3회</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p>천호역 → 경복궁역 · 5호선 환승 없이 44분</p>
            </CardContent>
            <CardFooter className="gap-2 border-t border-hairline">
              <Button size="sm">다시 안내받기</Button>
              <Button size="sm" variant="outline">
                삭제
              </Button>
            </CardFooter>
          </Card>
        </Group>

        <Group label="size sm · 내용만">
          <div className="grid grid-cols-2 gap-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle>작은 카드</CardTitle>
                <CardDescription>size=&quot;sm&quot;</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardContent>
                <p className="text-body-sm">내용만 있는 카드</p>
              </CardContent>
            </Card>
          </div>
        </Group>

        <Group label="이미지 · 강조 카드">
          <div className="space-y-3">
            <Card>
              <div className="aspect-[16/7] bg-mist" role="img" aria-label="이미지 자리" />
              <CardHeader>
                <CardTitle>이미지가 있는 카드</CardTitle>
                <CardDescription>이미지는 가장자리까지 꽉 채워요.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-charcoal bg-charcoal text-paper">
              <CardHeader>
                <CardTitle>Charcoal 카드</CardTitle>
                <CardDescription className="text-pearl">어두운 면은 한 줄에 하나만 두어요.</CardDescription>
              </CardHeader>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-iris bg-iris text-paper">
                <CardHeader>
                  <CardTitle>Iris</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-wine bg-wine text-paper">
                <CardHeader>
                  <CardTitle>Wine</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-orchid bg-orchid text-ink">
                <CardHeader>
                  <CardTitle>Orchid</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-lime bg-lime text-ink">
                <CardHeader>
                  <CardTitle>Lime</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </Group>
      </Section>

      {/* ───────── Badge ───────── */}
      <Section id="badge" title="Badge" desc="알약 모양 태그. 기본은 Charcoal 채움이에요.">
        <Group label="variant">
          <div className="flex flex-wrap gap-2">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="destructive">destructive</Badge>
            <Badge variant="ghost">ghost</Badge>
            <Badge variant="link">link</Badge>
          </div>
        </Group>
        <Group label="상태 (링크 배지: 기본 · 호버 · 포커스)">
          <div className="flex flex-wrap items-center gap-3">
            <Badge asChild variant="secondary">
              <a href="#badge">기본</a>
            </Badge>
            <Badge asChild variant="secondary" className="bg-hairline">
              <a href="#badge">호버</a>
            </Badge>
            <Badge asChild variant="secondary" className="border-ink ring-[3px] ring-ink/15">
              <a href="#badge">포커스</a>
            </Badge>
            <Badge variant="secondary" aria-invalid className="border-destructive">
              오류
            </Badge>
          </div>
        </Group>
        <Group label="아이콘 · 개수">
          <div className="flex flex-wrap gap-2">
            <Badge>
              <CheckIcon data-icon="inline-start" />
              제시간 도착
            </Badge>
            <Badge variant="outline">
              <MailIcon data-icon="inline-start" />
              알림
            </Badge>
            <Badge variant="secondary">
              <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
              계산 중
            </Badge>
            <Badge variant="destructive">3</Badge>
          </div>
        </Group>
      </Section>

      {/* ───────── Dialog ───────── */}
      <Section id="dialog" title="Dialog" desc="버튼을 눌러 직접 열어 볼 수 있어요. 아래에는 열린 모습을 정적으로 함께 보여 줘요.">
        <Group label="열어 보기">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">기본</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>출발 안내를 나갈까요?</DialogTitle>
                  <DialogDescription>안내 내역에서 다시 확인할 수 있어요.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">취소</Button>
                  </DialogClose>
                  <Button>나가기</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">입력 폼</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>장소 이름 바꾸기</DialogTitle>
                  <DialogDescription>목록에 보일 이름을 입력해 주세요.</DialogDescription>
                </DialogHeader>
                <Input placeholder="예: 우리 집" />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">취소</Button>
                  </DialogClose>
                  <Button>저장</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">삭제 확인</Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>기록을 모두 삭제할까요?</DialogTitle>
                  <DialogDescription>삭제하면 되돌릴 수 없어요. (닫기 버튼 없음)</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">취소</Button>
                  </DialogClose>
                  <Button variant="destructive">삭제</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Group>

        <Group label="열린 모습 (정적 미리보기)">
          <div className="rounded-nav border border-hairline bg-popover p-5 text-body-sm text-popover-foreground shadow-nav">
            {/* DialogTitle·Description은 Dialog 안에서만 쓸 수 있어 같은 모양의 일반 요소로 그린다. */}
            <DialogHeader>
              <h3 className="font-heading text-subheading leading-snug font-medium">기본 다이얼로그</h3>
              <p className="text-body-sm text-slate">제목, 설명, 버튼이 한 묶음으로 보여요.</p>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline">취소</Button>
              <Button>확인</Button>
            </DialogFooter>
          </div>
        </Group>
      </Section>
    </main>
  );
}

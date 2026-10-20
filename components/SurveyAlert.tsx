import { LinkIcon } from "lucide-react";
import AlertPanel from "@/components/AlertPanel";
import { Button } from "@/components/ui/button";

interface Props {
  /** 설문 주소 */
  href: string;
  /** 설문하러 가기를 눌렀을 때(링크는 새 탭으로 열린다) */
  onGo: () => void;
}

/** 도착했어요!를 누른 1초 뒤 한 번 띄우는 설문 참여 얼럿. 버튼은 하나라 설문으로 가야 닫힌다. */
export default function SurveyAlert({ href, onGo }: Props) {
  return (
    <AlertPanel
      title="사용해보신 소감을 들려주세요"
      description={
        <>
          3분이면 끝나는 짧은 설문이에요.
          <br />
          현재 서비스 개선에 참여자의 도움이 필요해요.
        </>
      }
    >
      <Button asChild size="lg">
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={onGo}>
          <LinkIcon className="size-5" />
          설문하러 가기
        </a>
      </Button>
    </AlertPanel>
  );
}

import AlertPanel from "@/components/AlertPanel";
import { Button } from "@/components/ui/button";

interface Props {
  /** 인스타그램 같은 앱 안의 브라우저로 열었는지. 이 경우에는 사파리로 다시 열어야 한다. */
  inApp?: boolean;
  /** 나중에·확인을 눌렀을 때 */
  onClose: () => void;
  /** 방법 보기를 눌렀을 때(사파리일 때만 보인다) */
  onGuide: () => void;
}

/** 아이폰에서 홈 화면에 추가하지 않고 열었을 때 띄우는 안내 얼럿. 홈 화면 앱에서만 도착 푸시가 오기 때문이다. */
export default function InstallAlert({ inApp = false, onClose, onGuide }: Props) {
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
      description="아이폰은 홈 화면에 추가한 앱에서만 도착 알림이 와요. 사파리 아래의 공유 버튼 → 홈 화면에 추가를 눌러 주세요."
    >
      <Button variant="secondary" size="lg" onClick={onClose}>
        나중에
      </Button>
      <Button size="lg" onClick={onGuide}>
        방법 보기
      </Button>
    </AlertPanel>
  );
}

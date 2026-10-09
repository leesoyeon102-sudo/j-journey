"use client";

import { useState } from "react";
import { StarIcon } from "lucide-react";
import AlertPanel from "@/components/AlertPanel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  /** 보내기를 눌렀을 때 */
  onSubmit: (rating: number, comment: string) => void;
  /** 나중에를 누르거나 바깥·Esc로 닫았을 때 */
  onClose: () => void;
}

const LABELS = ["", "별로예요", "아쉬워요", "보통이에요", "좋아요", "아주 좋아요"];

/** 첫 도착 기록 뒤 홈에서 한 번 띄우는 별점·의견 얼럿 */
export default function FeedbackAlert({ onSubmit, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <AlertPanel
      title="J의 외출, 어땠나요?"
      description="별점과 의견을 남겨 주시면 서비스를 고치는 데 큰 도움이 돼요."
      onClose={onClose}
      content={
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-1">
            <div role="radiogroup" aria-label="별점" className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n}점`}
                  onClick={() => setRating(n)}
                  className="flex size-11 items-center justify-center"
                >
                  <StarIcon className={`size-7 ${n <= rating ? "fill-primary text-primary" : "fill-inactive text-inactive"}`} />
                </button>
              ))}
            </div>
            <p className="h-5 text-caption text-muted-foreground">{LABELS[rating]}</p>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="불편했던 점이나 바라는 점을 적어 주세요 (선택)"
            maxLength={500}
            aria-label="의견"
          />
        </div>
      }
    >
      <Button variant="secondary" size="lg" onClick={onClose}>
        나중에
      </Button>
      <Button size="lg" disabled={rating === 0} onClick={() => onSubmit(rating, comment)}>
        보내기
      </Button>
    </AlertPanel>
  );
}

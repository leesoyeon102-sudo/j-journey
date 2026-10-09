import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// globals.css의 글자 크기 토큰(text-caption 등)을 글자 색(text-primary 등)과 구분하도록 알려 준다.
// 그렇지 않으면 className으로 색만 바꿔도 컴포넌트의 글자 크기가 같이 사라진다.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["caption", "caption-lg", "body", "body-sm", "body-lg", "label", "label-lg", "subheading", "heading", "heading-sm", "time", "display"] },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

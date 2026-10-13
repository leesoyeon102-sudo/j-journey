interface Props {
  title: string;
  sub?: React.ReactNode;
  /** 하늘 배경 위에 올리면 흰 글자로 바꾼다. */
  onSky?: boolean;
  /** 제목 줄 오른쪽 끝에 놓는 버튼 */
  action?: React.ReactNode;
}

export default function Header({ title, sub, onSky, action }: Props) {
  return (
    <header className="px-5 pb-4 pt-7">
      <div className="flex items-center justify-between">
        <h1 className={`text-heading font-semibold ${onSky ? "text-on-sky" : ""}`}>{title}</h1>
        {action}
      </div>
      {sub && <p className={`mt-1 text-body ${onSky ? "text-on-sky-muted" : "text-muted-foreground"}`}>{sub}</p>}
    </header>
  );
}

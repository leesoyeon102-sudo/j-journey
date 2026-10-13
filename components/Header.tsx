interface Props {
  title: string;
  sub?: React.ReactNode;
  /** 하늘 배경 위에 올리면 흰 글자로 바꾼다. */
  onSky?: boolean;
}

export default function Header({ title, sub, onSky }: Props) {
  return (
    <header className="px-5 pb-4 pt-7">
      <h1 className={`text-heading font-semibold ${onSky ? "text-on-sky" : ""}`}>{title}</h1>
      {sub && <p className={`mt-1 text-body ${onSky ? "text-on-sky-muted" : "text-muted-foreground"}`}>{sub}</p>}
    </header>
  );
}

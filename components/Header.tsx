export default function Header({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="px-5 pb-4 pt-12">
      <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-sm text-sub">{sub}</p>}
    </header>
  );
}

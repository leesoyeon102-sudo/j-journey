export default function Header({ title, sub }: { title: string; sub?: React.ReactNode }) {
  return (
    <header className="px-5 pb-4 pt-12">
      <h1 className="text-heading font-medium">{title}</h1>
      {sub && <p className="mt-1 text-body text-muted-foreground">{sub}</p>}
    </header>
  );
}

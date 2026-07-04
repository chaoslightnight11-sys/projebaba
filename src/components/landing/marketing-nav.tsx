import { Activity } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  ["Özellikler", "/features"],
  ["Fiyatlandırma", "/pricing"],
  ["Entegrasyonlar", "/integrations"],
  ["SSS", "/faq"],
  ["İletişim", "/contact"]
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur">
      <div className="container flex min-h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          ClinicNova
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}>
            Giriş
          </Link>
          <Link href="/demo" className={buttonVariants()}>
            Demo Talep Et
          </Link>
        </div>
      </div>
    </header>
  );
}

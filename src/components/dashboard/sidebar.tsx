import { Activity, BarChart3, BellRing, Boxes, CalendarDays, ClipboardCheck, CreditCard, HeartPulse, LayoutDashboard, MessageSquare, Plane, Settings, Stethoscope, Users, UserRoundCog } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/patients", label: "Hastalar", icon: Users },
  { href: "/dashboard/appointments", label: "Randevular", icon: CalendarDays },
  { href: "/dashboard/treatments", label: "Tedaviler", icon: Stethoscope },
  { href: "/dashboard/finance", label: "Finans", icon: CreditCard },
  { href: "/dashboard/stocks", label: "Stok", icon: Boxes },
  { href: "/dashboard/staff", label: "Personel", icon: UserRoundCog },
  { href: "/dashboard/consents", label: "Onamlar", icon: ClipboardCheck },
  { href: "/dashboard/surveys", label: "Anketler", icon: HeartPulse },
  { href: "/dashboard/communication", label: "İletişim", icon: MessageSquare },
  { href: "/dashboard/tourism", label: "Sağlık Turizmi", icon: Plane },
  { href: "/dashboard/recalls", label: "Recall", icon: BellRing },
  { href: "/dashboard/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Ayarlar", icon: Settings }
];

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn("flex h-full w-72 shrink-0 flex-col border-r bg-card", className)}>
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold">ClinicNova</div>
          <div className="text-xs text-muted-foreground">Klinik OS</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Mock entegrasyon</p>
            <Badge variant="success">Aktif</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">SMS, WhatsApp, POS, e-Fatura adapterleri hazır.</p>
        </div>
      </div>
    </aside>
  );
}

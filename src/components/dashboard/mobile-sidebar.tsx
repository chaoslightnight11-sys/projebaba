"use client";

import { Activity, BarChart3, BellRing, Boxes, CalendarDays, ClipboardCheck, CreditCard, HeartPulse, LayoutDashboard, Menu, MessageSquare, Plane, Settings, Stethoscope, Users, UserRoundCog, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="lg:hidden" variant="outline" size="icon" aria-label="Menü" onClick={() => setOpen(true)}>
        <Menu className="h-4 w-4" />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40" aria-label="Menüyü kapat" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[86vw] flex-col border-r bg-card shadow-soft">
            <div className="flex h-16 items-center justify-between border-b px-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">ClinicNova</div>
                  <div className="text-xs text-muted-foreground">Klinik OS</div>
                </div>
              </div>
              <Button variant="outline" size="icon" aria-label="Kapat" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}

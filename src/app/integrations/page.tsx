import { Cable, CheckCircle2 } from "lucide-react";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { Card, CardContent } from "@/components/ui/card";
import { integrations } from "@/lib/marketing";

export default function IntegrationsPage() {
  return (
    <>
      <MarketingNav />
      <main className="container py-14">
        <div className="mb-10 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-normal">Entegrasyonlar</h1>
          <p className="mt-4 text-lg text-muted-foreground">MVP’de tüm dış sistemler mock adapter olarak çalışır; gerçek API bağlantıları için interface yapısı hazırdır.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <Cable className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{integration}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Mock servis aktif
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}

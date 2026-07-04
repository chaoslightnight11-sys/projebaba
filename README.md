# ClinicNova

ClinicNova, diş klinikleri için modern ve özgün bir klinik yönetim SaaS MVP'sidir. Next.js App Router, TypeScript, Tailwind, shadcn/ui uyumlu lokal bileşenler, Prisma ve PostgreSQL üzerine kuruludur.

## Kurulum

```bash
npm install
```

`.env` oluşturun:

```bash
cp .env.example .env
```

Örnek `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinicnova?schema=public"
AUTH_SECRET="change-this-development-secret-at-least-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Prisma migration ve seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Geliştirme sunucusu:

```bash
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` üzerinde açılır.

## Demo Kullanıcılar

- `owner@clinicnova.test / password123`
- `doctor@clinicnova.test / password123`
- `receptionist@clinicnova.test / password123`

## Tamamlanan Özellikler

- Landing page: hero, özellikler, neden ClinicNova, entegrasyonlar ve fiyatlandırma
- Sayfalar: `/features`, `/pricing`, `/integrations`, `/faq`, `/contact`, `/demo`, `/login`, `/register`
- Custom JWT auth, HTTP-only cookie, middleware koruması
- Multi-tenant Prisma mimarisi: `Organization`, `Branch`, `User`, rol alanı ve organization filtreleri
- Dashboard layout: responsive sidebar, mobil drawer, global search, tema değiştirici
- Dashboard metrikleri: bugünkü randevular, haftalık randevu, aylık gelir, bekleyen ödemeler, aktif/yeni hasta, stok uyarısı, memnuniyet, doktor performansı
- CRUD başlangıçları: hasta, randevu, tedavi, tedavi planı, ödeme, stok, personel, onam, anket, iletişim ve recall
- Raporlama: gelir, iptal/gelmeme oranı, stok tüketimi, memnuniyet, şube karşılaştırması, CSV export
- AI Klinik Asistanı mock cevap servisi
- Audit log, RBAC yardımcıları, KVKK veri dışa aktarma/silme mock yüzeyi
- Loading, empty ve error state bileşenleri

## Mock Entegrasyonlar

Adapter/interface yaklaşımıyla eklenen mock servisler:

- `smsProvider.ts`
- `whatsappProvider.ts`
- `emailProvider.ts`
- `paymentProvider.ts`
- `eInvoiceProvider.ts`
- `ePrescriptionProvider.ts`
- `healthSystemProvider.ts`

API uçları:

- `POST /api/mock/ai`
- `POST /api/mock/notify`
- `POST /api/mock/payment`
- `POST /api/mock/e-invoice`
- `GET /api/reports/export`

## Mimari Notlar

- Prisma sorguları servis katmanında organizationId ile filtrelenir.
- Randevu oluşturma servisinde doktor saat çakışması kontrolü yapılır.
- Form validasyonları Zod şemalarıyla tanımlanmıştır.
- UI bileşenleri shadcn/ui stiline yakın lokal bileşenlerdir.
- Gerçek entegrasyonlar için provider dosyaları adapter yüzeyi olarak ayrılmıştır.

## Sonraki Geliştirme Önerileri

- FullCalendar ile gerçek sürükle-bırak takvim
- Server action sonuçları için inline hata/success state
- Gerçek PDF export ve dijital imza akışı
- Gerçek SMS/WhatsApp/e-Fatura/Sanal POS sağlayıcıları
- Gelişmiş permission matrisi ve modül bazlı guard
- Veri import sihirbazı
- E2E testleri ve CI pipeline

# ClinicNova production runbook

## Zorunlu altyapı

- Yönetilen PostgreSQL 16+; günlük şifreli yedek ve geri yükleme testi
- TLS sonlandıran gerçek alan adı
- En az iki uygulama örneği kullanılıyorsa paylaşımlı rate-limit deposu/WAF
- n8n veya eşdeğer otomasyon katmanı; WhatsApp, SMS, e-posta, e-Fatura ve ödeme sağlayıcı hesapları
- Merkezi log, hata izleme, uptime alarmı ve gizli anahtar kasası

`.env.production.example` dosyasını kopyalayın; örnek değer bırakmayın. Dağıtımdan önce:

```bash
npm ci
npm run production:check
npm run prisma:deploy
npm run build
npm run start:production
```

`GET /api/health` uygulama/veritabanı sağlığını, `GET /api/ready` ise yapılandırma hazırlığını döndürür. Trafik yalnızca ikisi de başarılı olduğunda yönlendirilmelidir.

## Docker

Uygulama ve migration imajlarını ayrı üretin:

```bash
docker build --target migrator -t clinicnova-migrator:1.1.0 .
docker build --target runner -t clinicnova:1.1.0 .
docker run --rm --env-file .env.production clinicnova-migrator:1.1.0
docker run --env-file .env.production -p 3000:3000 clinicnova:1.1.0
```

Migration işi başarıyla tamamlanmadan yeni uygulama imajına trafik vermeyin.

## Entegrasyon sözleşmesi

ClinicNova tüm dış olayları `N8N_OUTBOUND_WEBHOOK_URL` adresine POST eder. İstek başlıkları:

- `X-ClinicNova-Event`: olay adı
- `X-ClinicNova-Timestamp`: milisaniye Unix zamanı
- `X-ClinicNova-Signature`: `sha256=<hex>`

İmza girdisi `<timestamp>.<raw-body>` ve anahtar `N8N_OUTBOUND_SECRET` değeridir. n8n isteği işlemeden önce imzayı ve en fazla beş dakikalık zaman farkını doğrulamalıdır.

Gelen tenant webhook'ları `Authorization: Bearer <N8N_WEBHOOK_SECRET>` ve `X-ClinicNova-Organization: <tenant-slug>` başlıklarını taşır.

## Mobil üretim paketi

Gerçek APK demo verisi içermez; ilk açılışta HTTPS ClinicNova adresi ister. Sabit sunucu adresiyle kurumsal paket:

```bash
MOBILE_MODE=production MOBILE_SERVER_URL=https://app.example.com npm run android:build
```

Demo APK yalnızca satış gösterimi/test içindir:

```bash
MOBILE_MODE=demo npm run android:build
```

## Operasyon kontrolleri

- Her gün: `/api/health`, `/api/ready`, başarısız `IntegrationLog` ve yedek durumu
- Her hafta: örnek geri yükleme, kullanıcı/rol denetimi, geciken veri silme talepleri
- Her sürüm: `npm run check`, `npm run test:e2e`, dependency audit, APK imza ve SHA-256 doğrulaması
- Her anahtar değişiminde: eski anahtarı iptal et, gizli anahtar kasasını güncelle, servisleri kontrollü yeniden başlat

## Ticari canlıya geçişte dış bağımlılıklar

Kod tarafı sağlayıcı hatalarında başarısızlığı saklamaz. Ancak gerçek mesaj, ödeme ve e-Fatura işlemleri için klinik adına açılmış sağlayıcı sözleşmeleri ve üretim kimlik bilgileri gereklidir; bunlar kaynak kod deposuna yazılmaz.

# ClinicNova Desktop

Windows ve macOS masaüstü istemcisi, Android ile aynı yerel-öncelikli iş akışını paketler. Kayıtlar Windows DPAPI veya macOS Keychain tarafından korunan Electron `safeStorage` ile uygulamanın özel profilinde şifreli tutulur. HTTPS ClinicNova hesabına giriş yapıldığında bekleyen işlemler aynı idempotent mobil senkronizasyon API'sine gönderilir.

- Windows: `npm run desktop:win` → NSIS `.exe`
- macOS Intel + Apple Silicon: `npm run desktop:mac` → universal `.dmg`

Renderer Node.js erişimi olmadan, context isolation ve sandbox açık çalışır. Yalnız paket içindeki `clinicnova://app` içeriği yerel depolama/senkronizasyon köprüsüne erişebilir; uzak HTTPS giriş sayfasına Electron API'si verilmez.

Dağıtım imzası için Windows code-signing sertifikası ve Apple Developer ID/notarization kimliği ayrıca gerekir. İmzasız test paketleri işletim sistemi uyarısı üzerinden elle açılabilir; gerçek klinik dağıtımından önce imzalanmalıdır.

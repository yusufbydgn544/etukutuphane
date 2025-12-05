# E-Kütüphane Kurulum ve Çalıştırma Rehberi

Bu proje artık **Tek Parça (Unified)** yapıdadır. Yani Frontend ve Backend tek bir sunucu üzerinden çalışır.

## 1. Kurulum
Gerekli paketleri yükleyin:
```bash
npm install
```

## 2. Uygulamayı Başlatma (Tek Komut)
Aşağıdaki komut hem Frontend'i derler (build) hem de sunucuyu başlatır:
```bash
npm start
```
Bu komuttan sonra uygulamanız `http://localhost:5000` adresinde yayında olacaktır.

## 3. Sunucuda Yayınlama (Deployment)
Kendi sunucunuza (VDS, VPS vb.) dosyaları attıktan sonra sadece yukarıdaki `npm start` komutunu çalıştırmanız yeterlidir.
Arka planda sürekli çalışması için `pm2` kullanabilirsiniz:
```bash
npm install -g pm2
pm2 start server.js --name "etukutuphane"
```

## Notlar
- Veritabanı olarak **SQLite** (`library.db`) kullanılır. Ekstra kurulum gerektirmez.
- Frontend dosyaları `dist` klasörüne derlenir ve `server.js` tarafından sunulur.

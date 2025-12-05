# Google Cloud Run Kurulum Rehberi (Önerilen)

Bu rehber, uygulamanızı **Google Cloud Run** üzerinde konteyner olarak nasıl çalıştıracağınızı anlatır. Cloud Run, sunucu yönetimi gerektirmez ve trafiğe göre otomatik ölçeklenir.

## Ön Hazırlıklar

1.  Projenizde `Dockerfile` ve `.dockerignore` dosyalarının olduğundan emin olun (Bunları sizin için oluşturdum).
2.  [Google Cloud Console](https://console.cloud.google.com/) üzerinde bir proje oluşturun.
3.  Bilgisayarınızda [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) kurulu olmalıdır (veya Cloud Shell kullanabilirsiniz).

## Adım 1: Google Cloud CLI ile Giriş Yapın

Terminali açın ve şu komutla giriş yapın:

```bash
gcloud auth login
```

Projenizi seçin:

```bash
gcloud config set project [PROJE_ID_NİZ]
```

## Adım 2: Container Registry'yi Etkinleştirin

```bash
gcloud services enable containerregistry.googleapis.com run.googleapis.com
```

## Adım 3: Uygulamayı Build Edin ve Yükleyin

Aşağıdaki komut, uygulamanızı Google Cloud'a yükler ve build eder. `etukutuphane` yerine istediğiniz ismi verebilirsiniz.

```bash
gcloud builds submit --tag gcr.io/[PROJE_ID_NİZ]/etukutuphane
```
*(Not: `[PROJE_ID_NİZ]` kısmını kendi proje ID'nizle değiştirmeyi unutmayın)*

## Adım 4: Cloud Run'a Deploy Edin

```bash
gcloud run deploy etukutuphane \
  --image gcr.io/[PROJE_ID_NİZ]/etukutuphane \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated
```

*   **Region:** `europe-west3` (Frankfurt) Türkiye'ye yakın olduğu için seçildi.
*   **Allow unauthenticated:** Uygulamanın herkese açık olmasını sağlar.

## Adım 5: Sonuç

Komut tamamlandığında size bir URL verecektir (örn: `https://etukutuphane-xyz-ew.a.run.app`). Bu adrese tıklayarak uygulamanızı görebilirsiniz.

---

## Alternatif: Manuel Yükleme (Console Üzerinden)

Kod yazmak istemiyorsanız:

1.  **Dockerfile** dosyasını projenize eklediğimden emin olun.
2.  [Cloud Run Console](https://console.cloud.google.com/run)'a gidin.
3.  **"Create Service"** deyin.
4.  **"Continuously deploy new revisions from a source repository"** seçeneğini seçin.
5.  **"Set up with Cloud Build"** diyerek GitHub reponuzu bağlayın.
6.  Gerisini Google Cloud halledecektir.

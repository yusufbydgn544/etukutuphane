# Google Cloud Compute Engine Kurulum Rehberi

Bu rehber, projenizi Google Cloud üzerinde bir sanal sunucuya (VM Instance) kurarak nasıl yayınlayacağınızı adım adım anlatır.

## 1. Google Cloud Hesabı ve Sunucu Oluşturma
1.  [Google Cloud Console](https://console.cloud.google.com/) adresine gidin.
2.  Sol menüden **Compute Engine** > **VM Instances** seçeneğine tıklayın.
3.  **"Create Instance"** butonuna basın.
4.  **Ayarlar:**
    *   **Name:** `etukutuphane` (veya istediğiniz bir isim).
    *   **Region:** `europe-west3` (Frankfurt) veya size yakın bir yer seçin.
    *   **Machine Type:** `e2-micro` (Deneme için yeterli ve en ucuzu).
    *   **Boot Disk:** "Change" diyip **Ubuntu 22.04 LTS** seçin.
    *   **Firewall:** "Allow HTTP traffic" ve "Allow HTTPS traffic" kutucuklarını **işaretleyin**.
5.  **Create** diyerek sunucuyu oluşturun.

## 2. Sunucuya Bağlanma
1.  Oluşturduğunuz sunucunun yanındaki **SSH** butonuna tıklayın.
2.  Siyah bir terminal penceresi açılacaktır. Artık sunucunun içindesiniz.

## 3. Gerekli Programların Kurulumu
Aşağıdaki komutları sırasıyla SSH penceresine yapıştırıp Enter'a basın:

```bash
# Sistemi güncelle
sudo apt update

# Node.js kurulumu (Versiyon 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Git kurulumu (Dosyaları çekmek için)
sudo apt install -y git
```

## 4. Projeyi Sunucuya Yükleme
Projeyi sunucuya atmanın en kolay yolu GitHub kullanmaktır.
*(Eğer projeniz GitHub'da yoksa, önce bilgisayarınızdan GitHub'a yüklemeniz gerekir.)*

```bash
# Projeyi çekin (Kendi repo adresinizi yazın)
git clone https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git

# Klasöre girin
cd REPO_ADINIZ

# Paketleri yükleyin
npm install
```

## 5. Uygulamayı Başlatma
Test etmek için:
```bash
npm start
```
Eğer hata almazsanız `Ctrl + C` ile durdurun ve kalıcı olarak başlatmak için şu adımı yapın:

**Kalıcı Olarak Çalıştırma (PM2 ile):**
SSH penceresini kapatsanız bile sitenin açık kalması için:
```bash
# PM2 yükle
sudo npm install -g pm2

# Uygulamayı başlat
pm2 start server.js --name "etukutuphane"

# Bilgisayar yeniden başlasa bile otomatik açılması için
pm2 startup
pm2 save
```

## 6. Dış Dünyaya Açma (Port Ayarı)
Uygulamanız şu an 5000 portunda çalışıyor ama Google Cloud varsayılan olarak sadece 80 (HTTP) portuna izin verir.

**Yöntem A: Port Yönlendirme (En Kolayı)**
```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 5000
```
Bu komut, siteye girenleri otomatik olarak sizin uygulamanıza (5000 portuna) yönlendirir.

**Tebrikler!** 🎉
Artık Google Cloud panelinde gördüğünüz **External IP** adresini tarayıcıya yazarak sitenize girebilirsiniz.

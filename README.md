# Ayakkabı Dünyası 👟

Modern, responsive bir ayakkabı e-ticaret web uygulaması.

## Özellikler

- 🛍️ Ürün katalog yönetimi
- 👤 Kullanıcı kayıt ve giriş sistemi
- 🛒 Sepet yönetimi
- 💳 Sipariş takibi
- 📱 Responsive tasarım
- 👨‍💼 Admin paneli
- 🔄 İade yönetimi

## Teknolojiler

- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Frontend**: HTML, CSS, JavaScript

## Firebase Deployment

### Ön Gereksinimler

1. [Node.js](https://nodejs.org/) yüklü olmalı
2. [Firebase CLI](https://firebase.google.com/docs/cli) yüklü olmalı
3. Firebase hesabı

### Kurulum Adımları

#### 1. Firebase CLI Kurulumu

```bash
npm install -g firebase-tools
```

#### 2. Firebase'e Giriş

```bash
firebase login
```

#### 3. Firebase Projesi Oluşturma

Firebase Console'da yeni bir proje oluşturun: https://console.firebase.google.com/

#### 4. Firebase Başlatma

```bash
firebase init
```

Seçenekler:
- ✅ Firestore
- ✅ Functions
- ✅ Hosting

Ayarlar:
- **Firestore Rules**: `firestore.rules`
- **Firestore Indexes**: `firestore.indexes.json`
- **Functions Language**: JavaScript
- **Functions Source**: `functions`
- **Hosting Directory**: `public`
- **Single-page app**: No

#### 5. Proje Bağlantısı

```bash
firebase use --add
```

Oluşturduğunuz projeyi seçin ve bir alias verin (örn: 'production').

#### 6. Functions Bağımlılıklarını Yükleme

```bash
cd functions
npm install
cd ..
```

#### 7. Veri Taşıma (Opsiyonel)

Eğer mevcut SQLite veritabanınızdan veri taşımak istiyorsanız:

1. Firebase Console'dan Service Account Key indirin
2. `serviceAccountKey.json` olarak kaydedin (proje ana dizinine)
3. Migration scriptini çalıştırın:

```bash
node migrate-to-firestore.js
```

#### 8. Deploy

```bash
firebase deploy
```

Sadece hosting'i deploy etmek için:
```bash
firebase deploy --only hosting
```

Sadece functions'ı deploy etmek için:
```bash
firebase deploy --only functions
```

### Lokal Test

Firebase emülatörlerini kullanarak lokal test yapabilirsiniz:

```bash
firebase emulators:start
```

## Proje Yapısı

```
.
├── public/              # Frontend dosyaları (HTML, CSS, JS, images)
├── functions/           # Firebase Cloud Functions
│   ├── index.js        # Ana Cloud Function (Express API)
│   └── package.json    # Functions bağımlılıkları
├── data/               # Başlangıç verileri (JSON)
├── firebase.json       # Firebase konfigürasyonu
├── firestore.rules     # Firestore güvenlik kuralları
├── firestore.indexes.json  # Firestore indexleri
├── server.js           # Lokal development server (SQLite)
└── package.json        # Ana proje bağımlılıkları
```

## Lokal Geliştirme (SQLite)

Lokal geliştirme için hala SQLite kullanabilirsiniz:

```bash
npm install
npm start
```

Server `http://localhost:3003` adresinde çalışacaktır.

## Üretim URL'si

Deploy sonrası Firebase size bir URL verecektir:
```
https://your-project-id.web.app
```

veya

```
https://your-project-id.firebaseapp.com
```

## Lisans

MIT

---

**Not**: Firebase ücretsiz planı (Spark Plan) için limitler:
- Hosting: 10GB storage, 360MB/day transfer
- Cloud Functions: 125K invocations/month
- Firestore: 50K reads, 20K writes/day

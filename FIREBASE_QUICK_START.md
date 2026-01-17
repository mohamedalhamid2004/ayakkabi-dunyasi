# 🎯 Quick Firebase Deployment Commands

## 1️⃣ Login to Firebase
```bash
firebase login
```
Bu komut tarayıcıda bir pencere açacak. Google hesabınızla giriş yapın.

---

## 2️⃣ Firebase'i Başlat
```bash
firebase init
```

**Seçimler:**
- ✅ Firestore, Functions, Hosting (Spacebar ile seç)
- ✅ Use an existing project (veya Create new project)
- ✅ Firestore rules: `firestore.rules`
- ✅ Firestore indexes: `firestore.indexes.json`
- ✅ Functions language: JavaScript
- ✅ Install dependencies: Yes
- ✅ Public directory: `public`
- ⛔ Single-page app: No
- ⛔ Overwrite index.html: No

---

## 3️⃣ Firestore'u Aktifleştir

Firebase Console'da (https://console.firebase.google.com/):
1. Projenizi seçin
2. **Firestore Database** → **Create database**
3. **Production mode** → **europe-west3** (Frankfurt)

---

## 4️⃣ Functions Dependencies Yükle
```bash
cd functions
npm install
cd ..
```

---

## 5️⃣ Deploy Et! 🚀
```bash
firebase deploy
```

**Veya sadece belirli kısımlar:**
```bash
firebase deploy --only hosting      # Sadece frontend
firebase deploy --only functions    # Sadece backend/API
firebase deploy --only firestore    # Sadece database rules
```

---

## 🔄 Sonraki Deploymentlar

Kod değişikliği yaptıktan sonra:
```bash
firebase deploy
```

---

## 📊 Deployment Durumu Kontrol

```bash
firebase deploy:list
```

---

## 🌐 Site URL'nizi Görmek

Deploy sonrası terminal'de gösterilecek:
```
Hosting URL: https://your-project-id.web.app
```

---

## 🆘 Sorun Varsa

### Logout/Login
```bash
firebase logout
firebase login
```

### Proje Listesi
```bash
firebase projects:list
```

### Logs
```bash
firebase functions:log
```

### Emulator (Lokal Test)
```bash
firebase emulators:start
```

---

## ⚠️ Önemli Notlar

1. **İlk deployment 3-5 dakika sürebilir**
2. **Functions deployed olduktan sonra "cold start" 1-2 saniye sürebilir**
3. **Firestore rules deployment anında aktif olur**
4. **Ücretsiz planda 125K function invocations/month**

---

## ✅ Deployment Checklist

- [ ] Firebase CLI kuruldu (`firebase --version`)
- [ ] Firebase'e giriş yapıldı (`firebase login`)
- [ ] Firebase projesi oluşturuldu (Console'da)
- [ ] `firebase init` çalıştırıldı
- [ ] Firestore aktifleştirildi (Console'da)
- [ ] Functions dependencies kuruldu (`cd functions && npm install`)
- [ ] Deploy edildi (`firebase deploy`)
- [ ] Site test edildi

---

**Şu an hazırsınız!** Sıradaki adım: `firebase login` 🚀

# Ayakkabı Dünyası Projesi

Bu proje, modern web teknolojileri kullanılarak geliştirilmiş bir E-Ticaret uygulamasıdır.

## 🛠 Kullanılan Teknolojiler ve Diller

### 1. Backend (Sunucu Tarafı)
- **Node.js**: Sunucu ortamı olarak kullanıldı.
- **Express.js**: Web sunucusu ve API endpointlerini yönetmek için kullanılan framework.
- **SQLite**: (Yeni) Veri tabanı olarak dosya tabanlı SQL veritabanı. Ürünler ve kullanıcılar burada saklanır.
- **Body-Parser**: Gelen HTTP isteklerini işlemek için.
- **Path / FS**: Dosya sistemi işlemleri için.

### 2. Frontend (İstemci Tarafı)
- **HTML5**: Sayfa yapıları (Anasayfa, Ürün Detay, Admin Paneli vb.).
- **CSS3**: Özelleştirilmiş stiller ve responsive (mobil uyumlu) tasarım.
- **JavaScript (ES6+)**: Sayfa içi dinamik işlemler (Sepete ekle, Filtreleme, API ile iletişim).

## 🚀 Neler Yaptık?
1. **Ürün Yönetimi**: Ürünlerin listelenmesi, detay sayfaları ve kategorilendirilmesi (Kadın, Erkek, Çocuk).
2. **Kullanıcı Sistemi**: Admin ve Standart Kullanıcı girişi.
3. **Admin Paneli**: Ürün ekleme, silme ve düzenleme yetkisi.
4. **Sepet ve Ödeme**: Dinamik sepet yönetimi ve ödeme simülasyonu.
5. **Veritabanı Migrasyonu**: Verilerin JSON dosyaları yerine SQLite veritabanına taşınması (Şu an yapılıyor).

## 📂 Proje Yapısı
- `/public`: HTML, CSS ve JS dosyaları.
- `/data`: (Eski) JSON veri dosyaları.
- `server.js`: Uygulamanın ana sunucu dosyası.
- `database.sqlite`: Uygulama veritabanı.

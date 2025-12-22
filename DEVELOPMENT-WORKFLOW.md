# 🔄 Geliştirme ve Güncelleme Workflow'u

Bu rehber, projeyi geliştirirken ve canlıya güncellerken izlemeniz gereken adımları açıklar.

## 📋 İçindekiler

1. [Günlük Geliştirme](#günlük-geliştirme)
2. [Veritabanı Değişiklikleri](#veritabanı-değişiklikleri)
3. [Kod Değişiklikleri](#kod-değişiklikleri)
4. [Production'a Güncelleme](#productiona-güncelleme)
5. [Migration Yönetimi](#migration-yönetimi)

---

## 💻 Günlük Geliştirme

### Yeni Özellik Geliştirme

1. **Yeni branch oluştur** (opsiyonel ama önerilir):
   ```bash
   git checkout -b feature/yeni-ozellik
   ```

2. **Local'de geliştir**:
   ```bash
   npm run dev
   ```

3. **Değişiklikleri test et**

4. **Commit ve push**:
   ```bash
   git add .
   git commit -m "Yeni özellik eklendi"
   git push
   ```

---

## 🗄️ Veritabanı Değişiklikleri

### Senaryo 1: Yeni Tablo/Field Ekleme

#### Adım 1: Schema'yı Güncelle
`prisma/schema.prisma` dosyasını düzenle:
```prisma
model YeniModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  
  @@map("yeni_model")
}
```

#### Adım 2: Migration Oluştur (Local)
```bash
# Migration oluştur ve uygula (development database'e)
npx prisma migrate dev --name yeni_model_eklendi
```

Bu komut:
- ✅ Migration dosyası oluşturur (`prisma/migrations/...`)
- ✅ Local veritabanına uygular
- ✅ Prisma client'ı otomatik generate eder

#### Adım 3: Test Et
```bash
npm run dev
# Uygulamayı test et, her şey çalışıyor mu kontrol et
```

#### Adım 4: Production'a Deploy
```bash
# 1. Değişiklikleri GitHub'a push et
git add .
git commit -m "Yeni model eklendi"
git push

# 2. Vercel otomatik deploy edecek
# 3. Migration'ı production'a uygula (2 seçenek var):
```

**Seçenek A: Vercel CLI ile (Önerilen)**
```bash
# Vercel CLI'ı yükle (bir kez)
npm i -g vercel

# Production environment variable'ları çek
vercel env pull .env.production

# Migration'ı production'a uygula
npx prisma migrate deploy
```

**Seçenek B: Manuel (Supabase Dashboard)**
1. Supabase Dashboard → SQL Editor
2. `prisma/migrations/[migration-adi]/migration.sql` dosyasını aç
3. SQL'i kopyala ve Supabase SQL Editor'de çalıştır

---

### Senaryo 2: Mevcut Tabloya Field Ekleme

#### Adım 1: Schema'yı Güncelle
```prisma
model Transaction {
  // ... mevcut field'lar
  yeniField String?  // Yeni field ekle
}
```

#### Adım 2: Migration Oluştur
```bash
npx prisma migrate dev --name transaction_yeni_field
```

#### Adım 3: Test ve Deploy
Yukarıdaki "Senaryo 1" adımlarını takip et.

---

### Senaryo 3: Hızlı Prototipleme (db push)

⚠️ **Sadece development için!** Production'da kullanma!

Eğer hızlıca test etmek istiyorsanız:
```bash
# Migration oluşturmadan direkt schema'yı uygula
npx prisma db push
```

**Dikkat:** Bu migration dosyası oluşturmaz, sadece schema'yı uygular. Production'a geçmeden önce mutlaka `migrate dev` kullanın!

---

## 💻 Kod Değişiklikleri

### Sadece Kod Değişikliği (Veritabanı değişikliği YOK)

1. **Kodu değiştir**
2. **Local'de test et**:
   ```bash
   npm run dev
   ```
3. **GitHub'a push et**:
   ```bash
   git add .
   git commit -m "Kod güncellemesi"
   git push
   ```
4. **Vercel otomatik deploy eder** ✅

**Migration gerekmez!** Vercel build sırasında `postinstall` script'i Prisma client'ı otomatik generate eder.

---

## 🚀 Production'a Güncelleme

### Tam Workflow (Veritabanı + Kod Değişikliği)

```bash
# 1. Local'de migration oluştur ve test et
npx prisma migrate dev --name degisiklik_aciklamasi
npm run dev  # Test et

# 2. GitHub'a push et
git add .
git commit -m "Veritabanı ve kod güncellemesi"
git push

# 3. Vercel otomatik deploy başlatır (2-3 dakika)

# 4. Migration'ı production'a uygula
vercel env pull .env.production
npx prisma migrate deploy

# VEYA Supabase SQL Editor'den migration SQL'ini çalıştır
```

### Sadece Kod Güncellemesi

```bash
# 1. Değişiklikleri yap
# 2. Test et
npm run dev

# 3. Push et
git add .
git commit -m "Kod güncellemesi"
git push

# 4. Vercel otomatik deploy eder ✅
# Migration gerekmez!
```

---

## 📦 Migration Yönetimi

### Migration Dosyaları

Migration'lar `prisma/migrations/` klasöründe saklanır. Bu dosyalar:
- ✅ Git'e commit edilmeli
- ✅ Her geliştirici aynı migration'ları kullanır
- ✅ Production'a uygulanır

### Migration Geçmişi

```bash
# Tüm migration'ları görüntüle
npx prisma migrate status

# Migration geçmişini görüntüle
ls prisma/migrations/
```

### Migration'ı Geri Alma (Rollback)

⚠️ **Dikkat:** Prisma migration rollback desteklemez. Geri almak için:

1. Yeni bir migration oluştur (ters işlem yapan)
2. Veya manuel SQL ile düzelt

**Örnek:**
```bash
# Field'ı kaldırmak için yeni migration
npx prisma migrate dev --name field_kaldirildi
```

---

## 🔧 Pratik Komutlar

### Development

```bash
# Development server başlat
npm run dev

# Veritabanı değişikliği yap ve migration oluştur
npx prisma migrate dev --name aciklama

# Schema'yı hızlıca uygula (sadece dev)
npx prisma db push

# Prisma Studio'yu aç (veritabanı görüntüleme)
npm run db:studio

# Seed data ekle
npm run db:seed
```

### Production

```bash
# Migration'ı production'a uygula
npm run db:migrate:deploy

# Veya
npx prisma migrate deploy
```

---

## ⚠️ Önemli Notlar

### 1. Migration'ları Asla Manuel Düzenleme
Migration dosyalarını manuel olarak düzenlemeyin. Prisma otomatik oluşturur.

### 2. Production Migration'ı Önce Test Et
Production'a migration uygulamadan önce local'de test edin.

### 3. Veri Kaybı Riskleri
Field kaldırma veya tablo silme gibi işlemler veri kaybına neden olabilir. Dikkatli olun!

### 4. Backup Alın
Önemli değişikliklerden önce Supabase'den backup alın:
- Supabase Dashboard → Database → Backups

### 5. Migration Sırası
Migration'lar sırayla uygulanır. Eksik migration varsa hata verir.

---

## 🎯 Hızlı Referans

| Durum | Komut |
|-------|-------|
| Yeni migration oluştur | `npx prisma migrate dev --name isim` |
| Production'a uygula | `npx prisma migrate deploy` |
| Hızlı schema uygula (dev) | `npx prisma db push` |
| Prisma Studio | `npm run db:studio` |
| Seed data | `npm run db:seed` |

---

## 🆘 Sorun Giderme

### Migration Hatası
```bash
# Migration durumunu kontrol et
npx prisma migrate status

# Migration'ı sıfırla (DİKKAT: Veri kaybı olabilir!)
npx prisma migrate reset
```

### Production Migration Hatası
1. Vercel Logs'u kontrol et
2. Supabase Logs'u kontrol et
3. Migration SQL'ini manuel çalıştırmayı dene

### Prisma Client Hatası
```bash
# Prisma client'ı yeniden generate et
npx prisma generate
```

---

## 📚 Daha Fazla Bilgi

- [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Vercel Deployment](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)


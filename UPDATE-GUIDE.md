# 🔄 Güncelleme Rehberi (Hızlı Özet)

## 🎯 Senaryolar

### ✅ Senaryo 1: Sadece Kod Değişikliği (En Kolay)

**Veritabanı değişikliği YOK, sadece kod güncellemesi**

```bash
# 1. Kodu değiştir
# 2. Test et
npm run dev

# 3. GitHub'a push et
git add .
git commit -m "Kod güncellemesi"
git push
```

**Vercel otomatik deploy eder!** 🎉 Migration gerekmez.

---

### ✅ Senaryo 2: Veritabanı + Kod Değişikliği

**Yeni tablo/field ekleme veya mevcut tabloyu değiştirme**

#### Adım 1: Local'de Migration Oluştur
```bash
# 1. prisma/schema.prisma dosyasını düzenle
# 2. Migration oluştur
npx prisma migrate dev --name aciklama

# 3. Test et
npm run dev
```

#### Adım 2: GitHub'a Push Et
```bash
git add .
git commit -m "Veritabanı güncellemesi"
git push
```

#### Adım 3: Vercel Otomatik Deploy
Vercel otomatik olarak deploy başlatır (2-3 dakika).

#### Adım 4: Production'a Migration Uygula

**Yöntem A: Vercel CLI (Önerilen)**
```bash
# Vercel CLI yükle (bir kez)
npm i -g vercel

# Production environment'ı çek
vercel env pull .env.production

# Migration'ı uygula
npx prisma migrate deploy
```

**Yöntem B: Supabase SQL Editor**
1. Supabase Dashboard → SQL Editor
2. `prisma/migrations/[son-migration]/migration.sql` dosyasını aç
3. SQL'i kopyala ve Supabase'de çalıştır

---

## 📋 Hızlı Komutlar

| Ne Yapmak İstiyorsunuz? | Komut |
|------------------------|-------|
| Yeni tablo/field ekle | `npx prisma migrate dev --name aciklama` |
| Production'a migration uygula | `npx prisma migrate deploy` |
| Hızlı test (dev only) | `npx prisma db push` |
| Veritabanını görüntüle | `npm run db:studio` |
| Test verisi ekle | `npm run db:seed` |

---

## ⚠️ Önemli Notlar

1. **Migration'lar Git'e commit edilmeli** - `prisma/migrations/` klasörü
2. **Production migration'ı manuel uygula** - Otomatik değil (güvenlik için)
3. **Önce local'de test et** - Production'a geçmeden önce
4. **Backup alın** - Önemli değişikliklerden önce

---

## 📚 Detaylı Rehber

Daha fazla bilgi için: [DEVELOPMENT-WORKFLOW.md](./DEVELOPMENT-WORKFLOW.md)


# 🔐 Authentication System Kurulumu

## Adım 1: Veritabanı Migration'ı

### Supabase SQL Editor'de çalıştırın:

1. Supabase Dashboard → SQL Editor
2. `prisma/migrations/add_auth_system.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve çalıştırın

### UserRole Enum Güncelleme:

```sql
-- Add EDITOR to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EDITOR';
```

## Adım 2: İlk Admin Kullanıcı Oluşturma

### Local'de çalıştırın:

```bash
npm install  # bcryptjs paketini yüklemek için
npm run create-admin
```

Bu komut şu bilgilerle admin kullanıcı oluşturur:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `ADMIN`

⚠️ **ÖNEMLİ:** İlk girişten sonra şifreyi değiştirin!

## Adım 3: Test

1. Projeyi çalıştırın: `npm run dev`
2. `http://localhost:3000` adresine gidin
3. Login sayfasına yönlendirileceksiniz
4. `admin` / `admin123` ile giriş yapın
5. `/users` sayfasına gidip yeni kullanıcılar ekleyin

## Kullanıcı Rolleri

- **ADMIN**: Tüm yetkiler (ekleme, düzenleme, silme, kullanıcı yönetimi)
- **EDITOR**: Sadece status değiştirebilir, diğerleri görüntüleme
- **VIEWER**: Sadece görüntüleme (hiçbir düzenleme yapamaz)

## Özellikler

✅ Login sistemi (cookie-based session)
✅ Yetki kontrolü (ADMIN, EDITOR, VIEWER)
✅ Kullanıcı ekleme sayfası (admin only)
✅ Status değiştirildiğinde "Last updated by [kullanıcı]" gösterimi
✅ Logout butonu
✅ Middleware ile route koruması

## Production'a Deploy

1. Migration SQL'ini Supabase'de çalıştırın
2. İlk admin kullanıcıyı local'de oluşturun veya `/users` sayfasından oluşturun
3. GitHub'a push edin
4. Vercel otomatik deploy edecek


# Authentication System Migration

## Adım 1: Supabase SQL Editor'de Migration Çalıştırın

1. Supabase Dashboard → SQL Editor
2. `prisma/migrations/add_auth_system.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve çalıştırın

## Adım 2: UserRole Enum Güncelleme

UserRole enum'una EDITOR eklemek için Supabase SQL Editor'de şunu çalıştırın:

```sql
-- Add EDITOR to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EDITOR';
```

## Adım 3: İlk Admin Kullanıcı Oluşturma

İlk admin kullanıcıyı oluşturmak için (şifre: admin123):

```sql
-- Create first admin user (password will be hashed by the app)
-- Password: admin123 (will be hashed using bcrypt)
INSERT INTO "users" ("id", "username", "password", "name", "role", "createdAt", "updatedAt")
VALUES (
  'admin_' || gen_random_uuid()::text,
  'admin',
  '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', -- This is a placeholder, app will hash it
  'Administrator',
  'ADMIN',
  NOW(),
  NOW()
);
```

**Not:** Gerçek şifre hash'i uygulama tarafından oluşturulacak. İlk admin kullanıcıyı uygulama üzerinden oluşturmanız önerilir.


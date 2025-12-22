# ⚡ Hızlı Deployment (5 Dakika)

## 🎯 Adımlar

### 1️⃣ Supabase Veritabanı (2 dakika)
1. [supabase.com](https://supabase.com) → GitHub ile giriş
2. "New Project" → İsim ve şifre seç → "Create"
3. Settings > Database > Connection string (URI) → Kopyala

### 2️⃣ GitHub'a Yükle (1 dakika)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[KULLANICI]/[REPO].git
git push -u origin main
```

### 3️⃣ Vercel'e Deploy (2 dakika)
1. [vercel.com](https://vercel.com) → GitHub ile giriş
2. "Add New Project" → Repository seç
3. Environment Variables ekle:
   - Name: `DATABASE_URL`
   - Value: Supabase connection string (1. adımdan)
4. "Deploy" → Tamamlandı! 🎉

### 4️⃣ Veritabanı Migration (1 dakika)
Local'de çalıştır:
```bash
# .env dosyasına Supabase connection string'i ekle
DATABASE_URL="postgresql://postgres:[ŞİFRE]@db.[PROJE].supabase.co:5432/postgres"

# Migration çalıştır
npx prisma migrate deploy
npx prisma generate
```

**Veya** Vercel CLI ile:
```bash
npm i -g vercel
vercel env pull .env.local
npx prisma migrate deploy
```

## ✅ Bitti!

Projeniz canlıda: `https://[PROJE-ADI].vercel.app`

Detaylı rehber için: [DEPLOYMENT.md](./DEPLOYMENT.md)


# 🚀 Ücretsiz Canlıya Alma Rehberi

Bu projeyi tamamen ücretsiz olarak canlıya almak için **Vercel** (hosting) + **Supabase** (PostgreSQL veritabanı) kombinasyonunu kullanacağız.

## 📋 Gereksinimler

- GitHub hesabı (ücretsiz)
- Vercel hesabı (ücretsiz)
- Supabase hesabı (ücretsiz)

## 🗄️ Adım 1: Supabase Veritabanı Kurulumu

### 1.1 Supabase Hesabı Oluşturma
1. [https://supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın (ücretsiz)

### 1.2 Yeni Proje Oluşturma
1. Dashboard'da "New Project" butonuna tıklayın
2. Proje bilgilerini doldurun:
   - **Name**: RMV2 (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre seçin (kaydedin!)
   - **Region**: Size en yakın bölgeyi seçin
3. "Create new project" butonuna tıklayın
4. Projenin hazır olmasını bekleyin (2-3 dakika)

### 1.3 Veritabanı Bağlantı Bilgilerini Alma
1. Supabase dashboard'da sol menüden **Settings** > **Database** seçin
2. **Connection string** bölümünde **URI** formatını seçin
3. Connection string'i kopyalayın (şu formatta olacak):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Bu connection string'i bir yere kaydedin (Vercel'de kullanacağız)

### 1.4 Veritabanı Migrasyonu
1. Bilgisayarınızda proje klasörüne gidin
2. `.env` dosyasını açın (yoksa oluşturun)
3. Supabase'den aldığınız connection string'i ekleyin:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```
4. Terminal'de şu komutları çalıştırın:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
5. (Opsiyonel) Test verileri için:
   ```bash
   npm run db:seed
   ```

## 🌐 Adım 2: Vercel'e Deployment

### 2.1 Projeyi GitHub'a Yükleme
1. GitHub'da yeni bir repository oluşturun
2. Projeyi Git ile başlatın (eğer yapmadıysanız):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/[KULLANICI-ADI]/[REPO-ADI].git
   git push -u origin main
   ```

### 2.2 Vercel Hesabı Oluşturma
1. [https://vercel.com](https://vercel.com) adresine gidin
2. "Sign Up" butonuna tıklayın
3. GitHub hesabınızla giriş yapın

### 2.3 Projeyi Vercel'e Bağlama
1. Vercel dashboard'da "Add New..." > "Project" seçin
2. GitHub repository'nizi seçin
3. Proje ayarlarını yapın:
   - **Framework Preset**: Next.js (otomatik algılanacak)
   - **Root Directory**: `./` (varsayılan)
   - **Build Command**: `npm run build` (varsayılan)
   - **Output Directory**: `.next` (varsayılan)
4. **Environment Variables** bölümüne gidin
5. Yeni bir environment variable ekleyin:
   - **Name**: `DATABASE_URL`
   - **Value**: Supabase'den aldığınız connection string
6. "Deploy" butonuna tıklayın

### 2.4 Build Ayarları
Vercel otomatik olarak:
- `package.json`'daki `postinstall` script'ini çalıştıracak (Prisma client generate)
- `build` script'ini çalıştıracak
- Projeyi deploy edecek

## ✅ Adım 3: Kontrol ve Test

1. Deployment tamamlandıktan sonra Vercel size bir URL verecek (örn: `https://rmv2.vercel.app`)
2. Bu URL'yi açarak projenizi test edin
3. Herhangi bir sorun varsa Vercel dashboard'daki "Logs" bölümünden hataları kontrol edin

## 🔄 Güncellemeler

Projeyi güncellediğinizde:
1. Değişiklikleri GitHub'a push edin:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```
2. Vercel otomatik olarak yeni deployment başlatacak
3. Birkaç dakika içinde güncellemeler canlıda olacak

## 📝 Önemli Notlar

### Ücretsiz Limitler

**Vercel:**
- ✅ Sınırsız deployment
- ✅ 100GB bandwidth/ay
- ✅ Otomatik SSL sertifikası
- ✅ Global CDN

**Supabase:**
- ✅ 500MB veritabanı
- ✅ 2GB bandwidth/ay
- ✅ Sınırsız API istekleri
- ✅ 50,000 aktif kullanıcı/ay

### Veritabanı Yedekleme
Supabase ücretsiz planında otomatik yedekleme yok. Önemli veriler için:
- Düzenli olarak manuel yedek alın
- Veya Supabase Pro planına geçin ($25/ay)

### Environment Variables
Vercel'de environment variables'ları şu şekilde yönetebilirsiniz:
1. Project Settings > Environment Variables
2. Production, Preview ve Development için ayrı ayrı ayarlayabilirsiniz

## 🆘 Sorun Giderme

### Build Hatası
- Vercel Logs'u kontrol edin
- `DATABASE_URL` environment variable'ının doğru olduğundan emin olun
- Prisma client'ın generate edildiğinden emin olun

### Veritabanı Bağlantı Hatası
- Supabase connection string'in doğru olduğundan emin olun
- Supabase dashboard'da veritabanının aktif olduğunu kontrol edin
- Firewall ayarlarını kontrol edin (Supabase varsayılan olarak tüm IP'lere açık)

### Prisma Migration Hatası
- Local'de migration'ları çalıştırın: `npx prisma migrate dev`
- Production'da migration'ları çalıştırın: `npx prisma migrate deploy`

## 🎉 Tamamlandı!

Artık projeniz canlıda! URL'nizi paylaşabilir ve kullanmaya başlayabilirsiniz.

Herhangi bir sorun yaşarsanız:
- Vercel Logs'u kontrol edin
- Supabase Logs'u kontrol edin
- GitHub Issues'da sorun bildirin


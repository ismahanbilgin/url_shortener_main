# URL Shortener Backend

Bu proje, basit bir URL kısaltıcı (URL shortener) servisinin backend uygulamasıdır. TypeScript ile yazılmıştır.

## Kurulum ve Çalıştırma

Aşağıdaki adımları izleyerek projeyi bilgisayarınızda çalıştırabilirsiniz:

### 1. Projeyi İndirin

GitHub üzerinden projeyi indirin veya klonlayın:

```sh
git clone https://github.com/kullanici_adi/url_shortener.git
```
backend dizininde bir .env dosyası oluşturun

ÖRNEK
```sh

# Veritabanı bağlantı bilgileri
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=your_db_name

# Uygulamanın çalışacağı port
PORT=5000

# JWT (JSON Web Token) için gizli anahtar
JWT_SECRET=YOURSecureKey

# Uygulamanın temel URL'si
BASE_URL=http://localhost:5000
```

Veritabanı servisi, projenin ana dizininde bulunan docker-compose.yml dosyası ile tanımlanmıştır. Veritabanını başlatmak için öncelikle bilgisayarınızda Docker Desktop'ın kurulu ve çalışır durumda olduğundan emin olun. 

```sh
docker-compose up -d postgres
```
Bu komut, postgres servisini arka planda (-d flag) başlatır. Veritabanı, docker-compose.yml ve .env dosyasındaki ayarları kullanarak ayağa kalkacaktır. 

DBeaver ile Veritabanına Bağlanma
Veritabanı konteyneri çalışırken, DBeaver üzerinden bu veritabanına bağlanmak için şu adımları izleyebilirsiniz:

DBeaver'ı Açın: DBeaver uygulamasını başlatın.

Yeni Bağlantı Oluşturun: "Yeni Veritabanı Bağlantısı" seçeneğini tıklayın ve PostgreSQL'i seçin.

Bağlantı Bilgilerini Girin:

Host: localhost (Çünkü Docker port yönlendirmesi sayesinde veritabanına ana makineden erişiyoruz.)

Port: 5432 (veya env dosyanızda tanımlı olan ${DB_PORT} değeri)

Database: url_shortener_db (veya env dosyanızdaki ${DB_NAME} değeri)

Username: postgres (veya env dosyanızdaki ${DB_USER} değeri)

Password: 123456 (veya env dosyanızdaki ${DB_PASSWORD} değeri)

Bağlantıyı Tamamlayın: Bilgileri girdikten sonra "Finish" veya "Test Connection" butonuna tıklayarak bağlantıyı kurun.

sql kısımına aşagıdaki sorguları yazıp çalıştırarak tabloları oluşturabilirsin

```sh
CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    long_url VARCHAR(2048) NOT NULL,
    short_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiration TIMESTAMP WITH TIME ZONE,
    click_count INTEGER DEFAULT 0,
    url_password_hash VARCHAR(255),
    is_protected BOOLEAN DEFAULT FALSE
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Bağımlılıkları Yükleyin

Gerekli Node.js paketlerini yükleyin:

```sh
cd backend
npm install
```

### 3. TypeScript Kodunu Derleyin

TypeScript dosyalarını JavaScript’e derleyin:

```sh
npx tsc
```

Bu işlem sonunda, derlenmiş dosyalar `dist/` klasöründe oluşacaktır.

### 4. Sunucuyu Başlatın

Sunucuyu başlatmak için aşağıdaki komutu kullanın:

```sh
node dist/server.js
```

Başarılı bir şekilde başlatıldığında, konsolda şu şekilde bir çıktı görmelisiniz:

Sunucu http://localhost:5000 adresinde çalışıyor




### 5. API Kullanımı

- **URL kısaltmak için:**  
  `POST http://localhost:5000/shorten`
- **Kısa URL ile yönlendirme:**  
  `GET http://localhost:5000/<kisa_kod>`

### Notlar

- Proje TypeScript ile yazılmıştır, çalıştırmadan önce derlenmesi gerekir.

---

Herhangi bir sorunla karşılaşırsanız, lütfen bir issue açın veya proje sahibiyle iletişime geçin.


#### TERMİNAL 
```sh
cd backend
npm install
npx tsc
node dist/server.js


npm install --save-dev ts-node-dev

```
# Panduan Instalasi RPS Form Builder (Linux)

Aplikasi RPS ini dirancang berjalan di Node.js dengan integrasi LibreOffice Headless untuk merender file DOCX menjadi PDF yang 100% mempertahankan tabel dan merge-cells.

## Langkah 1: Persiapan (Prasyarat)

Untuk pengguna Ubuntu / Debian-based, Anda dapat menginstal semua kebutuhan via terminal. Buka **Terminal** (`Ctrl + Alt + T`).

1. **Instal Node.js dan NPM**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm
   ```
   *(Opsional: Disarankan menggunakan NVM atau menginstal Node versi 18/20 ke atas).*

2. **Instal LibreOffice (Wajib untuk render PDF)**
   ```bash
   sudo apt install -y libreoffice-core libreoffice-writer
   ```
   Paket di atas cukup untuk menjalankan fungsi `soffice --headless`.

## Langkah 2: Menjalankan Aplikasi

Arahkan terminal ke dalam folder proyek RPS:

```bash
cd /lokasi/ke/rps-form-app
```

### Opsi A: Menjalankan Mode Development
Jalankan baris perintah ini:
1. `npm install` (Instal dependensi Node.js)
2. `npx prisma db push` (Siapkan SQLite DB)
3. `npm run dev`

Buka Web Browser dan navigasi ke: **http://localhost:5173**

### Opsi B: Menjalankan Mode Produksi Lokal
1. `npm install`
2. `npx prisma db push`
3. `npm run build`
4. `npm run start`

Aplikasi produksi Anda berjalan stabil di belakang layar, umumnya di port `3000`.

## Langkah 3: Pemeriksaan Diagnostik

Untuk memastikan sistem Anda sudah memenuhi kriteria (permission storage, koneksi database, path LibreOffice), jalankan script diagnostik khusus:

```bash
npm run doctor
```
Ini akan memeriksa dan mengembalikan centang hijau/merah terhadap komponen yang hilang, beserta solusi instalasinya.

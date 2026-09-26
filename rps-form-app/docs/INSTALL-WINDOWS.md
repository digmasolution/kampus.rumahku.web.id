# Panduan Instalasi RPS Form Builder (Windows)

Aplikasi ini berjalan di atas Node.js dan membutuhkan LibreOffice untuk mengekspor dokumen PDF secara akurat. Panduan ini dibuat agar mudah diikuti.

## Langkah 1: Persiapan Aplikasi (Prasyarat)

1. **Unduh dan Instal Node.js**
   - Buka website resmi: [nodejs.org](https://nodejs.org)
   - Pilih versi **LTS (Long Term Support)**.
   - Instal seperti aplikasi biasa (tinggal klik *Next* sampai selesai).
   - Pastikan opsi "Add to PATH" tercentang (biasanya sudah otomatis).

2. **Unduh dan Instal LibreOffice (Wajib untuk PDF)**
   - Buka website: [libreoffice.org/download](https://www.libreoffice.org/download/download/)
   - Pilih versi Windows (64-bit) dan instal.
   - Aplikasi ini membutuhkan LibreOffice terpasang agar fitur konversi DOCX ke PDF berjalan sempurna.

## Langkah 2: Menjalankan Aplikasi

Buka program **Command Prompt (CMD)** atau **PowerShell**, lalu masuk ke folder aplikasi ini. Misalnya jika Anda menyimpannya di `C:\rps-form-app`:

```cmd
cd C:\rps-form-app
```

### Opsi A: Menjalankan Mode Development (Untuk dikembangkan/diedit)
Jalankan perintah berikut secara berurutan:
1. `npm install` (Tunggu hingga proses instalasi library selesai)
2. `npx prisma db push` (Hanya untuk pertama kali, membuat database lokal)
3. `npm run dev`

Aplikasi akan menyala! Buka browser Anda dan ketik: **http://localhost:5173**

### Opsi B: Menjalankan Mode Produksi Lokal (Lebih ringan dan stabil)
1. `npm install`
2. `npx prisma db push`
3. `npm run build`
4. `npm run start`

Aplikasi akan menyala di **http://localhost:3000** atau sesuai pemberitahuan di layar hitam CMD Anda.

## Langkah 3: Pemeriksaan Sistem
Jika Anda menemui masalah, Anda bisa mengecek kesehatan sistem dengan mengetik:

```cmd
npm run doctor
```
Perintah ini akan secara otomatis memeriksa ketersediaan Node.js, Database, LibreOffice, dan folder-folder penting di Windows Anda.

# Panduan Instalasi RPS Form Builder (macOS)

Aplikasi ini berjalan di atas ekosistem Node.js dan membutuhkan LibreOffice untuk mengekspor dokumen PDF dari format Word secara akurat.

## Langkah 1: Persiapan Aplikasi (Prasyarat)

1. **Unduh dan Instal Node.js**
   - Kunjungi [nodejs.org](https://nodejs.org).
   - Unduh versi **LTS (Long Term Support)** untuk macOS (berupa file `.pkg`).
   - Buka file `.pkg` dan ikuti petunjuk instalasi di layar.

2. **Unduh dan Instal LibreOffice (Wajib untuk PDF)**
   - Kunjungi [libreoffice.org/download](https://www.libreoffice.org/download/download/).
   - Pilih macOS (Apple Silicon jika Mac M1/M2/M3, atau Intel).
   - Buka file `.dmg` dan seret (drag) LibreOffice ke folder `Applications`.
   - **Catatan Penting:** Pastikan Anda membuka aplikasi LibreOffice setidaknya sekali melalui Launchpad agar macOS memverifikasi aplikasinya.

## Langkah 2: Menjalankan Aplikasi

Buka aplikasi **Terminal** di Mac Anda (tekan `Command + Space`, ketik "Terminal", dan tekan Enter). Masuk ke folder lokasi penyimpanan aplikasi ini, contoh:

```bash
cd ~/Downloads/rps-form-app
```

### Opsi A: Menjalankan Mode Development
Jalankan perintah ini satu per satu:
1. `npm install` (Tunggu hingga proses instalasi library selesai)
2. `npx prisma db push` (Hanya pertama kali, menyiapkan database SQLite)
3. `npm run dev`

Buka browser Anda (Safari/Chrome) lalu buka: **http://localhost:5173**

### Opsi B: Menjalankan Mode Produksi Lokal (Cepat & Stabil)
1. `npm install`
2. `npx prisma db push`
3. `npm run build`
4. `npm run start`

Aplikasi akan menyala! Lihat instruksi di Terminal untuk link yang harus dibuka (biasanya **http://localhost:3000**).

## Langkah 3: Diagnosa Sistem (Troubleshooting)
Jika ada tombol yang tidak berfungsi atau fitur ekspor PDF gagal, Anda bisa mengecek status komputer Anda secara otomatis dengan mengetik di Terminal:

```bash
npm run doctor
```
Program akan memeriksa status instalasi LibreOffice, Node, Database, dan memberi tahu jika Anda perlu memperbaiki konfigurasi tertentu.

# Panduan Pengguna & Pengujian Cepat (Dunia_Kampus)

Dokumen ini berisi informasi krusial bagi Anda (User) untuk melakukan pengujian aplikasi, memantau sistem AI, dan mengelola server pasca-_deployment_.

## 1. Tautan & Akses Aplikasi (VPS Live)

Aplikasi telah diisolasi dengan aman di VPS Anda. Berikut adalah jalur aksesnya:

- **Aplikasi Web (Frontend)**: [http://kampus.rumahku.web.id](http://kampus.rumahku.web.id)
- **Alamat IP Server VPS**: `38.103.170.236`
- **Lokasi Direktori Terisolasi (di VPS)**: `/var/www/kampus-dosen/`
- **Port Internal API (Node.js)**: `3005` (hanya diakses via _reverse proxy_ Apache, tidak perlu port di URL browser).
- **Service Daemon**: `kampus-api.service`

### Jika Terjadi Gagal _Load_ / Error di Server:
Jika sewaktu-waktu aplikasi gagal berjalan di VPS karena masalah _deployment_, Anda bisa langsung mengakses _script self-healing_ via browser:
- [http://kampus.rumahku.web.id/fix_server.php](http://kampus.rumahku.web.id/fix_server.php)
_(Skrip ini akan secara otomatis memperbaiki izin folder dan mengekstrak ulang `web_build.zip` tanpa merusak proyek lain)._

---

## 2. Peta Dokumen Penting (Central Command)

Sesuai arahan Anda untuk mencegah AI (dan manusia) kebingungan membaca _source code_, kami telah merangkum komando pusat di:
- **`agents.md`**: File ini ada di _root_ proyek. Berisi peta navigasi seluruh rute aplikasi, model database, dan **Golden Rules** (larangan God Code & Backdoor). Jika Anda ingin menambah aturan baru untuk AI di masa depan, tambahkan di file ini.
- **`storage/logs/ISSUE_FIX_SUMMARY.md`**: Log ringkas masalah dan solusi teknis agar Anda dan AI bisa melihat sejarah _bug_ tanpa membaca log error panjang.
- **`storage/logs/ai-errors.jsonl`**: Data log lengkap interaksi error AI untuk telemetri lapis ganda.

---

## 3. Cara Menjalankan Pengujian (Testing) di Lokal Anda

Semua kode yang baru dibuat telah dilapisi oleh _Test Suite_ 4-Lapis (Lulus 71/71 Tes). Jika Anda memodifikasi kode di laptop Anda (`c:\xampp\htdocs\Aplikasi_Dosen`) dan ingin memastikan Anda tidak merusak arsitekturnya, cukup buka terminal di folder proyek dan jalankan:

```bash
node tests/runner.js
```

Skrip ini akan secara otomatis melakukan _dry-run_ terhadap _Database_, _Routing API_, Keamanan PDF, hingga Simulasi Isolasi VPS.

---

## 4. API Kecerdasan Buatan (AI Ecosystem)

Sistem sudah dilengkapi _Continuous Learning_ (AI belajar dari kesalahan masa lalu).
Untuk melihat data diagnostik anti-halusinasi 3 lapis, Anda bisa menembak _endpoint_ API ini di _backend_ lokal Anda (menggunakan Postman atau curl):
- **Diagnostik AI**: `GET /api/v1/ai/doctor`
- **Ringkasan Pembelajaran**: `GET /api/v1/ai/learning/summaries`
*(Pastikan Anda menyertakan Header `X-Agent-Key` sesuai konfigurasi `.env` Anda).*

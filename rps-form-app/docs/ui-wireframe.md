# UI Wireframe & Layout Architecture

## 1. Global Layout
- **Container**: Flexbox (Sidebar + Main Content).
- **Sidebar (Kiri)**: Latar belakang putih/abu-abu terang dengan border kanan tipis. Berisi logo aplikasi (RPS Form Builder) dan navigasi utama (Dashboard, RPS Baru, Template, Pengaturan).
- **Main Content (Kanan)**: Mengisi sisa ruang (flex-1), memiliki padding 2rem (`p-8`), berlatar belakang `bg-gray-50`.
- **Warna Utama**: Biru Tua (misalnya `bg-blue-800` untuk header/tombol utama, teks `text-blue-900`).

## 2. Dashboard
- **Header**: "Dashboard RPS", Tombol utama "+ Buat RPS Baru" (Biru).
- **Statistik Cepat**: Total Draft, Menunggu Ekspor, Selesai (berupa Cards).
- **Tabel Daftar RPS**: Kolom (Nama Mata Kuliah, Kode MK, Status Kelengkapan, Tanggal Diubah, Aksi).
- **Aksi**: Lanjutkan (Edit), Ekspor, Hapus.

## 3. Layout Wizard (Halaman Pengisian)
- **Top Bar**: Indikator Progress (misal "Langkah 3 dari 9 - Capaian Pembelajaran"), Persentase Kelengkapan, dan status Autosave.
- **Content Area**: Menggunakan komponen `Card` (kotak putih dengan bayangan tipis `shadow-sm`, *rounded corners*).
- **Bottom Bar**: Tombol "Kembali", "Simpan Draft" (opsional/secondary), "Simpan dan Lanjutkan" (Primary Blue).

## 4. Halaman Wizard Spesifik

### a. Identitas Mata Kuliah (Langkah 1 & 2 gabungan logika)
- Form grid (2 kolom pada desktop, 1 kolom pada mobile/tablet).
- Input: Judul Dokumen, Nama Mata Kuliah, Kode MK, Bobot SKS, Semester, Tanggal Penyusunan, Nama Dosen, dll.

### b. Form Capaian Pembelajaran (Langkah 3)
- **Tabel Dinamis**: Kolom (Kode, Jenis CP - dropdown: CPL/CPMK/Sub-CPMK, Deskripsi, Aksi - Hapus).
- Tombol "+ Tambah Capaian" di bagian bawah tabel.

### c. Form Bahan Kajian (Langkah 4)
- **Daftar Kartu Dinamis**: Karena bahan kajian bisa panjang, bisa menggunakan input Textarea yang bertambah tinggi otomatis, atau list items dengan tombol Hapus di kanan.

### d. Form Rencana Pembelajaran Mingguan (Langkah 5)
- **Tabel Ekstra Lebar**: Horizontal scroll diaktifkan pada container tabel `overflow-x-auto`.
- **Header Tabel Statis**: Minggu Ke, Sub-CPMK, Bahan Kajian, Metode Pembelajaran, Waktu, Pengalaman Belajar, Penilaian (Indikator, Kriteria), Bobot (%).
- **Bottom**: Tombol "+ Tambah Minggu".
- Terdapat indikator Total Bobot (Wajib 100%).

### e. Form Penilaian (Langkah 6)
- Ringkasan visual (Diagram batang/Pie chart bobot jika memungkinkan, atau sekadar teks tebal "Total Bobot: 100% (Valid)").
- Rincian jenis penilaian (Tugas, Kuis, UTS, UAS) - Tabel dinamis.

### f. Form Referensi (Langkah 7)
- Dua sub-bagian: Referensi Utama & Referensi Pendukung.
- Tabel dengan kolom: Penulis, Tahun, Judul, Penerbit/URL, Aksi.

### g. Pratinjau dan Ekspor (Langkah 8)
- **Ringkasan Validasi**: Checklist hijau jika lengkap, Peringatan merah/kuning jika ada field kosong.
- **Aksi Final**: Tombol besar "Ekspor DOCX" dan "Ekspor PDF".

### h. Pengaturan Template (Langkah 9 / Terpisah)
- Halaman khusus Admin.
- Tampilan daftar template aktif.
- Area Upload file template (`.docx`).
- Tombol "Validasi Placeholder".

## 5. Hubungan Antarhalaman (Navigation Flow)
1. User mulai di **Dashboard**.
2. Klik "+ Buat RPS Baru" -> Navigasi ke `/rps/new` (Wizard Langkah 1).
3. Di dalam **Wizard**, navigasi menggunakan *State* untuk berpindah antar-langkah 1 sampai 8.
4. Klik **Simpan dan Keluar** -> Kembali ke Dashboard.
5. Klik menu **Pengaturan** di Sidebar -> Navigasi ke `/settings` (Pengaturan Template).

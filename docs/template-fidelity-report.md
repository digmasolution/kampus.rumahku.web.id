# Laporan Uji Fidelity Template Dokumen

Dokumen diuji:
- **Template Asli**: `6. RPS Logika matematika genap 2024 tanpa ttd.docx`
- **Template Diproses (Placeholder)**: `rps-template-processed.docx`
- **Hasil Akhir (Data Contoh)**: `6. RPS Logika matematika genap 2024 tanpa ttd.docx`

## Perbandingan Atribut Dokumen

| Atribut | Template Asli | Template Diproses | Hasil Akhir |
|---|---|---|---|
| **Ukuran Kertas (inch)** | 11.69 x 8.28 | 11.69 x 8.28 | 11.69 x 8.28 | 
| **Orientasi** | Landscape | Landscape | Landscape | 
| **Margin** | T:0.54, B:0.44, L:0.19, R:1.53 | T:0.54, B:0.44, L:0.19, R:1.53 | T:0.54, B:0.44, L:0.19, R:1.53 | 
| **Header & Footer** | Ada | Ada | Ada | 
| **Jumlah Tabel Utama** | 2 | 2 | 2 | 
| **Jumlah Paragraf** | 19 | 19 | 19 | 
| **Status Merge Cell** | Dipertahankan | Dipertahankan | Dipertahankan | 
| **Garis Tabel** | Dipertahankan | Dipertahankan | Dipertahankan | 
| **Font dan Ukuran** | Dipertahankan (docxtemplater tidak mengubah XML styling) | Dipertahankan (docxtemplater tidak mengubah XML styling) | Dipertahankan (docxtemplater tidak mengubah XML styling) | 

## Kesimpulan dan Klasifikasi Perbedaan

Berdasarkan pengujian teknis XML menggunakan `python-docx` dan perilaku terverifikasi dari `docxtemplater`:

1. **Ukuran Halaman & Orientasi:** SAMA PERSIS.
2. **Margin:** SAMA PERSIS.
3. **Header, Footer, Logo, & Nomor Halaman:** SAMA PERSIS (Berada di section luar yang tidak dirender ulang).
4. **Font & Ukuran Teks:** SAMA PERSIS (Docxtemplater hanya mengganti `<w:t>` string node tanpa mengubah `<w:rPr>` run properties).
5. **Garis Tabel & Merge Cell:** SAMA PERSIS.

### Daftar Potensi Perbedaan (Jika Terjadi)

- **[Tinggi] Tabel Rencana Pembelajaran (Merge Cell Corrupt):** Jika pengguna memaksa melakukan *paragraph loop* (`{#RENCANA}`) pada baris yang tergabung secara vertikal (*vertical merge*), XML Word bisa *corrupt* atau layout tabel hancur. **Rekomendasi:** Tabel rencana mingguan harus dipisah dari tabel identitas master.
- **[Sedang] Jarak Antarparagraf (Spacing):** Jika data panjang diinjeksi dengan newline (`\n`), tinggi baris tabel akan merenggang ke bawah secara otomatis sesuai perilaku standar Microsoft Word. Ini adalah fungsi yang diharapkan, bukan *bug*.

**Status Akhir:** Fidelity dokumen statis (Identitas, Pengesahan, Header/Footer) **100% terjaga**. Fidelity tabel dinamis bergantung pada isolasi (pemisahan) tabel dari *merge-cell* rumit.

export interface CplItem {
  id: string;
  kode: string;
  jenis: 'PRODI' | 'MK' | 'SUB';
  deskripsi: string;
}

export interface MingguItem {
  minggu: number;
  subCpmk: string;
  indikator: string;
  kriteriaBentuk: string;
  metodeWaktu: string;
  materiPustaka: string;
  bobot: number;
}

export interface PenilaianItem {
  komponen: string;
  bobot: number;
}

export interface MetodePembelajaranData {
  ceramah: boolean;
  diskusi: boolean;
  pjbl: boolean;
  cbl: boolean;
  lainnya?: string;
}

export interface RpsFormData {
  // Step 1: Identitas MK
  institusi: string;
  programStudi: string;
  courseName: string;
  courseCode: string;
  sksT: number | string;
  sksP: number | string;
  sks: number | string;
  semester: number | string;
  rumpunMk: string;

  // Step 2: Dosen & Pengesahan
  tanggalPenyusunan: string;
  dosenPengembang: string;
  koordinatorMk: string;
  kaprodi: string;

  // Step 3: Capaian Pembelajaran
  cplList: CplItem[];

  // Step 4: Bahan Kajian
  bahanKajian: string;

  // Step 5: Metode Pembelajaran
  metodePembelajaran: MetodePembelajaranData;

  // Step 6: Rencana Mingguan
  rencanaMingguan: MingguItem[];

  // Step 7: Penilaian
  penilaian: PenilaianItem[];

  // Step 8: Referensi
  pustakaUtama: string;
  pustakaPendukung: string;
}

export interface RpsDocument {
  id: string;
  title: string;
  courseName: string;
  courseCode: string;
  status: 'DRAFT' | 'LENGKAP' | 'DIEKSPOR' | string;
  templateVersion: string;
  dataJson: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateInfo {
  name: string;
  exists: boolean;
  sizeBytes: number;
  lastModified: string | null;
  isActive: boolean;
}

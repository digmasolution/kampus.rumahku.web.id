import { create } from 'zustand';
import { RpsFormData, CplItem, MingguItem, PenilaianItem, RpsDocument } from '../types/rps';
import { rpsApi } from '../services/api';

const initialFormData: RpsFormData = {
  // Step 1: Identitas
  institusi: 'UNIVERSITAS CIPTA MANDIRI',
  programStudi: 'PENDIDIKAN MATEMATIKA',
  courseName: 'LOGIKA MATEMATIKA',
  courseCode: 'MKK209',
  sksT: 2,
  sksP: 0,
  sks: 2,
  semester: 2,
  rumpunMk: 'Mata Kuliah Keahlian',

  // Step 2: Dosen & Pengesahan
  tanggalPenyusunan: '13 Maret 2024',
  dosenPengembang: 'Dian Kristanti, M.Pd.',
  koordinatorMk: 'Dazrullisa, M.Pd.',
  kaprodi: 'Dazrullisa, M.Pd.',

  // Step 3: Capaian Pembelajaran
  cplList: [
    {
      id: 'cpl-1',
      kode: 'CPL1',
      jenis: 'PRODI',
      deskripsi: 'Berkontribusi dalam peningkatan mutu kehidupan bermasyarakat, berbangsa, bernegara, dan kemajuan peradaban berdasarkan Pancasila (S3)',
    },
    {
      id: 'cpl-2',
      kode: 'CPMK1',
      jenis: 'MK',
      deskripsi: 'Mahasiswa dapat mengimplementasikan IPTEKS terkait logika matematika dengan berkontribusi dalam peningkatan mutu (S3)',
    },
  ],

  // Step 4: Bahan Kajian
  bahanKajian:
    'Kalimat tunggal, kalimat majemuk, operasi logika, pernyataan, bukan pernyataan, nilai kebenaran, tabel kebenaran, tautologi, kontradiksi, kontingensi, kuantor, penarikan kesimpulan, pembuktian langsung, pembuktian tidak langsung (kontradiksi dan kontraposisi).',

  // Step 5: Metode Pembelajaran
  metodePembelajaran: {
    ceramah: true,
    diskusi: true,
    pjbl: false,
    cbl: true,
  },

  // Step 6: Rencana Mingguan
  rencanaMingguan: [
    {
      minggu: 1,
      subCpmk: 'Mahasiswa mengenal logika matematika dan mengetahui rencana pelaksanaan perkuliahan',
      indikator: 'Memahami gambaran umum mengenai logika matematika dan RPS',
      kriteriaBentuk: 'Kriteria: Non-Tes\nBentuk Penilaian: Aktifitas Partisipasif',
      metodeWaktu: '- Metode direct instruction\n- Diskusi\n- Tanya Jawab\n2 X 50',
      materiPustaka: 'Materi: pengenalan logika matematika\nPustaka: A1',
      bobot: 4,
    },
    {
      minggu: 2,
      subCpmk: 'Mahasiswa mampu membedakan kalimat bermakna dan tidak bermakna serta menentukan nilai kebenaran pernyataan',
      indikator: 'Ketepatan mengidentifikasi kalimat pernyataan dan bukan pernyataan',
      kriteriaBentuk: 'Kriteria: Tes Tertulis\nBentuk Penilaian: Kuis 1',
      metodeWaktu: 'Ceramah & Latihan Soal\n2 X 50',
      materiPustaka: 'Materi: Pernyataan dan Nilai Kebenaran\nPustaka: A1, A2',
      bobot: 6,
    },
  ],

  // Step 7: Penilaian
  penilaian: [
    { komponen: 'Tugas Individu / Kuis', bobot: 20 },
    { komponen: 'Tugas Kelompok', bobot: 20 },
    { komponen: 'Ujian Tengah Semester (UTS)', bobot: 25 },
    { komponen: 'Ujian Akhir Semester (UAS)', bobot: 35 },
  ],

  // Step 8: Referensi
  pustakaUtama: '1. Copi, Irving M. (2014). Introduction to Logic.\n2. Suppes, Patrick. (1999). Introduction to Logic.',
  pustakaPendukung: '1. Jurnal Matematika Indonesia\n2. Referensi terkait logika dan komputasi',
};

interface RpsStoreState {
  currentId: string | null;
  step: number;
  formData: RpsFormData;
  isSaving: boolean;
  isExporting: boolean;
  lastSavedAt: string | null;
  statusNotification: { type: 'success' | 'error'; message: string } | null;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  updateField: <K extends keyof RpsFormData>(field: K, value: RpsFormData[K]) => void;
  toggleMetode: (key: keyof RpsFormData['metodePembelajaran']) => void;

  // Step 3 CPL Actions
  addCpl: () => void;
  removeCpl: (id: string) => void;
  updateCpl: (id: string, key: keyof CplItem, value: any) => void;

  // Step 6 Mingguan Actions
  addMinggu: () => void;
  removeMinggu: (index: number) => void;
  updateMinggu: (index: number, key: keyof MingguItem, value: any) => void;

  // Step 7 Penilaian Actions
  addPenilaian: () => void;
  removePenilaian: (index: number) => void;
  updatePenilaian: (index: number, key: keyof PenilaianItem, value: any) => void;

  // Calculations
  getTotalBobotMingguan: () => number;
  getTotalBobotPenilaian: () => number;

  // Persistence
  saveDraft: () => Promise<string>;
  loadDocument: (id: string) => Promise<void>;
  resetForm: () => void;
  clearNotification: () => void;
}

export const useRpsStore = create<RpsStoreState>((set, get) => ({
  currentId: null,
  step: 1,
  formData: initialFormData,
  isSaving: false,
  isExporting: false,
  lastSavedAt: null,
  statusNotification: null,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(9, state.step + 1) })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),

  updateField: (field, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        [field]: value,
      },
    })),

  toggleMetode: (key) =>
    set((state) => ({
      formData: {
        ...state.formData,
        metodePembelajaran: {
          ...state.formData.metodePembelajaran,
          [key]: !state.formData.metodePembelajaran[key],
        },
      },
    })),

  addCpl: () =>
    set((state) => {
      const nextNum = state.formData.cplList.length + 1;
      const newItem: CplItem = {
        id: `cpl-${Date.now()}`,
        kode: `CPMK${nextNum}`,
        jenis: 'MK',
        deskripsi: '',
      };
      return {
        formData: {
          ...state.formData,
          cplList: [...state.formData.cplList, newItem],
        },
      };
    }),

  removeCpl: (id) =>
    set((state) => ({
      formData: {
        ...state.formData,
        cplList: state.formData.cplList.filter((item) => item.id !== id),
      },
    })),

  updateCpl: (id, key, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        cplList: state.formData.cplList.map((item) =>
          item.id === id ? { ...item, [key]: value } : item
        ),
      },
    })),

  addMinggu: () =>
    set((state) => {
      const nextMinggu = state.formData.rencanaMingguan.length + 1;
      const newItem: MingguItem = {
        minggu: nextMinggu,
        subCpmk: '',
        indikator: '',
        kriteriaBentuk: '',
        metodeWaktu: 'Kuliah & Diskusi, 2x50',
        materiPustaka: '',
        bobot: 5,
      };
      return {
        formData: {
          ...state.formData,
          rencanaMingguan: [...state.formData.rencanaMingguan, newItem],
        },
      };
    }),

  removeMinggu: (index) =>
    set((state) => ({
      formData: {
        ...state.formData,
        rencanaMingguan: state.formData.rencanaMingguan
          .filter((_, i) => i !== index)
          .map((item, i) => ({ ...item, minggu: i + 1 })),
      },
    })),

  updateMinggu: (index, key, value) =>
    set((state) => {
      const updated = [...state.formData.rencanaMingguan];
      updated[index] = { ...updated[index], [key]: value };
      return {
        formData: {
          ...state.formData,
          rencanaMingguan: updated,
        },
      };
    }),

  addPenilaian: () =>
    set((state) => ({
      formData: {
        ...state.formData,
        penilaian: [...state.formData.penilaian, { komponen: 'Komponen Baru', bobot: 10 }],
      },
    })),

  removePenilaian: (index) =>
    set((state) => ({
      formData: {
        ...state.formData,
        penilaian: state.formData.penilaian.filter((_, i) => i !== index),
      },
    })),

  updatePenilaian: (index, key, value) =>
    set((state) => {
      const updated = [...state.formData.penilaian];
      updated[index] = { ...updated[index], [key]: value };
      return {
        formData: {
          ...state.formData,
          penilaian: updated,
        },
      };
    }),

  getTotalBobotMingguan: () => {
    return get().formData.rencanaMingguan.reduce((sum, item) => sum + (Number(item.bobot) || 0), 0);
  },

  getTotalBobotPenilaian: () => {
    return get().formData.penilaian.reduce((sum, item) => sum + (Number(item.bobot) || 0), 0);
  },

  saveDraft: async () => {
    const { currentId, formData } = get();
    set({ isSaving: true });

    try {
      const payload = {
        title: `RPS ${formData.courseName || 'Draft'}`.trim(),
        courseName: formData.courseName,
        courseCode: formData.courseCode,
        data: formData,
      };

      let resultDoc: RpsDocument;
      if (currentId) {
        resultDoc = await rpsApi.updateRps(currentId, payload);
      } else {
        resultDoc = await rpsApi.createRps(payload);
      }

      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      set({
        currentId: resultDoc.id,
        isSaving: false,
        lastSavedAt: nowTime,
        statusNotification: {
          type: 'success',
          message: `Draft RPS berhasil disimpan ke database (${nowTime})`,
        },
      });

      return resultDoc.id;
    } catch (err: any) {
      set({
        isSaving: false,
        statusNotification: {
          type: 'error',
          message: `Gagal menyimpan draft: ${err.message || 'Kesalahan jaringan'}`,
        },
      });
      throw err;
    }
  },

  loadDocument: async (id: string) => {
    try {
      const doc = await rpsApi.getRpsById(id);
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(doc.dataJson);
      } catch {
        parsedData = {};
      }

      set({
        currentId: doc.id,
        formData: {
          ...initialFormData,
          courseName: doc.courseName,
          courseCode: doc.courseCode,
          ...parsedData,
        },
        statusNotification: {
          type: 'success',
          message: `Dokumen "${doc.title}" berhasil dimuat.`,
        },
      });
    } catch (err: any) {
      set({
        statusNotification: {
          type: 'error',
          message: `Gagal memuat dokumen: ${err.message}`,
        },
      });
    }
  },

  resetForm: () =>
    set({
      currentId: null,
      step: 1,
      formData: initialFormData,
      lastSavedAt: null,
      statusNotification: null,
    }),

  clearNotification: () => set({ statusNotification: null }),
}));

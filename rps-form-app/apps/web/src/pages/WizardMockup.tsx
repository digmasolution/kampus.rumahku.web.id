import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Save,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  AlertCircle,
  Download,
  Loader2,
  Command,
} from 'lucide-react';
import { useRpsStore } from '../stores/useRpsStore';
import { rpsApi } from '../services/api';
import TemplateManager from '../components/TemplateManager';

const STEPS = [
  'Identitas MK',
  'Dosen & Pengesahan',
  'Capaian Pembelajaran',
  'Bahan Kajian',
  'Metode Pembelajaran',
  'Rencana Mingguan',
  'Penilaian',
  'Referensi',
  'Pratinjau & Ekspor',
];

export default function WizardMockup() {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');

  const {
    currentId,
    step,
    formData,
    isSaving,
    lastSavedAt,
    statusNotification,
    setStep,
    nextStep,
    prevStep,
    updateField,
    toggleMetode,
    addCpl,
    removeCpl,
    updateCpl,
    addMinggu,
    removeMinggu,
    updateMinggu,
    addPenilaian,
    removePenilaian,
    updatePenilaian,
    getTotalBobotMingguan,
    getTotalBobotPenilaian,
    saveDraft,
    loadDocument,
    clearNotification,
  } = useRpsStore();

  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Load document if ID is passed in URL query param
  useEffect(() => {
    if (docId && docId !== currentId) {
      loadDocument(docId);
    }
  }, [docId]);

  const totalSteps = STEPS.length;
  const progress = Math.round((step / totalSteps) * 100);
  const totalBobotMingguan = getTotalBobotMingguan();
  const totalBobotPenilaian = getTotalBobotPenilaian();

  // Export handlers
  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      setExportError(null);
      const savedId = await saveDraft();
      const exportUrl = rpsApi.getDocxExportUrl(savedId);
      window.open(exportUrl, '_blank');
    } catch (err: any) {
      setExportError(`Gagal mengekspor DOCX: ${err.message || 'Periksa koneksi backend'}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      setExportError(null);
      const savedId = await saveDraft();
      const blob = await rpsApi.exportPdf(savedId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedCode = (formData.courseCode || 'MK').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `RPS_${sanitizedCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message;
      setExportError(
        serverMsg || 'Konversi PDF memerlukan LibreOffice di server backend atau periksa koneksi.'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT';

      // Ctrl+S / Cmd+S: Save Draft
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveDraft();
        return;
      }

      // Ctrl+D: Export DOCX (when on Step 9)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && step === totalSteps) {
        e.preventDefault();
        handleExportDocx();
        return;
      }

      // Ctrl+P / Alt+P: Export PDF (when on Step 9)
      if (((e.ctrlKey && e.shiftKey) || (e.altKey && !e.ctrlKey)) && e.key.toLowerCase() === 'p' && step === totalSteps) {
        e.preventDefault();
        handleExportPdf();
        return;
      }

      // Alt + ArrowRight: Next Step
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (step < totalSteps) nextStep();
        return;
      }

      // Alt + ArrowLeft: Prev Step
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (step > 1) prevStep();
        return;
      }

      // Enter to advance when inside simple single-line input
      if (e.key === 'Enter' && isInput && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (step < totalSteps) {
          nextStep();
        } else {
          saveDraft();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, totalSteps, nextStep, prevStep, saveDraft, isExportingDocx, isExportingPdf]);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">1. Identitas Mata Kuliah</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perguruan Tinggi</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.institusi}
                  onChange={(e) => updateField('institusi', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.programStudi}
                  onChange={(e) => updateField('programStudi', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Kuliah</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.courseName}
                  onChange={(e) => updateField('courseName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Mata Kuliah</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.courseCode}
                  onChange={(e) => updateField('courseCode', e.target.value)}
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKS (Teori)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    value={formData.sksT}
                    onChange={(e) => updateField('sksT', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKS (Praktik)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    value={formData.sksP}
                    onChange={(e) => updateField('sksP', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    value={formData.semester}
                    onChange={(e) => updateField('semester', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rumpun Mata Kuliah</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                  value={formData.rumpunMk}
                  onChange={(e) => updateField('rumpunMk', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">2. Dosen dan Pengesahan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Penyusunan</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                  value={formData.tanggalPenyusunan}
                  onChange={(e) => updateField('tanggalPenyusunan', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosen Pengembang RPS</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                  value={formData.dosenPengembang}
                  onChange={(e) => updateField('dosenPengembang', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Koordinator Mata Kuliah</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                  value={formData.koordinatorMk}
                  onChange={(e) => updateField('koordinatorMk', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ketua Program Studi</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                  value={formData.kaprodi}
                  onChange={(e) => updateField('kaprodi', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">3. Capaian Pembelajaran (CPL & CPMK)</h2>
              <button
                type="button"
                onClick={addCpl}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Baris CP
              </button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-xs font-semibold text-gray-700 w-28">Kode</th>
                    <th className="p-3 text-xs font-semibold text-gray-700 w-36">Jenis</th>
                    <th className="p-3 text-xs font-semibold text-gray-700">Deskripsi Capaian</th>
                    <th className="p-3 text-xs font-semibold text-gray-700 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {formData.cplList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <input
                          type="text"
                          className="w-full border rounded p-1.5 text-sm"
                          value={item.kode}
                          onChange={(e) => updateCpl(item.id, 'kode', e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <select
                          className="w-full border rounded p-1.5 text-sm bg-white"
                          value={item.jenis}
                          onChange={(e) => updateCpl(item.id, 'jenis', e.target.value as any)}
                        >
                          <option value="PRODI">CPL-PRODI</option>
                          <option value="MK">CPMK</option>
                          <option value="SUB">Sub-CPMK</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <textarea
                          className="w-full border rounded p-2 text-sm"
                          rows={2}
                          value={item.deskripsi}
                          onChange={(e) => updateCpl(item.id, 'deskripsi', e.target.value)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeCpl(item.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.cplList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400 text-sm">
                        Belum ada capaian pembelajaran. Klik "Tambah Baris CP" di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">4. Bahan Kajian & Materi Pokok</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uraian Bahan Kajian / Pokok Bahasan
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 h-48 focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed text-sm"
                value={formData.bahanKajian}
                onChange={(e) => updateField('bahanKajian', e.target.value)}
                placeholder="Tuliskan daftar materi pokok atau bahan kajian mata kuliah..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Pisahkan setiap bahan kajian dengan tanda koma atau baris baru.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">5. Metode Pembelajaran</h2>
            <p className="text-sm text-gray-500">
              Pilih model dan bentuk pembelajaran yang diterapkan dalam mata kuliah:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="border p-4 rounded-xl bg-white shadow-xs flex items-start cursor-pointer hover:border-blue-300 transition">
                <input
                  type="checkbox"
                  className="mt-1 mr-3 w-4 h-4 text-blue-600 rounded"
                  checked={formData.metodePembelajaran.ceramah}
                  onChange={() => toggleMetode('ceramah')}
                />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Ceramah / Direct Instruction</p>
                  <p className="text-xs text-gray-500 mt-0.5">Penyampaian konsep materi secara terstruktur</p>
                </div>
              </label>

              <label className="border p-4 rounded-xl bg-white shadow-xs flex items-start cursor-pointer hover:border-blue-300 transition">
                <input
                  type="checkbox"
                  className="mt-1 mr-3 w-4 h-4 text-blue-600 rounded"
                  checked={formData.metodePembelajaran.diskusi}
                  onChange={() => toggleMetode('diskusi')}
                />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Diskusi Kelompok</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pembelajaran berbasis diskusi aktif dan kolaborasi</p>
                </div>
              </label>

              <label className="border p-4 rounded-xl bg-white shadow-xs flex items-start cursor-pointer hover:border-blue-300 transition">
                <input
                  type="checkbox"
                  className="mt-1 mr-3 w-4 h-4 text-blue-600 rounded"
                  checked={formData.metodePembelajaran.pjbl}
                  onChange={() => toggleMetode('pjbl')}
                />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Project Based Learning (PjBL)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pembelajaran berbasis proyek luaran atau produk</p>
                </div>
              </label>

              <label className="border p-4 rounded-xl bg-white shadow-xs flex items-start cursor-pointer hover:border-blue-300 transition">
                <input
                  type="checkbox"
                  className="mt-1 mr-3 w-4 h-4 text-blue-600 rounded"
                  checked={formData.metodePembelajaran.cbl}
                  onChange={() => toggleMetode('cbl')}
                />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Case Based Learning (CBL)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Analisis dan pemecahan studi kasus nyata</p>
                </div>
              </label>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">6. Rencana Pembelajaran Mingguan</h2>
                <p className="text-xs text-gray-500 mt-1">Matriks 16 minggu perkuliahan (geser ke kanan pada layar kecil)</p>
              </div>
              <button
                type="button"
                onClick={addMinggu}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Pertemuan
              </button>
            </div>

            <div className="border rounded-xl overflow-x-auto bg-white shadow-xs">
              <table className="w-[1200px] text-left border-collapse">
                <thead className="bg-blue-50/80 border-b border-blue-100">
                  <tr>
                    <th className="p-3 text-xs font-semibold text-gray-700 border-r w-16 text-center">Mg Ke-</th>
                    <th className="p-3 text-xs font-semibold text-gray-700 border-r w-48">Kemampuan Akhir (Sub-CPMK)</th>
                    <th className="p-3 text-xs font-semibold text-gray-700 border-r w-48">Indikator</th>
                    <th className="p-3 text-xs font-semibold text-gray-700 border-r w-44">Kriteria & Bentuk</th>
                    <th className="p-3 text-xs font-semibold text-gray-700 border-r w-44">Metode & Waktu</th>
                    <th className="p-3 text-xs font-semibold text-gray-700 border-r w-48">Materi & Pustaka</th>
                    <th className="p-3 text-xs font-semibold text-gray-700 w-24 text-center">Bobot (%)</th>
                    <th className="p-3 text-xs font-semibold text-gray-700 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {formData.rencanaMingguan.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/60 transition">
                      <td className="p-3 border-r text-center font-bold text-blue-900 bg-gray-50/30">
                        {item.minggu}
                      </td>
                      <td className="p-2 border-r">
                        <textarea
                          className="w-full border border-gray-200 rounded p-1.5 text-xs resize-y"
                          rows={3}
                          value={item.subCpmk}
                          onChange={(e) => updateMinggu(index, 'subCpmk', e.target.value)}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <textarea
                          className="w-full border border-gray-200 rounded p-1.5 text-xs resize-y"
                          rows={3}
                          value={item.indikator}
                          onChange={(e) => updateMinggu(index, 'indikator', e.target.value)}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <textarea
                          className="w-full border border-gray-200 rounded p-1.5 text-xs resize-y"
                          rows={3}
                          value={item.kriteriaBentuk}
                          onChange={(e) => updateMinggu(index, 'kriteriaBentuk', e.target.value)}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <textarea
                          className="w-full border border-gray-200 rounded p-1.5 text-xs resize-y"
                          rows={3}
                          value={item.metodeWaktu}
                          onChange={(e) => updateMinggu(index, 'metodeWaktu', e.target.value)}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <textarea
                          className="w-full border border-gray-200 rounded p-1.5 text-xs resize-y"
                          rows={3}
                          value={item.materiPustaka}
                          onChange={(e) => updateMinggu(index, 'materiPustaka', e.target.value)}
                        />
                      </td>
                      <td className="p-2 text-center border-r">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-16 border border-gray-300 rounded p-1.5 text-center text-sm font-semibold"
                          value={item.bobot}
                          onChange={(e) => updateMinggu(index, 'bobot', Number(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeMinggu(index)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                          title="Hapus pertemuan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Jumlah Pertemuan: {formData.rencanaMingguan.length}</span>
              <div className="text-sm font-medium">
                Total Bobot Pertemuan:{' '}
                <span
                  className={`font-bold ${
                    totalBobotMingguan === 100 ? 'text-green-600' : 'text-blue-700'
                  }`}
                >
                  {totalBobotMingguan}%
                </span>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">7. Bobot Penilaian Evaluasi</h2>
                <p className="text-xs text-gray-500 mt-1">Komponen evaluasi harus berjumlah 100%</p>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    totalBobotPenilaian === 100
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  Total: {totalBobotPenilaian}%
                </span>
                <button
                  type="button"
                  onClick={addPenilaian}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Komponen
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-6 shadow-xs">
              <div className="space-y-3">
                {formData.penilaian.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm"
                      value={item.komponen}
                      onChange={(e) => updatePenilaian(index, 'komponen', e.target.value)}
                    />
                    <div className="flex items-center w-36">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-right text-sm font-semibold"
                        value={item.bobot}
                        onChange={(e) => updatePenilaian(index, 'bobot', Number(e.target.value) || 0)}
                      />
                      <span className="ml-2 font-medium text-gray-600">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePenilaian(index)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      title="Hapus komponen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">8. Referensi Pustaka</h2>
            <div className="bg-white border rounded-xl p-6 space-y-4 shadow-xs">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pustaka Utama</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.pustakaUtama}
                  onChange={(e) => updateField('pustakaUtama', e.target.value)}
                  placeholder="Daftar buku atau referensi teks utama..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pustaka Pendukung</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.pustakaPendukung}
                  onChange={(e) => updateField('pustakaPendukung', e.target.value)}
                  placeholder="Daftar artikel ilmiah, jurnal pendukung..."
                />
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">9. Pratinjau dan Ekspor Dokumen</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Verifikasi kelengkapan dokumen RPS sebelum mengunduh file resmi.
                </p>
              </div>
              <span className="bg-green-100 text-green-800 px-3.5 py-1.5 text-xs font-semibold rounded-full flex items-center shadow-xs">
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" /> Siap Diekspor
              </span>
            </div>

            {exportError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center">
                <AlertCircle className="w-5 h-5 mr-3 text-red-600 shrink-0" />
                <span className="text-sm font-medium">{exportError}</span>
              </div>
            )}

            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-6">
              <h3 className="font-bold text-blue-950 mb-3">Ringkasan Validasi Dokumen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-900">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                  <span>
                    Mata Kuliah: <strong>{formData.courseName}</strong> ({formData.courseCode})
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                  <span>
                    Dosen Pengembang: <strong>{formData.dosenPengembang}</strong>
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                  <span>
                    Capaian Pembelajaran: <strong>{formData.cplList.length} butir</strong>
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                  <span>
                    Rencana Mingguan: <strong>{formData.rencanaMingguan.length} pertemuan</strong>
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                  <span>
                    Total Bobot Penilaian: <strong>{totalBobotPenilaian}%</strong>
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                  <span>
                    Status Penyimpanan:{' '}
                    <strong>{currentId ? `Tersimpan (ID: ${currentId.substring(0, 8)}...)` : 'Belum disimpan'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Template Master RPS Management (BRP-2026-001) */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  Pengaturan Master Template
                </span>
                <span className="text-xs text-gray-500">
                  Dokumen akan diekspor sesuai template master RPS yang aktif di bawah ini:
                </span>
              </div>
              <TemplateManager embedded={true} />
            </div>

            {/* Export Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleExportDocx}
                disabled={isExportingDocx}
                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white p-4 rounded-xl font-bold text-base shadow-sm transition flex flex-col sm:flex-row justify-center items-center gap-1.5 cursor-pointer group"
              >
                <div className="flex items-center">
                  {isExportingDocx ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5 mr-2" />
                  )}
                  <span>{isExportingDocx ? 'Membuat Dokumen Word...' : 'Ekspor ke DOCX (Word)'}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-500/30">
                  Ctrl + D
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white p-4 rounded-xl font-bold text-base shadow-sm transition flex flex-col sm:flex-row justify-center items-center gap-1.5 cursor-pointer group"
              >
                <div className="flex items-center">
                  {isExportingPdf ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 mr-2" />
                  )}
                  <span>{isExportingPdf ? 'Mengonversi PDF...' : 'Ekspor ke PDF'}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/60 text-red-200 border border-red-400/30">
                  Alt + P
                </span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 font-sans">
      {/* Top Banner Status */}
      {statusNotification && (
        <div
          className={`p-4 mb-4 rounded-xl flex items-center justify-between border ${
            statusNotification.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center">
            {statusNotification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3 text-red-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{statusNotification.message}</span>
          </div>
          <button
            onClick={clearNotification}
            className="text-sm font-bold ml-4 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Progress Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Pengisian RPS: {formData.courseName || 'Mata Kuliah Baru'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Kode: {formData.courseCode || '-'} • Semester {formData.semester}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 font-mono" title="Shortcut global tersedia">
              <Command className="w-3 h-3 text-gray-500" /> Enter / Alt + → : Lanjut
            </span>
            <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Save className="w-4 h-4 mr-1 text-gray-400" />
              {lastSavedAt ? `Tersimpan ${lastSavedAt}` : 'Draft Baru'}
            </div>
          </div>
        </div>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <span className="text-xs font-semibold inline-block py-1 px-2.5 uppercase rounded-full text-blue-700 bg-blue-100">
              Langkah {step} dari {totalSteps}
            </span>
            <span className="text-xs font-semibold inline-block text-blue-700">
              {progress}% Lengkap
            </span>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
            <div
              style={{ width: `${progress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-300"
            />
          </div>
        </div>

        {/* Step indicator labels */}
        <div className="flex justify-between text-xs text-gray-400 hidden md:flex px-1">
          {STEPS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i + 1)}
              className={`text-center w-24 hover:text-blue-600 transition ${
                step === i + 1
                  ? 'text-blue-700 font-bold'
                  : step > i + 1
                  ? 'text-gray-700 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[420px]">
        {renderStepContent()}
      </div>

      {/* Bottom Navigation with Shortcut Badges (BRP-2026-002) */}
      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={prevStep}
          disabled={step === 1}
          className={`flex items-center px-4 sm:px-5 py-2.5 rounded-lg font-medium text-sm transition ${
            step === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-xs'
          }`}
          title="Kembali ke langkah sebelumnya (Alt + ←)"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Kembali</span>
          <span className="ml-2 text-[10px] font-mono px-1 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 hidden sm:inline-block">
            Alt + ←
          </span>
        </button>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => saveDraft()}
            disabled={isSaving}
            className="px-4 sm:px-5 py-2.5 rounded-lg font-medium text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-xs flex items-center transition"
            title="Simpan dokumen sebagai draf (Ctrl + S)"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
            ) : (
              <Save className="w-4 h-4 mr-2 text-gray-500" />
            )}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Draft'}</span>
            <span className="ml-2 text-[10px] font-mono px-1 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 hidden sm:inline-block">
              Ctrl + S
            </span>
          </button>

          <button
            type="button"
            onClick={nextStep}
            disabled={step === totalSteps}
            className={`flex items-center px-5 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition shadow-xs ${
              step === totalSteps
                ? 'bg-blue-300 text-white cursor-not-allowed'
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
            title="Lanjut ke langkah berikutnya (Alt + → atau Enter)"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4 ml-1" />
            {step < totalSteps && (
              <span className="ml-2 text-[10px] font-mono px-1 py-0.5 rounded bg-blue-900/40 text-blue-100 border border-blue-400/40 hidden sm:inline-block">
                Alt + →
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

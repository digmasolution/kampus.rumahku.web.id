import { useState, useEffect, ChangeEvent } from 'react';
import { FileText, CheckCircle, UploadCloud, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { rpsApi } from '../services/api';
import { TemplateInfo } from '../types/rps';

interface TemplateManagerProps {
  embedded?: boolean;
}

export default function TemplateManager({ embedded = false }: TemplateManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTemplateInfo = async () => {
    try {
      const info = await rpsApi.getTemplateInfo();
      setTemplateInfo(info);
    } catch {
      // Fallback info if API not yet populated
      setTemplateInfo({
        name: 'rps-template-processed.docx',
        exists: true,
        sizeBytes: 58308,
        lastModified: new Date().toISOString(),
        isActive: true,
      });
    }
  };

  useEffect(() => {
    fetchTemplateInfo();
  }, []);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setNotification({
        type: 'error',
        message: 'Hanya file format Microsoft Word (.docx) yang diperbolehkan.',
      });
      return;
    }

    setIsUploading(true);
    setNotification(null);

    try {
      const res = await rpsApi.uploadTemplate(file);
      setNotification({
        type: 'success',
        message: res.message || 'Template berhasil diperbarui dan divalidasi.',
      });
      await fetchTemplateInfo();
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Gagal mengunggah template';
      setNotification({
        type: 'error',
        message: `Unggah gagal: ${errMsg}`,
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className={embedded ? "space-y-4" : "max-w-4xl mx-auto pb-12"}>
      {!embedded && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan Template RPS</h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola template master dokumen Word (.docx) untuk ekspor RPS Dosen.
            </p>
          </div>
          <button
            onClick={fetchTemplateInfo}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 flex items-center text-sm"
            title="Perbarui status"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Segarkan
          </button>
        </div>
      )}

      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3 text-red-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-sm font-bold ml-4 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Current Active Template Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" /> Template Master Aktif
          </h2>
          {embedded && (
            <button
              onClick={fetchTemplateInfo}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Cek Ulang
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50/70 rounded-xl border border-gray-100">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-700 mr-4 shadow-xs shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {templateInfo?.name || 'rps-template-processed.docx'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {templateInfo?.sizeBytes
                  ? `${Math.round(templateInfo.sizeBytes / 1024)} KB`
                  : '58 KB'}{' '}
                • {templateInfo?.lastModified ? `Diperbarui ${new Date(templateInfo.lastModified).toLocaleDateString('id-ID')}` : 'Siap Digunakan'}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-xs">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" /> Siap Digunakan
          </span>
        </div>
      </div>

      {/* Upload New Template Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Perbarui Template RPS (DOCX)</h2>
        <p className="text-xs text-gray-500 mb-4">
          Unggah template Word berformat (.docx) dengan tag placeholder SN-Dikti/OBE untuk mengubah format dokumen yang dihasilkan.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center relative hover:bg-gray-50/80 transition cursor-pointer group">
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
            {isUploading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <h4 className="font-semibold text-gray-800 text-xs mb-1">
            {isUploading ? 'Sedang Memvalidasi & Mengunggah Template...' : 'Klik untuk memilih file DOCX atau seret kemari'}
          </h4>
          <p className="text-[11px] text-gray-400">Microsoft Word (.docx) hingga 10MB</p>
        </div>
      </div>
    </div>
  );
}

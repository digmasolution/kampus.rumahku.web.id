import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { rpsApi } from '../services/api';
import { RpsDocument } from '../types/rps';

export default function DashboardMockup() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<RpsDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const data = await rpsApi.getRpsList(
        searchTerm || undefined,
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      setDocs(data);
    } catch {
      // Fallback sample data if server not running yet
      setDocs([
        {
          id: 'sample-1',
          title: 'Draft Logika Matematika',
          courseName: 'LOGIKA MATEMATIKA',
          courseCode: 'MKK209',
          status: 'DRAFT',
          templateVersion: '1.0',
          dataJson: '{}',
          completionPercentage: 45,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus dokumen RPS ini?')) {
      try {
        await rpsApi.deleteRps(id);
        setDocs((prev) => prev.filter((d) => d.id !== id));
      } catch (err: any) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  // Stats calculation
  const totalCount = docs.length;
  const draftCount = docs.filter((d) => d.status === 'DRAFT').length;
  const completedCount = docs.filter((d) => d.status !== 'DRAFT').length;

  return (
    <div className="max-w-6xl mx-auto pb-12 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard RPS Dosen</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola Rencana Pembelajaran Semester dan ekspor dokumen Word resmi.
          </p>
        </div>
        <Link
          to="/wizard"
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-xs flex items-center transition"
        >
          <Plus className="w-5 h-5 mr-1.5" /> Buat RPS Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mr-4">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Dokumen</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mr-4">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Draft Menunggu</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{draftCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mr-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Selesai & Diekspor</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Daftar Dokumen RPS</h2>
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari mata kuliah atau kode..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="LENGKAP">Lengkap</option>
              <option value="DIEKSPOR">Diekspor</option>
            </select>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="p-4 text-xs font-semibold text-gray-600">Nama Mata Kuliah</th>
                <th className="p-4 text-xs font-semibold text-gray-600">Kode MK</th>
                <th className="p-4 text-xs font-semibold text-gray-600">Kelengkapan</th>
                <th className="p-4 text-xs font-semibold text-gray-600">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-600">Diperbarui</th>
                <th className="p-4 text-xs font-semibold text-gray-600 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-gray-500">
                    Memuat data RPS...
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-gray-400">
                    Belum ada dokumen RPS yang ditemukan.{' '}
                    <Link to="/wizard" className="text-blue-600 hover:underline">
                      Buat dokumen baru sekarang
                    </Link>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => {
                  const progressPct = doc.completionPercentage || 0;
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => navigate(`/wizard?id=${doc.id}`)}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition">
                          {doc.courseName || doc.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{doc.title}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-600">
                        {doc.courseCode || '-'}
                      </td>
                      <td className="p-4">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              progressPct === 100
                                ? 'bg-green-500'
                                : progressPct > 50
                                ? 'bg-blue-600'
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">
                          {progressPct}% Lengkap
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            doc.status === 'LENGKAP'
                              ? 'bg-blue-100 text-blue-800'
                              : doc.status === 'DIEKSPOR'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(doc.updatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/wizard?id=${doc.id}`);
                            }}
                            className="text-gray-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-gray-100"
                            title="Edit RPS"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(doc.id, e)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                            title="Hapus RPS"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

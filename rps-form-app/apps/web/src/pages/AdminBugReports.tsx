import { useState, useEffect } from 'react';
import { 
  BugReportItem, 
  BugMetrics, 
  getBugReports, 
  updateBugReport, 
  approveBugReport,
  mergeBugReports,
  getAiDebugPrompt, 
  BugStatus, 
  BugSeverity 
} from '../services/feedbackApi';
import { 
  Bug, 
  Lightbulb, 
  MessageCircle, 
  Copy, 
  Check, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  Terminal, 
  Network, 
  Navigation, 
  Eye, 
  X,
  CheckCircle2,
  GitMerge,
  ThumbsUp
} from 'lucide-react';

export default function AdminBugReports() {
  const [reports, setReports] = useState<BugReportItem[]>([]);
  const [metrics, setMetrics] = useState<BugMetrics>({ total: 0, pending: 0, inProgress: 0, fixed: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<BugReportItem | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

// AI Prompt Modal
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [aiPromptCode, setAiPromptCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [rowCopiedId, setRowCopiedId] = useState<string | null>(null);
  const [bulkCopied, setBulkCopied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Multi-select for bulk copy
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCopyingBulk, setIsCopyingBulk] = useState(false);

  // Approve & Merge
  const [isApproving, setIsApproving] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getBugReports({
        status: statusFilter,
        type: typeFilter,
        severity: severityFilter,
        search,
      });
      setReports(data.reports || []);
      setMetrics(data.metrics || { total: 0, pending: 0, inProgress: 0, fixed: 0, critical: 0 });
    } catch (err) {
      console.error('Failed to load bug reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter, severityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  // Robust cross-browser clipboard copy helper (HTTPS & HTTP fallback)
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    } catch (err) {
      console.error('Fallback copy failed: ', err);
      return false;
    }
  };

  const handleViewPrompt = async (report: BugReportItem) => {
    try {
      const res = await getAiDebugPrompt(report.id);
      setAiPrompt(res.prompt);
      setAiPromptCode(res.brpCode);
    } catch {
      alert('Gagal mengambil AI prompt');
    }
  };

  const handleCopyPrompt = async () => {
    if (!aiPrompt) return;
    const ok = await copyTextToClipboard(aiPrompt);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert('Gagal menyalin ke clipboard. Silakan blok dan salin teks secara manual.');
    }
  };

  const handleCopySingleRowPrompt = async (report: BugReportItem) => {
    try {
      const res = await getAiDebugPrompt(report.id);
      const ok = await copyTextToClipboard(res.prompt);
      if (ok) {
        setRowCopiedId(report.id);
        setTimeout(() => setRowCopiedId(null), 2000);
      } else {
        alert('Gagal menyalin ke clipboard');
      }
    } catch {
      alert('Gagal mengambil AI prompt untuk disalin');
    }
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === reports.length && reports.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reports.map(r => r.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk copy multiple prompts
  const handleCopySelectedPrompts = async () => {
    if (selectedIds.length === 0) return;
    setIsCopyingBulk(true);
    try {
      const promptPromises = selectedIds.map(id => getAiDebugPrompt(id));
      const results = await Promise.all(promptPromises);
      const combined = results.map((r, i) => `=== LAPORAN #${i + 1} (${r.brpCode}) ===\n\n${r.prompt}`).join('\n\n' + '='.repeat(60) + '\n\n');
      
      const ok = await copyTextToClipboard(combined);
      if (ok) {
        setBulkCopied(true);
        setTimeout(() => setBulkCopied(false), 2500);
      } else {
        alert('Gagal menyalin multiple prompt ke clipboard.');
      }
    } catch {
      alert('Gagal mengambil salah satu atau seluruh prompt laporan');
    } finally {
      setIsCopyingBulk(false);
    }
  };

  const handleStatusChange = async (newStatus: BugStatus) => {
    if (!selectedReport) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateBugReport(selectedReport.id, {
        status: newStatus,
        resolutionNotes: resolutionNotes || undefined,
      });
      setSelectedReport(updated);
      setReports(reports.map(r => r.id === updated.id ? updated : r));
      fetchReports();
    } catch {
      alert('Gagal memperbarui status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReport) return;
    if (!confirm(`Setujui laporan ${selectedReport.brpCode} untuk segera dikerjakan?`)) return;
    setIsApproving(true);
    try {
      const userStr = localStorage.getItem('dk_auth_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const updated = await approveBugReport(selectedReport.id, user?.name || user?.email);
      setSelectedReport(updated);
      setReports(reports.map(r => r.id === updated.id ? updated : r));
      fetchReports();
    } catch {
      alert('Gagal menyetujui laporan');
    } finally {
      setIsApproving(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedReport || !mergeTargetId.trim()) return;
    const target = reports.find(r => r.id === mergeTargetId || r.brpCode === mergeTargetId.trim().toUpperCase());
    if (!target) {
      alert('Laporan target tidak ditemukan. Masukkan ID atau Kode BRP yang valid.');
      return;
    }
    if (!confirm(`Gabungkan ${selectedReport.brpCode} → ${target.brpCode}? Laporan ${selectedReport.brpCode} akan ditandai sebagai duplikat.`)) return;
    setIsMerging(true);
    try {
      const userStr = localStorage.getItem('dk_auth_user');
      const user = userStr ? JSON.parse(userStr) : null;
      await mergeBugReports(selectedReport.id, target.id, user?.name || user?.email);
      setShowMergeModal(false);
      setMergeTargetId('');
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Gagal menggabungkan laporan');
    } finally {
      setIsMerging(false);
    }
  };

  const getSeverityBadge = (sev: BugSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800"><ShieldAlert className="w-3 h-3" /> Critical</span>;
      case 'MAJOR':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3" /> Major</span>;
      case 'MINOR':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Info className="w-3 h-3" /> Minor</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Trivial</span>;
    }
  };

  const getStatusBadge = (st: BugStatus) => {
    switch (st) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">Pending</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">In Progress</span>;
      case 'FIXED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">Fixed</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200"><CheckCircle2 className="w-3 h-3" />Approved</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Won't Fix</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4 text-red-600" />;
      case 'feature_request': return <Lightbulb className="w-4 h-4 text-amber-500" />;
      default: return <MessageCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800">
              Admin & BVS Center
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Bug Verification System</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Daftar Laporan Masalah & Saran Perbaikan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau setiap saran atau error dengan data telemetri lengkap (network errors, console logs, jejak rute) untuk diimplementasikan.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Laporan</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{metrics.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-sm">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending (Menunggu)</p>
          <p className="text-2xl font-extrabold text-amber-900 mt-2">{metrics.pending}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-blue-50/30 shadow-sm">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Sedang Dikerjakan</p>
          <p className="text-2xl font-extrabold text-blue-900 mt-2">{metrics.inProgress}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 shadow-sm">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Selesai Diperbaiki</p>
          <p className="text-2xl font-extrabold text-emerald-900 mt-2">{metrics.fixed}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-200/80 bg-red-50/30 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Kritis / Urgent</p>
          <p className="text-2xl font-extrabold text-red-900 mt-2">{metrics.critical}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari BRP code, halaman, atau pesan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FIXED">Fixed</option>
            <option value="WONT_FIX">Won't Fix</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="bug">Bug</option>
            <option value="feature_request">Usulan Fitur</option>
            <option value="general">Umum</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="ALL">Semua Tingkat</option>
            <option value="CRITICAL">Critical</option>
            <option value="MAJOR">Major</option>
            <option value="MINOR">Minor</option>
            <option value="TRIVIAL">Trivial</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (when reports selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-sm font-bold">
                {selectedIds.length} Laporan Masalah Dipilih
              </p>
              <p className="text-xs text-blue-200">
                Salin seluruh prompt BVS sekaligus ke clipboard untuk diberikan ke AI.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition"
            >
              Batalkan Pilihan
            </button>
            <button
              onClick={handleCopySelectedPrompts}
              disabled={isCopyingBulk}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-blue-900 hover:bg-blue-50 shadow-md transition cursor-pointer"
            >
              {bulkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-700" />}
              {isCopyingBulk ? 'Menyiapkan Prompt...' : bulkCopied ? 'Tersalin Sekaligus!' : 'Salin Semua Prompt Terpilih'}
            </button>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    checked={reports.length > 0 && selectedIds.length === reports.length}
                    onChange={handleToggleSelectAll}
                    title="Pilih semua"
                  />
                </th>
                <th className="py-3.5 px-3">Kode BRP</th>
                <th className="py-3.5 px-4">Tipe & Tingkat</th>
                <th className="py-3.5 px-4">Lokasi Rute</th>
                <th className="py-3.5 px-4">Deskripsi Masalah / Saran</th>
                <th className="py-3.5 px-4">Pelapor</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    {loading ? 'Memuat laporan...' : 'Belum ada laporan atau feedback yang cocok.'}
                  </td>
                </tr>
              ) : (
                reports.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  const isRowCopied = rowCopiedId === r.id;
                  return (
                    <tr key={r.id} className={`transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'}`}>
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(r.id)}
                        />
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {r.brpCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(r.type)}
                          {getSeverityBadge(r.severity)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {r.routePath}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-medium text-slate-800 truncate" title={r.description}>
                          {r.description}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.createdAt).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <p className="truncate max-w-[130px]" title={r.reporterEmail || '-'}>{r.reporterEmail || '-'}</p>
                        <span className="text-[10px] text-slate-400">{r.reporterRole || 'DOSEN'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Direct copy prompt from table */}
                          <button
                            onClick={() => handleCopySingleRowPrompt(r)}
                            title={isRowCopied ? "Tersalin ke clipboard" : "Salin Prompt BVS"}
                            className={`p-1.5 rounded-lg border transition flex items-center gap-1 ${
                              isRowCopied 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                                : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                            }`}
                          >
                            {isRowCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="text-[10px] font-semibold hidden md:inline">
                              {isRowCopied ? 'Tersalin' : 'Salin'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleViewPrompt(r)}
                            title="Pratinjau AI Debugging Prompt"
                            className="p-1.5 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 transition"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setSelectedReport(r); setResolutionNotes(r.resolutionNotes || ''); }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail
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

      {/* Drawer / Modal Detail Laporan */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-900">{selectedReport.brpCode}</span>
                {getStatusBadge(selectedReport.status)}
                {getSeverityBadge(selectedReport.severity)}
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              
              {/* Deskripsi */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Deskripsi Permasalahan:</h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedReport.description}
                </div>
              </div>

              {/* Status Update Form */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2">Tindakan & Status Perbaikan</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(['PENDING', 'IN_PROGRESS', 'FIXED', 'WONT_FIX'] as BugStatus[]).map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                        selectedReport.status === st
                          ? 'bg-blue-900 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Catatan Implementasi Teknis:</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Tuliskan file apa yang diubah, fungsi apa yang diperbaiki, atau alasan jika ditolak..."
                  rows={2}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Telemetri Jejak Rute & Konteks Halaman */}
              {selectedReport.metadata && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">Data Telemetri Sistem BVS:</h4>

                  {/* Browser & Info */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                    <div><span className="text-slate-400">Rute Asal:</span> <span className="font-mono font-semibold">{selectedReport.routePath}</span></div>
                    <div><span className="text-slate-400">Viewport:</span> <span className="font-semibold">{selectedReport.metadata.browser?.viewport || '-'}</span></div>
                    <div><span className="text-slate-400">Memory Heap:</span> <span className="font-semibold">{selectedReport.metadata.performance?.memoryMB ? `${selectedReport.metadata.performance.memoryMB} MB` : '-'}</span></div>
                    <div><span className="text-slate-400">Waktu di Halaman:</span> <span className="font-semibold">{selectedReport.metadata.timeOnPageMs ? `${Math.round(selectedReport.metadata.timeOnPageMs / 1000)}s` : '-'}</span></div>
                  </div>

                  {/* Route History */}
                  <div>
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Navigation className="w-3.5 h-3.5 text-blue-700" /> Jejak Navigasi Halaman (Route History)
                    </span>
                    <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] space-y-1">
                      {selectedReport.metadata.routeHistory?.length ? (
                        selectedReport.metadata.routeHistory.map((rh: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span>{i + 1}. {rh.path}</span>
                            <span className="text-slate-500 text-[10px]">{new Date(rh.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500">Tidak ada riwayat perpindahan halaman</span>
                      )}
                    </div>
                  </div>

                  {/* Network Failure Breadcrumb */}
                  <div>
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Network className="w-3.5 h-3.5 text-red-600" /> Network Error Breadcrumb
                    </span>
                    <div className="p-3 bg-slate-900 text-red-400 rounded-xl font-mono text-[11px] space-y-1 max-h-40 overflow-y-auto">
                      {selectedReport.metadata.networkErrors?.length ? (
                        selectedReport.metadata.networkErrors.map((ne: any, i: number) => (
                          <div key={i}>
                            [{ne.method}] {ne.url} ➔ <strong className="text-red-300">Status {ne.status}</strong> ({ne.duration}ms)
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500">Tidak ada kegagalan request jaringan (Network clean)</span>
                      )}
                    </div>
                  </div>

                  {/* Console Critical */}
                  <div>
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-600" /> Console Critical Errors & Warnings
                    </span>
                    <div className="p-3 bg-slate-900 text-amber-300 rounded-xl font-mono text-[10px] space-y-1 max-h-36 overflow-y-auto">
                      {selectedReport.metadata.consoleCritical?.length ? (
                        selectedReport.metadata.consoleCritical.map((c: any, i: number) => (
                          <div key={i}>[{c.level.toUpperCase()}] {c.message}</div>
                        ))
                      ) : (
                        <span className="text-slate-500">Tidak ada runtime warning atau error tertangkap</span>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
              {/* Row 1: Primary actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Approve Button */}
                {selectedReport.status !== 'APPROVED' && selectedReport.status !== 'FIXED' && (
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition disabled:opacity-60 shadow-sm"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {isApproving ? 'Menyetujui...' : 'Approve — Setujui Laporan'}
                  </button>
                )}

                {/* Merge Button */}
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-sm"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  Gabung (Merge) ke Laporan Lain
                </button>
              </div>

              {/* Row 2: AI Debug + Close */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleViewPrompt(selectedReport)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900 text-white font-semibold text-xs hover:bg-purple-800 transition"
                >
                  <Terminal className="w-4 h-4" /> 1-Klik AI Debug Prompt
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && selectedReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <GitMerge className="w-5 h-5 text-slate-700" />
                Gabungkan Laporan Duplikat
              </h3>
              <button onClick={() => setShowMergeModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
              <strong>Laporan Sumber:</strong> <span className="font-mono font-bold">{selectedReport.brpCode}</span> akan ditandai sebagai duplikat dan statusnya berubah menjadi <em>Won't Fix</em>. Data asli tetap tersimpan.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Laporan Target (Kode BRP atau ID):
              </label>
              <select
                value={mergeTargetId}
                onChange={e => setMergeTargetId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">-- Pilih laporan yang merupakan laporan utama --</option>
                {reports
                  .filter(r => r.id !== selectedReport.id && r.status !== 'WONT_FIX')
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      {r.brpCode} — {r.description.substring(0, 60)}...
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl border"
              >
                Batal
              </button>
              <button
                onClick={handleMerge}
                disabled={!mergeTargetId || isMerging}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl disabled:opacity-50 flex items-center gap-1.5"
              >
                <GitMerge className="w-3.5 h-3.5" />
                {isMerging ? 'Menggabungkan...' : 'Gabungkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompt Modal */}
      {aiPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-sm">AI Debugging Prompt ({aiPromptCode})</h3>
              </div>
              <button onClick={() => setAiPrompt(null)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <p className="text-xs text-slate-500 mb-3">
                Salin teks di bawah ini dan berikan langsung ke AI (Antigravity/Cursor/Claude/ChatGPT) untuk memperbaiki masalah ini secara otomatis:
              </p>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {aiPrompt}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Tersalin ke Clipboard!' : 'Salin Prompt Lengkap'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


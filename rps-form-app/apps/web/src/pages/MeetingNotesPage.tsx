import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, MapPin, Users, CheckSquare, 
  Trash2, FileText, ArrowRight, Sparkles, QrCode, X
} from 'lucide-react';
import { 
  meetingTodoService, 
  MeetingNoteData, 
  UserItem, 
  ParsedTodoPreview,
  TodoItemData
} from '../services/meetingTodo.service';
import { WysiwygEditor } from '../components/meetings/WysiwygEditor';
import { Link } from 'react-router-dom';

export default function MeetingNotesPage() {
  const [meetings, setMeetings] = useState<MeetingNoteData[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingNoteData | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().substring(0, 10));
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [guestAttendeeInput, setGuestAttendeeInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedTodoPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setErrorMessage] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update parsed todos in real time whenever content changes
  useEffect(() => {
    if (!content) {
      setParsedPreview([]);
      return;
    }
    const timer = setTimeout(() => {
      meetingTodoService.previewParse(content).then(setParsedPreview).catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [content]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [meetingsData, usersData] = await Promise.all([
        meetingTodoService.getMeetings(),
        meetingTodoService.getUsers(),
      ]);
      setMeetings(meetingsData);
      setUsers(usersData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAttendee = (userName: string) => {
    if (selectedAttendees.includes(userName)) {
      setSelectedAttendees(selectedAttendees.filter((name) => name !== userName));
    } else {
      setSelectedAttendees([...selectedAttendees, userName]);
    }
  };

  const handleAddGuest = () => {
    if (guestAttendeeInput.trim() && !selectedAttendees.includes(guestAttendeeInput.trim())) {
      setSelectedAttendees([...selectedAttendees, guestAttendeeInput.trim()]);
      setGuestAttendeeInput('');
    }
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Judul dan isi catatan rapat wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await meetingTodoService.createMeeting({
        title,
        meetingDate,
        location,
        attendees: selectedAttendees,
        content,
        autoCreateTodos: true,
      });

      // Reset form
      setTitle('');
      setLocation('');
      setContent('');
      setSelectedAttendees([]);
      setIsCreating(false);
      await fetchInitialData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan catatan rapat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan rapat ini beserta seluruh todo yang terhubung?')) return;
    try {
      await meetingTodoService.deleteMeeting(id);
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(null);
      }
      await fetchInitialData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'P1':
        return <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs animate-pulse">P1 Sangat Penting</span>;
      case 'P2':
        return <span className="bg-orange-500 text-white font-semibold text-[10px] px-2 py-0.5 rounded">P2 Penting</span>;
      case 'P3':
        return <span className="bg-yellow-500 text-white font-medium text-[10px] px-2 py-0.5 rounded">P3 Normal</span>;
      case 'P4':
        return <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded">P4 Rendah</span>;
      default:
        return <span className="bg-gray-400 text-white text-[10px] px-2 py-0.5 rounded">P5 Opsional</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            Catatan Rapat Kampus
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Notulensi rapat manajemen kampus dengan pembagian tugas instan via hashtag <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-bold">#</code>, penugasan dosen <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded font-bold">@</code>, prioritas <code className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded font-bold">p1..p5</code>, dan batas waktu <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-bold">T1</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/todos"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-lg transition"
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            Buka Kanban Todoist
          </Link>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow transition"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Tutup Formulir' : 'Buat Catatan Baru'}
          </button>
        </div>
      </div>

      {/* Form Buat Catatan Rapat Baru */}
      {isCreating && (
        <form onSubmit={handleSaveMeeting} className="bg-white rounded-xl border border-blue-200 shadow-md p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Tulis Catatan Rapat Baru
            </h2>
            <span className="text-xs text-gray-500 italic">
              Auto-generate task terintegrasi ke Kanban
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Judul / Agenda Rapat *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Koordinasi Kurikulum OBE Semester Ganjil"
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Rapat *</label>
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ruangan / Platform (Opsional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Ruang Sidang Dekanat Lt. 3 / Zoom Meeting"
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Daftar Hadir / Presensi */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                Daftar Kehadiran Peserta ({selectedAttendees.length} Hadir)
              </label>
              <button
                type="button"
                onClick={() => setShowBarcodeModal(true)}
                className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition"
              >
                <QrCode className="w-4 h-4" />
                Barcode Absen
              </button>
            </div>

            {/* Tampilkan peserta yang sudah ditambahkan */}
            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAttendees.slice(0, 5).map((name, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-blue-600 text-white font-medium flex items-center gap-1.5 shadow-sm">
                    {name}
                    <button type="button" onClick={() => handleToggleAttendee(name)} className="text-white/70 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedAttendees.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowParticipantModal(true)}
                    className="text-xs px-2.5 py-1 rounded-full border bg-white border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm"
                  >
                    +{selectedAttendees.length - 5} lainnya (Klik untuk lihat)
                  </button>
                )}
              </div>
            )}

            {/* Pilihan User yang terdaftar */}
            {users.length > 0 && (
              <div className="pt-2 border-t border-gray-200 mt-2">
                <span className="block text-[10px] text-gray-400 font-semibold mb-2">
                  Atau klik nama dosen berikut untuk menambahkan:
                </span>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {users.map((u) => {
                    const isSelected = selectedAttendees.includes(u.name);
                    if (isSelected) return null;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleToggleAttendee(u.name)}
                        className="text-xs px-2.5 py-1 rounded-full border border-dashed transition flex items-center gap-1.5 bg-white border-gray-300 text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                        title="Klik untuk jadikan Hadir"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{u.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input peserta tambahan / tamu luar */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={guestAttendeeInput}
                onChange={(e) => setGuestAttendeeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGuest();
                  }
                }}
                placeholder="Tambah nama peserta lain / tamu, tekan Enter..."
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-md flex-1 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddGuest}
                className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium"
              >
                + Tambah
              </button>
            </div>
          </div>

          {/* Editor WYSIWYG */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Notulensi & Pembagian Tugas (Editor WYSIWYG) *
              </label>
              <span className="text-[11px] text-gray-500">
                Gunakan syntax: <b className="text-blue-700">#JudulTugas</b> <b className="text-purple-700">@Nama</b> <b className="text-red-600">p1</b> <b className="text-emerald-700">T1:YYYY-MM-DD</b>
              </span>
            </div>
            <WysiwygEditor
              value={content}
              onChange={setContent}
              users={users}
            />
          </div>

          {/* Live Preview Tugas yang Dideteksi */}
          {parsedPreview.length > 0 && (
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  {parsedPreview.length} Tugas Terdeteksi Otomatis:
                </span>
                <span className="text-[11px] text-blue-700">Akan dibuatkan card di Kanban Todoist saat disimpan</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {parsedPreview.map((item, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-xs flex flex-col justify-between space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-900 leading-snug">
                        #{item.title}
                      </span>
                      {getPriorityBadge(item.priority)}
                    </div>
                    {item.subTasks && item.subTasks.length > 0 && (
                      <div className="pt-2 pb-1 space-y-1">
                        {item.subTasks.map((sub, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600 bg-gray-50/50 p-1.5 rounded border border-gray-100">
                            <ArrowRight className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                            <span className="font-medium">{sub.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <span className="text-purple-700 font-medium">
                        {item.assignedToName ? `@${item.assignedToName}` : 'Belum di-assign'}
                      </span>
                      <span className="text-emerald-700 font-medium">
                        {item.dueDate ? `Batas: ${new Date(item.dueDate).toLocaleDateString('id-ID')}` : 'Batas: Bebas'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow disabled:opacity-50 transition flex items-center gap-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan & Buat Todo'}
            </button>
          </div>
        </form>
      )}

      {/* List Catatan Rapat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List Rapat */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider px-1">
            Riwayat Notulensi ({meetings.length})
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400 bg-white rounded-xl border border-gray-200">
              Memuat data rapat...
            </div>
          ) : meetings.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              Belum ada catatan rapat. Klik <b>"Buat Catatan Baru"</b> di atas.
            </div>
          ) : (
            meetings.map((m) => {
              const isSelected = selectedMeeting?.id === m.id;
              const attendeesCount = (() => {
                try {
                  return JSON.parse(m.attendees || '[]').length;
                } catch {
                  return 0;
                }
              })();

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  className={`p-4 rounded-xl border cursor-pointer transition relative group ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                      {m.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMeeting(m.id);
                      }}
                      title="Hapus Catatan"
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(m.meetingDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {attendeesCount} hadir
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                      <CheckSquare className="w-3 h-3 text-emerald-600" />
                      {m.todos?.length || 0} Tugas Dihasilkan
                    </span>
                    <span className="text-blue-600 font-semibold flex items-center group-hover:translate-x-0.5 transition">
                      Lihat <ArrowRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detail Catatan Rapat Terpilih */}
        <div className="lg:col-span-2">
          {selectedMeeting ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedMeeting.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        {new Date(selectedMeeting.meetingDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      {selectedMeeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-red-500" />
                          {selectedMeeting.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/todos"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Lihat di Kanban
                  </Link>
                </div>

                {/* Presensi Peserta */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Daftar Hadir:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      try {
                        const list = JSON.parse(selectedMeeting.attendees || '[]');
                        if (list.length === 0) return <span className="text-xs text-gray-400 italic">Tidak ada catatan hadir</span>;
                        return list.map((name: string, i: number) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full border border-gray-200">
                            {name}
                          </span>
                        ));
                      } catch {
                        return <span className="text-xs text-gray-400">Data presensi tidak valid</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Isi Notulensi */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Notulensi & Hasil Rapat:
                </h3>
                <div
                  className="prose prose-sm max-w-none text-gray-800 bg-gray-50/50 p-4 rounded-lg border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: selectedMeeting.content }}
                />
              </div>

              {/* Tugas Terhubung */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  Daftar Tugas Dihasilkan ({selectedMeeting.todos?.length || 0})
                </h3>
                {selectedMeeting.todos && selectedMeeting.todos.length > 0 ? (
                  <div className="space-y-3">
                    {selectedMeeting.todos.filter((t: TodoItemData) => !t.parentId).map((todo: TodoItemData) => {
                      const subs = selectedMeeting.todos!.filter((s: TodoItemData) => s.parentId === todo.id);
                      return (
                        <div key={todo.id} className="space-y-1.5">
                          <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between shadow-xs hover:border-gray-300 transition">
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  todo.status === 'DONE' ? 'bg-emerald-500' : 'border-2 border-gray-400'
                                }`}
                              />
                              <div>
                                <p className={`text-sm font-semibold ${todo.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {todo.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {todo.assignedToName ? `Ditugaskan ke: @${todo.assignedToName}` : 'Belum di-assign'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {getPriorityBadge(todo.priority)}
                              <span className="text-xs text-gray-400">
                                {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('id-ID') : 'No Due Date'}
                              </span>
                            </div>
                          </div>
                          
                          {subs.length > 0 && (
                            <div className="ml-6 pl-2 border-l-2 border-gray-200 space-y-1.5">
                              {subs.map((sub: TodoItemData) => (
                                <div key={sub.id} className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        sub.status === 'DONE' ? 'bg-emerald-500' : 'border border-gray-400'
                                      }`}
                                    />
                                    <span className={`text-xs font-medium ${sub.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                      {sub.title}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Tidak ada hashtag tugas '#' dalam notulensi ini.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-12 text-center text-gray-400 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-semibold text-gray-600">Pilih catatan rapat untuk melihat detail</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Semua notulensi rapat, presensi kehadiran, serta todo list yang diekstraksi akan ditampilkan di sini.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative">
            <button onClick={() => setShowBarcodeModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Absen Rapat via Barcode</h3>
            <div className="flex justify-center mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/attendance-checkin?meeting=' + encodeURIComponent(title || 'Rapat Baru') + '&date=' + meetingDate)}`} 
                alt="QR Code Absen"
                className="rounded-lg shadow-sm"
              />
            </div>
            <p className="text-xs text-center text-gray-500 mb-4">
              Scan barcode ini untuk melakukan presensi kehadiran rapat secara mandiri.
            </p>
            <button 
              onClick={() => setShowBarcodeModal(false)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Participant List Modal */}
      {showParticipantModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowParticipantModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 text-center">Peserta Rapat</h3>
            <p className="text-sm font-semibold text-center text-blue-600 mt-1">{title || 'Rapat Baru'}</p>
            <p className="text-xs text-center text-gray-500 mb-4">
              {new Date(meetingDate).toLocaleDateString('id-ID')}
            </p>
            
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 border-b">No</th>
                    <th className="px-4 py-2 border-b">Nama Peserta</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAttendees.map((name, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium">{name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setShowParticipantModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

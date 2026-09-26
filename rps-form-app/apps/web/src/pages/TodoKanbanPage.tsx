import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, CheckSquare, Calendar, 
  Trash2, Pencil, Flag, ChevronRight, 
  ChevronLeft, BookOpen
} from 'lucide-react';
import { 
  meetingTodoService, 
  TodoItemData, 
  UserItem 
} from '../services/meetingTodo.service';
import { Link } from 'react-router-dom';

type KanbanColumn = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

interface ColumnDef {
  key: KanbanColumn;
  title: string;
  badgeColor: string;
  bgLight: string;
  borderColor: string;
}

const COLUMNS: ColumnDef[] = [
  { 
    key: 'TODO', 
    title: 'Inbox / Rencana (To Do)', 
    badgeColor: 'bg-blue-100 text-blue-800', 
    bgLight: 'bg-blue-50/40', 
    borderColor: 'border-blue-200' 
  },
  { 
    key: 'IN_PROGRESS', 
    title: 'Sedang Dikerjakan', 
    badgeColor: 'bg-amber-100 text-amber-800', 
    bgLight: 'bg-amber-50/40', 
    borderColor: 'border-amber-200' 
  },
  { 
    key: 'REVIEW', 
    title: 'Review / Evaluasi', 
    badgeColor: 'bg-purple-100 text-purple-800', 
    bgLight: 'bg-purple-50/40', 
    borderColor: 'border-purple-200' 
  },
  { 
    key: 'DONE', 
    title: 'Selesai (Done)', 
    badgeColor: 'bg-emerald-100 text-emerald-800', 
    bgLight: 'bg-emerald-50/40', 
    borderColor: 'border-emerald-200' 
  },
];

export default function TodoKanbanPage() {
  const [todos, setTodos] = useState<TodoItemData[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [, setIsLoading] = useState(true);

  // Filter state
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Quick Add State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'P1' | 'P2' | 'P3' | 'P4' | 'P5'>('P3');
  const [newStatus, setNewStatus] = useState<KanbanColumn>('TODO');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignedToId, setNewAssignedToId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoItemData | null>(null);
  
  // Edit & Subtask state
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);

  // Delete confirmation modal state & refs
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const btnYaHapusRef = useRef<HTMLButtonElement>(null);
  const btnBatalRef = useRef<HTMLButtonElement>(null);

  // Auto-focus "Ya, Hapus" when delete modal opens
  useEffect(() => {
    if (deleteConfirmId) {
      setTimeout(() => btnYaHapusRef.current?.focus(), 50);
    }
  }, [deleteConfirmId]);

  // Keyboard navigation for delete confirm modal
  const handleDeleteModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const active = document.activeElement;
      if (active === btnYaHapusRef.current) {
        btnBatalRef.current?.focus();
      } else {
        btnYaHapusRef.current?.focus();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setDeleteConfirmId(null);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (deleteConfirmId) return; // biarkan modal delete yang handle
      if (e.key === 'Escape') {
        setIsQuickAddOpen(false);
        setSelectedTask(null);
        setIsEditingTask(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmId]);


  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [todosData, usersData] = await Promise.all([
        meetingTodoService.getTodos(),
        meetingTodoService.getUsers(),
      ]);
      setTodos(todosData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load todos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: KanbanColumn) => {
    const task = todos.find(t => t.id === id);
    if (task?.status === newStatus) return;

    try {
      // Optimistic update
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
      await meetingTodoService.updateTodo(id, { status: newStatus });
    } catch (err) {
      console.error(err);
      fetchData(); // rollback
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      await meetingTodoService.deleteTodo(id);
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const assignedUser = users.find((u) => u.id === newAssignedToId);
      const created = await meetingTodoService.createTodo({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority,
        status: newStatus,
        dueDate: newDueDate || null,
        assignedToId: newAssignedToId || null,
        assignedToName: assignedUser?.name || null,
      });

      setTodos([created, ...todos]);
      setIsQuickAddOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setNewAssignedToId('');
      setNewPriority('P3');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat tugas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTask || !editTitle.trim()) return;
    try {
      const updated = await meetingTodoService.updateTodo(selectedTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setSelectedTask(updated);
      setIsEditingTask(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan');
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    
    try {
      setIsSubmittingSubtask(true);

      let finalTitle = newSubtaskTitle.trim();
      let assignedToId: string | null = null;
      let assignedToName: string | null = null;

      // Cek apakah ada assign dari text (misal: @irfandidjailani@gmail.com)
      const mentionMatch = finalTitle.match(/@(\S+)/);
      if (mentionMatch) {
        const mention = mentionMatch[1];
        const userMatch = users.find(
          (u) =>
            u.email.toLowerCase() === mention.toLowerCase() ||
            u.name.toLowerCase().replace(/\s+/g, '') === mention.toLowerCase()
        );
        if (userMatch) {
          assignedToId = userMatch.id;
          assignedToName = userMatch.name;
          finalTitle = finalTitle.replace(mentionMatch[0], '').trim();
        }
      }

      const created = await meetingTodoService.createTodo({
        title: finalTitle,
        parentId: selectedTask.id,
        meetingNoteId: selectedTask.meetingNote?.id,
        priority: selectedTask.priority, // inherit
        assignedToId,
        assignedToName,
      });
      
      const updatedSelected = {
        ...selectedTask,
        subTasks: [...(selectedTask.subTasks || []), created]
      };
      setSelectedTask(updatedSelected);
      setNewSubtaskTitle('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat sub-task');
    } finally {
      setIsSubmittingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subId: string, currentStatus: string) => {
    if (!selectedTask) return;
    const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    
    try {
      const updatedSub = await meetingTodoService.updateTodo(subId, { status: newStatus as KanbanColumn });
      const updatedSelected = {
        ...selectedTask,
        subTasks: selectedTask.subTasks?.map(st => st.id === subId ? updatedSub : st)
      };
      setSelectedTask(updatedSelected);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubtask = async (subId: string) => {
    if (!selectedTask || !confirm('Hapus sub-task ini?')) return;
    try {
      await meetingTodoService.deleteTodo(subId);
      const updatedSelected = {
        ...selectedTask,
        subTasks: selectedTask.subTasks?.filter(st => st.id !== subId)
      };
      setSelectedTask(updatedSelected);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper render badge prioritas sesuai standar Todoist (P1 Merah dst)
  const renderPriorityBadge = (p: string) => {
    switch (p) {
      case 'P1':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shadow-xs">
            <Flag className="w-3 h-3 fill-red-600 text-red-600" />
            P1 Sangat Penting
          </span>
        );
      case 'P2':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
            <Flag className="w-3 h-3 fill-orange-500 text-orange-500" />
            P2 Penting
          </span>
        );
      case 'P3':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
            <Flag className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            P3 Normal
          </span>
        );
      case 'P4':
        return (
          <span className="flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <Flag className="w-3 h-3 fill-blue-500 text-blue-500" />
            P4 Rendah
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
            <Flag className="w-3 h-3 text-gray-400" />
            P5 Opsional
          </span>
        );
    }
  };

  // Filter list
  const filteredTodos = todos.filter((item) => {
    if (item.parentId) return false; // Only show top-level in columns
    if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchAssignee = item.assignedToName?.toLowerCase().includes(q);
      const matchMeeting = item.meetingNote?.title.toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchMeeting) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Todoist Kanban Board
              </h1>
              <p className="text-gray-500 text-xs">
                Manajemen pembagian tugas dosen & kampus terintegrasi otomatis dari Catatan Rapat.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/meetings"
            className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            Catatan Rapat
          </Link>
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Tugas Manual
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="Cari tugas, dosen penanggung jawab, atau judul rapat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 outline-none"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500 font-semibold mr-1">Prioritas:</span>
          {['ALL', 'P1', 'P2', 'P3', 'P4', 'P5'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                priorityFilter === p
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'ALL' ? 'Semua' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Modal Quick Add Task */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                Tambah Tugas Baru (Todoist Style)
              </h3>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTodo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siapkan draft RPS Pemrograman Web"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan atau catatan detail..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prioritas</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="P1">P1 - Sangat Penting (Merah)</option>
                    <option value="P2">P2 - Penting (Oranye)</option>
                    <option value="P3">P3 - Normal (Kuning)</option>
                    <option value="P4">P4 - Rendah (Biru)</option>
                    <option value="P5">P5 - Opsional (Abu-abu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status Kolom</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">Sedang Dikerjakan</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tugaskan Ke (@Assignee)</label>
                  <select
                    value={newAssignedToId}
                    onChange={(e) => setNewAssignedToId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">-- Pilih Dosen / Staf --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Batas Waktu (Due Date)</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Tambah ke Kanban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col, colIdx) => {
          const columnItems = filteredTodos.filter((t) => t.status === col.key);

          return (
            <div
              key={col.key}
              className={`rounded-xl border ${col.borderColor} bg-white shadow-xs flex flex-col min-h-[500px]`}
            >
              {/* Column Header */}
              <div className={`p-3.5 border-b ${col.borderColor} ${col.bgLight} rounded-t-xl flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {col.title}
                  </h2>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {columnItems.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setNewStatus(col.key);
                    setIsQuickAddOpen(true);
                  }}
                  title="Tambah tugas di kolom ini"
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-white/80 rounded transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Task Cards */}
              <div 
                className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[70vh]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('text/plain');
                  if (taskId) handleUpdateStatus(taskId, col.key);
                }}
              >
                {columnItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 italic">
                    Belum ada tugas di kolom ini
                  </div>
                ) : (
                  columnItems.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
                      task.status !== 'DONE';

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', task.id);
                        }}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsEditingTask(false);
                          setEditTitle(task.title);
                          setEditDescription(task.description || '');
                        }}
                        className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs hover:shadow-md transition-shadow group relative space-y-2.5 cursor-grab active:cursor-grabbing"
                      >
                        {/* Header: Priority & Origin Meeting Tag */}
                        <div className="flex items-start justify-between gap-1.5">
                          {renderPriorityBadge(task.priority)}

                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setIsEditingTask(true);
                                setEditTitle(task.title);
                                setEditDescription(task.description || '');
                              }}
                              title="Edit Tugas"
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(task.id);
                              }}
                              title="Hapus Tugas"
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Task Title & Description */}
                        <div>
                          <h3 className={`text-sm font-semibold text-gray-900 leading-snug ${
                            task.status === 'DONE' ? 'line-through text-gray-400' : ''
                          }`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Origin Meeting Badge */}
                        {task.meetingNote && (
                          <div className="text-[10px] text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate">Rapat: {task.meetingNote.title}</span>
                          </div>
                        )}

                        {/* Subtasks Indicator */}
                        {task.subTasks && task.subTasks.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            <CheckSquare className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium">
                              {task.subTasks.filter((s: any) => s.status === 'DONE').length}/{task.subTasks.length} Sub-task
                            </span>
                          </div>
                        )}

                        {/* Footer: Due Date & Assignee */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5 text-gray-600" title={task.assignedTo?.email || task.assignedToName || 'Belum ditugaskan'}>
                            <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center">
                              {(task.assignedTo?.name || task.assignedToName || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[11px] truncate max-w-[90px]">
                              {task.assignedTo?.email ? task.assignedTo.email.split('@')[0] : (task.assignedToName || 'Belum ditugaskan')}
                            </span>
                          </div>

                          {/* Due Date */}
                          {task.dueDate ? (
                            <span
                              className={`flex items-center gap-1 text-[11px] font-medium ${
                                isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">No date</span>
                          )}
                        </div>

                        {/* Quick 1-Click Status Mover Buttons */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          {colIdx > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(task.id, COLUMNS[colIdx - 1].key);
                              }}
                              className="text-gray-500 hover:text-blue-700 flex items-center gap-0.5"
                              title={`Pindah ke ${COLUMNS[colIdx - 1].title}`}
                            >
                              <ChevronLeft className="w-3 h-3" /> Mundur
                            </button>
                          ) : <span />}

                          {colIdx < COLUMNS.length - 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(task.id, COLUMNS[colIdx + 1].key);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 ml-auto"
                              title={`Pindah ke ${COLUMNS[colIdx + 1].title}`}
                            >
                              Lanjut <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Large Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scale-up relative">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 border-b pb-3 justify-between pr-8">
              <div className="flex flex-col">
                {selectedTask.parentId && (
                  <button 
                    onClick={() => {
                      const parent = todos.find(t => t.id === selectedTask.parentId) || 
                                     todos.flatMap(t => t.subTasks || []).find(st => st.id === selectedTask.parentId);
                      if (parent) {
                        setSelectedTask(parent);
                        setIsEditingTask(false);
                      }
                    }}
                    className="text-xs text-blue-600 hover:underline mb-1 text-left"
                  >
                    &larr; Kembali ke Induk
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Detail Tugas / Catatan Rapat</h2>
                </div>
              </div>
              {!isEditingTask && (
                <button
                  onClick={() => setIsEditingTask(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Edit Data
                </button>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              {isEditingTask ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Judul Tugas</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Deskripsi</label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditingTask(false)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-md">Batal</button>
                    <button onClick={handleSaveEdit} className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md">Simpan Perubahan</button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Judul Tugas</label>
                    <div className="text-base font-medium text-gray-900 mt-1">{selectedTask.title}</div>
                  </div>
                  
                  {selectedTask.description && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Deskripsi</label>
                      <div className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        {selectedTask.description}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      handleUpdateStatus(selectedTask.id, e.target.value as KanbanColumn);
                      setSelectedTask({ ...selectedTask, status: e.target.value as KanbanColumn });
                    }}
                    className="text-xs px-2 py-1.5 border border-gray-300 rounded-md w-full focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prioritas</label>
                  <div>{renderPriorityBadge(selectedTask.priority)}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Due Date</label>
                  <div className="text-xs text-gray-700 font-medium pt-1">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('id-ID') : '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Assignee</label>
                  <div className="text-xs text-gray-700 font-medium pt-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      {(selectedTask.assignedTo?.name || selectedTask.assignedToName || '?').charAt(0)}
                    </span>
                    <span className="truncate">
                      {selectedTask.assignedTo?.email || selectedTask.assignedToName || 'Belum di-assign'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                    Sub-tasks ({selectedTask.subTasks?.length || 0})
                  </h4>
                </div>
                
                <div className="space-y-2">
                  {selectedTask.subTasks?.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg group">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleSubtask(sub.id, sub.status)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            sub.status === 'DONE' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300 hover:border-emerald-400'
                          }`}
                        >
                          {sub.status === 'DONE' && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <span 
                          className={`text-sm cursor-pointer hover:underline ${sub.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-800'}`}
                          onClick={() => {
                            setSelectedTask(sub);
                            setIsEditingTask(false);
                            setEditTitle(sub.title);
                            setEditDescription(sub.description || '');
                          }}
                        >
                          {sub.title}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <form onSubmit={handleCreateSubtask} className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Tambah sub-task baru..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 outline-none bg-white"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingSubtask || !newSubtaskTitle.trim()}
                      className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                    >
                      Tambah
                    </button>
                  </form>
                </div>
              </div>

              {selectedTask.meetingNote && (
                <div className="bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100 flex items-center gap-2 flex-wrap text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-gray-900 capitalize">
                    {selectedTask.meetingNote.title}
                  </span>
                  <span className="text-gray-300 select-none">|</span>
                  <span className="text-gray-600">
                    {new Date(selectedTask.meetingNote.meetingDate).toLocaleDateString('id-ID', {
                      weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
                    })}, <span className="font-mono tracking-wider text-gray-400">__:__</span> - <span className="font-mono tracking-wider text-gray-400">__:__</span>
                  </span>
                  <span className="text-gray-300 select-none">|</span>
                  <Link
                    to="/meetings"
                    className="font-semibold text-blue-600 hover:underline whitespace-nowrap flex items-center gap-0.5"
                  >
                    Buka Catatan Rapat →
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-6">
              <button
                onClick={() => {
                  setSelectedTask(null);
                  handleDelete(selectedTask.id);
                }}
                className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Hapus Tugas
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    const newStatus = selectedTask.status === 'DONE' ? 'TODO' : 'DONE';
                    handleUpdateStatus(selectedTask.id, newStatus);
                    setSelectedTask({ ...selectedTask, status: newStatus });
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 ${
                    selectedTask.status === 'DONE' 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectedTask.status === 'DONE' ? 'Batal Selesai' : 'Tandai Selesai'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onKeyDown={handleDeleteModalKeyDown}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Hapus Tugas?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Tindakan ini tidak dapat dibatalkan. Tugas akan dihapus secara permanen.
            </p>
            <div className="flex gap-3">
              {/* Batal */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <button
                  ref={btnBatalRef}
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Batal
                </button>
                <span style={{ fontSize: '8px' }} className="text-gray-400 tracking-wide select-none">
                  ESC &nbsp;|&nbsp; ← Arrow
                </span>
              </div>

              {/* Ya, Hapus */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <button
                  ref={btnYaHapusRef}
                  onClick={confirmDelete}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  Ya, Hapus
                </button>
                <span style={{ fontSize: '8px' }} className="text-gray-400 tracking-wide select-none">
                  Enter &nbsp;|&nbsp; → Arrow
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

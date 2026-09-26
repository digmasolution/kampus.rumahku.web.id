/**
 * ShortcutsHelpModal.tsx
 * Keyboard shortcuts reference panel — opens via Shift+? or clicking '?' button in sidebar.
 */

import { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutEntry {
  label: string;
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  // Navigation
  { label: 'Alt + 1', description: 'Buka halaman Dashboard', category: 'Navigasi' },
  { label: 'Alt + 2', description: 'Buat RPS Baru (Wizard)', category: 'Navigasi' },
  { label: 'Alt + 3', description: 'Buka Catatan Rapat', category: 'Navigasi' },
  { label: 'Alt + 4', description: 'Buka Kanban Todo List', category: 'Navigasi' },
  { label: 'Alt + 5', description: 'Buka Pengaturan Template', category: 'Navigasi' },
  // Wizard
  { label: 'Alt + →', description: 'Langkah wizard berikutnya', category: 'Wizard RPS' },
  { label: 'Alt + ←', description: 'Kembali ke langkah sebelumnya', category: 'Wizard RPS' },
  { label: 'Ctrl + S', description: 'Simpan draft RPS saat ini', category: 'Wizard RPS' },
  // General
  { label: 'Ctrl + K', description: 'Fokus ke kolom pencarian', category: 'Produktivitas' },
  { label: 'Escape', description: 'Tutup modal / drawer aktif', category: 'Produktivitas' },
  { label: 'Shift + ?', description: 'Tampilkan / tutup daftar shortcut ini', category: 'Bantuan' },
];

const CATEGORIES = ['Navigasi', 'Wizard RPS', 'Produktivitas', 'Bantuan'];

export function ShortcutsHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-shortcuts-help', handleOpen);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('open-shortcuts-help', handleOpen);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Pintasan Keyboard</h2>
              <p className="text-xs text-gray-500">Kurangi klik & scroll — navigasi lebih cepat</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            title="Tutup (Escape)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CATEGORIES.map(cat => {
            const items = SHORTCUTS.filter(s => s.category === cat);
            return (
              <div key={cat}>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">
                  {cat}
                </h3>
                <div className="space-y-2.5">
                  {items.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-700">{s.description}</span>
                      <kbd className="inline-flex items-center gap-1 shrink-0">
                        {s.label.split(' + ').map((part, pi) => (
                          <span key={pi} className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded shadow-sm">
                            {part}
                          </span>
                        ))}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/80 flex items-center justify-between text-xs text-gray-400">
          <span>Tekan <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono font-bold">Shift + ?</kbd> kapan saja untuk membuka panel ini.</span>
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-white font-semibold text-xs hover:bg-gray-900 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

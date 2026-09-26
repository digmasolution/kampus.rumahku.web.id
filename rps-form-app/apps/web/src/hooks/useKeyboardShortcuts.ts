/**
 * useKeyboardShortcuts.ts
 * Global keyboard shortcut registry for Dunia Kampus app.
 * Reduces keystrokes and improves navigation efficiency.
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface ShortcutDefinition {
  key: string;
  meta?: boolean;  // Ctrl on Windows/Linux, Cmd on Mac
  alt?: boolean;
  shift?: boolean;
  description: string;
  category: string;
  action: () => void;
}

export function useKeyboardShortcuts(extraShortcuts?: ShortcutDefinition[]) {
  const navigate = useNavigate();

  const globalShortcuts: ShortcutDefinition[] = [
    // Navigation shortcuts
    {
      key: '1',
      alt: true,
      description: 'Buka Dashboard',
      category: 'Navigasi',
      action: () => navigate('/dashboard'),
    },
    {
      key: '2',
      alt: true,
      description: 'Buat RPS Baru',
      category: 'Navigasi',
      action: () => navigate('/wizard'),
    },
    {
      key: '3',
      alt: true,
      description: 'Catatan Rapat',
      category: 'Navigasi',
      action: () => navigate('/meetings'),
    },
    {
      key: '4',
      alt: true,
      description: 'Kanban Todo List',
      category: 'Navigasi',
      action: () => navigate('/todos'),
    },
    {
      key: '5',
      alt: true,
      description: 'Pengaturan Template',
      category: 'Navigasi',
      action: () => navigate('/settings'),
    },
    // Search focus — Ctrl+K (common modern UX pattern)
    {
      key: 'k',
      meta: true,
      description: 'Fokus ke kolom pencarian',
      category: 'Produktivitas',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="text"][placeholder*="Cari"], input[type="search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
    },
    // Escape — close any modal/drawer
    {
      key: 'Escape',
      description: 'Tutup modal / drawer aktif',
      category: 'Produktivitas',
      action: () => {
        // Click any visible close button
        const closeBtn = document.querySelector<HTMLButtonElement>(
          'button[aria-label="Tutup"], button[title="Tutup menu"], .modal-close'
        );
        if (closeBtn) closeBtn.click();
      },
    },
    // Help shortcut
    {
      key: '?',
      shift: true,
      description: 'Tampilkan daftar shortcut',
      category: 'Bantuan',
      action: () => {
        // Dispatch custom event to open shortcuts modal
        window.dispatchEvent(new CustomEvent('open-shortcuts-help'));
      },
    },
  ];

  const allShortcuts = [...globalShortcuts, ...(extraShortcuts || [])];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea/contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.contentEditable === 'true'
      ) {
        // Only allow Escape in inputs
        if (e.key !== 'Escape') return;
      }

      for (const shortcut of allShortcuts) {
        const metaMatch = shortcut.meta ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

        if (
          e.key === shortcut.key &&
          metaMatch &&
          altMatch &&
          shiftMatch
        ) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, extraShortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return allShortcuts;
}

/**
 * Exported catalog for display in ShortcutsHelpModal
 */
export function getShortcutLabel(s: ShortcutDefinition): string {
  const parts: string[] = [];
  if (s.meta) parts.push('Ctrl');
  if (s.alt) parts.push('Alt');
  if (s.shift) parts.push('Shift');
  parts.push(s.key === ' ' ? 'Space' : s.key);
  return parts.join(' + ');
}

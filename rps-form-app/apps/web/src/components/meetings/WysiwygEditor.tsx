import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Heading2, Quote, AtSign, Hash, 
  Calendar, Flag, X
} from 'lucide-react';
import { UserItem } from '../../services/meetingTodo.service';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  users: UserItem[];
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  users,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showDueDropdown, setShowDueDropdown] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState('');
  const [isTodoMode, setIsTodoMode] = useState(false);

  // Sync value from props to contentEditable only when external reset occurs
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const exec = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleInput = (e?: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);

      // 1. Mobile keyboard reliable detection using InputEvent.data
      if (e && (e.nativeEvent as InputEvent).data === '#' && !isTodoMode) {
        setIsTodoMode(true);
      }

      // Check for trigger characters at current selection
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let textBefore = sel.anchorNode.textContent || '';
        // Sanitize invisible characters that mobile keyboards sometimes insert
        textBefore = textBefore.replace(/[\u200B-\u200D\uFEFF]/g, '');

        // If user just typed @
        if (textBefore.endsWith('@')) {
          setShowUserDropdown(true);
        }
        // If user typed T1
        if (textBefore.endsWith('T1') || textBefore.endsWith('t1')) {
          setShowDueDropdown(true);
        }
        // Fallback detection for #
        if (textBefore.endsWith('#') && !isTodoMode) {
          setIsTodoMode(true);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isTodoMode) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsTodoMode(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '<br>&gt;&nbsp;');
      }
    } else {
      // Enter Todo Mode reliably on key press
      if (e.key === '#') {
        setIsTodoMode(true);
      }
    }
  };

  const insertTextAtCursor = (text: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, text);
      handleInput();
    }
  };

  const insertUserMention = (user: UserItem) => {
    // If text already has trailing @, we just insert user name
    const sel = window.getSelection();
    let textToInsert = `@${user.name.replace(/\s+/g, '_')} `;
    if (sel && sel.anchorNode && (sel.anchorNode.textContent || '').endsWith('@')) {
      textToInsert = `${user.name.replace(/\s+/g, '_')} `;
    }
    insertTextAtCursor(textToInsert);
    setShowUserDropdown(false);
  };

  const insertPriority = (prio: string) => {
    insertTextAtCursor(` ${prio} `);
    setShowPriorityDropdown(false);
  };

  const insertDueDate = () => {
    if (selectedDueDate) {
      insertTextAtCursor(` T1:${selectedDueDate} `);
      setShowDueDropdown(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-1.5 text-gray-700">
        <button
          type="button"
          onClick={() => exec('bold')}
          title="Tebal (Ctrl+B)"
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-black transition"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          title="Miring (Ctrl+I)"
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-black transition"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          title="Garis Bawah (Ctrl+U)"
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-black transition"
        >
          <Underline className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => exec('formatBlock', '<h2>')}
          title="Heading 2"
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-black transition font-semibold text-xs"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          title="Daftar Bullet"
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-black transition"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          title="Daftar Nomor"
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-black transition"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<blockquote>')}
          title="Kutipan"
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-black transition"
        >
          <Quote className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Smart Tag Helper Buttons */}
        <div className="flex items-center gap-1 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200 text-xs">
          <button
            type="button"
            onClick={() => {
              insertTextAtCursor(' #');
              setIsTodoMode(true);
            }}
            title="Tambah Pekerjaan ke To Do List (#)"
            className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 bg-white px-2 py-1 rounded border border-blue-300 shadow-xs hover:bg-blue-50 transition"
          >
            <Hash className="w-3.5 h-3.5 text-blue-600" />
            <span>#Tugas</span>
          </button>

          {/* User Mention Popover */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              title="Assign Dosen / User (@)"
              className="flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 bg-white px-2 py-1 rounded border border-purple-300 shadow-xs hover:bg-purple-50 transition"
            >
              <AtSign className="w-3.5 h-3.5 text-purple-600" />
              <span>@Assign</span>
            </button>
            {showUserDropdown && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 max-h-56 overflow-y-auto">
                <p className="text-[11px] font-bold text-gray-500 uppercase px-2 mb-1">Pilih Dosen / Pengguna</p>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => insertUserMention(u)}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 rounded flex items-center justify-between group transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-blue-700">{u.name}</p>
                      <p className="text-[10px] text-gray-400">{u.email}</p>
                    </div>
                    <span className="text-[9px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded uppercase font-mono">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Popover (P1 - P5) */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              title="Prioritas Tugas (p1 s/d p5)"
              className="flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900 bg-white px-2 py-1 rounded border border-rose-300 shadow-xs hover:bg-rose-50 transition"
            >
              <Flag className="w-3.5 h-3.5 text-rose-600" />
              <span>P1..P5</span>
            </button>
            {showPriorityDropdown && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => insertPriority('p1')}
                  className="w-full text-left px-2 py-1 text-xs rounded hover:bg-red-50 flex items-center gap-2 text-red-700 font-bold"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  P1 (Sangat Penting / Merah)
                </button>
                <button
                  type="button"
                  onClick={() => insertPriority('p2')}
                  className="w-full text-left px-2 py-1 text-xs rounded hover:bg-orange-50 flex items-center gap-2 text-orange-700 font-semibold"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  P2 (Penting / Oranye)
                </button>
                <button
                  type="button"
                  onClick={() => insertPriority('p3')}
                  className="w-full text-left px-2 py-1 text-xs rounded hover:bg-yellow-50 flex items-center gap-2 text-yellow-700"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  P3 (Normal / Kuning)
                </button>
                <button
                  type="button"
                  onClick={() => insertPriority('p4')}
                  className="w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-50 flex items-center gap-2 text-blue-700"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  P4 (Rendah / Biru)
                </button>
                <button
                  type="button"
                  onClick={() => insertPriority('p5')}
                  className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 flex items-center gap-2 text-gray-600"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                  P5 (Opsional / Abu-abu)
                </button>
              </div>
            )}
          </div>

          {/* T1 Due Date Trigger */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowDueDropdown(!showDueDropdown)}
              title="Due Date / Waktu (T1)"
              className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 bg-white px-2 py-1 rounded border border-emerald-300 shadow-xs hover:bg-emerald-50 transition"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>T1 (Due Date)</span>
            </button>
            {showDueDropdown && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Tentukan Batas Waktu (T1):</p>
                <input
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDueDropdown(false)}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={insertDueDate}
                    disabled={!selectedDueDate}
                    className="px-2.5 py-1 text-xs bg-emerald-600 text-white font-medium rounded hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Sisipkan T1
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative">
        {isTodoMode && (
          <div className="absolute top-2 right-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-2 py-1 rounded shadow-sm flex items-center gap-2 z-10 transition-all">
             <span className="font-medium flex items-center gap-1"><Hash className="w-3 h-3"/> Menulis Judul Todo</span>
             <button onClick={() => setIsTodoMode(false)} className="hover:bg-yellow-200 rounded-full p-0.5" title="Keluar Mode (Esc)">
                 <X className="w-3 h-3" />
             </button>
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={`p-4 min-h-[280px] max-h-[500px] overflow-y-auto focus:outline-none leading-relaxed text-sm prose max-w-none transition-colors ${isTodoMode ? 'bg-yellow-50/50 text-gray-900' : 'text-gray-800'}`}
          data-placeholder="Tuliskan jalannya rapat di sini... Ketik '#' untuk tugas baru, '@' untuk assign dosen, 'p1'..'p5' untuk prioritas (p1 merah = sangat penting), dan 'T1' untuk tanggal batas waktu."
        />
      </div>
    </div>
  );
};

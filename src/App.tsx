/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Tag as TagIcon, 
  X, 
  Menu, 
  Calendar,
  Hash,
  LayoutGrid,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Note = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
};

const STORAGE_KEY = "mymemo.notes";

const INITIAL_SEEDS: Note[] = [
  {
    id: 1,
    title: "시안 작업 가이드",
    body: "디자인 시안 작업 시 준수해야 할 타이포그래피와 컬러 팔레트 가이드라인을 정리합니다.",
    tags: ["디자인", "가이드"],
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "읽어야 할 책 리스트",
    body: "1. 클린 코드\n2. 리팩터링\n3. 디자인 패턴의 활용\n4. 타이포그래피의 탄생",
    tags: ["독서", "자기개발"],
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "프로젝트 아이디어",
    body: "개인용 메모 앱 'MyMemo' 개발 프로젝트. React, TailwindCSS, LocalStorage를 활용한 초간단 메모장.",
    tags: ["업무", "개발"],
    updatedAt: new Date().toISOString()
  }
];

// --- Components ---

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note> | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notes from localStorage", e);
        setNotes(INITIAL_SEEDS);
      }
    } else {
      setNotes(INITIAL_SEEDS);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isLoaded]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Derived State
  const tagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true;
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = note.title.toLowerCase().includes(lowerQuery) || 
                            note.body.toLowerCase().includes(lowerQuery) ||
                            note.tags.some(t => t.toLowerCase().includes(lowerQuery));
      return matchesTag && matchesSearch;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, selectedTag, searchQuery]);

  // Handlers
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNote?.title) return;

    const now = new Date().toISOString();
    if (currentNote.id) {
      // Update
      setNotes(prev => prev.map(n => n.id === currentNote.id ? { ...n, ...currentNote, updatedAt: now } as Note : n));
    } else {
      // Create
      const newNote: Note = {
        id: Date.now(),
        title: currentNote.title || "제목 없음",
        body: currentNote.body || "",
        tags: currentNote.tags || [],
        updatedAt: now
      };
      setNotes(prev => [newNote, ...prev]);
    }
    setIsModalOpen(false);
    setCurrentNote(null);
  };

  const handleDeleteNote = (id: number) => {
    if (confirm("정말로 이 메모를 삭제하시겠습니까?")) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const openCreateModal = () => {
    setCurrentNote({ title: "", body: "", tags: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setCurrentNote(note);
    setIsModalOpen(true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTag(prev => prev === tag ? null : tag);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-secondary text-slate-900 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg md:hidden text-slate-500"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { setSelectedTag(null); setIsMobileMenuOpen(false); }}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
              <FileText size={24} color="white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 hidden sm:block">MyMemo</h1>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4 md:mx-12 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="제목, 본문, 태그 검색..."
            className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 sm:px-6 rounded-full flex items-center gap-2 shadow-md shadow-indigo-200 transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span className="hidden sm:inline">새 메모</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar (Desktop) */}
        <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col p-6 shrink-0 overflow-y-auto hidden md:flex">
          <SidebarContent 
            selectedTag={selectedTag} 
            setSelectedTag={setSelectedTag} 
            notesCount={notes.length} 
            tagsWithCounts={tagsWithCounts}
            toggleTag={toggleTag}
          />
        </aside>

        {/* Sidebar (Mobile Overlay) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden top-20"
              />
              <motion.aside 
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-20 bottom-0 w-64 bg-slate-50 z-40 md:hidden p-6 flex flex-col border-r border-slate-200 shadow-xl"
              >
                <SidebarContent 
                  selectedTag={selectedTag} 
                  setSelectedTag={setSelectedTag} 
                  notesCount={notes.length} 
                  tagsWithCounts={tagsWithCounts}
                  toggleTag={toggleTag}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-800 capitalize">
                {selectedTag ? `#${selectedTag}` : "전체 메모"} 
                <span className="text-indigo-600 text-lg font-medium ml-3">{filteredNotes.length}</span>
              </h2>
            </div>
            
            {/* Note Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence initial={false} mode="popLayout">
                {filteredNotes.map((note, idx) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    idx={idx}
                    onClick={() => openEditModal(note)}
                    onDelete={() => handleDeleteNote(note.id)}
                    onTagClick={toggleTag}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filteredNotes.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-32 text-slate-400 text-center"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                  <FileText size={32} className="opacity-20" />
                </div>
                <p className="text-lg font-bold text-slate-800">메모를 찾을 수 없습니다</p>
                <p className="text-sm mt-1">다른 검색어나 태그를 시도해보세요.</p>
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedTag(null); }}
                  className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-semibold text-sm transition-colors"
                >
                  필터 초기화
                </button>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800">
                  {currentNote?.id ? "메모 편집" : "새 메모 작성"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSaveNote} className="space-y-4">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="제목을 입력하세요"
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-bold placeholder:text-slate-300 outline-none"
                  value={currentNote?.title || ""}
                  onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                />
                
                <textarea 
                  placeholder="내용을 입력하세요"
                  className="w-full h-48 px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-600 leading-relaxed placeholder:text-slate-300 outline-none"
                  value={currentNote?.body || ""}
                  onChange={(e) => setCurrentNote(prev => ({ ...prev, body: e.target.value }))}
                />

                <input 
                  type="text" 
                  placeholder="태그 (쉼표로 구분)"
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none"
                  value={currentNote?.tags?.join(", ") || ""}
                  onChange={(e) => {
                    const tagList = e.target.value.split(',').map(t => t.trim()).filter(t => t !== "");
                    setCurrentNote(prev => ({ ...prev, tags: tagList }));
                  }}
                />

                <div className="pt-6 flex gap-3">
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    {currentNote?.id ? "저장하기" : "추가하기"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({ selectedTag, setSelectedTag, notesCount, tagsWithCounts, toggleTag }: any) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">필터</h2>
        <nav className="space-y-1">
          <button 
            onClick={() => setSelectedTag(null)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition-all ${!selectedTag ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-white hover:shadow-sm text-slate-600'}`}
          >
            <span className="flex items-center gap-3">
              <LayoutGrid size={18} />
              전체 메모
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${!selectedTag ? 'bg-indigo-200' : 'bg-slate-200'}`}>{notesCount}</span>
          </button>
        </nav>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">태그 목록</h2>
        <div className="flex flex-col gap-1">
          {tagsWithCounts.map(([tag, count]: any) => (
            <button 
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`flex items-center justify-between px-4 py-2 rounded-lg transition-all ${selectedTag === tag ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
            >
              <span>#{tag}</span>
              <span className="text-xs text-slate-400">{count}</span>
            </button>
          ))}
          {tagsWithCounts.length === 0 && (
            <p className="px-4 py-2 text-xs text-slate-400 italic font-medium">태그가 없습니다.</p>
          )}
        </div>
      </div>
    </>
  );
}

function NoteCard({ note, idx, onClick, onDelete, onTagClick }: { note: Note, idx: number, onClick: () => void, onDelete: () => void, onTagClick: (t: string) => void }) {
  const formattedDate = new Date(note.updatedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // Cycle through some vibrant border colors
  const borderColors = [
    'border-emerald-100 hover:border-emerald-200',
    'border-amber-100 hover:border-amber-200',
    'border-indigo-100 hover:border-indigo-200',
    'border-rose-100 hover:border-rose-200',
    'border-sky-100 hover:border-sky-200'
  ];
  const tagColors = [
    'bg-emerald-50 text-emerald-600',
    'bg-amber-50 text-amber-600',
    'bg-indigo-50 text-indigo-600',
    'bg-rose-50 text-rose-600',
    'bg-sky-50 text-sky-600'
  ];

  const colorIdx = idx % borderColors.length;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -6 }}
      className={`group relative bg-white border-2 ${borderColors[colorIdx]} rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col h-full`}
      onClick={onClick}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-rose-50 text-rose-500 rounded-full transition-opacity hover:bg-rose-500 hover:text-white z-10"
        title="삭제"
      >
        <Trash2 size={16} />
      </button>

      <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight pr-6 group-hover:text-indigo-600 transition-colors">
        {note.title}
      </h3>
      <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
        {note.body}
      </p>

      <div className="mt-auto">
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {note.tags.map(tag => (
              <span 
                key={tag} 
                onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                className={`px-2 py-1 ${tagColors[colorIdx]} rounded-md text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import Sidebar from '../components/Sidebar';
import CardDetails from '../components/CardDetails';
import ExportPanel from '../components/ExportPanel';
import SettingsPanel from '../components/SettingsPanel';

export default function Dashboard() {
  const { 
    state, 
    preferences, 
    updatePreferences, 
    addCard, 
    updateCard, 
    deleteCard, 
    addLog, 
    deleteLog, 
    updateLog 
  } = useAppContext();
  
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [selectedCardId, setSelectedCardId] = useState<string | null>(id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  // Sync with URL params if they change
  useEffect(() => {
    if (id) {
      setSelectedCardId(id);
    }
  }, [id]);

  const selectedCard = useMemo(() => 
    state.cards.find((c) => c.id === selectedCardId),
  [state.cards, selectedCardId]);

  const filteredCards = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const isTagSearch = term.startsWith('#');
    const tagTerm = isTagSearch ? term.slice(1) : term;

    return state.cards.filter(c => {
      const matchesSearch = !term || (
        isTagSearch 
          ? c.tags.some(t => t.toLowerCase().includes(tagTerm))
          : (
              c.jiraId.toLowerCase().includes(term) ||
              c.title.toLowerCase().includes(term) ||
              c.tags.some(t => t.toLowerCase().includes(term))
            )
      );
      
      const hasValidDateRange = dateRange && dateRange.start && dateRange.end;
      const matchesDate = !hasValidDateRange || (
        new Date(c.createdAt) >= new Date(`${dateRange.start}T00:00:00`) &&
        new Date(c.createdAt) <= new Date(`${dateRange.end}T23:59:59`)
      );

      return matchesSearch && matchesDate;
    });
  }, [state.cards, searchTerm, dateRange]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    state.cards.forEach(c => c.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [state.cards]);

  const handleCreateCard = () => {
    const newCard = addCard('NEW-1', 'New Jira Card', ['task']);
    setSelectedCardId(newCard.id);
  };

  const handleSelectCard = (id: string) => {
    setSelectedCardId(id);
    navigate(`/dashboard/${id}`, { replace: true });
  };

  return (
    <div className={cn(
      "flex h-screen w-full font-sans transition-colors duration-300 overflow-hidden",
      preferences.theme === 'dark' && "theme-dark",
      preferences.theme === 'high-contrast' && "theme-high-contrast",
      `font-style-${preferences.fontFamily}`
    )}>
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarOpen ? (typeof window !== 'undefined' && window.innerWidth < 1024 ? '100%' : 320) : 0,
          x: sidebarOpen ? 0 : -320,
          opacity: sidebarOpen ? 1 : 0 
        }}
        className={cn(
          "fixed lg:relative h-full border-r border-[var(--border-color)] bg-[var(--bg-color)] z-50 overflow-hidden transition-colors duration-300 shadow-2xl lg:shadow-none",
          !sidebarOpen && "border-none"
        )}
      >
        <div className="w-[320px] max-w-full h-full flex flex-col">
          <Sidebar 
            cards={filteredCards}
            selectedCardId={selectedCardId}
            onSelectCard={(id) => {
              handleSelectCard(id);
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            onAddCard={() => {
              handleCreateCard();
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onExport={() => setIsExporting(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-[var(--bg-color)] transition-colors duration-300 flex flex-col">
        <header className="h-20 border-b border-[var(--border-color)] flex items-center justify-between px-4 lg:px-12 bg-[var(--bg-color)] opacity-90 backdrop-blur-sm sticky top-0 z-40 transition-colors duration-300">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-[var(--ink-color)] hover:bg-[var(--secondary-bg)] rounded-sm transition-colors"
            >
              <ArrowLeft className={cn("rotate-180 transition-transform", sidebarOpen && "rotate-0")} size={18} />
            </button>
            <div className="flex items-center space-x-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse transition-colors duration-300 hidden sm:block"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-color)] transition-colors duration-300">Ledger Active</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 border border-[var(--border-color)] text-[var(--ink-color)] rounded-sm shadow-sm hover:bg-[var(--secondary-bg)] transition-all flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-[var(--bg-color)]"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Home</span>
            </button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-color)] transition-colors duration-300">{filteredCards.length} records</span>
          </div>
        </header>

        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-16">
          <AnimatePresence mode="wait">
            {selectedCard ? (
              <motion.div
                key={selectedCard.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardDetails 
                  card={selectedCard}
                  logs={state.logs.filter(l => l.cardId === selectedCard.id)}
                  allTags={allTags}
                  onUpdateCard={updateCard}
                  onDeleteCard={(id) => {
                    deleteCard(id);
                    setSelectedCardId(null);
                    navigate('/dashboard', { replace: true });
                  }}
                  onAddLog={addLog}
                  onDeleteLog={deleteLog}
                  onUpdateLog={updateLog}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-24"
              >
                <BookOpen size={48} strokeWidth={1} className="mb-6 text-[var(--border-color)]" />
                <h2 className="text-3xl font-serif italic mb-2 tracking-tight transition-colors duration-300">Work Ledger</h2>
                <p className="max-w-xs text-sm text-[var(--muted-color)] transition-colors duration-300">Select an entry from the ledger or create a new document to begin.</p>
                <button 
                  onClick={handleCreateCard}
                  className="mt-8 px-10 py-4 border border-[var(--ink-color)] text-[var(--ink-color)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--ink-color)] hover:text-[var(--bg-color)] transition-all underline-offset-4 shadow-sm"
                >
                  Create New Record
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {isExporting && (
          <ExportPanel 
            state={state} 
            onClose={() => setIsExporting(false)} 
          />
        )}
        {isSettingsOpen && (
          <SettingsPanel 
            preferences={preferences}
            onUpdate={updatePreferences}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Settings
} from 'lucide-react';
import { useLogs } from './hooks/useLogs';
import { cn } from './lib/utils';
import Sidebar from './components/Sidebar';
import CardDetails from './components/CardDetails';
import ExportPanel from './components/ExportPanel';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const { state, preferences, updatePreferences, addCard, updateCard, deleteCard, addLog, deleteLog, updateLog } = useLogs();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const selectedCard = useMemo(() => 
    state.cards.find((c) => c.id === selectedCardId),
  [state.cards, selectedCardId]);

  const filteredCards = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return state.cards.filter(c => {
      const matchesSearch = c.jiraId.toLowerCase().includes(term) ||
        c.title.toLowerCase().includes(term) ||
        c.tags.some(t => t.toLowerCase().includes(term));
      
      const matchesDate = !dateRange || (
        new Date(c.createdAt) >= new Date(dateRange.start) &&
        new Date(c.createdAt) <= new Date(dateRange.end)
      );

      return matchesSearch && matchesDate;
    });
  }, [state.cards, searchTerm, dateRange]);

  const handleCreateCard = () => {
    const newCard = addCard('NEW-1', 'New Jira Card', ['task']);
    setSelectedCardId(newCard.id);
  };

  return (
    <div className={cn(
      "flex h-screen w-full font-sans transition-colors duration-300",
      preferences.theme === 'dark' && "theme-dark",
      preferences.theme === 'high-contrast' && "theme-high-contrast",
      `font-style-${preferences.fontFamily}`
    )}>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className={cn(
          "relative h-full border-r border-[var(--border-color)] bg-[var(--bg-color)] opacity-95 overflow-hidden z-20 transition-colors duration-300",
          !sidebarOpen && "border-none shadow-none"
        )}
      >
        <div className="w-[320px] h-full flex flex-col">
          <Sidebar 
            cards={filteredCards}
            selectedCardId={selectedCardId}
            onSelectCard={setSelectedCardId}
            onAddCard={handleCreateCard}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onExport={() => setIsExporting(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </motion.aside>

      {/* Collapse/Expand button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute bottom-6 left-6 z-30 p-2 bg-[var(--ink-color)] text-[var(--bg-color)] rounded-sm shadow-sm hover:scale-105 transition-all md:flex hidden"
      >
        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-[var(--bg-color)] transition-colors duration-300">
        <header className="h-20 border-b border-[var(--border-color)] flex items-center justify-between px-12 bg-[var(--bg-color)] opacity-90 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center space-x-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse transition-colors duration-300"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-color)] transition-colors duration-300">Ledger Active</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-color)] transition-colors duration-300">{filteredCards.length} records</span>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-12 py-16 min-h-full">
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
                  onUpdateCard={updateCard}
                  onDeleteCard={(id) => {
                    deleteCard(id);
                    setSelectedCardId(null);
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


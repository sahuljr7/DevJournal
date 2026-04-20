import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useLogs } from './hooks/useLogs';
import { cn } from './lib/utils';
import Sidebar from './components/Sidebar';
import CardDetails from './components/CardDetails';
import ExportPanel from './components/ExportPanel';

export default function App() {
  const { state, addCard, updateCard, deleteCard, addLog, deleteLog } = useLogs();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
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
    <div className="flex h-screen w-full bg-editorial-bg text-editorial-ink font-sans selection:bg-neutral-200">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className={cn(
          "relative h-full border-r border-black/10 bg-white/50 overflow-hidden z-20",
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
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </motion.aside>

      {/* Collapse/Expand button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute bottom-6 left-6 z-30 p-2 bg-black text-white rounded-sm shadow-sm hover:scale-105 transition-transform md:flex hidden"
      >
        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="h-20 border-b border-black/10 flex items-center justify-between px-12 bg-white/30 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Documentation Session Active</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{filteredCards.length} entries filtered</span>
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
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-24"
              >
                <BookOpen size={48} strokeWidth={1} className="mb-6 text-black/10" />
                <h2 className="text-3xl font-serif italic mb-2 tracking-tight">Work Ledger</h2>
                <p className="max-w-xs text-sm opacity-40">Select an entry from the ledger or create a new document to begin.</p>
                <button 
                  onClick={handleCreateCard}
                  className="mt-8 px-10 py-4 border border-black text-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all underline-offset-4"
                >
                  Create New Record
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Export Panel Overlay */}
      <AnimatePresence>
        {isExporting && (
          <ExportPanel 
            state={state} 
            onClose={() => setIsExporting(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}


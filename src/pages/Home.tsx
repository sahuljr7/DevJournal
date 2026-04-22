import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Calendar, 
  SortAsc, 
  SortDesc, 
  Type, 
  Plus, 
  ChevronDown,
  LayoutGrid,
  List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { cn, formatDate } from '../lib/utils';
import { JiraCard } from '../types';

type SortOption = 'date-desc' | 'date-asc' | 'alpha-asc' | 'alpha-desc' | 'month-year';

export default function Home() {
  const { state, preferences, addCard } = useAppContext();
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const sortedCards = useMemo(() => {
    const cards = [...state.cards];
    switch (sortOption) {
      case 'date-desc':
        return cards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'date-asc':
        return cards.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'alpha-asc':
        return cards.sort((a, b) => a.title.localeCompare(b.title));
      case 'alpha-desc':
        return cards.sort((a, b) => b.title.localeCompare(a.title));
      case 'month-year':
        return cards.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          if (dateA.getFullYear() !== dateB.getFullYear()) {
            return dateB.getFullYear() - dateA.getFullYear();
          }
          return dateB.getMonth() - dateA.getMonth();
        });
      default:
        return cards;
    }
  }, [state.cards, sortOption]);

  const handleCreateNew = () => {
    const newCard = addCard('NEW-1', 'New Jira Card', ['task']);
    navigate(`/dashboard/${newCard.id}`);
  };

  return (
    <div className={cn(
      "min-h-screen w-full font-sans transition-colors duration-300 bg-[var(--bg-color)] text-[var(--ink-color)] pb-32",
      preferences.theme === 'dark' && "theme-dark",
      preferences.theme === 'high-contrast' && "theme-high-contrast",
      `font-style-${preferences.fontFamily}`
    )}>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:h-[80vh] flex flex-col justify-center px-6 sm:px-12 border-b border-[var(--border-color)] overflow-hidden py-24 sm:py-0">
        <div className="absolute top-12 left-6 sm:left-12 flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-50">Systems Operational // v1.4.0</span>
        </div>

        <div className="max-w-4xl">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-[18vw] sm:text-[15vw] lg:text-[12vw] font-serif font-bold italic leading-[0.85] tracking-tighter mb-8"
          >
            Dev<br />Journal.
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl lg:text-2xl font-serif italic opacity-60 mb-12 max-w-2xl leading-relaxed"
          >
            A high-fidelity technical ledger for the modern engineer. 
            Consign your logic, version your evidence, and synthesize your progress.
          </motion.p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6"
          >
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-12 py-5 bg-[var(--ink-color)] text-[var(--bg-color)] text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl"
            >
              Enter Dashboard
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={handleCreateNew}
              className="w-full sm:w-auto px-12 py-5 border border-[var(--border-color)] text-[var(--ink-color)] text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[var(--secondary-bg)] transition-all"
            >
              <Plus size={16} />
              Initiate Record
            </button>
          </motion.div>
        </div>

        {/* Branding decoration */}
        <div className="absolute right-[-5vw] top-1/2 -translate-y-1/2 hidden lg:block opacity-5 pointer-events-none">
          <span className="text-[40vw] font-serif italic rotate-12 inline-block leading-none">V</span>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 border-b border-[var(--border-color)]">
        {[
          { title: "Technical Consensus", desc: "Markdown-based logs for rigorous documentation." },
          { title: "Source Versioning", desc: "Implicit history for all consigned technical files." },
          { title: "AI Synthesis", desc: "Generative executive summaries from long-running ledgers." }
        ].map((f, i) => (
          <div key={i} className="p-8 sm:p-12 border-b md:border-b-0 md:border-r border-[var(--border-color)] last:border-0 hover:bg-[var(--secondary-bg)] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4 block">0{i + 1} // Utility</span>
            <h3 className="text-xl font-serif font-bold italic mb-4">{f.title}</h3>
            <p className="text-sm opacity-60 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Records Library */}
      <section className="px-6 sm:px-12 py-16 sm:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50 mb-4 block">Central Repository</span>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold italic leading-tight">Records Library.</h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* View Toggle */}
            <div className="flex bg-[var(--secondary-bg)] border border-[var(--border-color)] p-1 rounded-sm">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 transition-all",
                  viewMode === 'grid' ? "bg-[var(--ink-color)] text-[var(--bg-color)]" : "text-[var(--muted-color)] hover:text-[var(--ink-color)]"
                )}
              >
                <LayoutGrid size={14} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 transition-all",
                  viewMode === 'list' ? "bg-[var(--ink-color)] text-[var(--bg-color)]" : "text-[var(--muted-color)] hover:text-[var(--ink-color)]"
                )}
              >
                <List size={14} />
              </button>
            </div>

            {/* Sort Dropdown simulated */}
            <div className="relative group w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 px-6 py-3 border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--secondary-bg)] transition-all">
                <span>Sort: {sortOption.replace('-', ' ')}</span>
                <ChevronDown size={14} />
              </button>
              <div className="absolute left-0 sm:left-auto right-0 top-full mt-2 w-full sm:w-48 bg-[var(--bg-color)] border border-[var(--border-color)] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {[
                  { id: 'date-desc', label: 'Date: Newest', icon: <SortDesc size={12} /> },
                  { id: 'date-asc', label: 'Date: Oldest', icon: <SortAsc size={12} /> },
                  { id: 'alpha-asc', label: 'Alphanumeric: A-Z', icon: <Type size={12} /> },
                  { id: 'alpha-desc', label: 'Alphanumeric: Z-A', icon: <Type size={12} /> },
                  { id: 'month-year', label: 'By Month & Year', icon: <Calendar size={12} /> },
                ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => setSortOption(opt.id as SortOption)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-color)] hover:text-[var(--ink-color)] hover:bg-[var(--secondary-bg)] border-b last:border-0 border-[var(--border-color)] text-left"
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {sortedCards.length > 0 ? (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8" 
              : "space-y-4"
          )}>
            {sortedCards.map((card) => (
              <motion.div
                layout
                key={card.id}
                onClick={() => navigate(`/dashboard/${card.id}`)}
                className={cn(
                  "group cursor-pointer border border-[var(--border-color)] transition-all hover:border-[var(--ink-color)] hover:shadow-xl bg-[var(--bg-color)]",
                  viewMode === 'grid' ? "p-6 sm:p-8 flex flex-col h-full" : "p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                )}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] font-mono font-bold tracking-widest opacity-40 uppercase">{card.jiraId}</span>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        card.status === 'done' ? 'bg-emerald-500' : 
                        card.status === 'in-progress' ? 'bg-amber-500' : 'bg-neutral-300'
                      )} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold italic mb-4 group-hover:underline leading-tight">{card.title}</h3>
                    <p className="text-sm opacity-50 mb-8 font-serif leading-relaxed line-clamp-3">
                      {card.description || 'No description provided for this record.'}
                    </p>
                    <div className="mt-auto pt-6 border-t border-[var(--border-color)] flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{formatDate(card.createdAt)}</span>
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all sm:block hidden" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 sm:gap-8 flex-1">
                      <span className="text-[10px] font-mono font-bold tracking-widest opacity-40 uppercase min-w-[60px] sm:min-w-[80px]">{card.jiraId}</span>
                      <h3 className="text-lg sm:text-xl font-serif font-bold italic group-hover:underline">{card.title}</h3>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-12 border-t sm:border-0 pt-4 sm:pt-0">
                      <div className="hidden sm:flex lg:flex items-center gap-2">
                        {card.tags.slice(0, 2).map((t, ti) => (
                          <span key={ti} className="text-[8px] uppercase font-bold tracking-widest bg-[var(--secondary-bg)] px-2 py-0.5 border border-[var(--border-color)] text-[var(--muted-color)]">
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 sm:min-w-[100px] sm:text-right">{formatDate(card.createdAt)}</span>
                      <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all text-[var(--ink-color)] hidden sm:block" />
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-24 sm:py-32 text-center border-2 border-dashed border-[var(--border-color)] rounded-sm">
            <h3 className="text-xl sm:text-2xl font-serif italic opacity-40 mb-8 px-4">The library is currently vacant.</h3>
            <button 
              onClick={handleCreateNew}
              className="px-8 sm:px-12 py-5 bg-[var(--ink-color)] text-[var(--bg-color)] text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3 mx-auto"
            >
              Initiate First Record
            </button>
          </div>
        )}
      </section>

      {/* Footer Branding */}
      <footer className="px-6 sm:px-12 py-12 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-6 opacity-30 italic font-serif text-[10px] tracking-widest uppercase mt-24 sm:mt-32 text-center sm:text-left">
        <span>DevJournal // Technical Documentation Framework</span>
        <span>Consign Your Logic // 2026</span>
      </footer>
    </div>
  );
}

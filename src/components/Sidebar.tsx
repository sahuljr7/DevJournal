import { Search, Plus, Download, Settings, XCircle } from 'lucide-react';
import { JiraCard } from '../types';
import { cn, formatDate } from '../lib/utils';

interface SidebarProps {
  cards: JiraCard[];
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  onAddCard: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onExport: () => void;
  onOpenSettings: () => void;
  dateRange: { start: string; end: string } | null;
  onDateRangeChange: (range: { start: string; end: string } | null) => void;
}

export default function Sidebar({
  cards,
  selectedCardId,
  onSelectCard,
  onAddCard,
  searchTerm,
  onSearchChange,
  onExport,
  onOpenSettings,
  dateRange,
  onDateRangeChange,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-color)] backdrop-blur-md transition-colors duration-300">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[var(--muted-color)] transition-colors duration-300">Work Ledger // v1.0</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenSettings}
              className="p-1 text-[var(--muted-color)] hover:text-[var(--ink-color)] transition-colors"
              title="Interface Settings"
            >
              <Settings size={14} />
            </button>
            <button 
              onClick={onExport}
              className="p-1 text-[var(--muted-color)] hover:text-[var(--ink-color)] transition-colors"
              title="Export Ledger"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-color)] group-focus-within:text-[var(--ink-color)] transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Search ID, title, or #tags..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-sm text-xs italic outline-none focus:border-[var(--muted-color)] transition-all text-[var(--ink-color)]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--muted-color)]">Temporal Filter</span>
              {dateRange && (dateRange.start || dateRange.end) && (
                <button 
                  onClick={() => onDateRangeChange(null)}
                  className="text-[8px] font-bold uppercase tracking-widest text-red-500 hover:underline flex items-center gap-1"
                >
                  <XCircle size={10} /> Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input 
                  type="date"
                  className="w-full text-[9px] bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-sm px-2 py-1.5 outline-none font-bold uppercase tracking-tighter text-[var(--muted-color)] focus:text-[var(--ink-color)] transition-colors"
                  value={dateRange?.start || ''}
                  onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value, end: dateRange?.end || '' } as any)}
                />
              </div>
              <span className="text-[9px] text-[var(--border-color)]">—</span>
              <div className="relative flex-1">
                <input 
                  type="date"
                  className="w-full text-[9px] bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-sm px-2 py-1.5 outline-none font-bold uppercase tracking-tighter text-[var(--muted-color)] focus:text-[var(--ink-color)] transition-colors"
                  value={dateRange?.end || ''}
                  onChange={(e) => onDateRangeChange({ ...dateRange, start: dateRange?.start || '', end: e.target.value } as any)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {cards.length > 0 ? (
          cards.map((card) => (
            <button
              key={card.id}
              onClick={() => onSelectCard(card.id)}
              className={cn(
                "w-full flex flex-col items-start text-left transition-all group border-b border-[var(--border-color)] pb-4 last:border-none",
                selectedCardId === card.id 
                  ? "opacity-100" 
                  : "opacity-40 hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-[9px] uppercase tracking-widest text-[var(--muted-color)] transition-colors">
                  {card.jiraId}
                </span>
                <span className="text-[9px] uppercase tracking-tighter text-[var(--muted-color)] transition-colors">
                  {formatDate(card.updatedAt)}
                </span>
              </div>
              <h3 className={cn(
                "text-lg font-serif italic leading-tight group-hover:underline transition-all text-[var(--ink-color)]",
                selectedCardId === card.id ? "opacity-100" : "opacity-90"
              )}>
                {card.title}
              </h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {card.tags.slice(0, 3).map((tag, i) => (
                  <span 
                    key={i} 
                    className="text-[8px] font-bold uppercase tracking-widest text-[var(--muted-color)] transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12 text-[var(--muted-color)] italic font-serif text-sm transition-colors">
            No matching records found.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[var(--border-color)] transition-colors">
        <button 
          onClick={onAddCard}
          className="w-full border border-[var(--ink-color)] bg-transparent text-[var(--ink-color)] py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[var(--ink-color)] hover:text-[var(--bg-color)] transition-all shadow-sm"
        >
          + Log New Work
        </button>
      </div>
    </div>
  );
}

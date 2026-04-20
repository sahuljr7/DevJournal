import { Search, Plus, Download, Tag } from 'lucide-react';
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
  dateRange,
  onDateRangeChange,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-md">
      {/* Header */}
      <div className="p-8 border-b border-black/10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40">Work Ledger // v1.0</h1>
          <button 
            onClick={onExport}
            className="p-1 text-black/20 hover:text-black transition-colors"
            title="Export Ledger"
          >
            <Download size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black/50 transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Search cards or logs..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/5 border border-black/10 rounded-sm text-xs italic outline-none focus:border-black/30 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
             <input 
              type="date"
              className="flex-1 text-[9px] bg-black/5 border border-black/10 rounded-sm px-2 py-1.5 outline-none font-bold uppercase tracking-tighter opacity-40 focus:opacity-100"
              value={dateRange?.start || ''}
              onChange={(e) => onDateRangeChange({ start: e.target.value, end: dateRange?.end || new Date().toISOString().split('T')[0] })}
            />
            <span className="text-[9px] opacity-20">—</span>
            <input 
              type="date"
              className="flex-1 text-[9px] bg-black/5 border border-black/10 rounded-sm px-2 py-1.5 outline-none font-bold uppercase tracking-tighter opacity-40 focus:opacity-100"
              value={dateRange?.end || ''}
              onChange={(e) => onDateRangeChange({ start: dateRange?.start || '2000-01-01', end: e.target.value })}
            />
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
                "w-full flex flex-col items-start text-left transition-all group border-b border-black/5 pb-4 last:border-none",
                selectedCardId === card.id 
                  ? "opacity-100" 
                  : "opacity-50 hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-[9px] uppercase tracking-widest text-black/40">
                  {card.jiraId}
                </span>
                <span className="text-[9px] uppercase tracking-tighter text-black/30">
                  {formatDate(card.updatedAt)}
                </span>
              </div>
              <h3 className={cn(
                "text-lg font-serif italic leading-tight group-hover:underline transition-all",
                selectedCardId === card.id ? "text-black" : "text-black/80"
              )}>
                {card.title}
              </h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {card.tags.slice(0, 3).map((tag, i) => (
                  <span 
                    key={i} 
                    className="text-[8px] font-bold uppercase tracking-widest text-black/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12 opacity-20 italic font-serif text-sm">
            No matching records found.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-black/10">
        <button 
          onClick={onAddCard}
          className="w-full border border-black py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all shadow-sm"
        >
          + Log New Work
        </button>
      </div>
    </div>
  );
}

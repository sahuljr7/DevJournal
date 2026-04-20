import { useState } from 'react';
import { 
  Trash2, 
  ExternalLink, 
  Tag, 
  Plus, 
  History,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react';
import { JiraCard, WorkLog } from '../types';
import { cn, formatDate } from '../lib/utils';
import RichEditor from './RichEditor';
import LogEntry from './LogEntry';

interface CardDetailsProps {
  card: JiraCard;
  logs: WorkLog[];
  onUpdateCard: (id: string, updates: Partial<JiraCard>) => void;
  onDeleteCard: (id: string) => void;
  onAddLog: (cardId: string, content: string, attachments: string[]) => void;
  onDeleteLog: (id: string) => void;
}

export default function CardDetails({
  card,
  logs,
  onUpdateCard,
  onDeleteCard,
  onAddLog,
  onDeleteLog,
}: CardDetailsProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newLogContent, setNewLogContent] = useState('');
  const [isAddingLog, setIsAddingLog] = useState(false);

  const handleUpdateTags = (tagsStr: string) => {
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    onUpdateCard(card.id, { tags });
  };

  const handleAddLog = () => {
    if (!newLogContent.trim()) return;
    onAddLog(card.id, newLogContent, []);
    setNewLogContent('');
    setIsAddingLog(false);
  };

  const statusIcons = {
    'todo': <Circle size={18} className="text-neutral-400" />,
    'in-progress': <Clock size={18} className="text-amber-500" />,
    'done': <CheckCircle2 size={18} className="text-emerald-500" />,
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="border-b-2 border-black/5 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Record No.</span>
              <span className="font-mono text-[10px] font-bold tracking-widest text-black/60">{card.jiraId}</span>
              <div className="w-[1px] h-3 bg-black/10 mx-2" />
              <button 
                onClick={() => {
                  const statusOrder: JiraCard['status'][] = ['todo', 'in-progress', 'done'];
                  const nextIdx = (statusOrder.indexOf(card.status) + 1) % statusOrder.length;
                  onUpdateCard(card.id, { status: statusOrder[nextIdx] });
                }}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity italic"
              >
                {statusIcons[card.status]}
                {card.status}
              </button>
            </div>
            <span className="text-[9px] text-black/30 font-bold uppercase tracking-tighter">Initiated // {formatDate(card.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onDeleteCard(card.id)}
              className="p-2 text-black/10 hover:text-red-500 hover:bg-neutral-50 transition-all rounded-sm"
              title="Purge Record"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="group relative">
          {isEditingTitle ? (
            <input 
              autoFocus
              className="text-5xl font-serif font-bold italic w-full bg-transparent border-none outline-none focus:ring-0 leading-tight"
              value={card.title}
              onChange={(e) => onUpdateCard(card.id, { title: e.target.value })}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            />
          ) : (
            <h2 
              onClick={() => setIsEditingTitle(true)}
              className="text-5xl font-serif font-bold italic mb-6 leading-tight cursor-text border-b border-transparent hover:border-black/10 transition-colors inline-block"
            >
              {card.title || 'Untitled Record'}
            </h2>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-8">
          <Tag size={12} className="text-black/30" />
          {card.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 border border-black/10 text-black/50 text-[9px] uppercase font-bold tracking-widest italic">
              {tag}
            </span>
          ))}
          <input 
            placeholder="add tags..."
            className="text-[9px] bg-transparent border-none outline-none focus:ring-0 text-black/30 w-32 lowercase font-bold tracking-tighter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUpdateTags((e.target as HTMLInputElement).value + ',' + card.tags.join(','));
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>
      </header>

      {/* Logs Section */}
      <section className="space-y-12 pb-32">
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-2 text-black/40">
            <History size={16} />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">Documentation Ledger</h3>
          </div>
          {!isAddingLog && (
            <button 
              onClick={() => setIsAddingLog(true)}
              className="px-4 py-2 border border-black/10 text-[9px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors"
            >
              + New Entry
            </button>
          )}
        </div>

        {isAddingLog && (
          <div className="bg-black/5 p-8 border border-black/10 rounded-sm">
            <h4 className="text-[9px] uppercase font-bold tracking-[0.2em] mb-6 opacity-30 italic">Drafting Entry...</h4>
            <RichEditor 
              value={newLogContent}
              onChange={setNewLogContent}
            />
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-black/5">
              <button 
                onClick={() => setIsAddingLog(false)}
                className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
              >
                Discard
              </button>
              <button 
                onClick={handleAddLog}
                className="px-8 py-3 bg-black text-white text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Log Entry
              </button>
            </div>
          </div>
        )}

        <div className="space-y-12">
          {logs.length > 0 ? (
            logs.map((log) => (
              <LogEntry 
                key={log.id} 
                log={log} 
                onDelete={() => onDeleteLog(log.id)}
              />
            ))
          ) : (
            !isAddingLog && (
              <div className="py-20 text-center border border-black/5 bg-black/5 rounded-sm opacity-30">
                <p className="text-sm italic font-serif">The ledger for this record is currently empty.</p>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

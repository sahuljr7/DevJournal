import { useState } from 'react';
import { 
  Trash2, 
  ExternalLink, 
  Tag, 
  Plus, 
  History,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';
import { JiraCard, WorkLog } from '../types';
import { cn, formatDate } from '../lib/utils';
import RichEditor from './RichEditor';
import LogEntry from './LogEntry';
import ReactMarkdown from 'react-markdown';
import { summarizeLogs } from '../services/aiService';

interface CardDetailsProps {
  card: JiraCard;
  logs: WorkLog[];
  allTags: string[];
  onUpdateCard: (id: string, updates: Partial<JiraCard>) => void;
  onDeleteCard: (id: string) => void;
  onAddLog: (cardId: string, content: string, attachments: string[]) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (id: string, content: string, attachments: string[]) => void;
}

export default function CardDetails({
  card,
  logs,
  allTags,
  onUpdateCard,
  onDeleteCard,
  onAddLog,
  onDeleteLog,
  onUpdateLog,
}: CardDetailsProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newLogContent, setNewLogContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleUpdateTags = (tagsStr: string) => {
    const tags = Array.from(new Set(tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)));
    onUpdateCard(card.id, { tags });
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = card.tags.filter(t => t !== tagToRemove);
    onUpdateCard(card.id, { tags: newTags });
  };

  const filteredSuggestions = allTags.filter(t => 
    t.toLowerCase().includes(tagInput.toLowerCase()) && 
    !card.tags.includes(t)
  ).slice(0, 5);

  const handleAddTag = (tag: string) => {
    if (!tag) return;
    const newTags = Array.from(new Set([...card.tags, tag.toLowerCase().trim()]));
    onUpdateCard(card.id, { tags: newTags });
    setTagInput('');
    setShowSuggestions(false);
  };

  const handleAddLog = () => {
    if (!newLogContent.trim() && attachments.length === 0) return;
    onAddLog(card.id, newLogContent, attachments);
    setNewLogContent('');
    setAttachments([]);
    setIsAddingLog(false);
  };

  const handleSummarize = async () => {
    if (logs.length === 0) return;
    
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const logContents = logs.map(l => l.content);
      const result = await summarizeLogs(logContents);
      setSummary(result);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };

  const statusIcons = {
    'todo': <Circle size={18} className="text-neutral-400" />,
    'in-progress': <Clock size={18} className="text-amber-500" />,
    'done': <CheckCircle2 size={18} className="text-emerald-500" />,
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="border-b-2 border-[var(--border-color)] pb-12 transition-colors">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-color)] transition-colors">Record No.</span>
              <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--muted-color)] transition-colors">{card.jiraId}</span>
              <div className="w-[1px] h-3 bg-[var(--border-color)] mx-2 transition-colors" />
              <button 
                onClick={() => {
                  const statusOrder: JiraCard['status'][] = ['todo', 'in-progress', 'done'];
                  const nextIdx = (statusOrder.indexOf(card.status) + 1) % statusOrder.length;
                  onUpdateCard(card.id, { status: statusOrder[nextIdx] });
                }}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity italic text-[var(--ink-color)]"
              >
                {statusIcons[card.status]}
                {card.status}
              </button>
            </div>
            <span className="text-[9px] text-[var(--muted-color)] font-bold uppercase tracking-tighter transition-colors">Initiated // {formatDate(card.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onDeleteCard(card.id)}
              className="p-2 text-[var(--border-color)] hover:text-red-500 hover:bg-red-500/10 transition-all rounded-sm"
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
              className="text-5xl font-serif font-bold italic w-full bg-transparent border-none outline-none focus:ring-0 leading-tight text-[var(--ink-color)]"
              value={card.title}
              onChange={(e) => onUpdateCard(card.id, { title: e.target.value })}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            />
          ) : (
            <h2 
              onClick={() => setIsEditingTitle(true)}
              className="text-5xl font-serif font-bold italic mb-6 leading-tight cursor-text border-b border-transparent hover:border-[var(--muted-color)] transition-colors inline-block text-[var(--ink-color)]"
            >
              {card.title || 'Untitled Record'}
            </h2>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-8">
          <Tag size={12} className="text-[var(--muted-color)]" />
          {card.tags.map((tag, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-0.5 border border-[var(--border-color)] text-[var(--muted-color)] text-[9px] uppercase font-bold tracking-widest italic transition-colors group/tag">
              {tag}
              <button 
                onClick={() => removeTag(tag)}
                className="opacity-0 group-hover/tag:opacity-100 hover:text-red-500 transition-all p-0.5"
              >
                <X size={8} />
              </button>
            </span>
          ))}
          <div className="relative">
            <input 
              placeholder="add tags..."
              className="text-[9px] bg-transparent border-none outline-none focus:ring-0 text-[var(--muted-color)] w-32 lowercase font-bold tracking-tighter"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag(tagInput);
                }
                if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
            />
            {showSuggestions && tagInput && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 bottom-full mb-1 w-40 bg-[var(--bg-color)] border border-[var(--border-color)] shadow-xl z-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="w-full text-left px-3 py-2 text-[8px] uppercase font-bold tracking-widest text-[var(--muted-color)] hover:bg-[var(--secondary-bg)] hover:text-[var(--ink-color)] border-b last:border-0 border-[var(--border-color)] transition-colors"
                    onClick={() => handleAddTag(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logs Section */}
      <section className="space-y-12 pb-32">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 transition-colors">
          <div className="flex items-center gap-2 text-[var(--muted-color)] transition-colors">
            <History size={16} />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">Documentation Ledger</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* AI Summary Button */}
            {logs.length > 0 && (
              <button 
                onClick={handleSummarize}
                disabled={isSummarizing}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 border border-[var(--border-color)] transition-all rounded-sm text-[9px] font-bold uppercase tracking-widest text-[var(--muted-color)] hover:border-[var(--ink-color)] hover:text-[var(--ink-color)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                  summary && "border-amber-500/50 text-amber-600 dark:text-amber-400"
                )}
                title="Generate AI Summary"
              >
                {isSummarizing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                {isSummarizing ? 'Processing...' : summary ? 'Update Summary' : 'Summarize'}
              </button>
            )}

            {/* Mode Toggle */}
            <button 
              onClick={() => setIsReaderMode(!isReaderMode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 border transition-all rounded-sm text-[9px] font-bold uppercase tracking-widest",
                isReaderMode 
                  ? "bg-[var(--ink-color)] text-[var(--bg-color)] border-[var(--ink-color)]" 
                  : "bg-transparent text-[var(--muted-color)] border-[var(--border-color)] hover:border-[var(--muted-color)]"
              )}
              title={isReaderMode ? "Switch to Editor" : "Switch to Preview"}
            >
              {isReaderMode ? <Eye size={12} /> : <EyeOff size={12} />}
              {isReaderMode ? 'Reader Active' : 'Preview Mode'}
            </button>

            {!isAddingLog && !isReaderMode && (
              <>
                <div className="w-[1px] h-3 bg-[var(--border-color)] mx-1" />
                <button 
                  onClick={() => setIsAddingLog(true)}
                  className="px-4 py-2 border border-[var(--border-color)] text-[var(--ink-color)] text-[9px] font-bold uppercase tracking-widest hover:bg-[var(--secondary-bg)] transition-colors"
                >
                  + New Entry
                </button>
              </>
            )}
          </div>
        </div>

        {isAddingLog && (
          <div className={cn(
            "p-8 border border-[var(--border-color)] rounded-sm transition-colors",
            isReaderMode ? "bg-transparent" : "bg-[var(--secondary-bg)]"
          )}>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--muted-color)] italic transition-colors">
                {isReaderMode ? 'Previewing Snapshot...' : 'Drafting Entry...'}
              </h4>
            </div>

            {isReaderMode ? (
              <div className="prose prose-neutral max-w-none text-lg leading-relaxed text-[var(--ink-color)] font-serif italic opacity-80 py-4 transition-colors">
                {newLogContent ? (
                  <ReactMarkdown>{newLogContent}</ReactMarkdown>
                ) : (
                  <p className="opacity-40">Entry is currently empty...</p>
                )}
              </div>
            ) : (
              <RichEditor 
                value={newLogContent}
                onChange={setNewLogContent}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            )}
            
            <div className={cn(
              "flex justify-end gap-3 mt-8 pt-6 border-t border-[var(--border-color)] transition-colors",
              isReaderMode && "hidden"
            )}>
              <button 
                onClick={() => setIsAddingLog(false)}
                className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--muted-color)] hover:text-[var(--ink-color)] transition-opacity"
              >
                Discard
              </button>
              <button 
                onClick={handleAddLog}
                className="px-8 py-3 bg-[var(--ink-color)] text-[var(--bg-color)] text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
              >
                Log Entry
              </button>
            </div>
          </div>
        )}

        {/* AI Summary Display */}
        {(summary || summaryError) && (
          <div className="p-8 border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 rounded-r-sm transition-all animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">
                Executive Synthesis
              </h4>
            </div>
            
            {summaryError ? (
              <p className="text-xs text-red-500 font-mono">{summaryError}</p>
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none font-serif italic text-[var(--ink-color)] opacity-90 leading-relaxed text-sm">
                <ReactMarkdown>{summary || ''}</ReactMarkdown>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-amber-500/10 flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase tracking-tighter text-amber-600/50">
                Generated via Ollama Llama3 // {new Date().toLocaleTimeString()}
              </span>
              <button 
                onClick={() => setSummary(null)}
                className="text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 hover:opacity-70 transition-opacity"
              >
                Dismiss
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
                onUpdate={(content, at) => onUpdateLog(log.id, content, at)}
              />
            ))
          ) : (
            !isAddingLog && (
              <div className="py-20 text-center border border-[var(--border-color)] bg-[var(--secondary-bg)] rounded-sm text-[var(--muted-color)] italic font-serif text-sm transition-colors">
                The ledger for this record is currently empty.
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

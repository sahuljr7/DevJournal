import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
  X,
  ListTodo,
  CheckSquare,
  FileDown,
  FileArchive,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { JiraCard, WorkLog, Attachment } from '../types';
import { cn, formatDate } from '../lib/utils';
import RichEditor from './RichEditor';
import LogEntry from './LogEntry';
import ReactMarkdown from 'react-markdown';
import { summarizeLogs } from '../services/aiService';
import { ZoomableImage } from './ImageOverlay';

interface CardDetailsProps {
  card: JiraCard;
  logs: WorkLog[];
  allTags: string[];
  onUpdateCard: (id: string, updates: Partial<JiraCard>) => void;
  onDeleteCard: (id: string) => void;
  onAddLog: (cardId: string, content: string, attachments: (string | Attachment)[], linkedStatus?: JiraCard['status']) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (id: string, content: string, attachments: (string | Attachment)[]) => void;
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
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newLogContent, setNewLogContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [attachments, setAttachments] = useState<(string | Attachment)[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<JiraCard['status'] | 'none'>('none');
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

  const addTask = () => {
    if (!taskInput.trim()) return;
    const newTask = {
      id: uuidv4(),
      text: taskInput.trim(),
      completed: false
    };
    onUpdateCard(card.id, { tasks: [...(card.tasks || []), newTask] });
    setTaskInput('');
  };

  const toggleTask = (taskId: string) => {
    const newTasks = (card.tasks || []).map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateCard(card.id, { tasks: newTasks });
  };

  const removeTask = (taskId: string) => {
    const newTasks = (card.tasks || []).filter(t => t.id !== taskId);
    onUpdateCard(card.id, { tasks: newTasks });
  };

  const completedCount = (card.tasks || []).filter(t => t.completed).length;
  const totalCount = (card.tasks || []).length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleAddLog = () => {
    if (!newLogContent.trim() && attachments.length === 0) return;
    onAddLog(card.id, newLogContent, attachments, selectedStatus === 'none' ? undefined : selectedStatus);
    setNewLogContent('');
    setAttachments([]);
    setSelectedStatus('none');
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

  const downloadFullTaskPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${card.jiraId}: ${card.title}`, 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${card.status.toUpperCase()}`, 20, yPos);
    yPos += 15;

    // Splitter
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos - 5, 190, yPos - 5);

    // Description
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitDesc = doc.splitTextToSize(card.description || 'No description provided.', 170);
    doc.text(splitDesc, 20, yPos);
    yPos += (splitDesc.length * 5) + 12;

    // Tasks
    if (card.tasks && card.tasks.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Action Items:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      card.tasks.forEach(t => {
        if (yPos > 280) { doc.addPage(); yPos = 20; }
        const symbol = t.completed ? '[x]' : '[ ]';
        doc.text(`${symbol} ${t.text}`, 25, yPos);
        yPos += 6;
      });
      yPos += 12;
    }

    // Logs Section
    doc.addPage();
    yPos = 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Work Ledger (Log Entries)', 20, yPos);
    yPos += 10;
    doc.line(20, yPos - 5, 190, yPos - 5);

    logs.forEach((log, index) => {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      
      const logNum = logs.length - index;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(`ENTRY #${logNum} // ${formatDate(log.timestamp)}`, 20, yPos);
      yPos += 8;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitLog = doc.splitTextToSize(log.content, 170);
      doc.text(splitLog, 20, yPos);
      yPos += (splitLog.length * 5) + 10;

      if (log.attachments && log.attachments.length > 0) {
         doc.setFontSize(8);
         doc.setFont('helvetica', 'italic');
         doc.text(`Note: ${log.attachments.length} source file(s) consigned to this entry.`, 25, yPos);
         yPos += 8;
      }
      
      yPos += 5; // Spacing between entries
    });

    // Footer info on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`DevJournal Export // ${card.jiraId} // Page ${i} of ${pageCount}`, 20, 285);
    }

    doc.save(`TaskReport-${card.jiraId}.pdf`);
  };

  const downloadAllTextLogs = async () => {
    if (logs.length === 0) return;
    const zip = new JSZip();
    
    logs.forEach((log, index) => {
      const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
      const itemsCount = logs.length - index;
      const filename = `entry-${itemsCount}-${dateStr}.md`;
      
      const content = `# Log Entry #${itemsCount}\nDate: ${formatDate(log.timestamp)}\nStatus: ${log.linkedStatus || 'None'}\n\n${log.content}\n\n---\nExported from DevJournal`;
      zip.file(filename, content);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `all-logs-text-${card.jiraId}.zip`);
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
              onClick={downloadFullTaskPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border-color)] text-[var(--muted-color)] text-[9px] font-bold uppercase tracking-widest hover:text-[var(--ink-color)] hover:border-[var(--ink-color)] transition-all rounded-sm"
              title="Download Full Task Report (PDF)"
            >
              <FileDown size={14} />
              Export PDF
            </button>
            <div className="w-[1px] h-4 bg-[var(--border-color)] mx-1" />
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

        <div className="group relative mt-2">
          {isEditingDescription ? (
            <textarea 
              autoFocus
              className="text-lg font-serif italic text-[var(--muted-color)] w-full bg-transparent border-none outline-none focus:ring-0 leading-relaxed resize-none h-auto min-h-[60px]"
              value={card.description}
              placeholder="consign record briefing..."
              onChange={(e) => onUpdateCard(card.id, { description: e.target.value })}
              onBlur={() => setIsEditingDescription(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  setIsEditingDescription(false);
                }
              }}
            />
          ) : (
            <p 
              onClick={() => setIsEditingDescription(true)}
              className={cn(
                "text-lg font-serif italic leading-relaxed cursor-text border-b border-transparent hover:border-[var(--muted-color)] transition-colors inline-block",
                card.description ? "text-[var(--muted-color)]" : "text-[var(--muted-color)] opacity-30"
              )}
            >
              {card.description || 'add technical briefing...'}
            </p>
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

        {/* Sub-tasks Section */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <ListTodo size={14} className="text-[var(--muted-color)]" />
              <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--muted-color)]">Sub-tasks Checklist</h3>
            </div>
            {totalCount > 0 && (
              <span className="text-[10px] font-mono font-bold text-[var(--ink-color)]">
                {completedCount}/{totalCount} COMPLETED // {Math.round(progress)}%
              </span>
            )}
          </div>

          {totalCount > 0 && (
            <div className="h-1 w-full bg-[var(--border-color)] overflow-hidden rounded-full">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[var(--ink-color)]"
              />
            </div>
          )}

          <div className="space-y-3">
            {(card.tasks || []).map((task) => (
              <div key={task.id} className="flex items-center group/task">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "p-1 mr-3 transition-colors",
                    task.completed ? "text-emerald-500" : "text-[var(--border-color)] hover:text-[var(--muted-color)]"
                  )}
                >
                  {task.completed ? <CheckSquare size={16} /> : <Circle size={16} />}
                </button>
                <span className={cn(
                  "text-sm transition-all flex-1",
                  task.completed ? "text-[var(--muted-color)] line-through opacity-50 font-serif italic" : "text-[var(--ink-color)]"
                )}>
                  {task.text}
                </span>
                <button 
                  onClick={() => removeTask(task.id)}
                  className="opacity-0 group-hover/task:opacity-100 p-1 text-[var(--muted-color)] hover:text-red-500 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <input 
              type="text"
              placeholder="assign mandatory sub-task..."
              className="flex-1 bg-transparent border-b border-[var(--border-color)] py-2 text-xs text-[var(--ink-color)] placeholder:italic placeholder:opacity-50 focus:border-[var(--ink-color)] outline-none transition-colors"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <button 
              onClick={addTask}
              disabled={!taskInput.trim()}
              className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest bg-[var(--ink-color)] text-[var(--bg-color)] hover:opacity-90 disabled:opacity-30 transition-all border border-[var(--ink-color)]"
            >
              Assign
            </button>
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
              <div className="flex items-center">
                {logs.length > 0 && (
                  <>
                    <button 
                      onClick={downloadAllTextLogs}
                      className="px-3 py-1.5 border border-[var(--border-color)] text-[var(--muted-color)] text-[8px] font-bold uppercase tracking-widest hover:text-[var(--ink-color)] transition-all flex items-center gap-1.5"
                      title="Archive All Text Entries (.zip)"
                    >
                      <FileArchive size={10} />
                      Log Archive
                    </button>
                    <div className="w-[1px] h-3 bg-[var(--border-color)] mx-2" />
                  </>
                )}
                <button 
                  onClick={() => setIsAddingLog(true)}
                  className="px-4 py-2 border border-[var(--border-color)] text-[var(--ink-color)] text-[9px] font-bold uppercase tracking-widest hover:bg-[var(--secondary-bg)] transition-colors"
                >
                  + New Entry
                </button>
              </div>
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

              {!isReaderMode && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold text-[var(--muted-color)] transition-colors">Link Status:</span>
                  <div className="flex bg-[var(--bg-color)] border border-[var(--border-color)] p-0.5 rounded-sm transition-colors">
                    {(['none', 'todo', 'in-progress', 'done'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={cn(
                          "px-2 py-1 text-[8px] uppercase font-bold tracking-widest transition-all",
                          selectedStatus === s 
                            ? "bg-[var(--ink-color)] text-[var(--bg-color)]" 
                            : "text-[var(--muted-color)] hover:text-[var(--ink-color)]"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isReaderMode ? (
              <div className="prose prose-neutral max-w-none text-lg leading-relaxed text-[var(--ink-color)] font-serif italic opacity-80 py-4 transition-colors">
                {newLogContent ? (
                  <ReactMarkdown components={{ img: ZoomableImage }}>{newLogContent}</ReactMarkdown>
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

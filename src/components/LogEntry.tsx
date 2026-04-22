import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Trash2, 
  Clock, 
  Paperclip, 
  Edit3, 
  X, 
  Check,
  FileText,
  MessageSquare,
  Maximize2,
  Eye,
  History as HistoryIcon,
  ExternalLink,
  Circle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { WorkLog, Attachment, AttachmentVersion } from '../types';
import { cn, formatDate } from '../lib/utils';
import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';
import RichEditor from './RichEditor';
import ImageOverlay, { ZoomableImage } from './ImageOverlay';

interface LogEntryProps {
  log: WorkLog;
  onDelete: () => void;
  onUpdate: (content: string, attachments: (string | Attachment)[]) => void;
}

export default function LogEntry({ log, onDelete, onUpdate }: LogEntryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(log.content);
  const [editAttachments, setEditAttachments] = useState<(string | Attachment)[]>(log.attachments);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleHistory = (id: string) => {
    setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const normalizeAttachment = (at: string | Attachment, index: number): Attachment => {
    if (typeof at === 'string') {
      return {
        id: `legacy-${index}`,
        url: at,
        name: `legacy_source_${index + 1}`,
        type: at.startsWith('data:image/') ? 'image/unknown' : 'application/octet-stream',
      };
    }
    return at;
  };

  const handleVersionSwitch = (atIndex: number, version: AttachmentVersion) => {
    const at = log.attachments[atIndex];
    if (typeof at === 'string') return;

    const currentAt: Attachment = at;
    const oldVersion: AttachmentVersion = {
      url: currentAt.url,
      name: currentAt.name,
      timestamp: new Date().toISOString()
    };

    const newVersions = currentAt.versions?.filter(v => v.url !== version.url) || [];
    newVersions.push(oldVersion);

    const updatedAt: Attachment = {
      ...currentAt,
      url: version.url,
      name: version.name,
      versions: newVersions
    };

    const newAttachments = [...log.attachments];
    newAttachments[atIndex] = updatedAt;
    onUpdate(log.content, newAttachments);
    
    toast.success('Source data restored', {
      description: `Version from ${new Date(version.timestamp).toLocaleString()} is now active.`,
      icon: <HistoryIcon size={16} className="text-emerald-500" />
    });
  };

  const handleSave = () => {
    onUpdate(editContent, editAttachments);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(log.content);
    setEditAttachments(log.attachments);
    setIsEditing(false);
  };

  const handleDownloadAll = async () => {
    if (log.attachments.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      const downloadPromises = log.attachments.map(async (at, index) => {
        const norm = normalizeAttachment(at, index);
        try {
          if (norm.url.startsWith('data:')) {
            const parts = norm.url.split(',');
            const base64 = parts[1];
            zip.file(norm.name, base64, { base64: true });
          } else {
            const response = await fetch(norm.url);
            const blob = await response.blob();
            zip.file(norm.name, blob);
          }
        } catch (err) {
          console.error(`Failed to include ${norm.name} in archive:`, err);
        }
      });

      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `ledger-sources-${log.id.slice(0, 8)}.zip`);
    } catch (err) {
      console.error('Batch download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const statusIcons = {
    'todo': <Circle size={10} className="text-neutral-400" />,
    'in-progress': <Clock size={10} className="text-amber-500" />,
    'done': <CheckCircle2 size={10} className="text-emerald-500" />,
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group relative"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted-color)] transition-colors">
          <Clock size={10} strokeWidth={3} />
          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {formatDate(log.timestamp)}
          {log.linkedStatus && (
            <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-[var(--border-color)]">
              {statusIcons[log.linkedStatus]}
              <span className="italic text-[8px] tracking-widest">{log.linkedStatus}</span>
            </div>
          )}
          {isEditing && (
            <span className="ml-2 text-amber-500 italic lowercase tracking-tight font-serif text-[10px]">Editing Mode Active</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1 text-[var(--muted-color)] hover:text-[var(--ink-color)] transition-all"
                title="Edit Entry"
              >
                <Edit3 size={12} />
              </button>
              <button 
                onClick={onDelete}
                className="p-1 text-[var(--muted-color)] hover:text-red-500 transition-all"
                title="Delete Entry"
              >
                <Trash2 size={12} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleSave}
                className="p-1 text-emerald-500 hover:text-emerald-600 transition-all"
                title="Confirm Changes"
              >
                <Check size={14} />
              </button>
              <button 
                onClick={handleCancel}
                className="p-1 text-red-500 hover:text-red-600 transition-all"
                title="Cancel Changes"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="bg-[var(--secondary-bg)] p-4 border border-[var(--border-color)] rounded-sm transition-colors">
          <RichEditor 
            value={editContent}
            onChange={setEditContent}
            attachments={editAttachments}
            onAttachmentsChange={setEditAttachments}
          />
        </div>
      ) : (
        <div className="prose prose-neutral max-w-none text-lg leading-relaxed text-[var(--ink-color)] transition-colors markdown-body">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{ 
              img: (props) => <ZoomableImage {...props} className="max-w-full h-auto rounded-sm border border-[var(--border-color)] my-8" />
            }}
          >
            {log.content}
          </ReactMarkdown>
        </div>
      )}

      {log.attachments.filter(Boolean).length > 0 && !isEditing && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-color)] transition-colors">
          <div className="col-span-full mb-2 flex items-center justify-between">
            <h5 className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--muted-color)] italic transition-colors">
              Consigned Sources // {log.attachments.length}
            </h5>
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="group/dl flex items-center gap-1.5 text-[8px] uppercase font-bold tracking-widest text-[var(--muted-color)] hover:text-[var(--ink-color)] transition-all disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Download size={10} className="group-hover/dl:translate-y-0.5 transition-transform" />
              )}
              {isDownloading ? 'Bundling...' : 'Download All (.zip)'}
            </button>
          </div>
          {log.attachments.filter(Boolean).map((at, i) => {
            const norm = normalizeAttachment(at, i);
            const isImage = norm.type.startsWith('image/');
            const isPdf = norm.type === 'application/pdf';
            const isPreviewing = previewId === norm.id;

            return (
              <div key={norm.id} className="group/at relative border border-[var(--border-color)] bg-[var(--bg-color)] p-4 shadow-sm transition-all hover:border-[var(--muted-color)] flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="shrink-0 relative h-20 w-20 border border-[var(--border-color)] bg-[var(--secondary-bg)] flex items-center justify-center overflow-hidden">
                    {isImage ? (
                      <ZoomableImage 
                        src={norm.url || undefined} 
                        alt={norm.name} 
                        className="h-full w-full object-cover grayscale opacity-80 group-hover/at:grayscale-0 group-hover/at:opacity-100 transition-all" 
                      />
                    ) : isPdf ? (
                      <div className="flex flex-col items-center gap-1">
                        <FileText size={24} className="text-red-500 opacity-60" />
                        <span className="text-[7px] font-mono font-bold uppercase tracking-tighter opacity-40">PDF</span>
                      </div>
                    ) : (
                      <Paperclip size={20} className="text-[var(--muted-color)] opacity-40" />
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/at:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      {(isImage || isPdf) && (
                        <button 
                          onClick={() => setPreviewId(isPreviewing ? null : norm.id)}
                          className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white"
                          title="Toggle In-line Preview"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <a 
                        href={norm.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white"
                        title="View Full Document"
                      >
                        <Maximize2 size={14} className="text-white" />
                      </a>
                      <a 
                        href={norm.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white"
                        title="View Source (New Tab)"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <button 
                        onClick={() => setPreviewId(isPreviewing ? null : norm.id)}
                        className="text-[10px] font-bold uppercase tracking-tight truncate text-[var(--ink-color)] hover:underline block text-left flex-1"
                      >
                        {norm.name}
                      </button>
                      {isPdf && (
                        <button
                          onClick={() => setPreviewId(isPreviewing ? null : norm.id)}
                          className={cn(
                            "shrink-0 text-[7px] uppercase font-bold tracking-widest px-1.5 py-0.5 border transition-all",
                            isPreviewing 
                              ? "bg-[var(--ink-color)] text-[var(--bg-color)] border-[var(--ink-color)]" 
                              : "bg-transparent text-[var(--muted-color)] border-[var(--border-color)] hover:border-[var(--ink-color)]"
                          )}
                        >
                          {isPreviewing ? 'Hide' : 'PDF Preview'}
                        </button>
                      )}
                      <a 
                        href={norm.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 text-[7px] uppercase font-bold tracking-widest px-1.5 py-0.5 border border-[var(--border-color)] text-[var(--muted-color)] hover:border-[var(--ink-color)] hover:text-[var(--ink-color)] transition-all"
                      >
                        <ExternalLink size={8} />
                        View Source
                      </a>
                    </div>
                    <p className="text-[8px] uppercase tracking-widest text-[var(--muted-color)] font-mono mb-1">
                       {norm.type.split('/')[1] || 'binary'} // {Math.round(norm.url.length / 1024)}KB
                    </p>

                    {norm.versions && norm.versions.length > 0 && (
                      <div className="mt-2">
                        <button 
                          onClick={() => toggleHistory(norm.id)}
                          className="flex items-center gap-1.5 text-[7px] uppercase font-bold text-[var(--muted-color)] hover:text-[var(--ink-color)] transition-colors opacity-70"
                        >
                          <HistoryIcon size={8} /> 
                          {expandedHistory[norm.id] ? 'Hide History' : `View History (${norm.versions.length})`}
                          {expandedHistory[norm.id] ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                        </button>

                        {expandedHistory[norm.id] && (
                          <div className="mt-2 space-y-1 pl-2 border-l border-[var(--border-color)]">
                            {norm.versions.map((v, vi) => (
                              <button 
                                key={vi}
                                onClick={() => handleVersionSwitch(i, v)}
                                className="group/v w-full flex items-center justify-between py-1 px-1.5 text-[7px] bg-[var(--secondary-bg)] border border-[var(--border-color)] hover:border-[var(--muted-color)] transition-all"
                                title={`Restore version from ${new Date(v.timestamp).toLocaleString()}`}
                              >
                                <div className="flex flex-col items-start min-w-0">
                                  <span className="font-bold truncate max-w-[100px]">{v.name}</span>
                                  <span className="opacity-50 font-mono italic">{formatDate(v.timestamp)}</span>
                                </div>
                                <span className="opacity-0 group-hover/v:opacity-100 text-[6px] uppercase font-bold tracking-tighter text-amber-600 transition-opacity">Restore</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {norm.annotation && (
                      <div className="relative mt-2 pl-4 border-l-2 border-[var(--border-color)] italic text-[11px] leading-relaxed text-[var(--muted-color)] font-serif">
                        <MessageSquare size={8} className="absolute left-[-14px] top-1 text-[var(--border-color)]" />
                        {norm.annotation}
                      </div>
                    )}
                  </div>
                </div>

                {isPreviewing && (
                  <div className={cn(
                    "relative w-full border border-[var(--border-color)] bg-black/5 flex items-center justify-center overflow-hidden group/preview",
                    isPdf ? "h-[600px]" : "aspect-video"
                  )}>
                    {isPdf ? (
                      <iframe src={`${norm.url}#view=FitH`} className="w-full h-full border-none" title={norm.name} />
                    ) : isImage ? (
                      <ZoomableImage 
                        src={norm.url || undefined} 
                        alt="preview" 
                        className="max-w-full max-h-full object-contain shadow-2xl transition-transform hover:scale-110" 
                      />
                    ) : (
                      <div className="text-[var(--muted-color)] italic text-xs">Preview not available for this type</div>
                    )}
                    <button 
                      onClick={() => setPreviewId(null)}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white opacity-0 group-hover/preview:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Editorial divider */}
      <div className="mt-12 h-[1px] w-12 bg-[var(--border-color)] transition-colors" />
    </motion.div>
  );
}

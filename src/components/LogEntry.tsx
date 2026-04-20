import ReactMarkdown from 'react-markdown';
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
  History as HistoryIcon
} from 'lucide-react';
import { WorkLog, Attachment, AttachmentVersion } from '../types';
import { formatDate } from '../lib/utils';
import { motion } from 'motion/react';
import { useState } from 'react';
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
        <div className="prose prose-neutral max-w-none text-lg leading-relaxed text-[var(--ink-color)] transition-colors">
          <ReactMarkdown components={{ img: ZoomableImage }}>{log.content}</ReactMarkdown>
        </div>
      )}

      {log.attachments.filter(Boolean).length > 0 && !isEditing && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-color)] transition-colors">
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
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-tight truncate text-[var(--ink-color)]">
                      {norm.name}
                    </p>
                    <p className="text-[8px] uppercase tracking-widest text-[var(--muted-color)] font-mono mb-1">
                       {norm.type.split('/')[1] || 'binary'} // {Math.round(norm.url.length / 1024)}KB
                    </p>

                    {norm.versions && norm.versions.length > 0 && (
                      <div className="mb-2">
                         <p className="text-[6px] uppercase font-bold text-[var(--muted-color)] flex items-center gap-1 mb-1 italic opacity-60">
                          <HistoryIcon size={7} /> History Available
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {norm.versions.map((v, vi) => (
                            <button 
                              key={vi}
                              onClick={() => handleVersionSwitch(i, v)}
                              className="text-[7px] bg-[var(--secondary-bg)] border border-[var(--border-color)] px-1 py-0.5 hover:border-[var(--ink-color)] transition-colors opacity-50 hover:opacity-100"
                              title={`Switch to: ${v.name}`}
                            >
                              v{vi + 1}
                            </button>
                          ))}
                        </div>
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
                  <div className="relative w-full aspect-video border border-[var(--border-color)] bg-black/5 flex items-center justify-center overflow-hidden group/preview">
                    {isPdf ? (
                      <iframe src={norm.url} className="w-full h-full border-none" title={norm.name} />
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

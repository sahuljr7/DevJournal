import React, { useCallback } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import ReactMarkdown from 'react-markdown';
import 'react-markdown-editor-lite/lib/index.css';
import { useDropzone } from 'react-dropzone';
import { 
  Image as ImageIcon, 
  ClipboardPaste, 
  X, 
  Paperclip, 
  FileText, 
  MessageSquare,
  Maximize2,
  History as HistoryIcon,
  RotateCcw,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import ImageOverlay, { ZoomableImage } from './ImageOverlay';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  attachments?: (string | Attachment)[];
  onAttachmentsChange?: React.Dispatch<React.SetStateAction<(string | Attachment)[]>>;
}

export default function RichEditor({ 
  value, 
  onChange, 
  attachments = [], 
  onAttachmentsChange 
}: RichEditorProps) {
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = React.useState<Record<string, boolean>>({});

  const toggleHistory = (id: string) => {
    setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const normalizeAttachment = (at: string | Attachment): Attachment => {
    if (typeof at === 'string') {
      return {
        id: uuidv4(),
        url: at,
        name: 'Legacy Attachment',
        type: at.startsWith('data:image/') ? 'image/unknown' : 'application/octet-stream',
      };
    }
    return at;
  };

  const onFileUpload = useCallback(async (file: File): Promise<Attachment> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          id: uuidv4(),
          url: e.target?.result as string,
          name: file.name,
          type: file.type,
          annotation: ''
        });
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleEditorChange = ({ text }: { text: string }) => {
    onChange(text);
  };

  const handleFile = useCallback(async (file: File) => {
    const attachment = await onFileUpload(file);
    
    // Add to attachments if callback provided
    if (onAttachmentsChange) {
      onAttachmentsChange(prev => [...prev, attachment]);
    }

    // Also insert into markdown if it's an image
    if (file.type.startsWith('image/')) {
      const imageMarkdown = `\n![${file.name}](${attachment.url})\n`;
      onChange(value + imageMarkdown);
    }
  }, [value, onChange, onFileUpload, onAttachmentsChange]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await handleFile(file);
    }
  }, [handleFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop,
    noClick: true,
    accept: { 
      'image/*': [], 
      'application/pdf': [], 
      'text/plain': [],
      'text/markdown': [],
      'application/json': [],
      'application/zip': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': []
    }
  });

  const removeAttachment = (id: string) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(prev => prev.filter(at => {
        const norm = normalizeAttachment(at);
        return norm.id !== id;
      }));
    }
  };

  const updateAnnotation = (id: string, annotation: string) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(prev => prev.map(at => {
        const norm = normalizeAttachment(at);
        if (norm.id === id) {
          return { ...norm, annotation };
        }
        return at;
      }));
    }
  };

  const updateSourceFile = async (id: string, file: File) => {
    const newAt = await onFileUpload(file);
    if (onAttachmentsChange) {
      onAttachmentsChange(prev => prev.map(at => {
        const norm = normalizeAttachment(at);
        if (norm.id === id) {
          const versions = norm.versions || [];
          return {
            ...norm,
            url: newAt.url,
            name: newAt.name,
            type: newAt.type,
            versions: [
              ...versions,
              { url: norm.url, timestamp: new Date().toISOString(), name: norm.name }
            ]
          };
        }
        return at;
      }));
    }
  };

  const restoreVersion = (id: string, versionIndex: number) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(prev => prev.map(at => {
        const norm = normalizeAttachment(at);
        if (norm.id === id && norm.versions?.[versionIndex]) {
          const version = norm.versions[versionIndex];
          const newVersions = [...norm.versions];
          newVersions.splice(versionIndex, 1);
          newVersions.push({ url: norm.url, timestamp: new Date().toISOString(), name: norm.name });
          
          return {
            ...norm,
            url: version.url,
            name: version.name,
            versions: newVersions
          };
        }
        return at;
      }));
    }
  };

  // Handle paste from clipboard
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/') || item.type === 'application/pdf') {
        const file = item.getAsFile();
        if (file) {
          await handleFile(file);
        }
      }
    }
  }, [handleFile]);

  return (
    <div 
      {...getRootProps()} 
      className={cn(
        "space-y-4 relative transition-all",
        isDragActive && "ring-2 ring-[var(--ink-color)] ring-inset"
      )}
    >
      <input {...getInputProps()} />
      
      <div 
        onPaste={handlePaste}
        className={cn(
          "relative rounded-sm overflow-hidden border transition-all border-[var(--border-color)]"
        )}
      >
        <MdEditor
          value={value}
          style={{ height: '400px', border: 'none', backgroundColor: 'var(--bg-color)', color: 'var(--ink-color)' }}
          renderHTML={(text) => <ReactMarkdown components={{ img: ZoomableImage }}>{text}</ReactMarkdown>}
          onChange={handleEditorChange}
          onImageUpload={async (file) => {
            const at = await onFileUpload(file);
            if (onAttachmentsChange) onAttachmentsChange(prev => [...prev, at]);
            return at.url;
          }}
          config={{
            view: { menu: true, md: true, html: false },
            canView: { menu: true, md: true, html: true, fullScreen: true, hideMenu: false },
          }}
        />
        
        <div className="absolute bottom-4 left-4 pointer-events-none opacity-40">
           <p className="text-[7px] uppercase font-bold tracking-[0.2em] text-[var(--muted-color)]">
             Drag & Drop or Paste to Log Sources
           </p>
        </div>
        
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button 
            type="button"
            onClick={open}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ink-color)] text-[var(--bg-color)] rounded-none text-[8px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity pointer-events-auto shadow-md"
          >
            <Paperclip size={10} />
            Attach Source
          </button>
        </div>
      </div>

      {isDragActive && (
        <div className="absolute inset-0 bg-[var(--bg-color)] opacity-95 backdrop-blur-md z-[100] flex flex-col items-center justify-center border-2 border-dashed border-[var(--ink-color)] animate-in fade-in zoom-in duration-200">
          <ImageIcon size={48} className="mb-6 opacity-20 animate-bounce" />
          <h4 className="text-2xl font-serif italic text-[var(--ink-color)] mb-2">Ingesting files to ledger...</h4>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-[var(--muted-color)]">Release to consign sources</p>
        </div>
      )}

      {attachments.filter(Boolean).length > 0 && (
        <div className="p-4 border border-[var(--border-color)] bg-[var(--bg-color)] rounded-sm transition-colors">
          <h5 className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--muted-color)] mb-6 italic border-b border-[var(--border-color)] pb-2">
            Consigned Sources // {attachments.length}
          </h5>
          <div className="grid grid-cols-1 gap-6">
            {attachments.filter(Boolean).map((at, i) => {
              const norm = normalizeAttachment(at);
              const isImage = norm.type.startsWith('image/');
              const isPdf = norm.type === 'application/pdf';
              const isPreviewing = previewId === norm.id;

              return (
                <div key={norm.id} className="group relative border border-[var(--border-color)] bg-[var(--secondary-bg)] p-4 shadow-sm transition-all hover:border-[var(--muted-color)] flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="shrink-0 relative h-20 w-20 border border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <ZoomableImage 
                          src={norm.url || undefined} 
                          alt="prev" 
                          className="h-full w-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" 
                        />
                      ) : isPdf ? (
                        <FileText size={24} className="text-red-500 opacity-60" />
                      ) : (
                        <Paperclip size={20} className="text-[var(--muted-color)] opacity-40" />
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button 
                          type="button"
                          onClick={() => setPreviewId(isPreviewing ? null : norm.id)}
                          className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white"
                          title="Toggle In-line Preview"
                        >
                          <Eye size={12} />
                        </button>
                        <a 
                          href={norm.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white"
                          title="View Source (New Tab)"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <button 
                            type="button"
                            onClick={() => setPreviewId(isPreviewing ? null : norm.id)}
                            className="text-[11px] font-bold uppercase tracking-tight truncate text-[var(--ink-color)] hover:underline block text-left"
                          >
                            {norm.name}
                          </button>
                          <p className="text-[9px] uppercase tracking-widest text-[var(--muted-color)] font-mono">
                            {norm.type.split('/')[1] || 'binary'} // {Math.round(norm.url.length / 1024)}KB
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          {isPdf && (
                            <button
                              type="button"
                              onClick={() => setPreviewId(isPreviewing ? null : norm.id)}
                              className={cn(
                                "text-[8px] uppercase font-bold tracking-widest px-2 py-1 border transition-all",
                                isPreviewing 
                                  ? "bg-[var(--ink-color)] text-[var(--bg-color)] border-[var(--ink-color)]" 
                                  : "bg-transparent text-[var(--muted-color)] border-[var(--border-color)] hover:border-[var(--ink-color)] hover:text-[var(--ink-color)]"
                              )}
                            >
                              {isPreviewing ? 'Close Preview' : 'Preview PDF'}
                            </button>
                          )}
                          <label className="cursor-pointer p-1.5 border border-[var(--border-color)] hover:bg-[var(--bg-color)] text-[var(--muted-color)] transition-colors rounded-none" title="Update Source (Creates Version)">
                            <RotateCcw size={10} />
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) updateSourceFile(norm.id, file);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {norm.versions && norm.versions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                          <button 
                            onClick={() => toggleHistory(norm.id)}
                            className="flex items-center gap-1.5 text-[7px] uppercase font-bold text-[var(--muted-color)] hover:text-[var(--ink-color)] transition-colors opacity-70"
                          >
                            <HistoryIcon size={8} /> 
                            {expandedHistory[norm.id] ? 'Hide Revisions' : `View Revisions (${norm.versions.length})`}
                            {expandedHistory[norm.id] ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                          </button>

                          {expandedHistory[norm.id] && (
                            <div className="mt-2 space-y-1 pl-2 border-l border-[var(--border-color)]">
                              {norm.versions.map((v, vi) => (
                                <button 
                                  key={vi}
                                  onClick={() => restoreVersion(norm.id, vi)}
                                  className="group/v w-full flex items-center justify-between py-1 px-1.5 text-[7px] bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-[var(--ink-color)] transition-all"
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
                          className="max-w-full max-h-full object-contain shadow-2xl" 
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

                  <div className="relative">
                    <div className="absolute left-2 top-2 text-[var(--muted-color)] pointer-events-none">
                      <MessageSquare size={10} />
                    </div>
                    <textarea 
                      placeholder="Add annotation to this source..."
                      className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] text-[11px] p-3 pl-8 focus:border-[var(--ink-color)] outline-none min-h-[60px] resize-none font-serif italic text-[var(--muted-color)] leading-relaxed shadow-inner"
                      value={norm.annotation || ''}
                      onChange={(e) => updateAnnotation(norm.id, e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={() => removeAttachment(norm.id)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

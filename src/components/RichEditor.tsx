import { useCallback } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import ReactMarkdown from 'react-markdown';
import 'react-markdown-editor-lite/lib/index.css';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, ClipboardPaste, X, Paperclip } from 'lucide-react';
import { cn } from '../lib/utils';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  attachments?: string[];
  onAttachmentsChange?: (attachments: string[]) => void;
}

export default function RichEditor({ 
  value, 
  onChange, 
  attachments = [], 
  onAttachmentsChange 
}: RichEditorProps) {
  const onImageUpload = useCallback(async (file: File) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleEditorChange = ({ text }: { text: string }) => {
    onChange(text);
  };

  const handleFile = useCallback(async (file: File) => {
    const url = await onImageUpload(file);
    
    // Add to attachments if callback provided
    if (onAttachmentsChange) {
      onAttachmentsChange([...attachments, url]);
    }

    // Also insert into markdown if it's an image
    if (file.type.startsWith('image/')) {
      const imageMarkdown = `\n![${file.name}](${url})\n`;
      onChange(value + imageMarkdown);
    }
  }, [value, onChange, onImageUpload, attachments, onAttachmentsChange]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await handleFile(file);
    }
  }, [handleFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop,
    noClick: true,
    accept: { 'image/*': [], 'application/pdf': [], 'text/plain': [] }
  });

  const removeAttachment = (index: number) => {
    if (onAttachmentsChange) {
      const newAttachments = [...attachments];
      newAttachments.splice(index, 1);
      onAttachmentsChange(newAttachments);
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
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        onPaste={handlePaste}
        className={cn(
          "relative rounded-sm overflow-hidden border transition-all",
          isDragActive ? "border-[var(--ink-color)] ring-4 ring-[var(--border-color)]" : "border-[var(--border-color)]"
        )}
      >
        <input {...getInputProps()} />
        <MdEditor
          value={value}
          style={{ height: '400px', border: 'none', backgroundColor: 'var(--bg-color)', color: 'var(--ink-color)' }}
          renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
          onChange={handleEditorChange}
          config={{
            view: { menu: true, md: true, html: false },
            canView: { menu: true, md: true, html: true, fullScreen: true, hideMenu: false },
          }}
        />
        
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

        {isDragActive && (
          <div className="absolute inset-0 bg-[var(--bg-color)] opacity-90 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-dashed border-[var(--ink-color)]">
            <ImageIcon size={32} className="mb-4 opacity-20" />
            <p className="font-serif italic text-lg text-[var(--ink-color)]">Consigning files to ledger...</p>
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="p-4 border border-[var(--border-color)] bg-[var(--bg-color)] rounded-sm transition-colors">
          <h5 className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--muted-color)] mb-4 italic">Pending Attachments // {attachments.length}</h5>
          <div className="flex flex-wrap gap-4">
            {attachments.map((at, i) => (
              <div key={i} className="group relative border border-[var(--border-color)] p-1 bg-[var(--secondary-bg)] shadow-sm">
                {at.startsWith('data:image/') ? (
                  <img src={at} alt="prev" className="h-16 w-auto object-cover grayscale opacity-60" />
                ) : (
                  <div className="h-16 w-16 flex items-center justify-center bg-[var(--border-color)] opacity-20">
                    <Paperclip size={16} />
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

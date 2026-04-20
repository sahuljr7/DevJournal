import { useCallback } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import ReactMarkdown from 'react-markdown';
import 'react-markdown-editor-lite/lib/index.css';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, ClipboardPaste } from 'lucide-react';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function RichEditor({ value, onChange }: RichEditorProps) {
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.type.startsWith('image/')) {
        const url = await onImageUpload(file);
        const imageMarkdown = `\n![image](${url})\n`;
        onChange(value + imageMarkdown);
      }
    }
  }, [value, onChange, onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    accept: { 'image/*': [] }
  });

  // Handle paste from clipboard
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const url = await onImageUpload(file);
          const imageMarkdown = `\n![pasted image](${url})\n`;
          onChange(value + imageMarkdown);
        }
      }
    }
  }, [value, onChange, onImageUpload]);

  return (
    <div 
      {...getRootProps()} 
      onPaste={handlePaste}
      className={`relative rounded-sm overflow-hidden border ${isDragActive ? 'border-[var(--ink-color)] ring-4 ring-[var(--border-color)]' : 'border-[var(--border-color)]'} transition-all`}
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
      <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--ink-color)] text-[var(--bg-color)] rounded-none text-[8px] font-bold uppercase tracking-widest">
          <ImageIcon size={10} />
          Drop Capture
        </div>
      </div>
      {isDragActive && (
        <div className="absolute inset-0 bg-[var(--bg-color)] opacity-90 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-dashed border-[var(--ink-color)]">
          <ImageIcon size={32} className="mb-4 opacity-20" />
          <p className="font-serif italic text-lg text-[var(--ink-color)]">Drop images to ledger</p>
        </div>
      )}
    </div>
  );
}

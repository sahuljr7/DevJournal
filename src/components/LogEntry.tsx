import ReactMarkdown from 'react-markdown';
import { Trash2, Clock, Paperclip, Edit3, X, Check } from 'lucide-react';
import { WorkLog } from '../types';
import { formatDate } from '../lib/utils';
import { motion } from 'motion/react';
import { useState } from 'react';
import RichEditor from './RichEditor';

interface LogEntryProps {
  log: WorkLog;
  onDelete: () => void;
  onUpdate: (content: string) => void;
}

export default function LogEntry({ log, onDelete, onUpdate }: LogEntryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(log.content);

  const handleSave = () => {
    onUpdate(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(log.content);
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
          />
        </div>
      ) : (
        <div className="prose prose-neutral max-w-none text-lg leading-relaxed text-[var(--ink-color)] transition-colors">
          <ReactMarkdown>{log.content}</ReactMarkdown>
        </div>
      )}

      {log.attachments.length > 0 && !isEditing && (
        <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-[var(--border-color)] transition-colors">
          {log.attachments.map((at, i) => (
            <div key={i} className="group/at relative border border-[var(--border-color)] p-2 bg-[var(--bg-color)] shadow-sm transition-transform hover:scale-105">
              <img 
                src={at} 
                alt="attachment" 
                className="h-32 w-auto object-cover grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100" 
                referrerPolicy="no-referrer"
              />
              <p className="mt-2 text-[8px] uppercase font-bold text-[var(--muted-color)] tracking-tighter">screenshot_{i+1}.png</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Editorial divider */}
      <div className="mt-12 h-[1px] w-12 bg-[var(--border-color)] transition-colors" />
    </motion.div>
  );
}

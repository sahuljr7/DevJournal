import { motion } from 'motion/react';
import { X, Palette, Type, Check } from 'lucide-react';
import { AppPreferences } from '../types';

interface SettingsPanelProps {
  preferences: AppPreferences;
  onUpdate: (updates: Partial<AppPreferences>) => void;
  onClose: () => void;
}

export default function SettingsPanel({ preferences, onUpdate, onClose }: SettingsPanelProps) {
  const themes = [
    { id: 'editorial', name: 'Editorial', color: '#FDFCFB' },
    { id: 'dark', name: 'Midnight', color: '#121212' },
    { id: 'high-contrast', name: 'High Contrast', color: '#000000' }
  ];

  const fonts = [
    { id: 'serif', name: 'Serif (Classic)', class: 'font-serif' },
    { id: 'sans', name: 'Sans (Modern)', class: 'font-sans' },
    { id: 'mono', name: 'Mono (Technical)', class: 'font-mono' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[var(--bg-color)] border border-[var(--border-color)] max-w-md w-full rounded-2xl shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif italic text-[var(--ink-color)]">Interface Settings</h2>
          <button onClick={onClose} className="text-[var(--muted-color)] hover:text-[var(--ink-color)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-10">
          {/* Theme selection */}
          <section>
            <div className="flex items-center gap-2 text-[var(--muted-color)] mb-4 uppercase text-[10px] font-bold tracking-widest">
              <Palette size={14} />
              <span>Color Atmosphere</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdate({ theme: t.id as any })}
                  className={`
                    group relative p-3 rounded-xl border transition-all text-center
                    ${preferences.theme === t.id 
                      ? 'border-[var(--ink-color)] bg-[var(--secondary-bg)]' 
                      : 'border-[var(--border-color)] hover:border-[var(--muted-color)]'}
                  `}
                >
                  <div 
                    className="w-full aspect-square rounded-lg mb-2 border border-black/10 flex items-center justify-center"
                    style={{ backgroundColor: t.color }}
                  >
                    {preferences.theme === t.id && <Check size={16} className={t.id === 'editorial' ? 'text-black' : 'text-white'} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${preferences.theme === t.id ? 'text-[var(--ink-color)]' : 'text-[var(--muted-color)]'}`}>
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Font selection */}
          <section>
            <div className="flex items-center gap-2 text-[var(--muted-color)] mb-4 uppercase text-[10px] font-bold tracking-widest">
              <Type size={14} />
              <span>Notebook Typography</span>
            </div>
            <div className="space-y-2">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdate({ fontFamily: f.id as any })}
                  className={`
                    w-full flex items-center justify-between p-4 rounded-xl border transition-all
                    ${preferences.fontFamily === f.id 
                      ? 'border-[var(--ink-color)] bg-[var(--secondary-bg)]' 
                      : 'border-[var(--border-color)] hover:border-[var(--muted-color)]'}
                  `}
                >
                  <span className={`text-sm ${f.class} text-[var(--ink-color)]`}>{f.name}</span>
                  {preferences.fontFamily === f.id && <Check size={16} className="text-[var(--ink-color)]" />}
                </button>
              ))}
            </div>
          </section>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-10 py-3 bg-[var(--ink-color)] text-[var(--bg-color)] rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg"
        >
          Confirm Changes
        </button>
      </motion.div>
    </motion.div>
  );
}

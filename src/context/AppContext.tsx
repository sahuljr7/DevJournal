import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { JiraCard, WorkLog, AppState, AppPreferences, Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  state: AppState;
  preferences: AppPreferences;
  updatePreferences: (updates: Partial<AppPreferences>) => void;
  addCard: (jiraId: string, title: string, tags: string[]) => JiraCard;
  updateCard: (id: string, updates: Partial<JiraCard>) => void;
  deleteCard: (id: string) => void;
  addLog: (cardId: string, content: string, attachments: (string | Attachment)[], linkedStatus?: JiraCard['status']) => WorkLog;
  deleteLog: (id: string) => void;
  updateLog: (id: string, content: string, attachments: (string | Attachment)[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'devjournal_state';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.preferences) {
          parsed.preferences = { theme: 'editorial', fontFamily: 'serif' };
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse storage:', e);
      }
    }
    return { 
      cards: [], 
      logs: [], 
      preferences: { theme: 'editorial', fontFamily: 'serif' } 
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updatePreferences = (updates: Partial<AppPreferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences!, ...updates }
    }));
  };

  const addCard = (jiraId: string, title: string, tags: string[]) => {
    const newCard: JiraCard = {
      id: uuidv4(),
      jiraId,
      title,
      description: '',
      tags,
      tasks: [],
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, cards: [newCard, ...prev.cards] }));
    return newCard;
  };

  const updateCard = (id: string, updates: Partial<JiraCard>) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }));
  };

  const deleteCard = (id: string) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== id),
      logs: prev.logs.filter((l) => l.cardId !== id),
    }));
  };

  const addLog = (cardId: string, content: string, attachments: (string | Attachment)[] = [], linkedStatus?: JiraCard['status']) => {
    const newLog: WorkLog = {
      id: uuidv4(),
      cardId,
      content,
      timestamp: new Date().toISOString(),
      attachments,
      linkedStatus,
    };
    setState((prev) => ({ ...prev, logs: [newLog, ...prev.logs] }));
    return newLog;
  };

  const deleteLog = (id: string) => {
    setState((prev) => ({
      ...prev,
      logs: prev.logs.filter((l) => l.id !== id),
    }));
  };

  const updateLog = (id: string, content: string, attachments: (string | Attachment)[]) => {
    setState((prev) => ({
      ...prev,
      logs: prev.logs.map((l) =>
        l.id === id ? { ...l, content, attachments } : l
      ),
    }));
  };

  const value = useMemo(() => ({
    state,
    preferences: state.preferences!,
    updatePreferences,
    addCard,
    updateCard,
    deleteCard,
    addLog,
    deleteLog,
    updateLog,
  }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

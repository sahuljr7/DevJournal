import { useState, useEffect } from 'react';
import { JiraCard, WorkLog, AppState, AppPreferences } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'devjournal_state';

export function useLogs() {
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

  const addLog = (cardId: string, content: string, attachments: string[] = []) => {
    const newLog: WorkLog = {
      id: uuidv4(),
      cardId,
      content,
      timestamp: new Date().toISOString(),
      attachments,
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

  const updateLog = (id: string, content: string) => {
    setState((prev) => ({
      ...prev,
      logs: prev.logs.map((l) =>
        l.id === id ? { ...l, content } : l
      ),
    }));
  };

  return {
    state,
    preferences: state.preferences!,
    updatePreferences,
    addCard,
    updateCard,
    deleteCard,
    addLog,
    deleteLog,
    updateLog,
  };
}

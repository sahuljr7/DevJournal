import { useState, useEffect } from 'react';
import { JiraCard, WorkLog, AppState } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'devjournal_state';

export function useLogs() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse storage:', e);
      }
    }
    return { cards: [], logs: [] };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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

  return {
    state,
    addCard,
    updateCard,
    deleteCard,
    addLog,
    deleteLog,
  };
}

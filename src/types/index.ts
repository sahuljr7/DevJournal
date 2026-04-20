
export interface JiraCard {
  id: string;
  jiraId: string; // e.g., PROJ-123
  title: string;
  description: string;
  tags: string[];
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface WorkLog {
  id: string;
  cardId: string;
  content: string; // Markdown
  timestamp: string;
  attachments: string[]; // Base64 or URLs
}

export interface AppState {
  cards: JiraCard[];
  logs: WorkLog[];
}

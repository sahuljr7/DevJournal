
export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface JiraCard {
  id: string;
  jiraId: string; // e.g., PROJ-123
  title: string;
  description: string;
  tags: string[];
  tasks: SubTask[];
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentVersion {
  url: string;
  timestamp: string;
  name: string;
}

export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
  annotation?: string;
  versions?: AttachmentVersion[];
}

export interface WorkLog {
  id: string;
  cardId: string;
  content: string; // Markdown
  timestamp: string;
  attachments: (string | Attachment)[]; // Support both old and new format for migration safety
}

export interface AppPreferences {
  theme: 'editorial' | 'dark' | 'high-contrast';
  fontFamily: 'serif' | 'sans' | 'mono';
}

export interface AppState {
  cards: JiraCard[];
  logs: WorkLog[];
  preferences?: AppPreferences;
}

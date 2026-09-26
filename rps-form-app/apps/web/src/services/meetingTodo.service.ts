import api from './api';

const API_BASE = ''; // The api instance already has /api base URL

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface TodoItemData {
  id: string;
  title: string;
  description?: string | null;
  meetingNoteId?: string | null;
  meetingNote?: { id: string; title: string; meetingDate: string } | null;
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  createdById?: string | null;
  parentId?: string | null;
  subTasks?: TodoItemData[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingNoteData {
  id: string;
  title: string;
  meetingDate: string;
  location?: string | null;
  attendees: string; // JSON string
  content: string;
  authorId?: string | null;
  author?: { id: string; name: string; email: string; role: string } | null;
  todos?: TodoItemData[];
  createdAt: string;
  updatedAt: string;
}

export interface ParsedTodoPreview {
  title: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  assignedToName?: string;
  dueDate?: string;
  rawText: string;
  subTasks?: { title: string; priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; rawText: string }[];
}

export const meetingTodoService = {
  // Meetings
  async getMeetings(): Promise<MeetingNoteData[]> {
    const res = await api.get(`${API_BASE}/meetings`);
    return res.data;
  },

  async getMeeting(id: string): Promise<MeetingNoteData> {
    const res = await api.get(`${API_BASE}/meetings/${id}`);
    return res.data;
  },

  async createMeeting(data: {
    title: string;
    meetingDate?: string;
    location?: string;
    attendees?: string[];
    content: string;
    authorId?: string;
    autoCreateTodos?: boolean;
  }): Promise<MeetingNoteData> {
    const res = await api.post(`${API_BASE}/meetings`, data);
    return res.data;
  },

  async updateMeeting(id: string, data: Partial<MeetingNoteData>): Promise<MeetingNoteData> {
    const res = await api.put(`${API_BASE}/meetings/${id}`, data);
    return res.data;
  },

  async deleteMeeting(id: string): Promise<{ success: boolean }> {
    const res = await api.delete(`${API_BASE}/meetings/${id}`);
    return res.data;
  },

  async previewParse(content: string): Promise<ParsedTodoPreview[]> {
    const res = await api.post(`${API_BASE}/meetings/preview-parse`, { content });
    return res.data;
  },

  // Todos
  async getTodos(filters?: { status?: string; priority?: string; meetingNoteId?: string }): Promise<TodoItemData[]> {
    const res = await api.get(`${API_BASE}/todos`, { params: filters });
    return res.data;
  },

  async createTodo(data: {
    title: string;
    description?: string;
    meetingNoteId?: string;
    priority?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
    status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    dueDate?: string | null;
    assignedToId?: string | null;
    assignedToName?: string | null;
    createdById?: string | null;
    parentId?: string | null;
  }): Promise<TodoItemData> {
    const res = await api.post(`${API_BASE}/todos`, data);
    return res.data;
  },

  async updateTodo(id: string, data: Partial<TodoItemData>): Promise<TodoItemData> {
    const res = await api.put(`${API_BASE}/todos/${id}`, data);
    return res.data;
  },

  async deleteTodo(id: string): Promise<{ success: boolean }> {
    const res = await api.delete(`${API_BASE}/todos/${id}`);
    return res.data;
  },

  // Users for Mention / Assign
  async getUsers(): Promise<UserItem[]> {
    const res = await api.get(`${API_BASE}/auth/users`);
    return res.data;
  },
};

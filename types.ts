export type QuestionStatus = 'unattempted' | 'correct' | 'incorrect';

export interface ProjectUnit {
  id: string;
  name: string;
  count: number; // Number of questions in this unit
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  units: ProjectUnit[];
}

export interface Attempt {
  projectId: string;
  unitId: string;
  questionIndex: number; // 1-based index
  status: QuestionStatus;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
}

export interface ReviewItem {
  projectId: string;
  unitId: string;
  questionIndex: number;
  dueDate: string; // YYYY-MM-DD
  interval: number; // Days until next review
  lastReviewDate: string;
}

export type ViewState = 'dashboard' | 'practice' | 'review' | 'setup' | 'settings';

export interface DayStats {
  date: string;
  total: number;
  correct: number;
  incorrect: number;
}
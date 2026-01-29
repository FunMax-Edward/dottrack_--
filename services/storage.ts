import { Project, Attempt, ReviewItem, QuestionStatus } from '../types';

const STORAGE_KEYS = {
  PROJECT: 'dottrack_project',
  ATTEMPTS: 'dottrack_attempts',
  REVIEWS: 'dottrack_reviews',
};

// --- Loaders ---

export const loadProject = (): Project | null => {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECT);
  return data ? JSON.parse(data) : null;
};

export const loadAttempts = (): Attempt[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
  return data ? JSON.parse(data) : [];
};

export const loadReviews = (): ReviewItem[] => {
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  return data ? JSON.parse(data) : [];
};

// --- Savers ---

export const saveProject = (project: Project) => {
  localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
};

export const saveAttempts = (attempts: Attempt[]) => {
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
};

export const saveReviews = (reviews: ReviewItem[]) => {
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
};

// --- Logic Helpers ---

export const getQuestionKey = (unitId: string, qIndex: number) => `${unitId}-${qIndex}`;

export const getTodayStr = () => {
  return new Date().toISOString().split('T')[0];
};

export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Get the latest status for every question to build the grid
export const getStatusMap = (attempts: Attempt[]) => {
  const map = new Map<string, QuestionStatus>();
  // Sort attempts by time ascending so latest overwrites
  const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
  
  sorted.forEach(a => {
    map.set(getQuestionKey(a.unitId, a.questionIndex), a.status);
  });
  return map;
};

// SRS Algorithm (Simplified Ebbinghaus)
export const calculateNextReview = (
  currentStatus: QuestionStatus, 
  previousReview: ReviewItem | undefined,
  today: string
): ReviewItem | null => {
  
  // If correct, maybe remove from queue or push far future?
  // User req: "Wrong questions appear again".
  // Implementation: Correct answers are removed from the immediate review queue to mark "Done".
  if (currentStatus === 'correct') {
    return null; 
  }

  // If incorrect, schedule it.
  if (currentStatus === 'incorrect') {
    let newInterval = 1;
    if (previousReview) {
      // If it was already in review and we got it wrong again, keep short interval (1 day)
      // Or if we want to be strict: reset to 1.
      newInterval = 1; 
    } else {
      // First time wrong
      newInterval = 2; // Default +2 days
    }
    
    return {
        projectId: '', // Filled by caller
        unitId: '', // Filled by caller
        questionIndex: 0, // Filled by caller
        dueDate: addDays(today, newInterval),
        interval: newInterval,
        lastReviewDate: today
    }
  }

  return null;
};

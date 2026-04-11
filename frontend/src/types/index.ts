export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
  options?: string[];
  emoji?: string;
  imageUrl?: string | null;
}

export interface UserProgress {
  level: number;
  xp: number;
  streak: number;
  badges: Badge[];
  totalQuestions: number;
  correctAnswers: number;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
  earnedAt?: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

export interface TimelineEntry {
  id: string;
  date: string;
  image?: string | null;
  status: string;
  note?: string;
  healthScore: number;
}

export interface Plant {
  id: string;
  name: string;
  species?: string;
  image?: string | null;
  healthScore: number;
  diagnosis?: string;
  treatment?: string;
  lastWatered?: string;
  addedAt: string;
  timeline: TimelineEntry[];
}
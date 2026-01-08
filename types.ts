
export type Banca = 'FGV' | 'FCC' | 'CESPE' | 'Vunesp' | 'Cebraspe';
export type Materia = 'Português' | 'Direito Constitucional' | 'Direito Administrativo' | 'Raciocínio Lógico' | 'Informática';

export interface Question {
  id: string;
  banca: Banca;
  materia: Materia;
  statement: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswerId: string;
  explanation: string;
}

export interface UserPerformance {
  totalAnswered: number;
  correctAnswers: number;
  subjectStats: Record<string, { total: number; correct: number }>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface StudyLocation {
  title: string;
  uri: string;
  snippet?: string;
}

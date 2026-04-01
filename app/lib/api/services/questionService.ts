import { apiClient } from '../apiClient';

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  imageURL?: string;
  subject: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionsFilter {
  subject?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}

export const questionService = {
  async getQuestions(filter: QuestionsFilter = {}): Promise<Question[]> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    return apiClient.get<Question[]>(`/questions?${params.toString()}`);
  },

  async getQuestion(id: string): Promise<Question> {
    return apiClient.get<Question>(`/questions/${id}`);
  },

  async createQuestion(data: Omit<Question, 'id'>): Promise<Question> {
    return apiClient.post<Question>('/questions', data);
  },

  async updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
    return apiClient.put<Question>(`/questions/${id}`, data);
  },

  async deleteQuestion(id: string): Promise<void> {
    await apiClient.delete(`/questions/${id}`);
  },

  async getQuestionsByTopic(subject: string, topic?: string): Promise<Question[]> {
    return this.getQuestions({ subject, topic });
  },
};
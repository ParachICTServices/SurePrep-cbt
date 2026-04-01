import { apiClient } from '../apiClient';

export interface TestResult {
  id: string;
  userId: string;
  subject: string;
  subjectId: string;
  topic?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  type: 'practice' | 'mock';
  history: QuestionHistory[];
}

export interface QuestionHistory {
  questionText: string;
  options: string[];
  correctOption: number;
  selectedOption: number;
  explanation: string;
  imageURL?: string;
}

export const examService = {
  async submitTestResult(data: Omit<TestResult, 'id'>): Promise<TestResult> {
    return apiClient.post<TestResult>('/exam/results', data);
  },

  async getTestResults(filter?: { type?: string; limit?: number }): Promise<TestResult[]> {
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type);
    if (filter?.limit) params.append('limit', filter.limit.toString());
    
    return apiClient.get<TestResult[]>(`/exam/results?${params.toString()}`);
  },

  async getTestResult(id: string): Promise<TestResult> {
    return apiClient.get<TestResult>(`/exam/results/${id}`);
  },

  async getStatistics(): Promise<any> {
    return apiClient.get('/exam/statistics');
  },
};
import {
  FIRESTORE_COLLECTIONS,
  createRecord,
  listRecords,
  removeRecord,
  updateRecord,
} from "@/app/lib/firebaseData";

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
  examType?: string;
  subjectId?: string;
  topic?: string;
  source?: string;
}

export interface QuestionsFilter {
  examType?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}

export const questionService = {
  async getQuestions(filter: QuestionsFilter = {}): Promise<Question[]> {
    const questions = await listRecords(FIRESTORE_COLLECTIONS.questions);
    return questions.filter((question) => {
      const topics = Array.isArray(question.topics) ? question.topics : [];
      const subjectMatches = !filter.subject || question.subjectId === filter.subject || question.subject === filter.subject;
      const topicMatches = !filter.topic || topics.includes(filter.topic) || question.topic === filter.topic;
      const difficultyMatches = !filter.difficulty || question.difficulty === filter.difficulty;
      const storedExam = question.examType ?? question.exam ?? question.source;
      const examMatches = !filter.examType || !storedExam || String(storedExam).toLowerCase() === filter.examType.toLowerCase();
      return subjectMatches && topicMatches && difficultyMatches && examMatches;
    }).slice(filter.offset ?? 0, (filter.offset ?? 0) + (filter.limit ?? Number.MAX_SAFE_INTEGER)) as Question[];
  },

  async getQuestion(id: string): Promise<Question> {
    const questions = await listRecords(FIRESTORE_COLLECTIONS.questions);
    const question = questions.find((item) => item.id === id);
    if (!question) throw new Error("Question not found.");
    return question as Question;
  },

  async createQuestion(data: Omit<Question, 'id'>): Promise<Question> {
    return createRecord(FIRESTORE_COLLECTIONS.questions, data) as Promise<Question>;
  },

  async updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
    return updateRecord(FIRESTORE_COLLECTIONS.questions, id, data) as Promise<Question>;
  },

  async deleteQuestion(id: string): Promise<void> {
    await removeRecord(FIRESTORE_COLLECTIONS.questions, id);
  },

  async getQuestionsByTopic(subject: string, topic?: string): Promise<Question[]> {
    return this.getQuestions({ subject, topic });
  },

  async getAvailableQuestions(params: {
    examType?: string;
    subjectId: string;
    topic?: string | null;
    subjectIds?: string | null;
  }): Promise<Question[]> {
    const subjects = params.subjectIds?.split(",").filter(Boolean) ?? [params.subjectId];
    const questions = await listRecords(FIRESTORE_COLLECTIONS.questions);
    return questions.filter((question) => {
      const topicList = Array.isArray(question.topics) ? question.topics : [];
      const subjectMatches = subjects.includes(question.subjectId) || subjects.includes(question.subject);
      const topicMatches = !params.topic || topicList.includes(params.topic) || question.topic === params.topic;
      const storedExam = question.examType ?? question.exam ?? question.source;
      const examMatches = !params.examType || !storedExam || String(storedExam).toLowerCase() === params.examType.toLowerCase();
      return subjectMatches && topicMatches && examMatches;
    }) as Question[];
  },
};